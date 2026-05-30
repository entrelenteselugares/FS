---
phase: 55
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - backend/src/services/r2Storage.service.ts
  - backend/src/services/googleDrive.service.ts
  - backend/.env.example
  - backend/src/controllers/vault.controller.ts
autonomous: true
requirements: []
---

<objective>
Migrar o armazenamento de mídias do Google Drive para Cloudflare R2.

Atualmente, `createResumableUploadUrl` e `finalizeResumableUpload` em `googleDrive.service.ts` entregam arquivos via Google Drive, que possui quotas rígidas de API e risco de banimento por distribuição em massa. Esta migração cria `r2Storage.service.ts` com a mesma interface (Pre-signed PUT URL → confirmar upload), e redireciona os endpoints de vault para usar R2 em produção, mantendo o Google Drive como fallback de leitura para mídias antigas (via `webViewLink` já no banco).
</objective>

<threat_model>
## Threat Model

| Ameaça | Severidade | Mitigação |
|---|---|---|
| Credenciais R2 expostas em logs | ALTA | Usar variáveis de ambiente; nunca logar `R2_SECRET_ACCESS_KEY` |
| Pre-signed URL vazada permite upload arbitrário | MÉDIA | URL expira em 15min; inclui Content-Type específico na assinatura |
| Migração incompleta deixa mídias em dois storages | BAIXA | Google Drive `webViewLink` permanece no banco — novas mídias vão para R2 |
</threat_model>

<tasks>

<task id="55.1.1">
<title>Criar r2Storage.service.ts com Pre-signed PUT URLs</title>
<type>execute</type>
<read_first>
- backend/src/services/googleDrive.service.ts (padrão de interface: createResumableUploadUrl, finalizeResumableUpload)
- backend/src/lib/prisma.ts (padrão de singleton)
</read_first>
<action>
Criar `backend/src/services/r2Storage.service.ts` com a classe `R2StorageService`:

```typescript
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

class R2StorageService {
  private s3: S3Client | null = null;
  private bucket: string;
  private publicUrl: string;

  constructor() {
    this.bucket = process.env.R2_BUCKET_NAME || '';
    this.publicUrl = process.env.R2_PUBLIC_URL || '';
    
    if (process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY) {
      this.s3 = new S3Client({
        region: 'auto',
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
        },
      });
    } else {
      console.warn('[R2] Credenciais não configuradas. Operando em MODO MOCK.');
    }
  }

  async createPresignedUploadUrl({ key, mimeType }: { key: string; mimeType: string }): Promise<{ uploadUrl: string; publicUrl: string }> {
    if (!this.s3) {
      const mockUrl = `http://localhost:3002/api/mock/r2-upload/${key}`;
      return { uploadUrl: mockUrl, publicUrl: `http://localhost:3002/uploads/mock/${key}` };
    }
    const command = new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: mimeType });
    const uploadUrl = await getSignedUrl(this.s3, command, { expiresIn: 900 }); // 15 min
    return { uploadUrl, publicUrl: `${this.publicUrl}/${key}` };
  }

  async deleteObject(key: string): Promise<void> {
    if (!this.s3) return;
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}

export const r2Service = new R2StorageService();
```

Instalar dependências: `npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner --save`
</action>
<acceptance_criteria>
- `backend/src/services/r2Storage.service.ts` existe
- Arquivo contém `class R2StorageService`
- Arquivo contém `createPresignedUploadUrl`
- Arquivo contém `export const r2Service`
- `package.json` contém `"@aws-sdk/client-s3"`
- `package.json` contém `"@aws-sdk/s3-request-presigner"`
- `npx tsc --noEmit` no backend retorna exit code 0
</acceptance_criteria>
</task>

<task id="55.1.2">
<title>Redirecionar vault.controller.ts para usar R2 em initResumableUpload</title>
<type>execute</type>
<read_first>
- backend/src/controllers/vault.controller.ts (métodos initResumableUpload e completeResumableUpload — linhas ~85-200)
- backend/src/services/r2Storage.service.ts (recém criado — interface createPresignedUploadUrl)
</read_first>
<action>
No topo de `vault.controller.ts`, adicionar import:
```typescript
import { r2Service } from '../services/r2Storage.service';
```

No método `initResumableUpload`, substituir a chamada `driveService.createResumableUploadUrl(...)` por:
```typescript
const finalFileName = `vaults/${albumId}/${Date.now()}-${fileName.replace(/\s+/g, '_')}`;
const { uploadUrl, publicUrl } = await r2Service.createPresignedUploadUrl({
  key: finalFileName,
  mimeType
});
return res.json({ uploadUrl, finalFileName, publicUrl, storageType: 'r2' });
```

No método `completeResumableUpload`, o `fileId` recebido agora será o `key` do R2 (ex: `vaults/abc/1234-foto.jpg`). Adaptar:
```typescript
// Para R2, não há fileId do Google. O publicUrl foi retornado no init.
// O cliente deve mandar { key, publicUrl, fileSize, ... }
const { key, publicUrl: filePublicUrl, fileSize, width, height, originalDate, type } = req.body;

const newMedia = await prisma.sharedAlbumMedia.create({
  data: {
    albumId,
    uploadedById: memberInfo.id,
    fileId: key,                        // key do R2 em vez de fileId do Drive
    webViewLink: filePublicUrl,          // URL pública do R2
    thumbnailLink: filePublicUrl,        // Sem thumbnail automático; usa a própria URL
    status: album.ownerId === userId ? 'APPROVED' : 'PENDING',
    type: type || (mimeType?.includes('video') ? 'VIDEO' : 'PHOTO'),
    fileSize: fileSize || null,
    width: width || null,
    height: height || null,
    originalDate: originalDate ? new Date(originalDate) : null,
  },
  include: { uploadedBy: true, _count: { select: { votes: true } } }
});
```
</action>
<acceptance_criteria>
- `vault.controller.ts` contém `import { r2Service }` 
- `vault.controller.ts` contém `r2Service.createPresignedUploadUrl`
- `vault.controller.ts` contém `storageType: 'r2'` na resposta do initResumableUpload
- `npx tsc --noEmit` no backend retorna exit code 0
</acceptance_criteria>
</task>

<task id="55.1.3">
<title>Atualizar VaultDetailPage.tsx para o novo contrato R2</title>
<type>execute</type>
<read_first>
- frontend/src/pages/VaultDetailPage.tsx (função handleFileUpload — linhas ~306-430)
</read_first>
<action>
Na função `handleFileUpload`, no bloco do Passo 3 (Direct Upload):

1. Ao receber a resposta do `upload/init`, capturar `publicUrl` e `storageType`:
```typescript
const { uploadUrl, finalFileName, publicUrl, storageType } = initRes.data;
```

2. A detecção de MOCK deve checar `storageType !== 'r2'` E a URL de mock:
```typescript
if (!uploadUrl || uploadUrl.includes('/api/mock/')) { /* fallback legado */ }
```

3. Ao chamar `upload/complete`, mandar `key` e `publicUrl` em vez de `fileId`:
```typescript
await api.post(`/vaults/${vaultId}/upload/complete`, {
  key: finalFileName,
  publicUrl,
  fileSize: file.size,
  type: isVideo ? 'VIDEO' : 'PHOTO'
});
```

4. O `xhr.onload` para R2 não retorna JSON com `id`. O R2 retorna `200 OK` sem body (para PUT simples) ou `204`. Ajustar:
```typescript
xhr.onload = () => {
  if (xhr.status >= 200 && xhr.status < 300) {
    resolve(finalFileName); // usa o key já conhecido, não vem no response
  } else {
    reject(new Error(`Falha no R2 HTTP ${xhr.status}: ${xhr.responseText}`));
  }
};
```
</action>
<acceptance_criteria>
- `VaultDetailPage.tsx` contém `storageType` na desestruturação do initRes.data
- `VaultDetailPage.tsx` contém `publicUrl` sendo enviado em `upload/complete`
- `VaultDetailPage.tsx` contém `resolve(finalFileName)` no xhr.onload (não `response.id`)
- `npx tsc --noEmit` no frontend retorna exit code 0
</acceptance_criteria>
</task>

<task id="55.1.4">
<title>Atualizar .env.example com variáveis R2</title>
<type>execute</type>
<read_first>
- backend/.env.example (todas as variáveis existentes — manter sem alterar as que já existem)
</read_first>
<action>
Adicionar ao final de `backend/.env.example`:

```env
# ============================================================
# CLOUDFLARE R2 — Object Storage para Mídias
# Substitui Google Drive como storage de produção.
# Obtenha em: dash.cloudflare.com → R2 → Manage R2 API Tokens
# ============================================================
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=foto-segundo-media
R2_PUBLIC_URL=https://media.fotosegundo.com.br
```
</action>
<acceptance_criteria>
- `backend/.env.example` contém `R2_ACCOUNT_ID=`
- `backend/.env.example` contém `R2_ACCESS_KEY_ID=`
- `backend/.env.example` contém `R2_SECRET_ACCESS_KEY=`
- `backend/.env.example` contém `R2_BUCKET_NAME=foto-segundo-media`
- `backend/.env.example` contém `R2_PUBLIC_URL=`
</acceptance_criteria>
</task>

</tasks>

<verification>
## Verification

1. `npx tsc --noEmit` no backend retorna exit code 0 (zero erros de tipo)
2. `npx tsc --noEmit` no frontend retorna exit code 0
3. `backend/src/services/r2Storage.service.ts` existe e exporta `r2Service`
4. `backend/src/controllers/vault.controller.ts` importa e usa `r2Service`
5. `backend/.env.example` contém todas as 5 variáveis R2 listadas acima
</verification>

<success_criteria>
- Novas mídias subidas pelo vault passam pelo R2 (ou MOCK local) em vez do Google Drive
- Compilação TypeScript limpa em ambos frontend e backend
- `.env.example` documentado para que qualquer desenvolvedor saiba configurar R2
- Google Drive mantido como leitura de mídias antigas (sem breaking change nas `webViewLink` existentes no banco)
</success_criteria>

## PLANNING COMPLETE
