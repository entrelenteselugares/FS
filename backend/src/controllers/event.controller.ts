import { Response } from "express";
import { AuthRequest } from "../lib/auth";
import prisma from "../lib/prisma";
import { NotificationService } from "../services/notification.service";

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
          cartorioUser: { select: { cartorio: { select: { razaoSocial: true } } } }
        }
      });

      if (!event) {
        return res.status(404).json({ error: "Evento não encontrado" });
      }

      const isPaid = (req.app as any).locals.MOCK_PAID || false;
      const order = await prisma.order.findFirst({
        where: { eventId: event.id, clienteId: userId as string, status: "APROVADO" }
      }).catch(() => null);

      const hasAccess = isPaid || !!order;

      // Links sensíveis só aparecem se aprovado
      const rawPreviews = (event as any).previewPhotos;
      const previewPhotos: string[] = rawPreviews ? JSON.parse(rawPreviews) : [];

      return res.json({
        id: event.id,
        nomeNoivos: event.nomeNoivos,
        dataEvento: event.dataEvento,
        cartorio: (event as any).cartorioUser?.cartorio?.razaoSocial || event.location,
        coverPhotoUrl: event.coverPhotoUrl,
        priceBase: event.priceBase,
        priceEarly: event.priceEarly,
        temFoto: event.temFoto,
        temVideo: event.temVideo,
        temReels: event.temReels,
        temFotoImpressa: event.temFotoImpressa,
        previewPhotos,
        // Links sensíveis só aparecem se aprovado e visível
        lightroomUrl: (hasAccess && (!order || order.showAlbum)) ? event.lightroomUrl : null,
        driveUrl: (hasAccess && (!order || order.showVideo)) ? event.driveUrl : null,
        paywall: {
          active: !hasAccess,
          message: hasAccess ? "Entrega liberada via links externos." : "Galeria protegida."
        }
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
      const events: any[] = await prisma.$queryRaw`
        SELECT 
          id, 
          "nomeNoivos", 
          "dataEvento", 
          cartorio, 
          "coverPhotoUrl",
          "priceBase",
          "priceEarly",
          true as "temFoto" -- Ativando badges por padrão para estética
        FROM events
        WHERE active = true AND (
          REPLACE(LOWER("nomeNoivos"), '&', 'e') LIKE ${term} 
          OR REPLACE(LOWER(cartorio), '&', 'e') LIKE ${term}
        )
        ORDER BY "dataEvento" DESC
        LIMIT ${take} OFFSET ${skip}
      `;

      // 2. Busca o total para cálculo de páginas
      const countResult: any[] = await prisma.$queryRaw`
        SELECT COUNT(*)::int as count FROM events
        WHERE active = true AND (
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
      return res.status(500).json({ error: "Erro ao carregar vitrine", details: (error as any).message });
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
        const customPrices = (p.cartorio?.servicePrices as any) || {};
        
        // Merge legacy with custom (custom takes priority)
        const mergedPrices = { ...legacyPrices, ...customPrices };

        return {
          id: p.id,
          name: p.cartorio?.razaoSocial || p.nome,
          city: p.cartorio?.cidade || "Campinas",
          prices: mergedPrices,
          fixedDuration: p.cartorio?.fixedDuration ?? 2,
          fixedTime: p.cartorio?.fixedTime ?? false,
          hideDuration: p.cartorio?.hideDuration ?? false
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
        name, email, attendees, locationType, usageType, selectedPartnerId, 
        customCep, eventDate, eventHours, description, selectedServices, totalPrice 
      } = req.body;

      // Todos os novos eventos começam como inativos até o pagamento/aprovação
      const isQuote = locationType === "OTHER";
      
      // ── LOGICA DE CONVOCAÇÃO TÁTICA (PROXIMIDADE) ──
      // Se for ponto fixo, buscamos os profissionais titulares (FIXO)
      let captacaoId: string | null = null;
      let fixoProfessionals: any[] = [];

      if (locationType === "PARTNER" && selectedPartnerId) {
        const cartorio = await prisma.cartorio.findUnique({
          where: { userId: selectedPartnerId },
          include: { 
            profissionais: { 
              where: { tipo: "FIXO" }, 
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

      const event = await prisma.event.create({
        data: {
          nomeNoivos: name,
          dataEvento: new Date(eventDate),
          eventHours: eventHours ? Number(eventHours) : 2,
          location: locationType === "PARTNER" ? "Ponto Fixo" : `CEP: ${customCep}`,
          description: `ORÇAMENTO AUTOMÁTICO\nConvidados: ${attendees}\nUso: ${usageType}\nServiços: ${selectedServices.join(", ")}\n\nDescrição do Cliente: ${description}`,
          usageType: usageType || "PESSOAL",
          isQuote: isQuote,
          quoteStatus: isQuote ? "PENDING" : "APPROVED", // Pontos fixos já nascem aprovados, apenas aguardando pagamento
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
            status: "PENDENTE"
          }
        });

        // Link de Checkout para Ponto Fixo (Pagamento imediato)
        // Prioriza URL de produção via variáveis de ambiente
        const appUrl = process.env.VITE_APP_URL || process.env.APP_URL || 'https://foto-segundo.vercel.app';
        const checkoutUrl = `${appUrl}/checkout/${order.id}`;
        
        return res.json({ success: true, eventId: event.id, checkoutUrl });
      }

      // Se for Orçamento (OTHER), apenas retorna sucesso. O Admin irá precificar depois.
      // Alerta de novo lead para o admin via WhatsApp
      NotificationService.notifyNewLead({ name, email, eventDate, usageType, locationType });
      return res.json({ success: true, message: "Sua solicitação foi enviada! Em breve entraremos em contato com o orçamento detalhado." });

    } catch (error) {
      console.error("Erro ao processar orçamento:", error);
      return res.status(500).json({ error: "Falha na Máquina de Vendas. Tente novamente." });
    }
  }
}
