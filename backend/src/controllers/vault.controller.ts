import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../lib/auth";
import { prisma } from "../lib/prisma";
import { driveService } from "../services/googleDrive.service";
import { r2Service } from "../services/r2Storage.service";
import { MercadoPagoService } from "../services/mercadopago.service";
import { SubscriptionService } from "../services/subscription.service";
import sharp from "sharp";
import exifr from "exifr";
import axios from "axios";

import { WhatsAppService } from "../services/whatsapp.service";

/**
 * VaultController - Orquestrador da Fase 11 (Cofres de Memórias).
 * Gerencia a lógica de negócio unindo Prisma e Google Drive Cold Storage.
 */
export class VaultController {
  
  /**
   * Cria um novo cofre privado, gerando a pasta correspondente no Drive.
   */
  static async createAlbum(req: AuthRequest, res: Response) {
    const { name, nome, goalPoses, cycleEndDay } = req.body;
    const finalName = nome || name;
    const userId = req.user?.userId;

    if (!userId) return res.status(401).json({ error: "Não autenticado." });
    if (!finalName) return res.status(400).json({ error: "O nome do cofre é obrigatório." });

    try {
      console.log(`[VAULT] Iniciando criação de cofre: ${finalName} para usuário ${userId}`);

      // Gerar slug amigável
      const slug = finalName.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove acentos
        .replace(/[^a-z0-z0-9]/g, "-") // Troca tudo que não é letra/número por hífen
        .replace(/-+/g, "-") // Remove hífens duplicados
        .replace(/^-|-$/g, ""); // Remove hífens no início/fim
      
      const uniqueSlug = `${slug}-${Date.now().toString(36)}`;

      // 1. Validar Meta (Regra da Folha A4: Múltiplos de 4, mínimo 12)
      let finalGoal = Number(goalPoses) || 12;
      if (finalGoal < 12) finalGoal = 12;
      if (finalGoal % 4 !== 0) finalGoal = Math.ceil(finalGoal / 4) * 4;

      // 2. Criar a estrutura física no Cold Storage (Google Drive)
      const driveFolder = await driveService.createAlbumFolder(finalName);

      // 3. Persistir metadados e hierarquia no Prisma
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 30);

      const album = await prisma.sharedAlbum.create({
        data: {
          nome: finalName,
          slug: uniqueSlug,
          goalPoses: finalGoal,
          folderId: driveFolder.id,
          status: "OPEN",
          cycleEndDay: Number(cycleEndDay) || 30,
          trialEndsAt,
          subscriptionStatus: "TRIAL",
          ownerId: userId,
          members: {
            create: {
              userId,
              role: "OWNER"
            }
          }
        }
      });

      return res.status(201).json({
        message: "Cofre criado com sucesso.",
        album
      });
    } catch (error: any) {
      console.error("[VAULT] Erro ao criar cofre:", error.message);
      return res.status(500).json({ 
        error: "Falha na criação do cofre.", 
        details: error.message 
      });
    }
  }

  /**
   * (DIRECT UPLOAD ARCHITECTURE)
   * Passo 1: Inicia a sessão de Resumable Upload com o Google Drive e devolve a URL.
   */
  static async initResumableUpload(req: AuthRequest, res: Response) {
    const albumId = req.params.albumId as string;
    const userId = req.user?.userId;
    const { fileName, mimeType, fileSize, originalDate, width, height, type } = req.body;

    if (!userId) return res.status(401).json({ error: "Não autenticado." });
    if (!fileName || !mimeType) return res.status(400).json({ error: "fileName e mimeType são obrigatórios." });

    try {
      const album = await prisma.sharedAlbum.findUnique({
        where: { id: albumId },
        include: { 
          members: true,
          _count: { select: { media: true } }
        }
      });

      if (!album) return res.status(404).json({ error: "Cofre não encontrado." });
      
      // Regra de Negócio: Impedir upload além do DOBRO da meta
      if (album._count.media >= album.goalPoses * 2) {
        return res.status(400).json({ 
          error: "Cofre cheio!", 
          details: `Você atingiu o limite máximo de envios (${album.goalPoses * 2} fotos). A materialização é para as melhores ${album.goalPoses} poses.` 
        });
      }

      if (!album.folderId) return res.status(400).json({ error: "Infraestrutura de storage não inicializada para este cofre." });

      const isMember = (album as any).members.some((m: any) => m.userId === userId);
      if (!isMember) return res.status(403).json({ error: "Você não tem permissão para enviar mídias para este cofre." });

      // Gera nome final para evitar colisão
      const finalFileName = `vaults/${albumId}/${Date.now()}-${fileName.replace(/\s+/g, '_')}`;
      const { uploadUrl, publicUrl } = await r2Service.createPresignedUploadUrl({
        key: finalFileName,
        mimeType
      });

      return res.json({ uploadUrl, finalFileName, publicUrl, storageType: 'r2' });

    } catch (err: any) {
      console.error("[VAULT] Erro initResumableUpload:", err);
      return res.status(500).json({ error: "Falha ao iniciar sessão de upload", details: err.message });
    }
  }

  /**
   * (DIRECT UPLOAD ARCHITECTURE)
   * Passo 3: Após o cliente subir o arquivo para a URL, ele manda o fileId pra cá 
   * para salvar no banco de dados.
   */
  static async completeResumableUpload(req: AuthRequest, res: Response) {
    const albumId = req.params.albumId as string;
    const userId = req.user?.userId;
    const { key, publicUrl: filePublicUrl, fileSize, width, height, originalDate, type } = req.body;

    if (!userId) return res.status(401).json({ error: "Não autenticado." });
    if (!key) return res.status(400).json({ error: "key é obrigatório." });

    try {
      const album = await prisma.sharedAlbum.findUnique({
        where: { id: albumId },
        include: { members: true }
      });
      if (!album) return res.status(404).json({ error: "Cofre não encontrado." });

      const isMember = (album as any).members.some((m: any) => m.userId === userId);
      if (!isMember) return res.status(403).json({ error: "Você não tem permissão para este cofre." });

      const memberInfo = (album as any).members.find((m: any) => m.userId === userId);

      // Salva no banco de dados
      const newMedia = await prisma.sharedAlbumMedia.create({
        data: {
          albumId,
          uploadedById: userId,
          fileId: key,                        // key do R2 em vez de fileId do Drive
          webViewLink: filePublicUrl,          // URL pública do R2
          thumbnailLink: filePublicUrl,        // Sem thumbnail automático; usa a própria URL
          status: album.ownerId === userId ? 'APPROVED' : 'PENDING',
          type: type || 'PHOTO', // frontend must send type

          fileSize: fileSize || null,
          width: width || null,
          height: height || null,
          originalDate: originalDate ? new Date(originalDate) : null,
        },
        include: { uploadedBy: true, _count: { select: { votes: true } } }
      });

      return res.status(201).json(newMedia);
    } catch (err: any) {
      console.error("[VAULT] Erro completeResumableUpload:", err);
      return res.status(500).json({ error: "Falha ao finalizar upload", details: err.message });
    }
  }

  /**
   * (LEGADO - NÃO USAR PARA ARQUIVOS GRANDES EM VERCEL)
   * Realiza o upload de mídias para o cofre, salvando metadados e thumbnailLink.
   */
  static async uploadMedia(req: AuthRequest, res: Response) {
    const albumId = req.params.albumId as string;
    const file = req.file;
    const userId = req.user?.userId;

    if (!userId) return res.status(401).json({ error: "Não autenticado." });
    if (!file) return res.status(400).json({ error: "Nenhum arquivo enviado." });

    let uploadFilePath = file.path;

    try {
      // Validar existência do cofre e permissão do membro
      const album = await prisma.sharedAlbum.findUnique({
        where: { id: albumId },
        include: { 
          members: true,
          _count: { select: { media: true } }
        }
      });

      if (!album) return res.status(404).json({ error: "Cofre não encontrado." });
      
      // Regra de Negócio: Impedir upload além do DOBRO da meta (para permitir votação)
      if (album._count.media >= album.goalPoses * 2) {
        return res.status(400).json({ 
          error: "Cofre cheio!", 
          details: `Você atingiu o limite máximo de envios (${album.goalPoses * 2} fotos). A materialização é para as melhores ${album.goalPoses} poses.` 
        });
      }

      if (!album.folderId) return res.status(400).json({ error: "Infraestrutura de storage não inicializada para este cofre." });

      const isMember = (album as any).members.some((m: any) => m.userId === userId);
      if (!isMember) return res.status(403).json({ error: "Você não tem permissão para enviar mídias para este cofre." });

      // 1. Otimização & Upload para o Cold Storage
      const fileName = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
      
      let finalMimeType = file.mimetype;
      let finalFileName = fileName;
      
      let imageWidth: number | null = null;
      let imageHeight: number | null = null;
      let originalDate: Date | null = null;
      const fileSize = file.size;

      const fs = require('fs');
      const path = require('path');

      if (file.mimetype.startsWith('image/')) {
        try {
          // Extração de Metadados via Sharp & EXIFR a partir do disco
          const metadata = await sharp(uploadFilePath).metadata();
          imageWidth = metadata.width || null;
          imageHeight = metadata.height || null;
          
          try {
            const exifData = await exifr.parse(uploadFilePath);
            if (exifData && exifData.DateTimeOriginal) {
              originalDate = new Date(exifData.DateTimeOriginal);
            }
          } catch (exifErr) {
            console.warn("[VAULT] Falha ao extrair EXIF via exifr:", (exifErr as Error).message);
          }

          const resizedBuffer = await sharp(uploadFilePath)
            .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 80 })
            .toBuffer();
          
          finalMimeType = 'image/jpeg';
          finalFileName = fileName.replace(/\.[^/.]+$/, "") + ".jpeg";
          
          // Grava a versão comprimida por cima no disco para não deixar na RAM
          const os = require('os');
          const tempResized = path.join(os.tmpdir(), `resized_${finalFileName}`);
          fs.writeFileSync(tempResized, resizedBuffer);
          uploadFilePath = tempResized; // Atualiza a variável monitorada pelo finally

          console.log(`[VAULT] Imagem comprimida de ${file.size} para ${resizedBuffer.length} bytes.`);
        } catch (sharpError) {
          console.warn("[VAULT] Falha na compressão Sharp, enviando original:", sharpError);
        }
      }

      const driveFile = await driveService.uploadMedia({
        folderId: album.folderId,
        fileName: finalFileName,
        filePath: uploadFilePath,
        mimeType: finalMimeType
      });

      const isVideo = finalMimeType.startsWith('video/');

      // 2. Persistir metadados no Prisma (incluindo o thumbnailLink para performance)
      const media = await prisma.sharedAlbumMedia.create({
        data: {
          albumId: albumId as string,
          fileId: driveFile.id!,
          webViewLink: driveFile.webViewLink!,
          thumbnailLink: driveFile.thumbnailLink!,
          uploadedById: userId,
          fileSize: fileSize,
          width: imageWidth,
          height: imageHeight,
          originalDate: originalDate,
          type: isVideo ? "VIDEO" : "PHOTO",
          status: album.ownerId === userId ? "APPROVED" : "PENDING"
        }
      });

      // WA Gatilho 2 - Upload concluído
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user && user.whatsapp) {
        WhatsAppService.sendMessage(
          user.whatsapp,
          `Suas fotos chegaram no álbum *${album.nome}*! Vote nas favoritas: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/vaults/${album.id}`
        ).catch(console.error);
      }

      return res.status(201).json({
        message: "Upload concluído com sucesso.",
        media
      });
    } catch (error: any) {
      console.error("\n=======================================================");
      console.error("[VAULT] 🚨 ERRO CRÍTICO NO UPLOAD DE MÍDIA (Controller)");
      console.error("=======================================================");
      console.error(" - Mensagem:", error.message);
      if (error.response && error.response.data) {
        console.error(" - Google API Response (Detalhes do Bloqueio):");
        console.error(JSON.stringify(error.response.data, null, 2));
      } else {
        console.error(" - Nenhum detalhe de resposta da API (Pode ser falha local de Buffer ou Rede).");
      }
      console.error("=======================================================\n");

      return res.status(500).json({ 
        error: "Falha no upload.", 
        details: error.message || "Erro interno na comunicação com o Drive.",
        googleError: error.response?.data || null
      });
    } finally {
      // GARANTIA ABSOLUTA DE LIMPEZA DE DISCO (PREVENÇÃO OOM)
      const fs = require('fs');
      try {
        if (uploadFilePath && fs.existsSync(uploadFilePath)) fs.unlinkSync(uploadFilePath);
        if (file && file.path && fs.existsSync(file.path) && uploadFilePath !== file.path) fs.unlinkSync(file.path);
      } catch (e) {
        console.warn("[VAULT] Erro ignorado durante a limpeza de tmp files:", e);
      }
    }
  }

  /**
   * Lista as mídias de um cofre.
   */
  static async listMedia(req: AuthRequest, res: Response) {
    const albumId = req.params.albumId as string;
    const userId = req.user?.userId;

    if (!userId) return res.status(401).json({ error: "Não autenticado." });

    try {
      // Zero Trust: Validar se o usuário é membro do cofre
      const membership = await prisma.albumMember.findUnique({
        where: {
          albumId_userId: { albumId, userId }
        },
        include: { album: true }
      });

      if (!membership) return res.status(403).json({ error: "Acesso negado a este cofre." });

      if (membership.album.subscriptionStatus === "BLOCKED" || membership.album.subscriptionStatus === "EXPIRED") {
        return res.status(402).json({ 
          error: "SUBSCRIPTION_REQUIRED", 
          message: "O período gratuito deste cofre expirou. Assine para continuar acessando." 
        });
      }

      const media = await prisma.sharedAlbumMedia.findMany({
        where: { 
          albumId: albumId as string,
          ...(membership.role !== "OWNER" ? {
            OR: [
              { status: "APPROVED" },
              { uploadedById: userId }
            ]
          } : {})
        },
        orderBy: { createdAt: "desc" },
        include: {
          uploadedBy: {
            select: { nome: true }
          },
          _count: {
            select: { votes: true }
          }
        }
      });

      return res.json(media);
    } catch (error: any) {
      return res.status(500).json({ error: "Erro ao listar mídias do cofre." });
    }
  }

  /**
   * Lista os cofres onde o usuário é membro.
   */
  static async listAlbums(req: AuthRequest, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Não autenticado." });

    try {
      console.log(`[VAULT] Listando cofres para usuário: ${userId}`);
      const memberships = await prisma.albumMember.findMany({
        where: { userId },
        include: {
          album: {
            include: {
              subscription: true,
              _count: {
                select: { media: true, members: true }
              }
            }
          }
        },
        orderBy: { createdAt: "desc" }
      });

      return res.json(memberships.map((m: any) => ({
        ...m.album,
        myRole: m.role
      })));
    } catch (error: any) {
      console.error("[VAULT] Erro ao listar cofres:", error.message);
      return res.status(500).json({ error: "Erro ao listar seus cofres.", details: error.message });
    }
  }

  /**
   * Obtém detalhes de um cofre específico.
   */
  static async getAlbumDetails(req: AuthRequest, res: Response) {
    const albumId = req.params.albumId as string;
    const userId = req.user?.userId;

    if (!userId) return res.status(401).json({ error: "Não autenticado." });

    try {
      const album = await prisma.sharedAlbum.findUnique({
        where: { id: albumId },
        include: {
          members: {
            include: { user: { select: { nome: true } } }
          },
          subscription: true,
          _count: {
            select: { media: true, members: true }
          }
        }
      });

      if (!album) return res.status(404).json({ error: "Cofre não encontrado." });

      const isMember = album.members.some((m: any) => m.userId === userId);
      if (!isMember) return res.status(403).json({ error: "Acesso negado." });

      return res.json(album);
    } catch (error: any) {
      return res.status(500).json({ error: "Erro ao buscar detalhes do cofre." });
    }
  }
  /**
   * Gera um link de convite (AccessLink) para o cofre.
   */
  static async generateInvite(req: AuthRequest, res: Response) {
    const albumId = req.params.albumId as string;
    const userId = req.user?.userId;

    if (!userId) return res.status(401).json({ error: "Não autenticado." });

    try {
      const membership = await prisma.albumMember.findUnique({
        where: { albumId_userId: { albumId, userId } }
      });
      if (!membership || membership.role !== "OWNER") {
        return res.status(403).json({ error: "Apenas o proprietário pode gerar convites." });
      }

      // Criar um link válido por 7 dias
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const link = await prisma.accessLink.create({
        data: {
          albumId,
          code: Math.random().toString(36).substring(2, 12).toUpperCase(),
          expiresAt
        }
      });

      return res.json({
        inviteCode: link.code,
        expiresAt: link.expiresAt,
        url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/api/vaults/share/${link.code}`
      });
    } catch (error: any) {
      console.error("[INVITE] Erro:", error.message);
      return res.status(500).json({ error: "Erro ao gerar convite.", details: error.message });
    }
  }

  /**
   * Registra um voto em uma mídia.
   */
  static async voteMedia(req: AuthRequest, res: Response, next: NextFunction) {
    const mediaId = req.params.mediaId as string;
    const userId = req.user?.userId;

    if (!userId) return res.status(401).json({ error: "Não autenticado." });

    try {
      const media = await prisma.sharedAlbumMedia.findUnique({
        where: { id: mediaId }
      });

      if (!media) return res.status(404).json({ error: "Mídia não encontrada." });
      
      const membership = await prisma.albumMember.findUnique({
        where: { albumId_userId: { albumId: media.albumId, userId } }
      });

      if (!membership) return res.status(403).json({ error: "Acesso negado." });

      // Toggle vote
      const existingVote = await prisma.mediaVote.findUnique({
        where: { mediaId_userId: { mediaId, userId } }
      });

      if (existingVote) {
        await prisma.mediaVote.delete({ where: { id: existingVote.id } });
        return res.json({ voted: false });
      } else {
        await prisma.mediaVote.create({
          data: { mediaId, userId }
        });
        return res.json({ voted: true });
      }
    } catch (error: any) {
      console.error("[VOTE] Erro:", error.message);
      return res.status(500).json({ error: "Erro ao processar voto.", details: error.message });
    }
  }

  /**
   * Obtém detalhes de um convite pelo código.
   */
  static async getInvitationDetails(req: Request, res: Response, next: NextFunction) {
    const code = req.params.code as string;

    try {
      const link = await prisma.accessLink.findUnique({
        where: { code },
        include: {
          album: {
            select: {
              id: true,
              nome: true,
              _count: { select: { members: true, media: true } },
              owner: { select: { nome: true, referralCode: true } }
            }
          }
        }
      });

      if (!link) return res.status(404).json({ error: "Convite não encontrado." });
      if (link.expiresAt && link.expiresAt < new Date()) return res.status(410).json({ error: "Convite expirado." });

      return res.json(link);
    } catch (error: any) {
      return res.status(500).json({ error: "Erro ao buscar convite." });
    }
  }

  /**
   * Gera um preview HTML dinâmico com tags Open Graph para WhatsApp/Facebook
   * e redireciona os usuários reais para a aplicação.
   */
  static async sharePreview(req: Request, res: Response) {
    const code = req.params.code as string;
    
    try {
      const link = await prisma.accessLink.findUnique({
        where: { code },
        include: {
          album: {
            include: { owner: true }
          }
        }
      });

      const frontendUrl = process.env.FRONTEND_URL || "https://foto-segundo.vercel.app";

      if (!link) {
        return res.redirect(`${frontendUrl}`);
      }

      const albumName = link.album.nome;
      const ownerName = link.album.owner.nome.split(" ")[0]; // Pega apenas o primeiro nome
      const title = `${ownerName.toUpperCase()} CONVIDOU VOCÊ PARA O ÁLBUM - ${albumName.toUpperCase()}`;
      const description = "Acesse para ver as fotos e vídeos deste cofre de memórias no Foto Segundo.";
      // Logo default (deve existir na pasta public do frontend)
      const imageUrl = `${frontendUrl}/logo.png`;

      const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    
    <!-- Open Graph / WhatsApp / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="${frontendUrl}/api/vaults/share/${code}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${imageUrl}">
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="${frontendUrl}/api/vaults/share/${code}">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${imageUrl}">
    
    <!-- Redirecionamento instantâneo do cliente -->
    <meta http-equiv="refresh" content="0; url=${frontendUrl}/invitation/${code}">
</head>
<body style="background-color: #000; color: #fff; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;">
    <h2 style="opacity: 0.5;">Carregando convite...</h2>
</body>
</html>`;

      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.send(html);
    } catch (err) {
      console.error("[SHARE PREVIEW] Erro:", err);
      return res.redirect(process.env.FRONTEND_URL || "/");
    }
  }

  /**
   * Aceita um convite e adiciona o usuário ao cofre.
   */
  static async acceptInvite(req: AuthRequest, res: Response, next: NextFunction) {
    const code = req.params.code as string;
    const userId = req.user?.userId;

    if (!userId) return res.status(401).json({ error: "Não autenticado." });

    try {
      const link = await prisma.accessLink.findUnique({
        where: { code },
        include: { album: true }
      });

      if (!link) return res.status(404).json({ error: "Convite não encontrado." });
      if (link.expiresAt && link.expiresAt < new Date()) return res.status(410).json({ error: "Convite expirado." });

      // Verificar se já é membro
      const existing = await prisma.albumMember.findUnique({
        where: { albumId_userId: { albumId: link.albumId, userId } }
      });

      if (existing) {
        return res.json({ message: "Você já é membro deste cofre.", albumId: link.albumId });
      }

      // Adicionar como GUEST (Convidado)
      await prisma.albumMember.create({
        data: {
          albumId: link.albumId,
          userId,
          role: "GUEST"
        }
      });

      // WA Gatilho 1 - Convidado aceita o convite
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user && user.whatsapp && link.album) {
        WhatsAppService.sendMessage(
          user.whatsapp,
          `Oi ${user.nome}! Você foi adicionado ao álbum *${link.album.nome}*. Manda suas fotos aqui: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/vaults/${link.album.id}`
        ).catch(console.error);
      }

      return res.status(201).json({
        message: "Convite aceito com sucesso!",
        albumId: link.albumId
      });
    } catch (error: any) {
      console.error("[INVITE] Erro ao aceitar:", error.message);
      return res.status(500).json({ error: "Erro ao aceitar convite." });
    }
  }

  /**
   * Checkout On-Demand: Permite materializar as fotos do cofre manualmente.
   */
  static async checkoutVault(req: AuthRequest, res: Response) {
    const albumId = req.params.albumId as string;
    const userId = req.user?.userId;

    if (!userId) return res.status(401).json({ error: "Não autenticado." });

    try {
      const album = await prisma.sharedAlbum.findUnique({
        where: { id: albumId },
        include: { owner: true }
      });

      if (!album) return res.status(404).json({ error: "Cofre não encontrado." });
      if (album.ownerId !== userId) return res.status(403).json({ error: "Apenas o proprietário pode solicitar a materialização do cofre." });

      // 1. Buscar as top fotos
      const media = await prisma.sharedAlbumMedia.findMany({
        where: { albumId },
        include: { _count: { select: { votes: true } } }
      });

      const sortedMedia = media.sort((a: any, b: any) => b._count.votes - a._count.votes);
      const topMedia = sortedMedia.slice(0, album.goalPoses);

      if (topMedia.length === 0) {
        return res.status(400).json({ error: "Não há fotos no cofre para materializar." });
      }

      // 2. Preço Dinâmico: base varia com o goalPoses do cofre
      const PRICE_TABLE: Record<number, number> = { 12: 29.90, 24: 49.90, 36: 69.90, 48: 89.90 };
      const basePrice = PRICE_TABLE[album.goalPoses] ?? 49.90;
      const shippingPrice = 15.00; // Carta Registrada
      const total = basePrice + shippingPrice;

      // 3. Garantir Evento Específico do Cofre
      let systemEvent = await prisma.event.findFirst({
        where: { slug: `vault-${album.id}` }
      });

      if (!systemEvent) {
        systemEvent = await prisma.event.create({
          data: {
            slug: `vault-${album.id}`,
            title: album.nome,
            active: true,
            dataEvento: new Date(),
            ownerId: album.ownerId
          }
        });
      }

      // 4. Criar Pedido
      const order = await prisma.order.create({
        data: {
          valor: total,
          status: "PENDENTE",
          eventId: systemEvent.id,
          clienteId: userId,
          buyerEmail: album.owner.email,
          deliveryType: "SHIPPING",
          fulfillmentStatus: "PENDING",
          isManual: true,
          manualType: "VAULT_ONDEMAND",
          shippingFee: shippingPrice,
          internalNotes: `Checkout Avulso do cofre: ${album.nome}`,
          items: {
            create: topMedia.map((m: any) => ({
              price: 0,
              quantity: 1,
              selectedPhotos: [m.id]
            }))
          }
        }
      });

      // Aqui integraria com o Mercado Pago Service para gerar o init_point real.
      
      const backendUrl = process.env.BACKEND_URL || `http://localhost:3001`;
      const mpResponse = await MercadoPagoService.createPreference({
        transaction_amount: total,
        description: `Materialização Cofre: ${album.nome}`,
        payer_email: album.owner.email,
        notification_url: `${backendUrl}/api/webhooks/mercadopago`,
        orderId: order.id
      });

      await prisma.order.update({
        where: { id: order.id },
        data: { paymentId: String(mpResponse.id) }
      });

      // WA Gatilho 3 - Owner materializa
      if (album.owner.whatsapp) {
        WhatsAppService.sendMessage(
          album.owner.whatsapp,
          `As fotos mais votadas do *${album.nome}* estão sendo preparadas para impressão! Acompanhe: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/vaults/${album.id}`
        ).catch(console.error);
      }

      return res.json({
        orderId: order.id,
        init_point: mpResponse.init_point,
        sandbox_init_point: mpResponse.sandbox_init_point,
        total,
        photosCount: topMedia.length
      });

    } catch (error: any) {
      console.error("[VAULT CHECKOUT] Erro:", error.message);
      return res.status(500).json({ error: "Erro ao processar checkout do cofre.", details: error.message });
    }
  }

  /**
   * Ativa a assinatura recorrente para o cofre.
   */
  static async subscribe(req: AuthRequest, res: Response) {
    const albumId = req.params.albumId as string;
    const userId = req.user?.userId;
    const { planLimit } = req.body || {};

    if (!userId) return res.status(401).json({ error: "Não autenticado." });

    try {
      const result = await SubscriptionService.createVaultSubscription(userId, albumId, planLimit || 36);
      
      return res.json(result);
    } catch (error: any) {
      console.error("[VAULT SUBSCRIBE] Erro:", error.message);
      
      const message = error.message || "";
      let status = 500;
      
      if (message.includes("Apenas o proprietário")) {
        status = 403; // Forbidden
      } else if (message.includes("já possui uma assinatura") || message.includes("não encontrado")) {
        status = 400; // Bad Request
      }
      
      return res.status(status).json({ error: message || "Erro ao processar assinatura do cofre." });
    }
  }

  /**
   * Proxy de mídia para contornar restrições de CORS do Google Drive.
   */
  static async proxyMedia(req: Request, res: Response) {
    const fileId = req.params.fileId as string;
    if (!fileId) return res.status(400).send("File ID missing");

    try {
      const media = await prisma.sharedAlbumMedia.findUnique({
        where: { fileId },
        include: { album: true }
      });

      if (media && (media.album.subscriptionStatus === "BLOCKED" || media.album.subscriptionStatus === "EXPIRED")) {
        return res.status(402).send("SUBSCRIPTION_REQUIRED");
      }

      // Se for arquivo mock, servir diretamente do diretório local
      if (fileId.startsWith("mock-file-")) {
        const fs = require('fs');
        const path = require('path');
        const uploadDir = path.join(process.cwd(), 'uploads', 'vaults');
        
        let fileName = "";
        if (media && media.webViewLink) {
          fileName = media.webViewLink.substring(media.webViewLink.lastIndexOf('/') + 1);
        }
        
        const filePath = path.join(uploadDir, fileName || fileId);
        if (fs.existsSync(filePath)) {
          const contentType = fileName.endsWith('.mp4') ? 'video/mp4' : 'image/jpeg';
          res.setHeader('Content-Type', contentType);
          res.setHeader('Cache-Control', 'public, max-age=86400');
          return fs.createReadStream(filePath).pipe(res);
        } else if (media && media.webViewLink) {
          // If mock file isn't local, just redirect to the webViewLink (e.g. picsum)
          return res.redirect(media.webViewLink);
        }
      }

      const driveRes = await driveService.getMediaStream(fileId);
      
      const contentType = driveRes.headers['content-type'] || 'image/jpeg';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400');

      // Pipe the stream directly
      return (driveRes.data as any).pipe(res);
    } catch (error: any) {
      console.error("[PROXY MEDIA] Erro fatal:");
      console.error(" - Mensagem:", error.message);
      
      // Fallback para arquivo local se falhar a conexão com o Google Drive
      try {
        const media = await prisma.sharedAlbumMedia.findUnique({ where: { fileId } });
        if (media && media.webViewLink) {
          const fs = require('fs');
          const path = require('path');
          const fileName = media.webViewLink.substring(media.webViewLink.lastIndexOf('/') + 1);
          const filePath = path.join(process.cwd(), 'uploads', 'vaults', fileName);
          if (fs.existsSync(filePath)) {
            const contentType = fileName.endsWith('.mp4') ? 'video/mp4' : 'image/jpeg';
            res.setHeader('Content-Type', contentType);
            res.setHeader('Cache-Control', 'public, max-age=86400');
            return fs.createReadStream(filePath).pipe(res);
          }
        }
      } catch (localErr) {
        console.error("[PROXY MEDIA] Falha ao tentar carregar localmente:", localErr);
      }

      if (error.response) {
        console.error(" - Google Data:", JSON.stringify(error.response.data, null, 2));
        console.error(" - Status:", error.response.status);
        return res.status(error.response.status || 500).json({ 
          error: "Erro na API do Google Drive", 
          details: error.message,
          googleError: error.response.data 
        });
      }
      res.status(500).send("Erro ao carregar mídia");
    }
  }

  /**
   * Baixa todas as mídias do cofre como um arquivo ZIP via stream
   */
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

      let mediaIds: string[] = [];
      if (req.query.mediaIds && typeof req.query.mediaIds === 'string') {
        mediaIds = req.query.mediaIds.split(',').filter(id => id.trim().length > 0);
      }

      const mediaList = await prisma.sharedAlbumMedia.findMany({
        where: {
          albumId,
          ...(membership.role !== 'OWNER' ? {
            OR: [{ status: 'APPROVED' }, { uploadedById: userId }]
          } : {}),
          ...(mediaIds.length > 0 ? { id: { in: mediaIds } } : {})
        },
        select: { fileId: true, webViewLink: true, type: true }
      });

      if (mediaList.length === 0) {
        return res.status(404).json({ error: 'Nenhuma foto encontrada para download.' });
      }

      // Se Worker não configurado, usa o archiver local
      const workerUrl = process.env.WORKER_URL;
      if (!workerUrl) {
        console.warn("[VAULT] WORKER_URL não configurado, usando archiver local para zip");
        const { ZipArchive } = require('archiver');
        const archive = new ZipArchive({ zlib: { level: 5 } });
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${membership.album.nome.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-fotos.zip"`);
        archive.pipe(res);

        let addedCount = 0;
        for (const media of mediaList) {
          try {
            const ext = media.type === 'VIDEO' ? 'mp4' : 'jpg';
            const fileName = `${media.fileId.replace(/[^a-zA-Z0-9._-]/g, '_')}.${ext}`;

            if (media.webViewLink && (media.webViewLink.startsWith('http://') || media.webViewLink.startsWith('https://'))) {
              // R2 ou qualquer URL pública — busca via HTTP
              const httpRes = await axios.get(media.webViewLink, { responseType: 'stream', timeout: 30000 });
              archive.append(httpRes.data, { name: fileName });
              addedCount++;
            } else if (media.fileId.startsWith('mock-file-')) {
              // Arquivo local mock
              const fs = require('fs');
              const path = require('path');
              const localName = media.webViewLink
                ? media.webViewLink.substring(media.webViewLink.lastIndexOf('/') + 1)
                : media.fileId;
              const filePath = path.join(process.cwd(), 'uploads', 'vaults', localName);
              if (fs.existsSync(filePath)) {
                archive.append(fs.createReadStream(filePath), { name: fileName });
                addedCount++;
              } else {
                console.warn(`[VAULT] Arquivo local não encontrado: ${filePath}`);
              }
            } else {
              // Fallback: Google Drive
              const driveRes = await driveService.getMediaStream(media.fileId);
              archive.append(driveRes.data, { name: fileName });
              addedCount++;
            }
          } catch (e) {
            console.error(`[VAULT] Erro ao adicionar ${media.fileId} ao zip:`, e);
          }
        }

        console.log(`[VAULT] ZIP finalizado com ${addedCount}/${mediaList.length} arquivos.`);
        await archive.finalize();
        return;
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

  /**
   * Atualiza configurações gerais do cofre (nome e/ou meta de poses). Apenas Proprietário.
   */
  static async renameAlbum(req: AuthRequest, res: Response) {
    const albumId = req.params.albumId as string;
    const userId = req.user?.userId;
    const { nome, goalPoses, externalVideoLink } = req.body;

    if (!userId) return res.status(401).json({ error: "Não autenticado." });
    if (!nome && goalPoses === undefined && externalVideoLink === undefined) return res.status(400).json({ error: "Nenhum campo para atualizar." });

    try {
      const album = await prisma.sharedAlbum.findUnique({ where: { id: albumId } });
      if (!album) return res.status(404).json({ error: "Cofre não encontrado." });
      if (album.ownerId !== userId) return res.status(403).json({ error: "Apenas o proprietário pode editar o cofre." });

      const updateData: { nome?: string; goalPoses?: number; externalVideoLink?: string | null } = {};

      if (nome && nome.trim()) updateData.nome = nome.trim();
      if (externalVideoLink !== undefined) updateData.externalVideoLink = externalVideoLink;

      if (goalPoses !== undefined) {
        let finalGoal = Number(goalPoses);
        if (isNaN(finalGoal) || finalGoal < 12) finalGoal = 12;
        if (finalGoal % 4 !== 0) finalGoal = Math.ceil(finalGoal / 4) * 4;
        updateData.goalPoses = finalGoal;
      }

      const updated = await prisma.sharedAlbum.update({
        where: { id: albumId },
        data: updateData
      });
      return res.json(updated);
    } catch (e: any) {
      return res.status(500).json({ error: "Erro ao atualizar cofre.", details: e.message });
    }
  }

  /**
   * Remove um membro (Convidado) do cofre (Apenas Proprietário)
   */
  static async removeMember(req: AuthRequest, res: Response) {
    const albumId = req.params.albumId as string;
    const targetUserId = req.params.userId as string;
    const ownerId = req.user?.userId;

    if (!ownerId) return res.status(401).json({ error: "Não autenticado." });

    try {
      const album = await prisma.sharedAlbum.findUnique({ where: { id: albumId } });
      if (!album) return res.status(404).json({ error: "Cofre não encontrado." });
      if (album.ownerId !== ownerId) return res.status(403).json({ error: "Apenas o proprietário pode remover membros." });
      if (targetUserId === ownerId) return res.status(400).json({ error: "Não é possível remover o proprietário." });

      await prisma.albumMember.delete({
        where: { albumId_userId: { albumId, userId: targetUserId } }
      });

      return res.json({ success: true });
    } catch (e: any) {
      return res.status(500).json({ error: "Erro ao remover membro.", details: e.message });
    }
  }

  /**
   * Exclui permanentemente uma mídia do banco de dados e do Google Drive (Apenas Proprietário)
   */
  static async deleteMedia(req: AuthRequest, res: Response) {
    const albumId = req.params.albumId as string;
    const mediaId = req.params.mediaId as string;
    const ownerId = req.user?.userId;

    if (!ownerId) return res.status(401).json({ error: "Não autenticado." });

    try {
      const album = await prisma.sharedAlbum.findUnique({ where: { id: albumId } });
      if (!album) return res.status(404).json({ error: "Cofre não encontrado." });
      if (album.ownerId !== ownerId) return res.status(403).json({ error: "Apenas o proprietário pode excluir fotos." });

      const media = await prisma.sharedAlbumMedia.findUnique({ where: { id: mediaId, albumId } });
      if (!media) return res.status(404).json({ error: "Mídia não encontrada." });

      // 1. Tentar deletar do Drive
      try {
        await driveService.deleteItem(media.fileId);
      } catch (driveErr) {
        console.warn(`[VAULT DELETE] Falha ao deletar arquivo ${media.fileId} do Drive. Ignorando...`, driveErr);
      }

      // 2. Deletar do BD
      await prisma.sharedAlbumMedia.delete({ where: { id: mediaId } });

      return res.json({ success: true, message: "Foto excluída com sucesso." });
    } catch (e: any) {
      console.error("[VAULT DELETE MEDIA] Erro:", e.message);
      return res.status(500).json({ error: "Erro ao excluir foto.", details: e.message });
    }
  }

  /**
   * Atualiza o status de aprovação de uma mídia (Apenas Proprietário)
   */
  static async rotateMedia(req: AuthRequest, res: Response) {
    const albumId = req.params.albumId as string;
    const mediaId = req.params.mediaId as string;
    const { direction } = req.body; // 'LEFT' ou 'RIGHT'
    const userId = req.user?.userId;

    if (!userId) return res.status(401).json({ error: "Não autenticado." });

    try {
      const album = await prisma.sharedAlbum.findUnique({
        where: { id: albumId }
      });

      if (!album) return res.status(404).json({ error: "Cofre não encontrado." });
      if (album.ownerId !== userId) return res.status(403).json({ error: "Apenas o proprietário pode rotacionar a mídia." });

      const media = await prisma.sharedAlbumMedia.findUnique({
        where: { id: mediaId }
      });

      if (!media) return res.status(404).json({ error: "Mídia não encontrada." });

      let newRotation = media.rotation;
      if (direction === 'LEFT') {
        newRotation = (newRotation - 90) % 360;
        if (newRotation < 0) newRotation += 360;
      } else if (direction === 'RIGHT') {
        newRotation = (newRotation + 90) % 360;
      } else {
        return res.status(400).json({ error: "Direção inválida. Use 'LEFT' ou 'RIGHT'." });
      }

      const updated = await prisma.sharedAlbumMedia.update({
        where: { id: mediaId },
        data: { rotation: newRotation }
      });

      return res.json(updated);
    } catch (error: any) {
      console.error("[VAULT] Erro ao rotacionar mídia:", error.message);
      return res.status(500).json({ error: "Erro ao rotacionar mídia.", details: error.message });
    }
  }

  static async updateMediaStatus(req: AuthRequest, res: Response) {
    const albumId = req.params.albumId as string;
    const mediaId = req.params.mediaId as string;
    const ownerId = req.user?.userId;
    const { status } = req.body;

    if (!ownerId) return res.status(401).json({ error: "Não autenticado." });
    if (!["APPROVED", "PENDING", "REJECTED"].includes(status)) {
      return res.status(400).json({ error: "Status inválido." });
    }

    try {
      const album = await prisma.sharedAlbum.findUnique({ where: { id: albumId } });
      if (!album) return res.status(404).json({ error: "Cofre não encontrado." });
      if (album.ownerId !== ownerId) return res.status(403).json({ error: "Apenas o proprietário pode aprovar fotos." });

      const media = await prisma.sharedAlbumMedia.update({
        where: { id: mediaId, albumId },
        data: { status }
      });

      return res.json({ success: true, media });
    } catch (e: any) {
      console.error("[VAULT UPDATE MEDIA] Erro:", e.message);
      return res.status(500).json({ error: "Erro ao atualizar status da foto.", details: e.message });
    }
  }

  static async buyService(req: AuthRequest, res: Response) {
    const albumId = req.params.albumId as string;
    const userId = req.user?.userId;
    const { serviceId, internalNotes, referenceFiles, soundtrackSuggestion } = req.body;

    if (!userId) return res.status(401).json({ error: "Não autenticado." });
    if (!serviceId) return res.status(400).json({ error: "serviceId é obrigatório." });

    try {
      // 1. Validar membro do cofre
      const membership = await prisma.albumMember.findUnique({
        where: { albumId_userId: { albumId, userId } }
      });
      if (!membership) return res.status(403).json({ error: "Você não é membro deste cofre." });

      // 2. Buscar álbum e serviço
      const album = await prisma.sharedAlbum.findUnique({
        where: { id: albumId },
        include: { owner: true }
      });
      if (!album) return res.status(404).json({ error: "Cofre não encontrado." });

      const service = await prisma.serviceCatalog.findUnique({ where: { id: serviceId } });
      if (!service || !service.active || !(service as any).availableInVault) {
        return res.status(404).json({ error: "Serviço não disponível." });
      }

      // 3. Garantir Evento do Cofre
      let systemEvent = await prisma.event.findFirst({
        where: { slug: `vault-${album.id}` }
      });

      if (!systemEvent) {
        systemEvent = await prisma.event.create({
          data: {
            slug: `vault-${album.id}`,
            title: album.nome,
            active: true,
            dataEvento: new Date(),
            ownerId: album.ownerId
          }
        });
      }

      // 3.5 Garantir ProfessionalService (para o relacionamento do OrderItem)
      let proService = await prisma.professionalService.findFirst({
        where: { catalogId: service.id, active: true }
      });

      if (!proService) {
        let firstPro = await prisma.profissional.findFirst();
        if (!firstPro) {
          let adminUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });
          if (!adminUser) {
            adminUser = await prisma.user.findFirst();
          }
          if (adminUser) {
            firstPro = await prisma.profissional.create({
              data: {
                userId: adminUser.id,
                experienceYears: 5,
                hourlyRate: 150,
                equipmentMultiplier: 1.0,
              }
            });
          }
        }

        if (firstPro) {
          proService = await prisma.professionalService.create({
            data: {
              profissionalId: firstPro.id,
              catalogId: service.id,
              name: service.name,
              description: service.description,
              price: service.basePrice,
              active: true,
              category: service.category,
              estimatedMinutes: service.estimatedMinutes,
              reviewStatus: "APPROVED",
            }
          });
        }
      }

      if (!proService) {
        return res.status(500).json({ error: "Nenhum profissional disponível para associar ao serviço do catálogo." });
      }

      // 4. Criar pedido PENDENTE
      const buyer = await prisma.user.findUnique({ where: { id: userId } });
      const order = await prisma.order.create({
        data: {
          valor: Number(service.basePrice),
          status: "PENDENTE",
          eventId: systemEvent.id,
          clienteId: userId,
          buyerEmail: buyer?.email || album.owner.email,
          isManual: true,
          manualType: "VAULT_SERVICE",
          paymentId: `VAULT-SVC-${Date.now()}`,
          internalNotes: `Serviço "${service.name}" contratado via cofre "${album.nome}"${internalNotes ? `\n\nObservações: ${internalNotes}` : ""}`,
          referenceFiles: referenceFiles ? referenceFiles : undefined,
          soundtrackSuggestion: soundtrackSuggestion || undefined,
          items: {
            create: [{
              serviceId: proService.id,
              price: Number(service.basePrice),
              quantity: 1,
            }]
          }
        }
      });

      // 5. Notificar admin via WhatsApp
      const { NotificationService } = require("../services/notification.service");
      NotificationService.notifyNewSale({
        buyerEmail: buyer?.email || "desconhecido",
        eventTitle: `Serviço: ${service.name} (Cofre: ${album.nome})`,
        orderId: order.id,
        amount: Number(service.basePrice)
      });

      return res.json({
        orderId: order.id,
        amount: Number(service.basePrice),
        serviceName: service.name
      });
    } catch (error: any) {
      console.error("[VAULT BUY SERVICE] Erro:", error.message);
      return res.status(500).json({ error: "Erro ao contratar serviço.", details: error.message });
    }
  }
}
