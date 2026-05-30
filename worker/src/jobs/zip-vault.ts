import { Router, Request, Response } from 'express';
import archiver from 'archiver';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PassThrough } from 'stream';
import { Upload } from '@aws-sdk/lib-storage';

const router = Router();

// S3/R2 client
const s3 = new S3Client({
  region: 'auto',
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
router.post('/zip-vault', async (req: Request, res: Response) => {
  const { albumId, albumName, mediaList } = req.body;
  
  if (!albumId || !mediaList?.length) {
    return res.status(400).json({ error: 'albumId e mediaList são obrigatórios' });
  }

  const zipKey = `zips/${albumId}/${Date.now()}-${albumName?.replace(/\s+/g, '_') || albumId}.zip`;

  try {
    // Streaming: archiver → PassThrough → S3 Upload (sem buffer completo em memória)
    const passthrough = new PassThrough();
    const archive = archiver('zip', { zlib: { level: 1 } }); // nível 1 = speed over compression
    archive.pipe(passthrough);

    // Upload stream para R2
    const upload = new Upload({
      client: s3,
      params: {
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: zipKey,
        Body: passthrough,
        ContentType: 'application/zip',
      },
    });

    // Adicionar arquivos ao ZIP em lotes de 20 (controle de memória)
    const BATCH_SIZE = 20;
    for (let i = 0; i < mediaList.length; i += BATCH_SIZE) {
      const batch = mediaList.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(async (media: any) => {
        try {
          const fileUrl = media.webViewLink;
          const ext = media.type === 'VIDEO' ? '.mp4' : '.jpg';
          // fileId in our DB can be R2 key, we just get the basename
          const fileBase = typeof media.fileId === 'string' ? media.fileId.split('/').pop() : media.fileId;
          const fileName = `${fileBase}${ext}`;
          
          // Fetch do arquivo de onde quer que esteja (R2 ou Drive via webViewLink)
          const fetchRes = await fetch(fileUrl);
          if (!fetchRes.ok) throw new Error(`HTTP ${fetchRes.status} para ${fileUrl}`);
          const buffer = Buffer.from(await fetchRes.arrayBuffer());
          archive.append(buffer, { name: fileName });
        } catch (err: any) {
          console.error(`[ZIP] Pulando mídia ${media.fileId}: ${err.message}`);
        }
      }));
    }

    // Inicia o upload em paralelo com a finalização do archive
    const [uploadResult] = await Promise.all([upload.done(), archive.finalize()]);

    // Gera URL de download pré-assinada (expira em 1h)
    const downloadUrl = await getSignedUrl(
      s3 as any,
      new GetObjectCommand({ Bucket: process.env.R2_BUCKET_NAME!, Key: zipKey }),
      { expiresIn: 3600 }
    );

    return res.json({ downloadUrl, zipKey, fileCount: mediaList.length });

  } catch (err: any) {
    console.error('[ZIP] Erro fatal:', err.message);
    return res.status(500).json({ error: 'Falha ao gerar ZIP', details: err.message });
  }
});

export { router as zipVaultRouter };
