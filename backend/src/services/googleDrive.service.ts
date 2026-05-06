import { google } from 'googleapis';
import { Readable } from 'stream';
import fs from 'fs';
import path from 'path';

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

/**
 * GoogleDriveService - Infraestrutura de Cold Storage para a Fase 11.
 * Gerencia a criação de pastas dinâmicas e o upload de mídias para álbuns privados.
 */
export class GoogleDriveService {
  private drive;

  constructor() {
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n');

    console.log(`[DRIVE DEBUG] ServiceAccountEmail: ${clientEmail ? 'Presente' : 'MISSING'}`);
    console.log(`[DRIVE DEBUG] PrivateKey: ${privateKey ? 'Presente' : 'MISSING'}`);

    if (!clientEmail || !privateKey) {
      console.warn('⚠️ Google Drive Service Account não configurado. O sistema operará em MODO MOCK para Cofres.');
      this.drive = null;
      return;
    }

    try {
      const jwtClient = new google.auth.JWT({
        email: clientEmail,
        key: privateKey,
        scopes: SCOPES
      });

      this.drive = google.drive({ version: 'v3', auth: jwtClient });
      console.log(`[DRIVE] Serviço JWT (Service Account) inicializado com sucesso.`);
    } catch (err: any) {
      console.error(`[DRIVE] Falha ao inicializar JWT:`, err.message);
      this.drive = null;
    }
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
    
    const fileMetadata = {
      name: `Vault: ${albumName}`,
      mimeType: 'application/vnd.google-apps.folder',
      parents: rootFolderId ? [rootFolderId] : [],
    };

    try {
      const folder = await this.drive.files.create({
        requestBody: fileMetadata,
        fields: 'id, name',
      });

      console.log(`[DRIVE] Pasta criada para álbum: ${albumName} (ID: ${folder.data.id})`);

      // Liberar acesso de leitura para a pasta (Ajuda na exibição de miniaturas)
      await this.drive.permissions.create({
        fileId: folder.data.id!,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });

      return folder.data;
    } catch (error: any) {
      console.error('[DRIVE] Erro ao criar pasta:', error.message);
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
      const file = await this.drive.files.create({
        requestBody: {
          name: fileName,
          parents: [folderId],
        },
        media: {
          mimeType: mimeType,
          body: fs.createReadStream(tmpFilePath),
        },
        fields: 'id, name, webViewLink, thumbnailLink',
      } as any);

      // Limpar o arquivo temporário
      if (fs.existsSync(tmpFilePath)) {
        fs.unlinkSync(tmpFilePath);
      }

      // Liberar acesso de leitura para quem tem o link (Necessário para exibição no App)
      await this.drive.permissions.create({
        fileId: file.data.id!,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });

      return file.data;
    } catch (error: any) {
      if (fs.existsSync(tmpFilePath)) {
        fs.unlinkSync(tmpFilePath);
      }
      console.error('[DRIVE] Erro CRÍTICO no upload de mídia:', error);
      if (error.response) {
        console.error('[DRIVE] Detalhes da API Google (Response):', JSON.stringify(error.response.data, null, 2));
      }
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
      { fileId, alt: 'media' },
      { responseType: 'stream' }
    );
  }
}

export const driveService = new GoogleDriveService();
