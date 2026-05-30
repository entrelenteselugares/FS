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
    const uploadUrl = await getSignedUrl(this.s3 as any, command, { expiresIn: 900 }); // 15 min
    return { uploadUrl, publicUrl: `${this.publicUrl}/${key}` };
  }

  async deleteObject(key: string): Promise<void> {
    if (!this.s3) return;
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}

export const r2Service = new R2StorageService();
