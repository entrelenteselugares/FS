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
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!email || !privateKey || privateKey.includes('SUA_CHAVE_AQUI')) {
      console.warn('⚠️ Google Drive Service Account não configurada ou usando placeholder. O sistema operará em MODO MOCK para Cofres.');
      this.drive = null;
      return;
    }

    const auth = new google.auth.JWT({
      email,
      key: privateKey,
      scopes: SCOPES
    });
    this.drive = google.drive({ version: 'v3', auth });
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
  async uploadMedia(folderId: string, fileName: string, buffer: Buffer, mimeType: string) {
    if (!this.drive) {
      console.warn(`[DRIVE MOCK] Gravando arquivo localmente: ${fileName}`);
      const mockId = `mock-file-${Date.now()}`;
      
      const uploadDir = path.join(process.cwd(), 'uploads', 'vaults');
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

    const fileMetadata = {
      name: fileName,
      parents: [folderId],
    };

    const media = {
      mimeType,
      body: Readable.from(buffer),
    };

    try {
      const file = await this.drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id, name, webViewLink, thumbnailLink',
      });

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
      console.error('[DRIVE] Erro no upload de mídia:', error.message);
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
}

export const driveService = new GoogleDriveService();
