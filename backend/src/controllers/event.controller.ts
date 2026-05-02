import { Response } from "express";
import { AuthRequest } from "../lib/auth";
import prisma from "../lib/prisma";
import { NotificationService } from "../services/notification.service";
import bcrypt from "bcryptjs";
import { APP_URL } from "../lib/config";

export class EventController {
  /**
   * GET /api/public/events/:id/access
   * Libera links sensíveis se o pagamento estiver aprovado.
   */
  static async getAccess(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { orderId } = req.query;

      if (!orderId) {
        return res.status(400).json({ error: "ID do pedido é obrigatório" });
      }

      const order = await prisma.order.findUnique({
        where: { id: orderId as string },
        include: { event: true }
      });

      if (!order || order.eventId !== id || order.status !== "APROVADO") {
        return res.status(403).json({ error: "Acesso ainda não liberado. Aguardando processamento." });
      }

      return res.json({
        lightroomUrl: order.showAlbum ? order.event.lightroomUrl : null,
        driveUrl: order.showVideo ? order.event.driveUrl : null,
        eventTitle: order.event.nomeNoivos,
        accessType: order.accessType || "PRIVATE"
      });
    } catch (error) {
      console.error("Erro ao verificar acesso:", error);
      return res.status(500).json({ error: "Erro interno ao processar acesso." });
    }
  }

  /**
   * GET /api/events/:id
   * Lógica de Pivot: Retorna URLs de entrega baseando-se no acesso.
   */
  static async getById(req: AuthRequest, res: Response) {
    const { slug: id } = req.params; // O express mapeia :slug para req.params.slug
    const { userId } = req.query;

    console.log(`[EventController.getById] Buscando evento por id/slug: ${id}`);
    
    // Usuário identificado pelo middleware optionalAuth
    const authUser = req.user;

    try {
      // Busca no banco por ID ou Slug
      const event = await prisma.event.findFirst({
        where: { 
          OR: [
            { id: String(id) },
            { slug: String(id) }
          ]
        },
        include: {
          cartorioUser: { select: { cartorio: { select: { razaoSocial: true } } } },
          captacao: { select: { id: true } },
          edicao: { select: { id: true } }
        }
      });

      if (!event) {
        return res.status(404).json({ error: "Evento não encontrado" });
      }

      // 1. Identifica o usuário (Query ou JWT)
      const currentUserId = (userId as string) || (authUser?.userId);

      // 2. Busca qualquer pedido (Pendente ou Aprovado) para este usuário/evento
      const order = currentUserId ? await prisma.order.findFirst({
        where: { 
          eventId: event.id, 
          clienteId: currentUserId,
          status: { not: "CANCELADO" }
        },
        orderBy: { createdAt: "desc" }
      }) : null;
      
      // 3. Lógica de Acesso (Pivot)
      const isOwner = authUser && (
        authUser.role === "ADMIN" || 
        authUser.userId === event.captacaoId || 
        authUser.userId === event.edicaoId || 
        authUser.userId === event.cartorioUserId
      );

      const isPaid = order && (order.status === "PAGO" || order.status === "APROVADO");
      
      // Verifica se o álbum já foi "liberado" globalmente (pelo menos um pagamento aprovado de álbum completo)
      // Nota: Para PHOTO_MARKETPLACE, o acesso continua sendo individual por pedido.
      let isGloballyPaid = false;
      if (event.type !== 'PHOTO_MARKETPLACE') {
        const anyPaidOrder = await prisma.order.findFirst({
          where: { 
            eventId: event.id, 
            status: { in: ["PAGO", "APROVADO"] },
            manualType: { not: "Reserva (50%)" } // Reserva não libera o álbum todo
          }
        });
        isGloballyPaid = !!anyPaidOrder;
      }

      const hasAccess = isPaid || isOwner || isGloballyPaid;

      // 3.1 Guard específico para PHOTO_MARKETPLACE
      // Removido o bloqueio agressivo de 404 que impedia o primeiro acesso para compra.
      // A segurança agora é tratada pela lógica de paywall e hasAccess abaixo.
      if (event.type === 'PHOTO_MARKETPLACE') {
        if (!isOwner) {
          const isCorrectBuyer = currentUserId && (
            order && (order.status === "PAGO" || order.status === "APROVADO")
          );

          if (!isCorrectBuyer) {
            // Sem token ou comprador errado: retorna o evento SEM mídia + paywall ativo
            // (o frontend vai pedir login/pagamento)
            const rawPreviews = event.previewPhotos;
            const previewPhotos: string[] = rawPreviews ? (typeof rawPreviews === "string" ? JSON.parse(rawPreviews) : rawPreviews) : [];

            return res.json({
              id: event.id,
              nomeNoivos: event.nomeNoivos,
              dataEvento: event.dataEvento,
              cartorio: event.cartorioUser?.cartorio?.razaoSocial || event.location,
              coverPhotoUrl: event.coverPhotoUrl,
              type: event.type,
              isUnitSale: event.isUnitSale,
              priceUnit: event.priceUnit,
              pricePerPhoto: event.pricePerPhoto,
              previewPhotos,
              isOwner: false,
              hasAccess: false,
              paywall: { active: true, message: "Acesse com o e-mail utilizado na compra para liberar downloads." }
            });
          }
        }
      } else if (event.isPrivate && !hasAccess) {
        // Evento privado sem acesso: bloqueia apenas se nenhum pagamento foi confirmado.
        // Se isGloballyPaid = true, hasAccess já será true acima e não cairemos aqui.
        return res.status(403).json({ 
          error: "Este álbum é privado e não está vinculado à sua conta.",
          isPrivate: true 
        });
      }


      // 4. Links sensíveis e Previews
      let previewPhotos: string[] = [];
      const rawPreviews = event.previewPhotos;
      const jsonPreviews: string[] = rawPreviews ? (typeof rawPreviews === "string" ? JSON.parse(rawPreviews) : rawPreviews) : [];
      
      if (event.type === 'PHOTO_MARKETPLACE') {
        const prints = await prisma.phygitalPrint.findMany({
          where: { eventId: event.id },
          orderBy: { createdAt: 'desc' },
          take: 50,
          select: { imageUrl: true }
        });
        previewPhotos = prints.map(p => p.imageUrl);
        // Se houver previews manuais, adicionamos no final
        previewPhotos = [...previewPhotos, ...jsonPreviews];
      } else {
        previewPhotos = jsonPreviews;
      }

      return res.json({
        id: event.id,
        nomeNoivos: event.nomeNoivos,
        dataEvento: event.dataEvento,
        cartorio: event.cartorioUser?.cartorio?.razaoSocial || event.location,
        coverPhotoUrl: event.coverPhotoUrl,
        priceBase: event.priceBase,
        priceEarly: event.priceEarly,
        temFoto: event.temFoto,
        temVideo: event.temVideo,
        temReels: event.temReels,
        temFotoImpressa: event.temFotoImpressa,
        previewPhotos,
        pendingOrderId: (order && order.status === "PENDENTE") ? order.id : null,
        isOwner: hasAccess,
        // Links sensíveis só aparecem se aprovado e visível
        lightroomUrl: (hasAccess && (!order || order.showAlbum)) ? event.lightroomUrl : null,
        driveUrl: (hasAccess && (!order || order.showVideo)) ? event.driveUrl : null,
        paywall: {
          active: !hasAccess,
          message: hasAccess ? "Entrega liberada." : "Galeria protegida."
        },
        recentOrders: await prisma.order.findMany({
          where: { eventId: event.id, status: "APROVADO", contributorName: { not: null } },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { id: true, contributorName: true, valor: true, createdAt: true }
        }),
        isUnitSale: event.isUnitSale,
        priceUnit: event.priceUnit,
        type: event.type,
        isPrivate: event.isPrivate,
        clientEmail: event.clientEmail,
        isPrimaryClient: !!(authUser && event.clientEmail && authUser.email === event.clientEmail),
        city: event.city,
        location: event.location,
      });
    } catch (error) {
      console.error("Erro ao buscar evento:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  /**
   * GET /api/public/events
   * Lista eventos para a vitrine pública com suporte a busca robusta e paginação real.
   */
  static async listPublic(req: AuthRequest, res: Response) {
    try {
      const { q, page = "1" } = req.query;
      const query = q as string;
      const take = 20;
      const skip = (Number(page) - 1) * take;
      // Normalização robusta: transforma "&" em "e" para busca flexível
      const term = query ? `%${query.toLowerCase().replace(/&/g, "e")}%` : "%";

      // 1. Busca os eventos com SQL Nativo para máxima estabilidade (contornando Case-Sensitivity)
      const events: Array<{
        id: string;
        nomeNoivos: string;
        dataEvento: Date;
        cartorio: string | null;
        coverPhotoUrl: string | null;
        priceBase: number;
        priceEarly: number;
        temFoto: boolean;
      }> = await prisma.$queryRaw`
        SELECT 
          id, 
          "nomeNoivos", 
          "dataEvento", 
          cartorio, 
          "coverPhotoUrl",
          "priceBase",
          "priceEarly",
          type,
          true as "temFoto" -- Ativando badges por padrão para estética
        FROM events
        WHERE active = true AND "isPrivate" = false AND "isQuote" = false
          AND type IN ('ALBUM_FULL', 'PHOTO_MARKETPLACE')
          AND (
          REPLACE(LOWER("nomeNoivos"), '&', 'e') LIKE ${term} 
          OR REPLACE(LOWER(cartorio), '&', 'e') LIKE ${term}
        )
        ORDER BY "dataEvento" DESC
        LIMIT ${take} OFFSET ${skip}
      `;

      // 2. Busca o total para cálculo de páginas
      const countResult: Array<{ count: number }> = await prisma.$queryRaw`
        SELECT COUNT(*)::int as count FROM events
        WHERE active = true AND "isPrivate" = false AND "isQuote" = false
          AND type = 'ALBUM_FULL'
          AND (
          REPLACE(LOWER("nomeNoivos"), '&', 'e') LIKE ${term} 
          OR REPLACE(LOWER(cartorio), '&', 'e') LIKE ${term}
        )
      `;
      
      const total = countResult[0].count;
      const pages = Math.ceil(total / take);

      return res.json({
        events,
        total,
        page: Number(page),
        pages
      });
    } catch (error) {
      console.error("Erro ao listar eventos públicos:", error);
      return res.status(500).json({ error: "Erro ao carregar vitrine", details: error instanceof Error ? error.message : String(error) });
    }
  }

  /**
   * GET /api/public/partners
   * Lista todos os cartórios cadastrados como pontos parceiros.
   */
  static async listPartners(req: AuthRequest, res: Response) {
    try {
      const partners = await prisma.user.findMany({
        where: { role: "CARTORIO" },
        include: { cartorio: true },
        orderBy: { nome: "asc" }
      });
      return res.json(partners.map(p => {
        const legacyPrices = {
          foto: p.cartorio?.priceFoto,
          video: p.cartorio?.priceVideo,
          reels: p.cartorio?.priceReels,
          impresso: p.cartorio?.priceImpresso
        };
        const customPrices = (p.cartorio?.servicePrices as Record<string, number>) || {};
        
        // Merge legacy with custom (custom takes priority)
        const mergedPrices = { ...legacyPrices, ...customPrices };

        const cartorioConfig = p.cartorio as {
          razaoSocial?: string;
          cidade?: string;
          fixedDuration?: number;
          fixedTime?: boolean;
          hideDuration?: boolean;
          workingHours?: unknown;
          disabledServices?: string[];
        } | null;

        return {
          id: p.id,
          name: cartorioConfig?.razaoSocial || p.nome,
          city: cartorioConfig?.cidade || "Campinas",
          prices: mergedPrices,
          fixedDuration: cartorioConfig?.fixedDuration ?? 2,
          fixedTime: cartorioConfig?.fixedTime ?? false,
          hideDuration: cartorioConfig?.hideDuration ?? false,
          workingHours: cartorioConfig?.workingHours,
          disabledServices: cartorioConfig?.disabledServices || []
        };
      }));
    } catch (error) {
      console.error("Erro ao listar parceiros:", error);
      return res.status(500).json({ error: "Erro interno ao listar parceiros." });
    }
  }

  /**
   * POST /api/public/quotes
   * Processa a solicitação de orçamento e gera o fluxo de reserva.
   */
  static async createQuote(req: AuthRequest, res: Response) {
    try {
      const { 
        name, email, whatsapp, attendees, locationType, usageType, selectedPartnerId, 
        customCep, eventDate, eventHours, eventDays, description, selectedServices, totalPrice 
      } = req.body;
      
      // ── ANTI-FLOOD / DUPLICATE CHECK ──
      const recentEvent = await prisma.event.findFirst({
        where: {
          clientEmail: email,
          dataEvento: new Date(eventDate),
          createdAt: {
            gt: new Date(Date.now() - 2 * 60 * 1000) // últimos 2 minutos
          }
        }
      });

      if (recentEvent) {
        console.log(`[Quote] Bloqueando duplicata para ${email}`);
        return res.json({ success: true, message: "Sua solicitação já foi recebida e está em processamento." });
      }

      // Todos os novos eventos começam como inativos até o pagamento/aprovação
      const isQuote = locationType === "OTHER";
      
      // ── LOGICA DE CONVOCAÇÃO TÁTICA (PROXIMIDADE) ──
      // Se for ponto fixo, buscamos os profissionais titulares (FIXO)
      let captacaoId: string | null = null;
      let fixoProfessionals: Array<{
        profissional: {
          user: { id: string; email: string; nome: string; };
        };
      }> = [];

      if (locationType === "PARTNER" && selectedPartnerId) {
        const cartorio = await prisma.cartorio.findUnique({
          where: { userId: selectedPartnerId },
          include: { 
            profissionais: { 
              where: { tipo: "FIXO", status: "ACCEPTED" }, 
              include: { profissional: { include: { user: true } } } 
            } 
          }
        });
        
        if (cartorio?.profissionais?.length) {
          fixoProfessionals = cartorio.profissionais;
          // Atribui o primeiro como titular da captação
          captacaoId = fixoProfessionals[0].profissional.user.id;
          console.log(`[Quote] Convocando profissionais FIXOS: ${fixoProfessionals.length} encontrados. Titular: ${captacaoId}`);
        }
      }

      // ── LOGICA DE USUÁRIO / CADASTRO AUTOMÁTICO ──
      // Verifica se o usuário já existe ou cria um novo (Senha Provisória)
      let targetUser = await prisma.user.findUnique({ where: { email } });
      let tempPassForEmail: string | undefined = undefined;

      if (!targetUser) {
        tempPassForEmail = `FS-${Math.floor(1000 + Math.random() * 9000)}`;
        const hashedPass = await bcrypt.hash(tempPassForEmail, 10);
        
        targetUser = await prisma.user.create({
          data: {
            email,
            nome: name,
            senha: hashedPass,
            role: "CLIENTE",
            whatsapp: whatsapp ? String(whatsapp).replace(/\D/g, "") : null
          }
        });
        console.log(`[Quote] Novo usuário criado para ${email}. Senha: ${tempPassForEmail}`);
      }

      const event = await prisma.event.create({
        data: {
          nomeNoivos: name,
          dataEvento: new Date(eventDate),
          eventHours: eventHours ? Number(eventHours) : 2,
          eventDays: eventDays ? Number(eventDays) : 1,
          location: locationType === "PARTNER" ? "Ponto Fixo" : `CEP: ${customCep}`,
          description: `ORÇAMENTO AUTOMÁTICO\nConvidados: ${attendees}\nUso: ${usageType}\nPreferência: ${req.body.workflowPref || 'TRADICIONAL'}\nOrçamento Disponível: ${req.body.availableBudget || 'Não informado'}\nServiços: ${selectedServices.join(", ")}\nDias: ${eventDays}\n\nDescrição do Cliente: ${description}`,
          usageType: usageType || "PESSOAL",
          isQuote: isQuote,
          quoteStatus: isQuote ? "PENDING" : "APROVADO", // Pontos fixos já nascem aprovados, apenas aguardando pagamento
          priceBase: totalPrice,
          priceEarly: totalPrice,
          active: false, // MANDATÓRIO: Inativo até confirmação de pagamento
          cartorioUserId: locationType === "PARTNER" ? selectedPartnerId : null,
          temFoto: selectedServices.includes("foto"),
          temVideo: selectedServices.includes("video"),
          temReels: selectedServices.includes("reels"),
          temFotoImpressa: selectedServices.includes("impresso"),
          clientEmail: email,
          clientName: name,
          captacaoId: captacaoId,
          captacaoStatus: "PENDING"
        }
      });

      // Notifica todos os profissionais FIXOS da unidade sobre o novo evento
      fixoProfessionals.forEach(fp => {
        NotificationService.notifyProfessionalNewAssignment({
          to: fp.profissional.user.email,
          profissionalName: fp.profissional.user.nome,
          eventTitle: name,
          eventDate: eventDate,
          location: locationType === "PARTNER" ? "Ponto Fixo" : `CEP: ${customCep}`
        }).catch(e => console.error("Erro ao notificar profissional fixo:", e));
      });

      if (locationType === "PARTNER") {
        const order = await prisma.order.create({
          data: {
            eventId: event.id,
            valor: totalPrice,
            buyerEmail: email,
            clienteId: targetUser.id,
            tempPassword: tempPassForEmail,
            status: "PENDENTE",
            manualType: "Pagamento Integral"
          }
        });

        // Dispara e-mail de Boas-Vindas / Confirmação
        NotificationService.sendWelcomeEmail({
          to: email,
          name: name,
          tempPassword: tempPassForEmail
        }).catch(e => console.error("Erro ao enviar boas-vindas:", e));

        const checkoutUrl = `${APP_URL}/checkout/${order.id}`;
        
        return res.json({ success: true, eventId: event.id, checkoutUrl });
      }

      // Se for Orçamento (OTHER), apenas retorna sucesso. O Admin irá precificar depois.
      NotificationService.notifyNewLead({ name, email, eventDate, usageType, locationType });
      
      NotificationService.sendWelcomeEmail({
        to: email,
        name: name,
        tempPassword: tempPassForEmail
      }).catch(e => console.error("Erro ao enviar boas-vindas (lead):", e));

      return res.json({ success: true, eventId: event.id, message: "Sua solicitação foi enviada! Em breve entraremos em contato com o orçamento detalhado." });

    } catch (error) {
      console.error("Erro ao processar orçamento:", error);
      return res.status(500).json({ error: "Falha na Máquina de Vendas. Tente novamente." });
    }
  }

  /**
   * POST /api/profissional/flash-event
   * Cria um evento instantâneo (Flash) para franqueados/profissionais em campo.
   */
  static async createFlashEvent(req: AuthRequest, res: Response) {
    const { name, pricePerPhoto, isPrivate } = req.body;
    const { userId } = req.user!;

    if (!name) return res.status(400).json({ error: "Nome do evento é obrigatório" });

    try {
      const profile = await prisma.franchiseProfile.findUnique({
        where: { userId }
      });

      const slug = `${name.toLowerCase().replace(/\s+/g, "-")}-${Math.random().toString(36).substring(2, 6)}`;
      
      const event = await prisma.event.create({
        data: {
          nomeNoivos: name,
          slug,
          type: "PHOTO_MARKETPLACE",
          dataEvento: new Date(),
          active: true,
          captacaoId: userId,
          franchiseeId: profile?.id,
          priceBase: Number(pricePerPhoto) || 30,
          priceEarly: Number(pricePerPhoto) || 30,
          description: "EVENTO FLASH - Criado instantaneamente via App Franqueado",
          temFoto: true,
          temFotoImpressa: true,
          quoteStatus: "APROVADO",
          isQuote: false,
          isPrivate: !!isPrivate
        }
      });

      return res.json({ success: true, eventId: event.id, slug: event.slug });
    } catch (error) {
      console.error("Erro ao criar evento flash:", error);
      return res.status(500).json({ error: "Erro ao criar evento instantâneo." });
    }
  }

  /**
   * GET /api/profissional/events
   * Lista eventos vinculados ao profissional (captação, edição ou parceiro fixo).
   */
  static async listByProfessional(req: AuthRequest, res: Response) {
    const { userId } = req.user!;
    try {
      const events = await prisma.event.findMany({
        where: {
          OR: [
            { captacaoId: userId },
            { edicaoId: userId },
            { cartorioUserId: userId }
          ]
        },
        orderBy: { dataEvento: "desc" },
        include: {
          pedidos: {
            where: { status: "APROVADO" },
            select: { valor: true }
          }
        }
      });

      const mapped = events.map(e => ({
        id: e.id,
        nomeNoivos: e.nomeNoivos,
        dataEvento: e.dataEvento,
        location: e.location,
        type: e.type,
        active: e.active,
        slug: e.slug,
        captacaoId: e.captacaoId,
        collected: e.pedidos.reduce((acc: number, o: any) => acc + Number(o.valor), 0)
      }));

      return res.json(mapped);
    } catch (error) {
      console.error("Erro ao listar eventos profissionais:", error);
      return res.status(500).json({ error: "Erro ao carregar sua agenda." });
    }
  }
}
