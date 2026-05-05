import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../lib/auth";
import { prisma } from "../lib/prisma";
import { driveService } from "../services/googleDrive.service";
import { MercadoPagoService } from "../services/mercadopago.service";

/**
 * VaultController - Orquestrador da Fase 11 (Cofres de Memórias).
 * Gerencia a lógica de negócio unindo Prisma e Google Drive Cold Storage.
 */
export class VaultController {
  
  /**
   * Cria um novo cofre privado, gerando a pasta correspondente no Drive.
   */
  static async createVault(req: AuthRequest, res: Response) {
    const { name, goalPoses, cycleEndDay } = req.body;
    const userId = req.user?.userId;

    if (!userId) return res.status(401).json({ error: "Não autenticado." });
    if (!name) return res.status(400).json({ error: "O nome do cofre é obrigatório." });

    try {
      console.log(`[VAULT] Iniciando criação de cofre: ${name} para usuário ${userId}`);

      // 1. Criar a estrutura física no Cold Storage (Google Drive)
      // Nota: driveService já utiliza o GOOGLE_DRIVE_ROOT_FOLDER_ID como parent.
      const driveFolder = await driveService.createAlbumFolder(name);

      // 2. Persistir metadados e hierarquia no Prisma
      const album = await prisma.sharedAlbum.create({
        data: {
          name,
          goalPoses: Number(goalPoses) || 36,
          folderId: driveFolder.id,
          status: "OPEN",
          cycleEndDay: Number(cycleEndDay) || 30,
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
   * Realiza o upload de mídias para o cofre, salvando metadados e thumbnailLink.
   */
  static async uploadMedia(req: AuthRequest, res: Response) {
    const albumId = req.params.albumId as string;
    const file = req.file;
    const userId = req.user?.userId;

    if (!userId) return res.status(401).json({ error: "Não autenticado." });
    if (!file) return res.status(400).json({ error: "Nenhum arquivo enviado." });

    try {
      // Validar existência do cofre e permissão do membro
      const album = await prisma.sharedAlbum.findUnique({
        where: { id: albumId },
        include: { members: true }
      });

      if (!album) return res.status(404).json({ error: "Cofre não encontrado." });
      if (!album.folderId) return res.status(400).json({ error: "Infraestrutura de storage não inicializada para este cofre." });

      const isMember = (album as any).members.some((m: any) => m.userId === userId);
      if (!isMember) return res.status(403).json({ error: "Você não tem permissão para enviar mídias para este cofre." });

      // 1. Upload para o Cold Storage
      const fileName = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
      const driveFile = await driveService.uploadMedia(
        album.folderId,
        fileName,
        file.buffer,
        file.mimetype
      );

      // 2. Persistir metadados no Prisma (incluindo o thumbnailLink para performance)
      const media = await prisma.sharedAlbumMedia.create({
        data: {
          albumId: albumId as string,
          fileId: driveFile.id!,
          webViewLink: driveFile.webViewLink!,
          thumbnailLink: driveFile.thumbnailLink!,
          uploadedById: userId
        }
      });

      return res.status(201).json({
        message: "Upload concluído com sucesso.",
        media
      });
    } catch (error: any) {
      console.error("[VAULT] Erro no upload de mídia:", error.message);
      return res.status(500).json({ 
        error: "Falha no upload.", 
        details: error.message 
      });
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
        }
      });

      if (!membership) return res.status(403).json({ error: "Acesso negado a este cofre." });

      const media = await prisma.sharedAlbumMedia.findMany({
        where: { albumId: albumId as string },
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
  static async listMyVaults(req: AuthRequest, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Não autenticado." });

    try {
      console.log(`[VAULT] Listando cofres para usuário: ${userId}`);
      const memberships = await prisma.albumMember.findMany({
        where: { userId },
        include: {
          album: {
            include: {
              _count: {
                select: { media: true, members: true }
              }
            }
          }
        },
        orderBy: { createdAt: "desc" }
      });

      return res.json(memberships.map(m => ({
        ...m.album,
        myRole: m.role
      })));
    } catch (error: any) {
      console.error("[VAULT] Erro ao listar cofres:", error.message);
      return res.status(500).json({ error: "Erro ao listar seus cofres.", details: error.message });
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
        url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invitation/${link.code}`
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
              name: true,
              _count: { select: { members: true, media: true } }
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
   * Aceita um convite e adiciona o usuário ao cofre.
   */
  static async acceptInvite(req: AuthRequest, res: Response, next: NextFunction) {
    const code = req.params.code as string;
    const userId = req.user?.userId;

    if (!userId) return res.status(401).json({ error: "Não autenticado." });

    try {
      const link = await prisma.accessLink.findUnique({
        where: { code }
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

      const sortedMedia = media.sort((a, b) => b._count.votes - a._count.votes);
      const topMedia = sortedMedia.slice(0, album.goalPoses);

      if (topMedia.length === 0) {
        return res.status(400).json({ error: "Não há fotos no cofre para materializar." });
      }

      // 2. Preço Fixo (Exemplo: Pacote Cofre + Carta Registrada)
      const basePrice = 49.90; // Pacote On-Demand
      const shippingPrice = 15.00; // Carta Registrada
      const total = basePrice + shippingPrice;

      // 3. Garantir Evento de Sistema
      let systemEvent = await prisma.event.findFirst({
        where: { slug: "vaults-system" }
      });

      if (!systemEvent) {
        systemEvent = await prisma.event.create({
          data: {
            slug: "vaults-system",
            nomeNoivos: "System: Vaults Orders",
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
          internalNotes: `Checkout Avulso do cofre: ${album.name}`,
          items: {
            create: topMedia.map(m => ({
              price: 0,
              quantity: 1
            }))
          }
        }
      });

      // Aqui integraria com o Mercado Pago Service para gerar o init_point real.
      
      const backendUrl = process.env.BACKEND_URL || `http://localhost:3001`;
      const mpResponse = await MercadoPagoService.createPreference({
        transaction_amount: total,
        description: `Materialização Cofre: ${album.name}`,
        payer_email: album.owner.email,
        notification_url: `${backendUrl}/api/webhooks/mercadopago`,
        orderId: order.id
      });

      await prisma.order.update({
        where: { id: order.id },
        data: { paymentId: String(mpResponse.id) }
      });

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
}
