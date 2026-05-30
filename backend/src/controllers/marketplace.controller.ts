import { Response } from "express";
import { AuthRequest } from "../lib/auth";
import prisma from "../lib/prisma";
import { slugify } from "../lib/utils";
import { supabaseAdmin } from "../lib/supabase";
import { PricingService } from "../services/pricing.service";
import { NotificationService } from "../services/notification.service";
import { MercadoPagoService } from "../services/mercadopago.service";
import { audit } from "../lib/audit";
import { applyWatermark } from "../lib/image-processor";
import bcrypt from "bcryptjs";
import { driveService } from "../services/googleDrive.service";
import { GamificationService } from "../services/gamification.service";
import { PhygitalService } from "../services/phygital.service";

export class MarketplaceController {
  /**
   * POST /api/marketplace/express-sale
   * A "Venda Rápida": Cria evento + Pedido Manual em um único clique.
   */
  static async expressSale(req: AuthRequest, res: Response) {
    const { 
      customerEmail, email, 
      customerName, 
      amount, valorTotal, 
      paymentMethod, method, 
      location, ponto, 
      date,
      captacaoId,
      internalNotes,
      whatsapp,
      productType,
      cart 
    } = req.body;

    const finalEmail = (customerEmail || email)?.toLowerCase().trim();
    const finalAmount = Number(amount || valorTotal);
    const finalMethod = (paymentMethod || method || "DINHEIRO").toUpperCase();
    const finalLocation = location || ponto || "Venda Direta";
    const finalName = customerName || finalEmail.split('@')[0].toUpperCase();
    const finalProduct = productType || "FOTOS";

    if (!finalEmail || !finalAmount) {
      return res.status(400).json({ error: "E-mail e Valor são obrigatórios." });
    }

    if (req.user?.userId) {
      const dbUser = await prisma.user.findUnique({ where: { id: req.user.userId } });
      if (!dbUser || (dbUser.role === "PROFISSIONAL" && !dbUser.isVerified && dbUser.verificationStatus !== "APPROVED")) {
        return res.status(403).json({ error: "Sua conta de profissional ainda não foi aprovada pelo administrador. Aguarde a aprovação para criar vendas expressas." });
      }
    }

    let tempPassword: string | null = null;

    try {
      // 1. Garante que o cliente existe
      let user = await prisma.user.findUnique({ where: { email: finalEmail } });
      
      if (!user) {
        tempPassword = "FS-" + Math.random().toString(36).slice(-8).toUpperCase();
        try {
          const hash = await bcrypt.hash(tempPassword, 12);
          const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: finalEmail,
            password: tempPassword,
            email_confirm: true,
            user_metadata: { nome: finalName, role: "CLIENTE" }
          });

          if (authError) {
            if (authError.message.includes("already registered")) {
              const existingUser = await prisma.user.findFirst({ where: { email: finalEmail } });
              if (existingUser) {
                user = existingUser;
                tempPassword = ""; // Clear tempPassword so the email template shows the "habitual" message
              } else {
                // User exists in Supabase but not in Prisma (edge case)
                const { data: { users: sbUsers } } = await supabaseAdmin.auth.admin.listUsers();
                const sbUser = (sbUsers as { id: string, email?: string }[]).find(u => u.email === finalEmail);
                if (sbUser) {
                  user = await prisma.user.create({
                    data: { id: sbUser.id, email: finalEmail, nome: finalName, senha: "", whatsapp: whatsapp || null, role: "CLIENTE" }
                  });
                  tempPassword = "";
                }
              }
            } else { throw authError; }
          } else if (authData?.user) {
            user = await prisma.user.create({
              data: { id: authData.user.id, email: finalEmail, nome: finalName, senha: hash, whatsapp: whatsapp || null, role: "CLIENTE" }
            });
          }
        } catch (err: unknown) {
          console.error("[ExpressSale Auto-Register Error]:", err instanceof Error ? err.message : String(err));
          const fallbackHash = await bcrypt.hash(tempPassword as string, 10);
          user = await prisma.user.create({
            data: { email: finalEmail, nome: finalName, senha: fallbackHash, whatsapp: whatsapp || null, role: "CLIENTE" }
          });
        }
      }

      if (!user) return res.status(500).json({ error: "Falha ao identificar ou criar usuário." });

      // 2. Cria o Evento
      const eventDate = date ? new Date(date) : new Date();
      let slug = slugify(`express-${finalEmail.split('@')[0]}-${Date.now().toString(36)}`);
      const { editorId } = req.body; 

      const isPhysical = finalProduct === "SD_CARD" || finalProduct === "ALBUM_IMPRESSO";
      // BUG FIX: Evento só fica ativo de imediato para pagamentos físicos (MONEY/PIX direto).
      // Para PIX/CARD digitais (checkout pendente), o evento só é ativado após confirmação via webhook.
      const isDigitalPayment = finalMethod === "PIX" || finalMethod === "CARD";

      const event = await prisma.event.create({
        data: {
          title: finalName,
          dataEvento: eventDate,
          location: finalLocation,
          type: "PHOTO_MARKETPLACE",
          active: !isDigitalPayment, // Ativa imediatamente só para pagamentos físicos confirmados
          isPrivate: true,
          slug,
          captacaoId: captacaoId || req.user?.userId,
          edicaoId: isPhysical ? null : (editorId || captacaoId || req.user?.userId), 
          captacaoStatus: "ACCEPTED",
          edicaoStatus: (editorId && !isPhysical) ? "PENDING" : "ACCEPTED", 
          pricePerPhoto: 15, 
          isUnitSale: true,
          priceUnit: finalAmount
        }
      });

      // 3. Vincular mídias
      let orderItems: Array<{ mediaId: string; price: number; quantity: number }> = [];
      if (Array.isArray(cart) && cart.length > 0) {
        const dbMedias = await prisma.eventMedia.findMany({
          where: { eventId: event.id, shortId: { in: cart } }
        });
        orderItems = dbMedias.map(m => ({
          mediaId: m.id,
          price: Number(m.price ?? 15),
          quantity: 1
        }));
      }

      // 4. Cria o Pedido
      const isDigital = isDigitalPayment;
      const { matriz, captacao, edicao, cartorio } = await PricingService.calculateSplits(finalAmount, {
        isExpressSale: true,
        paymentMethod: finalMethod,
        hasEditor: !!editorId,
        productType: finalProduct
      });

      const guestToken = "GT-" + Math.random().toString(36).slice(-12).toUpperCase();

      const order = await prisma.order.create({
        data: {
          eventId: event.id,
          clienteId: user.id,
          editorId: (editorId && !isPhysical) ? editorId : null,
          valor: finalAmount,
          status: isDigital ? "PENDENTE" : "APROVADO",
          hasPaid: !isDigital,
          isManual: !isDigital,
          manualType: finalMethod,
          contributorName: finalName,
          buyerEmail: finalEmail,
          buyerWhatsapp: whatsapp || null,
          internalNotes: internalNotes || null,
          splitMatriz: matriz,
          splitCaptacao: captacao,
          splitEdicao: edicao,
          splitCartorio: cartorio,
          guestToken: guestToken,
          isGuestOrder: true,
          items: {
            create: orderItems
          }
        }
      });
      
      // 5. INTEGRAÇÃO MERCADO PAGO (Para Venda Digital via Checkout Interno)
      // BUG FIX: Não geramos mais o Checkout Pro externo do MP.
      // Retornamos o link da nossa página de checkout (/checkout/:orderId) que usa o MP Bricks.
      // Isso garante o padrão de UX da plataforma e evita o checkout externo.
      let checkoutUrl: string | null = null;
      if (isDigital) {
        const frontendUrl = process.env.FRONTEND_URL || "https://foto-segundo.vercel.app";
        checkoutUrl = `${frontendUrl}/checkout/${order.id}`;
        console.log(`[ExpressSale] Checkout URL interno gerado: ${checkoutUrl}`);

        // Salva o paymentId como referência para o webhook conseguir localizar o pedido
        // (O MP Brick vai criar o pagamento e vincular via orderId no processPayment)
        await prisma.order.update({
          where: { id: order.id },
          data: { buyerEmail: finalEmail } // Garante que o e-mail está salvo para o checkout transparente
        });
      }

      // Audit — Registro de Venda Expressa (P0)
      await audit(req, "EXPRESS_SALE_CREATED", "Event", event.id, null, {
        type: event.type,
        amount: finalAmount,
        method: finalMethod,
        location: finalLocation,
        buyerEmail: finalEmail,
        orderId: order.id,
        isDigital,
        hasCheckout: !!checkoutUrl
      });

      // ENVIO DE E-MAIL (Sempre enviamos para garantir o link de acesso)
      const magicLink = `${process.env.FRONTEND_URL}/e/${event.slug || event.id}?token=${guestToken}`;
      
      NotificationService.sendWelcomeEmail({
        to: finalEmail,
        name: finalName,
        tempPassword: tempPassword || undefined,
        magicLink: magicLink,
        checkoutUrl: checkoutUrl || undefined
      }).catch(e => console.error("[ExpressSale Email Error]:", e));

      return res.json({ 
        success: true, 
        eventId: event.id, 
        orderId: order.id,
        isDigital,
        checkoutUrl, // Enviando o link real para o frontend
        magicLink,   // Enviando o link de acesso direto do cliente
        message: isDigital 
          ? "Venda registrada. Gerando link de pagamento..." 
          : "Venda registrada e liquidada com sucesso!"
      });

    } catch (error) {
      console.error("Erro na Venda Expressa:", error);
      return res.status(500).json({ error: "Falha ao registrar venda expressa." });
    }
  }

  /**
   * POST /api/marketplace/events/:id/media
   * Fotógrafo sobe fotos individuais (Base64)
   */
  static async addMedia(req: AuthRequest, res: Response) {
    const { id: eventId } = req.params;
    const { imageBase64, mimeType, price, metadata } = req.body;
    const userId = req.user?.userId;

    if (!imageBase64 || !mimeType) {
      return res.status(400).json({ error: "Imagem e MimeType são obrigatórios." });
    }

    try {
      // 1. Validar propriedade do evento
      const event = await prisma.event.findFirst({
        where: {
          id: String(eventId),
          OR: [{ captacaoId: userId }, { edicaoId: userId }]
        }
      });
      if (!event) return res.status(403).json({ error: "Acesso negado." });

      // 2. Upload unificado pela esteira Phygital (garante borda polaroid, watermark tiling, e metadados)
      const base64Data = String(imageBase64).replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      
      const dbUser = await prisma.user.findUnique({ where: { id: userId } });
      const customerName = dbUser?.nome || "Fotógrafo / Admin";

      const result = await PhygitalService.processUpload(buffer, {
        eventId: String(eventId),
        customerName,
        customerPhone: "Manual Upload",
        userId,
        isBulk: false,
        applyWatermark: true,
        price: price ? Number(price) : undefined
      });

      // 3. Buscar a mídia recém-criada para retornar o mesmo formato esperado pelo frontend
      const media = await prisma.eventMedia.findFirst({
        where: { eventId: String(eventId), shortId: result.referenceCode.split('-').pop() },
        orderBy: { createdAt: 'desc' }
      });

      if (!media) {
        throw new Error("Erro ao tentar localizar mídia recém processada pelo PhygitalService");
      }

      // Audit — Upload de Mídia (P2)
      await audit(req, "MEDIA_UPLOADED", "EventMedia", media.id, null, {
        eventId: String(eventId),
        url: media.url,
        shortId: media.shortId,
        price: media.price
      });

      return res.json(media);
    } catch (error) {
      console.error("[AddMedia Error]:", error);
      return res.status(500).json({ error: "Erro ao adicionar mídia ao storage." });
    }
  }

  /**
   * GET /api/marketplace/events/:id/media
   * Cliente visualiza fotos para compra.
   * Trava de Privacidade: Se o evento for privado, exige vínculo com o usuário.
   */
  static async listMedia(req: AuthRequest, res: Response) {
    const { id: eventId } = req.params;
    const authUser = req.user;

    try {
      console.log(`[MarketplaceController.listMedia] Listando mídias para evento: ${eventId}`);
      // 1. Busca o evento para verificar privacidade
      const event = await prisma.event.findUnique({
        where: { id: String(eventId) },
        select: { 
          id: true, 
          isPrivate: true, 
          captacaoId: true, 
          edicaoId: true, 
          cartorioUserId: true 
        }
      });

      if (!event) return res.status(404).json({ error: "Evento não encontrado." });

      // 2. Se for privado, exige autorização
      if (event.isPrivate) {
        if (!authUser) {
          return res.status(401).json({ error: "Este álbum é privado. Por favor, faça login para acessar." });
        }

        const isOwner = authUser && (
          authUser.role === "ADMIN" || 
          authUser.userId === event.captacaoId || 
          authUser.userId === event.edicaoId || 
          authUser.userId === event.cartorioUserId
        );

        if (!isOwner) {
          // Verifica se o usuário tem algum pedido para este evento
          const order = await prisma.order.findFirst({
            where: { 
              eventId: event.id, 
              clienteId: authUser.userId,
              status: { not: "CANCELADO" }
            }
          });

          // Também permite acesso se o usuário fez um upload phygital para este evento
          const phygitalUpload = order ? null : await prisma.phygitalPrint.findFirst({
            where: { eventId: event.id, userId: authUser.userId }
          });

          if (!order && !phygitalUpload) {
            return res.status(403).json({ error: "Você não tem permissão para visualizar este álbum privado." });
          }
        }
      }

      // 3. Filtro de busca (Escolar/Esportivo)
      const { search } = req.query;
      const whereClause: any = { eventId: String(eventId) };

      if (search) {
        const searchStr = String(search);
        whereClause.OR = [
          { shortId: { contains: searchStr, mode: 'insensitive' } },
          {
            metadata: {
              path: ['studentId'],
              string_contains: searchStr
            }
          },
          {
            metadata: {
              path: ['bibNumber'],
              string_contains: searchStr
            }
          }
        ];
      }

      // 4. Retorna as mídias (Híbrido: EventMedia + PhygitalPrint)
      const media = await prisma.eventMedia.findMany({
        where: whereClause,
        orderBy: { shortId: "asc" }
      });

      const phygital = await prisma.phygitalPrint.findMany({
        where: { eventId: String(eventId) },
        include: { user: true }
      });

      // Mapeia Phygital para o formato de Media
      const mappedPhygital = phygital.map(p => {
        const isProfessional = p.userId && (
          p.userId === event.captacaoId ||
          p.userId === event.edicaoId ||
          p.user?.role === "PROFISSIONAL"
        );
        return {
          id: p.id,
          eventId: p.eventId,
          url: p.imageUrl,
          shortId: p.referenceCode, // Usamos referenceCode como shortId
          price: null,
          type: "PHOTO",
          isGuest: !isProfessional,          // Fotos de convidados via QR Code se não for profissional
          createdAt: p.createdAt
        };
      });

      // Deduplica por URL (Prioridade para EventMedia se houver duplicata)
      const allMedia = [...media];
      const existingUrls = new Set(media.map(m => m.url));
      
      media.forEach(m => {
        const meta = m.metadata as any;
        if (meta?.printUrl) existingUrls.add(meta.printUrl);
        if (meta?.rawUrl) existingUrls.add(meta.rawUrl);
      });

      mappedPhygital.forEach(p => {
        if (!existingUrls.has(p.url)) {
          allMedia.push(p as any);
          existingUrls.add(p.url);
        }
      });

      // 4. Se logado, retorna IDs desbloqueados
      let unlockedMediaIds: string[] = [];
      if (authUser) {
        const paidOrders = await prisma.order.findMany({
          where: { 
            eventId: event.id, 
            clienteId: authUser.userId,
            status: { in: ["PAGO", "APROVADO"] }
          },
          include: { items: true }
        });
        paidOrders.forEach(o => {
          o.items.forEach(item => {
            if (item.mediaId) unlockedMediaIds.push(item.mediaId);
          });
        });
      }

      return res.json({
        media: allMedia,
        unlockedMediaIds
      });
    } catch (error) {
      console.error("[Marketplace.listMedia] Erro:", error);
      return res.status(500).json({ error: "Erro ao listar mídias." });
    }
  }

  /**
   * POST /api/marketplace/events/:id/sync-drive
   * Sincroniza fotos de uma pasta do Google Drive com o marketplace.
   * Extrai metadados (studentId/bibNumber) automaticamente do nome do arquivo.
   */
  static async syncEventMedia(req: AuthRequest, res: Response) {
    const { id: eventId } = req.params;
    const userId = req.user?.userId;

    try {
      // 1. Validar propriedade e obter o driveUrl
      const event = await prisma.event.findFirst({
        where: {
          id: String(eventId),
          OR: [{ captacaoId: userId }, { edicaoId: userId }, { cartorioUserId: userId }, { franchiseeId: userId }]
        }
      });

      if (!event) return res.status(403).json({ error: "Acesso negado ou evento não encontrado." });
      if (!event.driveUrl) return res.status(400).json({ error: "Este evento não possui um Drive URL configurado." });

      // Extrair ID da pasta do Drive URL
      const folderIdMatch = event.driveUrl.match(/[\w-]{25,}/);
      if (!folderIdMatch) return res.status(400).json({ error: "Drive URL inválido (ID da pasta não encontrado)." });
      const folderId = folderIdMatch[0];

      // 2. Listar arquivos no Drive
      console.log(`[SYNC] Iniciando sincronização para evento ${event.title} (ID: ${eventId})`);
      const files = await driveService.listFiles(folderId);
      console.log(`[SYNC] ${files.length} arquivos encontrados no Drive.`);

      let createdCount = 0;
      let updatedCount = 0;

      // 3. Processar cada arquivo
      for (const file of files) {
        if (!file.id || !file.name) continue;

        // Regex para extrair identificador (sequência de 3 a 10 dígitos)
        // Exemplos: 12345.jpg, ALUNO_12345.jpg, BIB_123.jpg
        const idMatch = file.name.match(/(\d{3,10})/);
        const extractedId = idMatch ? idMatch[1] : null;

        const metadata: any = {};
        if (extractedId) {
          if (event.type === 'SCHOOL') metadata.studentId = extractedId;
          else if (event.type === 'SPORTS') metadata.bibNumber = extractedId;
          else metadata.identifier = extractedId;
        }

        // Verificar se já existe (usamos o fileId do drive como referência única no campo 'url' ou via metadata)
        // Aqui usaremos a URL (ou o ID do drive se preferir) como chave.
        // Para simplificar e evitar duplicatas, checamos se já existe EventMedia com essa URL.
        const existingMedia = await prisma.eventMedia.findFirst({
          where: { eventId: event.id, url: file.id } // Usamos o ID do Drive como URL para o proxy
        });

        if (existingMedia) {
          await prisma.eventMedia.update({
            where: { id: existingMedia.id },
            data: { 
              metadata: { ...(existingMedia.metadata as object || {}), ...metadata },
              price: event.pricePerPhoto || 15
            }
          });
          updatedCount++;
        } else {
          // Gerar ShortID sequencial
          const count = await prisma.eventMedia.count({ where: { eventId: event.id } });
          const shortId = `F${(count + 1 + createdCount).toString().padStart(4, '0')}`;

          await prisma.eventMedia.create({
            data: {
              eventId: event.id,
              url: file.id, // Armazenamos o ID do Drive. O frontend usará o proxy para exibir.
              shortId,
              price: event.pricePerPhoto || 15,
              metadata: metadata
            }
          });
          createdCount++;
        }
      }

      await audit(req, "DRIVE_SYNC_COMPLETED", "Event", event.id, null, {
        filesFound: files.length,
        created: createdCount,
        updated: updatedCount
      });

      return res.json({
        success: true,
        message: `Sincronização concluída: ${createdCount} novas, ${updatedCount} atualizadas.`,
        details: { total: files.length, created: createdCount, updated: updatedCount }
      });

    } catch (error: any) {
      console.error("[SyncDrive Error]:", error);
      return res.status(500).json({ error: "Erro durante a sincronização com o Google Drive.", details: error.message });
    }
  }

  /**
   * PATCH /api/marketplace/media/:mediaId/metadata
   * Allows Admin to fix metadata manually (studentId, bibNumber, etc).
   */
  static async patchMediaMetadata(req: AuthRequest, res: Response) {
    const mediaId = String(req.params.mediaId);
    const { metadata } = req.body;

    try {
      const updated = await prisma.eventMedia.update({
        where: { id: mediaId },
        data: { metadata: metadata || {} }
      });

      await audit(req, "MEDIA_METADATA_UPDATED", "EventMedia", mediaId, null, { metadata });

      return res.json(updated);
    } catch (error: any) {
      console.error("[PatchMediaMetadata Error]:", error);
      return res.status(500).json({ error: "Falha ao atualizar metadados da mídia." });
    }
  }

  /**
   * GET /api/marketplace/profissionais
   * Public directory of subscribed professionals.
   * Only returns users with an ACTIVE PRO subscription.
   */
  static async listProfissionais(req: AuthRequest, res: Response) {
    const { search, city, service, lat, lng } = req.query;
    try {
      // Find users with active PRO subscriptions
      const activeSubs = await prisma.subscription.findMany({
        where: { type: "PRO", status: "ACTIVE" },
        select: { userId: true }
      });
      const subscribedUserIds = activeSubs.map(s => s.userId);

      if (subscribedUserIds.length === 0) {
        return res.json({ profissionais: [] });
      }

      const where: any = {
        userId: { in: subscribedUserIds },
        user: {
          isVerified: true,
          active: true,
          ...(search ? { nome: { contains: String(search), mode: "insensitive" } } : {}),
        },
        ...(service ? { services: { has: String(service).toUpperCase() } } : {}),
      };

      // Se passou city, filtra tanto no user.address quanto no profissional.city
      if (city) {
        where.OR = [
          { city: { contains: String(city), mode: "insensitive" } },
          { user: { address: { contains: String(city), mode: "insensitive" } } }
        ];
      }

      let profissionais = await prisma.profissional.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              nome: true,
              profileImageUrl: true,
              address: true,
              isVerified: true,
            }
          }
        },
        take: 100, // We take more if filtering by distance
      });

      // Se passou lat/lng, aplica filtro de raio e ordena por distância
      if (lat && lng) {
        const clientLat = Number(lat);
        const clientLng = Number(lng);
        
        if (!isNaN(clientLat) && !isNaN(clientLng)) {
          const R = 6371; // Radius in km
          const deg2rad = (deg: number) => deg * (Math.PI / 180);

          profissionais = profissionais.filter((p) => {
            // Se o profissional não tem localização base configurada, ele não é retornado no filtro "Near Me"
            // ou podemos assumir que ele atende o país todo se o raio for gigante, mas melhor remover.
            if (!p.baseLocationLat || !p.baseLocationLng) return false;

            const dLat = deg2rad(p.baseLocationLat - clientLat);
            const dLon = deg2rad(p.baseLocationLng - clientLng);
            const a =
              Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(deg2rad(clientLat)) * Math.cos(deg2rad(p.baseLocationLat)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = R * c;

            // Salva a distância para ordenar depois
            (p as any).distanceToClient = distance;

            // Filtra pelo raio do profissional (default 50)
            return distance <= (p.serviceRadiusKm || 50);
          });

          // Sort by distance (closest first), then agility points
          profissionais.sort((a, b) => {
            const distA = (a as any).distanceToClient || 0;
            const distB = (b as any).distanceToClient || 0;
            if (distA !== distB) return distA - distB;
            return b.agilityPoints - a.agilityPoints;
          });
        }
      } else {
        // Se não tem localização, ordena por Agility Points
        profissionais.sort((a, b) => b.agilityPoints - a.agilityPoints);
      }

      // Limita a 60 após o sort/filter
      profissionais = profissionais.slice(0, 60);

      return res.json({ profissionais });
    } catch (error: any) {
      console.error("[listProfissionais Error]:", error);
      return res.status(500).json({ error: "Erro ao listar profissionais." });
    }
  }

  /**
   * GET /api/marketplace/profissionais/:id
   * Returns public profile for a professional.
   * Contact (WhatsApp) is always hidden — only revealed after booking fee payment.
   */
  static async getProfissionalProfile(req: AuthRequest, res: Response) {
    const id = String(req.params.id);
    try {
      const prof = await prisma.profissional.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              nome: true,
              profileImageUrl: true,
              address: true,
              isVerified: true,
              verificationStatus: true,
              createdAt: true,
              whatsapp: true,
              pixKey: true,
            }
          },
          proServices: true,
        }
      });

      if (!prof) return res.status(404).json({ error: "Profissional não encontrado." });

      // Increment profile views asynchronously
      prisma.profissional.update({
        where: { id: prof.id },
        data: { profileViews: { increment: 1 } }
      }).catch(e => console.error("[Analytics] Error incrementing profile views:", e));

      // Check if this professional has an active PRO subscription
      const sub = await prisma.subscription.findFirst({
        where: { userId: prof.userId, type: "PRO", status: "ACTIVE" }
      });

      const badges = GamificationService.getProfessionalBadges(prof, !!sub);

      const p: any = prof;
      // Return public-safe data (no WhatsApp!)
      return res.json({
        id: p.id,
        userId: p.userId,
        nome: p.user.nome,
        profileImageUrl: p.user.profileImageUrl,
        address: p.user.address,
        isVerified: p.user.isVerified,
        services: p.services,
        otherHabilities: p.otherHabilities,
        experienceYears: p.experienceYears,
        workflowType: p.workflowType,
        avgDeliveryHours: p.avgDeliveryHours,
        totalMissions: p.totalMissions,
        agilityPoints: p.agilityPoints,
        proServices: p.proServices,
        isSubscriber: !!sub,
        badges,
        memberSince: p.user.createdAt,
      });
    } catch (error: any) {
      console.error("[getProfissionalProfile Error]:", error);
      return res.status(500).json({ error: "Erro ao buscar perfil." });
    }
  }

  /**
   * POST /api/marketplace/profissionais/book
   * Client initiates a booking fee payment to unlock professional contact.
   * Creates a ServiceBooking + MercadoPago preference for the fee.
   */
  static async bookProfissional(req: AuthRequest, res: Response) {
    const { profissionalId, packageDesc, bookingFee, clientePhone } = req.body;
    const userId = req.user?.userId;
    const clienteEmail = req.user?.email || req.body.clienteEmail;
    const clienteName = req.body.clienteName || req.user?.nome || "Cliente";

    if (!profissionalId || !packageDesc || !bookingFee) {
      return res.status(400).json({ error: "profissionalId, packageDesc e bookingFee são obrigatórios." });
    }

    try {
      const prof = await prisma.profissional.findUnique({
        where: { id: profissionalId },
        include: { user: { select: { nome: true, isVerified: true } } }
      });
      if (!prof) return res.status(404).json({ error: "Profissional não encontrado." });

      // Create the booking record
      const booking = await prisma.serviceBooking.create({
        data: {
          clienteName,
          clienteEmail,
          clientePhone: clientePhone || "",
          profissionalId,
          packageDesc,
          bookingFee: Number(bookingFee),
          status: "PENDING",
        } as any
      });

      // Create MP preference for the booking fee
      let checkoutUrl: string | null = null;
      try {
        const preference = await MercadoPagoService.createPreference({
          transaction_amount: Number(bookingFee),
          description: `Taxa de Reserva — ${prof.user.nome} | ${packageDesc}`,
          payer_email: clienteEmail,
          notification_url: `${process.env.BACKEND_URL}/api/webhooks/mercadopago`,
          orderId: `booking-${booking.id}`,
        });
        checkoutUrl = preference.init_point ?? null;
      } catch (mpErr) {
        console.error("[bookProfissional MP Error]:", mpErr);
      }

      await audit(req, "SERVICE_BOOKING_CREATED", "ServiceBooking", booking.id, null, {
        profissionalId,
        packageDesc,
        bookingFee,
        checkoutUrl: !!checkoutUrl,
      });

      return res.json({
        bookingId: booking.id,
        checkoutUrl,
        message: "Reserva iniciada. Complete o pagamento para receber o contato do profissional."
      });
    } catch (error: any) {
      console.error("[bookProfissional Error]:", error);
      return res.status(500).json({ error: "Erro ao iniciar reserva." });
    }
  }
}
