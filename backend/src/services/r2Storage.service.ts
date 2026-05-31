import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { supabaseAdmin } from '../lib/supabase';

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
      console.warn('[R2] Credenciais não configuradas. Operando em modo Supabase Storage (Fallback).');
    }
  }

  async createPresignedUploadUrl({ key, mimeType }: { key: string; mimeType: string }): Promise<{ uploadUrl: string; publicUrl: string }> {
    if (!this.s3) {
      // Fallback para o Supabase Storage se o R2 não estiver configurado
      const bucketName = 'vaults';
      const { data, error } = await supabaseAdmin.storage.from(bucketName).createSignedUploadUrl(key);
      if (error || !data) {
        throw new Error(`Falha ao gerar URL assinada no Supabase Storage: ${error?.message}`);
      }
      const publicUrl = supabaseAdmin.storage.from(bucketName).getPublicUrl(key).data.publicUrl;
      return { uploadUrl: data.signedUrl, publicUrl };
    }
    const command = new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: mimeType });
    const uploadUrl = await getSignedUrl(this.s3 as any, command, { expiresIn: 900 }); // 15 min
    return { uploadUrl, publicUrl: `${this.publicUrl}/${key}` };
  }

  async deleteObject(key: string): Promise<void> {
    if (!this.s3) {
      // Fallback para o Supabase Storage
      const bucketName = 'vaults';
      await supabaseAdmin.storage.from(bucketName).remove([key]);
      return;
    }
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}

export const r2Service = new R2StorageService();
