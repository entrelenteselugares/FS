---
phase: 55
plan: 3
type: execute
wave: 2
depends_on: [1]
files_modified:
  - worker/package.json
  - worker/src/index.ts
  - worker/src/jobs/zip-vault.ts
  - worker/Dockerfile
  - worker/.env.example
  - backend/src/controllers/vault.controller.ts
  - backend/.env.example
autonomous: true
requirements: []
---

<objective>
Criar um Worker Express dedicado (em `worker/`) e mover `downloadAllMedia` da Vercel para ele.

O `downloadAllMedia` atual baixa todos os arquivos do Drive, faz ZIP em memória e transmite para o cliente — tudo dentro de uma Lambda da Vercel com limite de 60s e ~1024MB de RAM. Com 1.500 fotos de 5MB cada, isso é matematicamente impossível. Esta plan cria um serviço Worker separado em `worker/` que roda em Railway (servidor persistente, sem timeout), move a lógica de ZIP para lá, e transforma o endpoint da Vercel em um dispatcher que enfileira o job e retorna um `jobId` imediatamente.
</objective>

<threat_model>

## Threat Model

| Ameaça                                              | Severidade | Mitigação                                                                                                         |
| --------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------- |
| Worker exposto publicamente sem auth                | ALTA       | Header `X-Worker-Secret` obrigatório em todas as rotas do Worker; rejeitado com 401 se ausente/incorreto          |
| Job ZIP consome memória ilimitada com cofre gigante | MÉDIA      | Usar streaming com `archiver.pipe(upload-stream-r2)` em vez de buffer em memória; agrupar em lotes de 20 arquivos |
| URL pré-assinada de download vaza zip privado       | BAIXA      | URL expira em 1h; inclui albumId no caminho para auditoria                                                        |

</threat_model>

<tasks>

<task id="55.3.1">
<title>Criar estrutura do Worker Express em worker/</title>
<type>execute</type>
<read_first>
- backend/src/index.ts (modelo de setup Express com middleware de auth e error handling)
- backend/package.json (versão do Node, dependências comuns como express, cors, prisma)
</read_first>
<action>
Criar o diretório `worker/` na raiz do projeto com a seguinte estrutura:

**`worker/package.json`:**

```json
{
  "name": "foto-segundo-worker",
  "version": "1.0.0",
  "description": "Background Worker for heavy jobs (ZIP, Phygital) — runs on Railway",
  "main": "dist/index.js",
  "scripts": {
    "dev": "ts-node-dev --respawn src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@aws-sdk/client-s3": "^3.0.0",
    "@aws-sdk/s3-request-presigner": "^3.0.0",
    "@prisma/client": "^5.0.0",
    "archiver": "^7.0.0",
    "axios": "^1.6.0",
    "cors": "^2.8.5",
    "dotenv": "^16.0.0",
    "express": "^4.18.0",
    "node-fetch": "^3.0.0"
  },
  "devDependencies": {
    "@types/archiver": "^6.0.0",
    "@types/cors": "^2.8.0",
    "@types/express": "^4.17.0",
    "@types/node": "^20.0.0",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.0.0"
  }
}
```

**`worker/src/index.ts`:**

```typescript
import "dotenv/config";
import express from "express";
import cors from "cors";
import { zipVaultRouter } from "./jobs/zip-vault";

const app = express();
app.use(cors());
app.use(express.json());

// Auth middleware — todas as rotas exigem WORKER_SECRET
app.use((req, res, next) => {
  const secret = req.headers["x-worker-secret"];
  if (!process.env.WORKER_SECRET || secret !== process.env.WORKER_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
});

app.use("/jobs", zipVaultRouter);

app.get("/health", (_req, res) =>
  res.json({ status: "ok", ts: new Date().toISOString() }),
);

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => console.log(`[WORKER] Rodando na porta ${PORT}`));
```

**`worker/tsconfig.json`:**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"]
}
```

</action>
<acceptance_criteria>
- `worker/package.json` existe e contém `"foto-segundo-worker"`
- `worker/src/index.ts` existe e contém `x-worker-secret`
- `worker/src/index.ts` contém `/health` route
- `worker/tsconfig.json` existe
</acceptance_criteria>
</task>

<task id="55.3.2">
<title>Criar worker/src/jobs/zip-vault.ts com lógica de ZIP em streaming</title>
<type>execute</type>
<read_first>
- backend/src/controllers/vault.controller.ts (método downloadAllMedia, linhas 943-1039 — lógica atual a ser migrada)
- backend/src/services/r2Storage.service.ts (método createPresignedUploadUrl — usar para gerar URL de download do ZIP final)
</read_first>
<action>
Criar `worker/src/jobs/zip-vault.ts`:

```typescript
import { Router, Request, Response } from "express";
import archiver from "archiver";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PassThrough } from "stream";
import { Upload } from "@aws-sdk/lib-storage";

const router = Router();

// S3/R2 client
const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

/**
 * POST /jobs/zip-vault
 * Body: { albumId, albumName, mediaList: [{ fileId, webViewLink, type }] }
 * Response: { downloadUrl } — URL pré-assinada do ZIP no R2, expira em 1h
 */
router.post("/zip-vault", async (req: Request, res: Response) => {
  const { albumId, albumName, mediaList } = req.body;

  if (!albumId || !mediaList?.length) {
    return res
      .status(400)
      .json({ error: "albumId e mediaList são obrigatórios" });
  }

  const zipKey = `zips/${albumId}/${Date.now()}-${albumName?.replace(/\s+/g, "_") || albumId}.zip`;

  try {
    // Streaming: archiver → PassThrough → S3 Upload (sem buffer completo em memória)
    const passthrough = new PassThrough();
    const archive = archiver("zip", { zlib: { level: 1 } }); // nível 1 = speed over compression
    archive.pipe(passthrough);

    // Upload stream para R2
    const upload = new Upload({
      client: s3,
      params: {
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: zipKey,
        Body: passthrough,
        ContentType: "application/zip",
      },
    });

    // Adicionar arquivos ao ZIP em lotes de 20 (controle de memória)
    const BATCH_SIZE = 20;
    for (let i = 0; i < mediaList.length; i += BATCH_SIZE) {
      const batch = mediaList.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async (media: any) => {
          try {
            const fileUrl = media.webViewLink;
            const ext = media.type === "VIDEO" ? ".mp4" : ".jpg";
            const fileName = `${media.fileId}${ext}`;

            // Fetch do arquivo de onde quer que esteja (R2 ou Drive via webViewLink)
            const fetchRes = await fetch(fileUrl);
            if (!fetchRes.ok)
              throw new Error(`HTTP ${fetchRes.status} para ${fileUrl}`);
            const buffer = Buffer.from(await fetchRes.arrayBuffer());
            archive.append(buffer, { name: fileName });
          } catch (err: any) {
            console.error(
              `[ZIP] Pulando mídia ${media.fileId}: ${err.message}`,
            );
          }
        }),
      );
    }

    // Inicia o upload em paralelo com a finalização do archive
    const [uploadResult] = await Promise.all([
      upload.done(),
      archive.finalize(),
    ]);

    // Gera URL de download pré-assinada (expira em 1h)
    const downloadUrl = await getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: zipKey,
      }),
      { expiresIn: 3600 },
    );

    return res.json({ downloadUrl, zipKey, fileCount: mediaList.length });
  } catch (err: any) {
    console.error("[ZIP] Erro fatal:", err.message);
    return res
      .status(500)
      .json({ error: "Falha ao gerar ZIP", details: err.message });
  }
});

export { router as zipVaultRouter };
```

Adicionar dependência extra ao `worker/package.json`:

```json
"@aws-sdk/lib-storage": "^3.0.0"
```

</action>
<acceptance_criteria>
- `worker/src/jobs/zip-vault.ts` existe
- Arquivo contém `router.post('/zip-vault'`
- Arquivo contém `PassThrough` (streaming sem buffer total)
- Arquivo contém `new Upload({` (streaming upload para R2)
- Arquivo contém `getSignedUrl` (URL pré-assinada de download)
- Arquivo contém `BATCH_SIZE = 20`
</acceptance_criteria>
</task>

<task id="55.3.3">
<title>Transformar downloadAllMedia da Vercel em dispatcher assíncrono</title>
<type>execute</type>
<read_first>
- backend/src/controllers/vault.controller.ts (método downloadAllMedia, linhas 943-1039 — substituir a lógica de ZIP por uma chamada HTTP ao Worker)
- backend/.env.example (adicionar WORKER_URL e WORKER_SECRET)
</read_first>
<action>
Substituir o método `downloadAllMedia` em `vault.controller.ts` pela versão dispatcher:

```typescript
static async downloadAllMedia(req: AuthRequest, res: Response) {
  const albumId = req.params.albumId as string;
  const userId = req.user?.userId;

  if (!userId) return res.status(401).json({ error: 'Não autenticado.' });

  try {
    const membership = await prisma.albumMember.findUnique({
      where: { albumId_userId: { albumId, userId } },
      include: { album: true }
    });

    if (!membership) return res.status(403).json({ error: 'Você não é membro deste cofre.' });
    if (['BLOCKED', 'EXPIRED'].includes(membership.album.subscriptionStatus)) {
      return res.status(402).json({ error: 'SUBSCRIPTION_REQUIRED', message: 'O período gratuito deste cofre expirou.' });
    }

    const mediaList = await prisma.sharedAlbumMedia.findMany({
      where: {
        albumId,
        ...(membership.role !== 'OWNER' ? {
          OR: [{ status: 'APPROVED' }, { uploadedById: userId }]
        } : {})
      },
      select: { fileId: true, webViewLink: true, type: true }
    });

    if (mediaList.length === 0) {
      return res.status(404).json({ error: 'Nenhuma foto encontrada para download.' });
    }

    // Se Worker não configurado, resposta informativa em vez de travar a Lambda
    const workerUrl = process.env.WORKER_URL;
    if (!workerUrl) {
      return res.status(503).json({
        error: 'WORKER_NOT_CONFIGURED',
        message: 'O serviço de download em lote ainda não está ativo. Configure WORKER_URL nas variáveis de ambiente.',
      });
    }

    // Dispara o job no Worker (sem await — retorna jobId imediatamente)
    const workerRes = await fetch(`${workerUrl}/jobs/zip-vault`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-worker-secret': process.env.WORKER_SECRET || '',
      },
      body: JSON.stringify({
        albumId,
        albumName: membership.album.nome,
        mediaList,
      }),
    });

    if (!workerRes.ok) {
      const errText = await workerRes.text();
      throw new Error(`Worker HTTP ${workerRes.status}: ${errText}`);
    }

    const { downloadUrl } = await workerRes.json() as { downloadUrl: string };

    return res.json({
      downloadUrl,
      message: `ZIP com ${mediaList.length} arquivo(s) pronto para download.`,
      expiresIn: '1h',
    });

  } catch (error: any) {
    console.error('[DOWNLOAD ALL] Erro:', error.message);
    return res.status(500).json({ error: 'Erro ao iniciar download de todas as fotos.' });
  }
}
```

Adicionar ao final de `backend/.env.example`:

```env
# ============================================================
# WORKER — Serviço dedicado para jobs pesados (Railway)
# Rode worker/ separadamente e configure a URL aqui.
# ============================================================
WORKER_URL=https://seu-worker.up.railway.app
WORKER_SECRET=uma-senha-secreta-longa-e-aleatoria
```

</action>
<acceptance_criteria>
- `vault.controller.ts` método `downloadAllMedia` contém `WORKER_NOT_CONFIGURED`
- `vault.controller.ts` contém `process.env.WORKER_URL`
- `vault.controller.ts` contém `x-worker-secret`
- `vault.controller.ts` NÃO contém mais `archiver(` (lógica de ZIP removida)
- `vault.controller.ts` NÃO contém mais `archive.pipe(`
- `backend/.env.example` contém `WORKER_URL=`
- `backend/.env.example` contém `WORKER_SECRET=`
- `npx tsc --noEmit` no backend retorna exit code 0
</acceptance_criteria>
</task>

<task id="55.3.4">
<title>Criar Dockerfile e worker/.env.example para deploy no Railway</title>
<type>execute</type>
<read_first>
- worker/package.json (scripts de build e start)
</read_first>
<action>
Criar `worker/Dockerfile`:
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package\*.json ./
RUN npm install --production=false

COPY . .
RUN npm run build

EXPOSE 3003
CMD ["npm", "start"]

````

Criar `worker/.env.example`:
```env
# ============================================================
# WORKER — Variáveis de Ambiente (Railway)
# ============================================================
PORT=3003

# Auth — mesma chave que WORKER_SECRET no backend Vercel
WORKER_SECRET=uma-senha-secreta-longa-e-aleatoria

# R2 — mesmo bucket do backend
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=foto-segundo-media
R2_PUBLIC_URL=https://media.fotosegundo.com.br

# DATABASE (para o Worker buscar membros e mídias se necessário)
DATABASE_URL=
````

Criar `worker/.gitignore`:

```
node_modules/
dist/
.env
```

</action>
<acceptance_criteria>
- `worker/Dockerfile` existe e contém `FROM node:20-alpine`
- `worker/Dockerfile` contém `npm run build`
- `worker/.env.example` existe e contém `WORKER_SECRET=`
- `worker/.env.example` contém `R2_ACCOUNT_ID=`
- `worker/.gitignore` existe
</acceptance_criteria>
</task>

<task id="55.3.5">
<title>Atualizar frontend VaultDetailPage para novo contrato de downloadAllMedia</title>
<type>execute</type>
<read_first>
- frontend/src/pages/VaultDetailPage.tsx (buscar chamadas para /download-all — grep por "download-all" ou "downloadAllMedia")
</read_first>
<action>
No `VaultDetailPage.tsx`, localizar o botão/função que chama `GET /vaults/:id/download-all`.

O endpoint agora retorna `{ downloadUrl, message, expiresIn }` em vez de stream de ZIP direto. Atualizar o handler para:

```typescript
const handleDownloadAll = async () => {
  try {
    setDownloading(true);
    const res = await api.get(`/vaults/${vaultId}/download-all`);
    const { downloadUrl, message } = res.data;

    // Abre o link do ZIP pre-assinado numa nova aba (download direto do R2/Worker)
    window.open(downloadUrl, "_blank");

    // Feedback ao usuário
    alert(message || "Download iniciado!");
  } catch (err: any) {
    const code = err.response?.data?.error;
    if (code === "SUBSCRIPTION_REQUIRED") {
      alert("Assine o cofre para baixar todas as fotos.");
    } else if (code === "WORKER_NOT_CONFIGURED") {
      alert(
        "O download em lote ainda não está disponível. Entre em contato com o suporte.",
      );
    } else {
      alert("Erro ao gerar o download. Tente novamente.");
    }
  } finally {
    setDownloading(false);
  }
};
```

Adicionar state `const [downloading, setDownloading] = useState(false)` se não existir.
</action>
<acceptance_criteria>

- `VaultDetailPage.tsx` contém `window.open(downloadUrl, '_blank')`
- `VaultDetailPage.tsx` contém `WORKER_NOT_CONFIGURED`
- `VaultDetailPage.tsx` contém `setDownloading`
- `npx tsc --noEmit` no frontend retorna exit code 0
  </acceptance_criteria>
  </task>

</tasks>

<verification>

## Verification

1. `worker/` diretório existe com `package.json`, `src/index.ts`, `src/jobs/zip-vault.ts`, `Dockerfile`, `.env.example`
2. `vault.controller.ts` NÃO contém mais `archiver(` — lógica de ZIP foi removida da Vercel
3. `vault.controller.ts` contém `WORKER_NOT_CONFIGURED` (fallback gracioso se Worker não configurado)
4. `backend/.env.example` contém `WORKER_URL=` e `WORKER_SECRET=`
5. `npx tsc --noEmit` no backend retorna exit code 0
6. `npx tsc --noEmit` no frontend retorna exit code 0
   </verification>

<success_criteria>

- A lógica de ZIP está 100% fora da Vercel (em `worker/src/jobs/zip-vault.ts`)
- O endpoint `GET /vaults/:id/download-all` na Vercel delega ao Worker e retorna em < 2s
- Se `WORKER_URL` não estiver configurado, o usuário recebe uma mensagem clara em vez de um timeout silencioso de 60s
- O Worker usa streaming (sem buffer completo em memória) para suportar cofres com 1.000+ fotos
  </success_criteria>

## PLANNING COMPLETE
