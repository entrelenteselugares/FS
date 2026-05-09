import { google } from 'googleapis';
import { Readable } from 'stream';
import fs from 'fs';
import path from 'path';

const SCOPES = ['https://www.googleapis.com/auth/drive'];

/**
 * GoogleDriveService - Infraestrutura de Cold Storage para a Fase 11.
 * Gerencia a criação de pastas dinâmicas e o upload de mídias para álbuns privados.
 */
export class GoogleDriveService {
  private drive;

  constructor() {
    const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;

    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n');

    // 1. Tentar OAuth2 (Recomendado para evitar erro de Storage Quota em contas pessoais)
    if (clientId && clientSecret && refreshToken) {
      try {
        const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
        oauth2Client.setCredentials({ refresh_token: refreshToken });
        this.drive = google.drive({ version: 'v3', auth: oauth2Client });
        console.log(`[DRIVE] 🚀 Modo OAuth2 (Refresh Token) ativado. Usando cota de armazenamento do usuário.`);
        return;
      } catch (oauthErr: any) {
        console.error(`[DRIVE] Falha ao inicializar OAuth2:`, oauthErr.message);
      }
    }

    // 2. Fallback para Service Account
    if (clientEmail && privateKey) {
      try {
        const jwtClient = new google.auth.JWT({
          email: clientEmail,
          key: privateKey,
          scopes: SCOPES
        });

        this.drive = google.drive({ version: 'v3', auth: jwtClient });
        console.log(`[DRIVE] 🛡️ Modo Service Account ativado. (Atenção: Requer Shared Drive ou Quota de SA).`);
        return;
      } catch (err: any) {
        console.error(`[DRIVE] Falha ao inicializar JWT:`, err.message);
      }
    }

    console.warn('⚠️ Google Drive não configurado (OAuth2 ou Service Account). O sistema operará em MODO MOCK.');
    this.drive = null;
  }

  /**
   * Helper method to retry operations with exponential backoff
   */
  private async withRetry<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        return await operation();
      } catch (error: any) {
        attempt++;
        console.warn(`\n[DRIVE RETRY] ⚠️ Tentativa ${attempt}/${maxRetries} falhou.`);
        console.warn(` - Mensagem: ${error.message}`);
        if (error.response) {
          console.warn(` - Google API Error:`, JSON.stringify(error.response.data, null, 2));
        }
        
        if (attempt >= maxRetries) {
          console.error(`[DRIVE] ❌ Esgotadas todas as retentativas para a operação.`);
          throw error;
        }
        await new Promise(res => setTimeout(res, 1000 * Math.pow(2, attempt))); // Exponential backoff
      }
    }
    throw new Error('Unreachable');
  }

  /**
   * Cria uma pasta para um novo Álbum compartilhado.
   */
  async createAlbumFolder(albumName: string) {
    if (!this.drive) {
      console.warn(`[DRIVE MOCK] Criando pasta mock para: ${albumName}`);
      return { id: `mock-folder-${Date.now()}`, name: albumName };
    }

    const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
    
    let fileMetadata = {
      name: `Vault: ${albumName}`,
      mimeType: 'application/vnd.google-apps.folder',
      parents: rootFolderId ? [rootFolderId] : [],
    };

    let folder: any;
    try {
      try {
        folder = await this.withRetry(() => this.drive!.files.create({
          requestBody: fileMetadata,
          supportsAllDrives: true,
          fields: 'id, name',
        }));
      } catch (parentError: any) {
        if (parentError.message && parentError.message.includes('File not found') && rootFolderId) {
          console.warn(`[DRIVE] Pasta Root (${rootFolderId}) não encontrada. Criando na raiz da conta.`);
          // Remove a dependência da pasta root e tenta novamente
          fileMetadata.parents = [];
          folder = await this.withRetry(() => this.drive!.files.create({
            requestBody: fileMetadata,
            supportsAllDrives: true,
            fields: 'id, name',
          }));
        } else {
          throw parentError;
        }
      }

      console.log(`[DRIVE] Pasta criada para álbum: ${albumName} (ID: ${folder.data.id})`);

      // Compartilhar explicitamente com o email de admin do Foto Segundo para garantir visibilidade
      await this.withRetry(() => this.drive!.permissions.create({
        fileId: folder.data.id!,
        requestBody: {
          role: 'writer',
          type: 'user',
          emailAddress: 'contatofotosegundo@gmail.com'
        },
        supportsAllDrives: true,
        sendNotificationEmail: false
      }));

      // Liberar acesso de leitura para a pasta (Ajuda na exibição de miniaturas)
      await this.withRetry(() => this.drive!.permissions.create({
        fileId: folder.data.id!,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
        supportsAllDrives: true,
      }));

      return folder.data;
    } catch (error: any) {
      console.error('[DRIVE] Erro ao criar pasta após retentativas:', error.message);
      throw error;
    }
  }

  /**
   * Realiza o upload de uma mídia diretamente para a pasta do álbum.
   * Utiliza thumbnailLink para performance no frontend conforme diretrizes executivas.
   */
  async uploadMedia({ folderId, fileName, buffer, mimeType }: { folderId: string, fileName: string, buffer: Buffer, mimeType: string }) {
    if (!this.drive) {
      console.warn(`[DRIVE MOCK] Gravando arquivo localmente (em /tmp): ${fileName}`);
      const mockId = `mock-file-${Date.now()}`;
      
      const os = require('os');
      const uploadDir = path.join(os.tmpdir(), 'vaults');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, fileName);
      fs.writeFileSync(filePath, buffer);

      const appUrl = process.env.APP_URL || 'http://localhost:3001';
      const fileUrl = `${appUrl}/uploads/vaults/${fileName}`;

      return { 
        id: mockId, 
        webViewLink: fileUrl,
        thumbnailLink: fileUrl
      };
    }

    // Workaround para Serverless (Vercel): O googleapis precisa do tamanho exato do arquivo
    // para fazer o upload corretamente. Readable.from(buffer) frequentemente falha com erro 500.
    const os = require('os');
    const tmpFilePath = path.join(os.tmpdir(), fileName);
    fs.writeFileSync(tmpFilePath, buffer);

    try {
      console.log(`[DRIVE] Iniciando upload: ${fileName} (${buffer.length} bytes)`);
      
      const file = await this.withRetry(() => this.drive!.files.create({
        requestBody: {
          name: fileName,
          parents: [folderId],
        },
        media: {
          mimeType: mimeType,
          body: fs.createReadStream(tmpFilePath),
        },
        supportsAllDrives: true,
        fields: 'id, name, webViewLink, thumbnailLink',
      } as any));

      // Limpar o arquivo temporário
      if (fs.existsSync(tmpFilePath)) {
        fs.unlinkSync(tmpFilePath);
      }

      // Liberar acesso de leitura para quem tem o link (Necessário para exibição no App)
      await this.withRetry(() => this.drive!.permissions.create({
        fileId: file.data.id!,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
        supportsAllDrives: true,
      }));

      return file.data;
    } catch (error: any) {
      if (fs.existsSync(tmpFilePath)) {
        fs.unlinkSync(tmpFilePath);
      }
      
      console.error('=========================================');
      console.error('[DRIVE] ❌ ERRO CRÍTICO NO UPLOAD');
      console.error(' - Mensagem:', error.message);
      
      if (error.response) {
        console.error(' - Google API Error:', JSON.stringify(error.response.data, null, 2));
      }
      console.error('=========================================');
      
      throw error;
    }
  }

  /**
   * Remove um arquivo ou pasta do Drive.
   */
  async deleteItem(fileId: string) {
    if (!this.drive) return;
    try {
      await this.drive.files.delete({ fileId });
    } catch (error: any) {
      console.error('[DRIVE] Erro ao deletar item:', error.message);
    }
  }

  /**
   * Obtém o stream de um arquivo para proxy.
   */
  async getMediaStream(fileId: string) {
    if (!this.drive) throw new Error("Drive service not initialized");
    return this.drive.files.get(
      { fileId, alt: 'media', supportsAllDrives: true },
      { responseType: 'arraybuffer' }
    );
  }
}

export const driveService = new GoogleDriveService();
