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
    try {
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
    } catch (criticalErr: any) {
      console.error(`[DRIVE CRITICAL] Erro fatal no construtor:`, criticalErr.message);
      this.drive = null;
    }
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
  async createAlbumFolder(albumName: string): Promise<any> {
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
      if (error.message && (error.message.includes('invalid_grant') || error.message.includes('auth') || error.message.includes('credential') || error.message.includes('expired') || error.message.includes('revoked'))) {
        console.warn(`[DRIVE] ⚠️ Erro de credenciais detectado ao criar pasta. Alternando para MODO MOCK dinamicamente.`);
        this.drive = null;
        return this.createAlbumFolder(albumName);
      }
      throw error;
    }
  }

  /**
   * Realiza o upload de uma mídia diretamente para a pasta do álbum.
   * Utiliza thumbnailLink para performance no frontend conforme diretrizes executivas.
   */
  async uploadMedia({ folderId, fileName, filePath, mimeType }: { folderId: string, fileName: string, filePath: string, mimeType: string }): Promise<any> {
    if (!this.drive) {
      console.warn(`[DRIVE MOCK] Copiando arquivo localmente (em /uploads/vaults): ${fileName}`);
      const mockId = `mock-file-${Date.now()}`;
      
      const uploadDir = path.join(process.cwd(), 'uploads', 'vaults');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const destPath = path.join(uploadDir, fileName);
      fs.copyFileSync(filePath, destPath);

      const appUrl = process.env.BACKEND_URL || process.env.APP_URL || 'http://localhost:3002';
      const fileUrl = `${appUrl}/uploads/vaults/${fileName}`;

      return { 
        id: mockId, 
        webViewLink: fileUrl,
        thumbnailLink: fileUrl
      };
    }

    try {
      console.log(`[DRIVE] Iniciando upload: ${fileName} from ${filePath}`);
      
      const file = await this.withRetry(() => this.drive!.files.create({
        requestBody: {
          name: fileName,
          parents: [folderId],
        },
        media: {
          mimeType: mimeType,
          body: fs.createReadStream(filePath),
        },
        supportsAllDrives: true,
        fields: 'id, name, webViewLink, thumbnailLink',
      } as any));

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
      console.error('=========================================');
      console.error('[DRIVE] ❌ ERRO CRÍTICO NO UPLOAD');
      console.error(' - Mensagem:', error.message);
      
      if (error.response) {
        console.error(' - Google API Error:', JSON.stringify(error.response.data, null, 2));
      }
      console.error('=========================================');
      
      if (error.message && (error.message.includes('invalid_grant') || error.message.includes('auth') || error.message.includes('credential') || error.message.includes('expired') || error.message.includes('revoked'))) {
        console.warn(`[DRIVE] ⚠️ Erro de credenciais detectado no upload. Alternando para MODO MOCK dinamicamente.`);
        this.drive = null;
        return this.uploadMedia({ folderId, fileName, filePath, mimeType });
      }
      
      throw error;
    }
  }

  /**
   * INICIA UMA SESSÃO DE RESUMABLE UPLOAD DIRETO PARA O FRONTEND.
   * Contorna o limite de 4.5MB da Vercel retornando uma URL para o qual
   * o cliente (navegador) fará o PUT diretamente para o Google Drive.
   */
  async createResumableUploadUrl({ folderId, fileName, mimeType }: { folderId: string, fileName: string, mimeType: string }): Promise<string> {
    if (!this.drive) {
      console.warn(`[DRIVE MOCK] Retornando MOCK URL para upload resumable: ${fileName}`);
      const appUrl = process.env.BACKEND_URL || process.env.APP_URL || 'http://localhost:3002';
      return `${appUrl}/api/mock/resumable-upload`; 
    }

    try {
      console.log(`[DRIVE] Solicitando URL Resumable para: ${fileName}`);
      
      // Para pegar a URL resumable, precisamos usar fetch ou axios manualmente com o Token
      // A biblioteca googleapis faz isso por baixo dos panos apenas quando passamos a stream.
      // Aqui, pegamos o token e fazemos a requisição manual:
      
      const authClient = (this.drive as any).context?._options?.auth || (this.drive as any)._options?.auth;
      const accessToken = await authClient.getAccessToken();
      const token = accessToken.token;

      if (!token) throw new Error("Não foi possível obter Access Token do Google Drive");

      const metadata = {
        name: fileName,
        parents: [folderId]
      };

      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json; charset=UTF-8',
          'X-Upload-Content-Type': mimeType
        },
        body: JSON.stringify(metadata)
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Google API HTTP ${response.status}: ${errText}`);
      }

      // O Google Drive retorna a URL temporária de upload no header 'Location'
      const uploadUrl = response.headers.get('location');
      
      if (!uploadUrl) {
        throw new Error("Google Drive não retornou a URL de location.");
      }

      return uploadUrl;

    } catch (error: any) {
      console.error('[DRIVE] ❌ ERRO AO CRIAR SESSÃO RESUMABLE:', error.message);
      if (error.message && (error.message.includes('invalid_grant') || error.message.includes('auth'))) {
         console.warn(`[DRIVE] ⚠️ Erro de credenciais. Alternando para MODO MOCK dinamicamente.`);
         this.drive = null;
         return this.createResumableUploadUrl({ folderId, fileName, mimeType });
      }
      throw error;
    }
  }

  /**
   * Finaliza o fluxo do Resumable. O cliente fez o PUT da imagem e pegou o ID.
   * Agora nós damos permissão de leitura (anyone with link) e pegamos a thumbnail.
   */
  async finalizeResumableUpload(fileId: string): Promise<any> {
    if (!this.drive) {
      console.warn(`[DRIVE MOCK] Finalizando upload MOCK para fileId: ${fileId}`);
      return {
        id: fileId,
        webViewLink: `mock-url-${fileId}`,
        thumbnailLink: `mock-url-${fileId}`
      };
    }

    try {
      // 1. Libera o arquivo para visualização
      await this.withRetry(() => this.drive!.permissions.create({
        fileId: fileId,
        requestBody: { role: 'reader', type: 'anyone' },
        supportsAllDrives: true,
      }));

      // 2. Busca os metadados gerados pelo Drive (inclui Thumbnail)
      const file = await this.withRetry(() => this.drive!.files.get({
        fileId,
        fields: 'id, name, webViewLink, thumbnailLink',
        supportsAllDrives: true,
      }));

      return file.data;
    } catch (error: any) {
      console.error('[DRIVE] ❌ ERRO AO FINALIZAR RESUMABLE:', error.message);
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
    if (!this.drive) {
      // MOCK MODE
      console.warn(`[DRIVE MOCK] Lendo arquivo local (mock): ${fileId}`);
      // Em mock mode, fileId gerado geralmente é "mock-file-...", mas aqui no vault
      // o media.fileId pode ter recebido o link ou nome real salvo.
      // Tentamos achar pelo nome do arquivo ou ID. Se o ID for uma URL (webViewLink),
      // pegamos a última parte. No upload nós passamos o ID como "mock-file-X".
      // Vamos assumir que os arquivos estão na pasta 'uploads/vaults' com o nome que está no banco.
      // Porém, o vault.controller.ts passa media.fileId para getMediaStream.
      // E no MOCK nós salvamos como { id: mockId, webViewLink: fileUrl }. E o arquivo fisicamente tem o nome original.
      // Infelizmente, se não soubermos o fileName, será difícil, MAS...
      // Vamos alterar no vault.controller.ts para mock também, se necessário?
      // Melhor: se fileId contém "mock-file", não temos o nome original aqui, a não ser que busquemos.
      // Vamos apenas avisar e jogar um erro explícito para consertarmos onde chamou?
      throw new Error("Modo MOCK não suporta getMediaStream apenas com ID se não salvou o nome do arquivo. Por favor, trate MOCK localmente.");
    }
    return this.drive.files.get(
      { fileId, alt: 'media', supportsAllDrives: true },
      { responseType: 'stream' }
    );
  }

  /**
   * Lista arquivos de uma pasta do Drive.
   * Utilizado para sincronização de galerias em massa.
   */
  async listFiles(folderId: string): Promise<any[]> {
    if (!this.drive) {
      console.warn(`[DRIVE MOCK] Listando arquivos mock para pasta: ${folderId}`);
      const uploadDir = path.join(process.cwd(), 'uploads', 'vaults');
      if (fs.existsSync(uploadDir)) {
        try {
          const files = fs.readdirSync(uploadDir);
          const appUrl = process.env.BACKEND_URL || process.env.APP_URL || 'http://localhost:3002';
          return files.map((file, index) => {
            const fileUrl = `${appUrl}/uploads/vaults/${file}`;
            return {
              id: `mock-file-${index}-${Date.now()}`,
              name: file,
              mimeType: 'image/jpeg',
              webViewLink: fileUrl,
              thumbnailLink: fileUrl
            };
          });
        } catch (readErr: any) {
          console.error('[DRIVE MOCK] Erro ao ler pasta de upload mock:', readErr.message);
        }
      }
      return [];
    }

    try {
      const response = await this.withRetry(() => this.drive!.files.list({
        q: `'${folderId}' in parents and trashed = false and mimeType contains 'image/'`,
        fields: 'files(id, name, mimeType, webViewLink, thumbnailLink)',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      }));

      return response.data.files || [];
    } catch (error: any) {
      console.error('[DRIVE] Erro ao listar arquivos:', error.message);
      if (error.message && (error.message.includes('invalid_grant') || error.message.includes('auth') || error.message.includes('credential') || error.message.includes('expired') || error.message.includes('revoked'))) {
        console.warn(`[DRIVE] ⚠️ Erro de credenciais detectado na listagem. Alternando para MODO MOCK dinamicamente.`);
        this.drive = null;
        return this.listFiles(folderId);
      }
      throw error;
    }
  }
}

export const driveService = new GoogleDriveService();
