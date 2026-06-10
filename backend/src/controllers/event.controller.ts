import { Response } from "express";
import { AuthRequest } from "../lib/auth";
import prisma from "../lib/prisma";
import { NotificationService } from "../services/notification.service";
import bcrypt from "bcryptjs";
import { APP_URL } from "../lib/config";
import axios from "axios";
import { AcceptanceStatus } from "@prisma/client";
import archiver from "archiver";

export class EventController {
  /**
   * GET /api/public/events/:id/access
   * Libera links sensíveis se o pagamento estiver aprovado.
   */
  static async getAccess(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { orderId, guestToken } = req.query;

      if (!orderId && !guestToken) {
        return res.status(400).json({ error: "ID do pedido ou Token de convidado é obrigatório" });
      }

      const order = await prisma.order.findFirst({
        where: { 
          OR: [
            { id: orderId as string },
            { guestToken: guestToken as string }
          ],
          eventId: id as string,
          status: "APROVADO"
        },
        include: { event: true }
      });

      if (!order) {
        return res.status(403).json({ error: "Acesso ainda não liberado ou token inválido." });
      }

      const o = order as any;
      // Redirect to the appropriate media URL if access is permitted
      if (o.showAlbum && o.event?.lightroomUrl && o.event.lightroomUrl !== "null") {
        return res.redirect(o.event.lightroomUrl);
      }
      if (o.showVideo && o.event?.driveUrl && o.event.driveUrl !== "null") {
        return res.redirect(o.event.driveUrl);
      }
      // Fallback: return JSON with URLs (maintains backwards compatibility)
      return res.json({
        lightroomUrl: (o.showAlbum && o.event?.lightroomUrl !== "null") ? o.event?.lightroomUrl : null,
        driveUrl: (o.showVideo && o.event?.driveUrl !== "null") ? o.event?.driveUrl : null,
        eventTitle: o.event?.title,
        accessType: o.accessType || "PRIVATE",
        guestToken: o.guestToken,
        isGuestOrder: o.isGuestOrder
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
    const { userId, orderId, guestToken } = req.query;

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
          cartorioUser: { select: { 
            cartorio: { select: { razaoSocial: true } },
            tenantLogoUrl: true,
            tenantBrandColor: true
          } },
          captacao: { select: { id: true, nome: true } },
          edicao: { select: { id: true, nome: true } },
          media: true
        }
      });

      if (!event) {
        return res.status(404).json({ error: "Evento não encontrado" });
      }

      // Increment views asynchronously
      prisma.event.update({
        where: { id: event.id },
        data: { views: { increment: 1 } }
      }).catch(e => console.error("[Analytics] Error incrementing event views:", e));

      // 1. Identifica o usuário (Query ou JWT)
      const currentUserId = (userId as string) || (authUser?.userId);

      // 2. Busca qualquer pedido (Pendente ou Aprovado) para este usuário/evento/token
      
      const order = currentUserId 
        ? await prisma.order.findFirst({
            where: { 
              eventId: event.id, 
              clienteId: currentUserId,
              status: { not: "CANCELADO" }
            },
            orderBy: { createdAt: "desc" }
          }) 
        : (guestToken 
          ? await prisma.order.findFirst({
              where: {
                eventId: event.id,
                guestToken: String(guestToken),
                status: { not: "CANCELADO" }
              }
            })
          : null);
      
      // 3. Lógica de Acesso (Pivot)
      const isOwner = authUser && (
        authUser.role === "ADMIN" || 
        authUser.userId === event.captacaoId || 
        authUser.userId === event.edicaoId || 
        authUser.userId === event.ownerId ||
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

      // hasAccess is true if paid, owner, globally paid, or if a valid guestToken/orderId is provided
      const hasAccess = isPaid || isOwner || isGloballyPaid || (!!order && (!!guestToken || !!orderId));

      // 3.1 Guard específico para PHOTO_MARKETPLACE
      // Removido o bloqueio agressivo de 404 que impedia o primeiro acesso para compra.
      // A segurança agora é tratada pela lógica de paywall e hasAccess abaixo.
      // 3.1 Acesso granular tratado na lógica de unlockedMediaIds abaixo.
      // 3.1 Guard específico para PHOTO_MARKETPLACE
      const isRestrictedPrivate = event.isPrivate && !hasAccess && !(authUser && event.clientEmail && authUser.email === event.clientEmail);

      // 3.2 Lógica de Expiração de Galeria (Downloads) 🛡️⌛
      const retentionDays = event.retentionDays || (event.isPrivate ? 7 : 15);
      const expirationDate = new Date(new Date(event.dataEvento).getTime() + retentionDays * 24 * 60 * 60 * 1000);
      const isExpired = !isOwner && new Date() > expirationDate;

      // 4. Links sensíveis e Previews
      let previewPhotos: string[] = [];
      const rawPreviews = event.previewPhotos;
      const jsonPreviews: string[] = rawPreviews ? (typeof rawPreviews === "string" ? JSON.parse(rawPreviews) : rawPreviews) : [];
      
      // Previews são visíveis mesmo se restrito (vitrine)
      const prints = await prisma.phygitalPrint.findMany({
        where: { eventId: event.id },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: { imageUrl: true }
      });
      const printUrls = prints.map((p: { imageUrl: string }) => p.imageUrl);
      previewPhotos = Array.from(new Set([...printUrls, ...jsonPreviews]));

      // 4. Se for Marketplace, buscamos quais mídias específicas foram compradas
      let unlockedMediaIds: string[] = [];

      if (!isRestrictedPrivate && (event.type === 'PHOTO_MARKETPLACE' || event.type === 'FOTO_POINT' || event.type === 'FLASH_EVENT') && (currentUserId || guestToken || orderId)) {
        const paidOrders = await prisma.order.findMany({
          where: { 
            eventId: event.id, 
            OR: [
              ...(currentUserId ? [{ clienteId: currentUserId }] : []),
              ...(guestToken ? [{ guestToken: String(guestToken) }] : []),
              ...(orderId ? [{ id: String(orderId) }] : [])
            ],
            status: { in: ["PAGO", "APROVADO"] }
          },
          include: { items: { include: { media: true } } }
        });

        paidOrders.forEach((o: any) => {
          o.items.forEach((item: any) => {
            if (item.mediaId) unlockedMediaIds.push(item.mediaId);
            if (item.media?.shortId) unlockedMediaIds.push(item.media.shortId);
          });
          // FALLBACK TÁTICO: Recuperar do internalNotes (JSON do carrinho)
          if (o.items.length === 0 && o.internalNotes) {
            try {
              const notes = JSON.parse(o.internalNotes);
              if (notes.cart && Array.isArray(notes.cart)) {
                unlockedMediaIds.push(...notes.cart);
              }
            } catch (e) { /* ignore */ }
          }
        });
      }

      const responseData = {
        id: event.id,
        title: event.title,
        dataEvento: event.dataEvento,
        cartorio: event.cartorioUser?.cartorio?.razaoSocial || event.location,
        tenantBrandColor: event.customBrandColor || event.cartorioUser?.tenantBrandColor || null,
        tenantLogoUrl: event.customLogoUrl || event.cartorioUser?.tenantLogoUrl || null,
        coverPhotoUrl: event.coverPhotoUrl,
        priceBase: event.priceBase ? Number(event.priceBase) : null,
        priceEarly: event.priceEarly ? Number(event.priceEarly) : null,
        pricePerPhoto: event.pricePerPhoto ? Number(event.pricePerPhoto) : null,
        temFoto: event.temFoto,
        temVideo: event.temVideo,
        temReels: event.temReels,
        temFotoImpressa: event.temFotoImpressa,
        previewPhotos,
        unlockedMediaIds,
        pendingOrderId: (order && order.status === "PENDENTE") ? order.id : null,
        isOwner: isOwner,
        hasAccess: hasAccess,
        lightroomUrl: (hasAccess && !isExpired && (!order || order.showAlbum)) ? (event.lightroomUrl === "null" ? null : event.lightroomUrl) : null,
        driveUrl: (hasAccess && !isExpired && (!order || order.showVideo)) ? (event.driveUrl === "null" ? null : event.driveUrl) : null,
        paywall: {
          active: !hasAccess && !isOwner,
          message: isExpired ? "Prazo de download expirado." : (hasAccess ? "Entrega liberada." : "Galeria protegida.")
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
        itinerary: event.itinerary,
        description: event.description,
        references: event.references,
        medias: (event as any).media || [],
        photographer: event.captacao ? { id: event.captacao.id, nome: event.captacao.nome } : null,
        isExpired,
        retentionDays,
        expirationDate,
        slug: event.slug,
        active: event.active,
        verticalConfigs: (event as any).verticalConfigs || {},
        preSaleEnabled: (event as any).preSaleEnabled ?? false,
        postSaleEnabled: (event as any).postSaleEnabled ?? true,
      };

      // Se o acesso for restrito, limpamos campos sensíveis para evitar vazamento
      if (isRestrictedPrivate) {
        return res.json({
          id: responseData.id,
          title: responseData.title,
          dataEvento: responseData.dataEvento,
          location: responseData.location,
          type: responseData.type,
          slug: responseData.slug,
          coverPhotoUrl: responseData.coverPhotoUrl,
          isPrivate: true,
          hasAccess: false,
          isLocked: true,
          previewPhotos: responseData.previewPhotos,
          message: "Este álbum é privado. Faça login ou use um link de acesso para visualizar todas as fotos."
        });
      }

      return res.json(responseData);
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
      const { q, page = "1", type, city, sortBy } = req.query;
      const query = q as string;
      const take = 20;
      const skip = (Number(page) - 1) * take;

      const where: any = {
        active: true,
        isPrivate: false,
        isQuote: false,
        type: type ? String(type) : {
          in: ['ALBUM_FULL', 'PHOTO_MARKETPLACE', 'FOTO_POINT', 'FLASH_EVENT']
        };

      const andConditions: any[] = [
        { NOT: { slug: { startsWith: 'vault-' } } }
      ];

      if (city) {
        andConditions.push({
          OR: [
            { city: { equals: String(city), mode: 'insensitive' } },
            {
              cartorioUser: {
                cartorio: {
                  cidade: { equals: String(city), mode: 'insensitive' }
                }
              }
            }
          ]
        });
      }

      if (query) {
        andConditions.push({
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { location: { contains: query, mode: 'insensitive' } },
            { clientName: { contains: query, mode: 'insensitive' } }
          ]
        });
      }

      if (andConditions.length > 0) {
        where.AND = andConditions;
      }

      console.log("[DEBUG] listPublic where:", JSON.stringify(where, null, 2));

      let orderBy: any = { dataEvento: 'desc' };
      if (sortBy === 'AZ') orderBy = { title: 'asc' };
      if (sortBy === 'ZA') orderBy = { title: 'desc' };
      if (sortBy === 'PRICE_ASC') orderBy = { priceBase: 'asc' };
      if (sortBy === 'PRICE_DESC') orderBy = { priceBase: 'desc' };
      if (sortBy === 'OLD') orderBy = { dataEvento: 'asc' };

      const total = await prisma.event.count({ where });
      const events = await prisma.event.findMany({
          where,
          take,
          skip,
          orderBy,
          select: {
            id: true,
            slug: true,
            title: true,
            dataEvento: true,
            location: true,
            coverPhotoUrl: true,
            priceBase: true,
            priceEarly: true,
            type: true,
            category: true,
            temFoto: true,
            temVideo: true,
            temReels: true,
            city: true,
            captacao: {
              select: {
                nome: true
              }
            },
            cartorioUser: {
              select: {
                nome: true,
                cartorio: {
                  select: {
                    cidade: true
                  }
                }
              }
            }
          }
        });

      const pages = Math.ceil(total / take);

      const mapped = events.map((e: any) => ({
        ...e,
        ownerName: e.cartorioUser?.nome || e.captacao?.nome || "Foto Segundo",
        city: e.city || (e as any).cartorioUser?.cartorio?.cidade || null
      }));

      return res.json({
        events: mapped,
        total,
        page: Number(page),
        pages
      });
    } catch (error) {
      console.error("[listPublic] Erro ao listar eventos públicos:", error);
      return res.status(500).json({ error: "Erro ao carregar vitrine" });
    }
  }

  /**
   * GET /api/public/events/cities
   * Lista as cidades disponíveis com base nos eventos ativos na vitrine.
   */
  static async getPublicCities(req: AuthRequest, res: Response) {
    try {
      const where: any = {
        active: true,
        isPrivate: false,
        isQuote: false,
        NOT: {
          type: 'ALBUM_FULL',
          pedidos: {
            some: {
              status: 'PENDENTE'
            }
          }
        },
        AND: [
          { NOT: { slug: { startsWith: 'vault-' } } }
        ]
      };

      const events = await prisma.event.findMany({
        where,
        select: {
          city: true,
          cartorioUser: {
            select: {
              cartorio: {
                select: {
                  cidade: true
                }
              }
            }
          }
        }
      });

      const citiesSet = new Set<string>();
      
      events.forEach((e: any) => {
        const city = e.city || e.cartorioUser?.cartorio?.cidade;
        if (city) {
          citiesSet.add(city.trim());
        }
      });

      // Se o Set estiver vazio, retornar pelo menos Campinas como fallback
      if (citiesSet.size === 0) {
        citiesSet.add("Campinas");
      }

      return res.json({ cities: Array.from(citiesSet).sort() });
    } catch (error) {
      console.error("[getPublicCities] Erro ao listar cidades:", error);
      return res.status(500).json({ error: "Erro ao listar cidades" });
    }
  }

  /**
   * GET /api/public/partners
   * Lista todos os cartórios cadastrados como pontos parceiros.
   */
  static async listPartners(req: AuthRequest, res: Response) {
    try {
      const partners = await prisma.user.findMany({
        where: { 
          role: "CARTORIO"
        },
        include: { cartorio: true },
        orderBy: { nome: "asc" }
      });
      console.log(`[PARTNERS] Encontrados ${partners.length} parceiros com role CARTORIO`);
      return res.json(partners.map((p: any) => {
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
          eventTypes?: string[];
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
          disabledServices: cartorioConfig?.disabledServices || [],
          eventTypes: cartorioConfig?.eventTypes || []
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
      console.log('Headers:', req.headers);
      console.log('CreateQuote payload:', req.body);
      const {
        name,
        title,
        email: rawEmail,
        whatsapp,
        attendees,
        locationType,
        usageType,
        selectedPartnerId,
        customCep,
        eventDate,
        eventHours,
        eventDays,
        description,
        selectedServices = [],
        totalPrice,
        preferredProfessionalId,
        category,
        ticketUrl,
        fotoSegundoPromoCode,
        city
      } = req.body;

      // Fallback: use title if name is not provided
      const finalName = name || title;
      if (!finalName) {
        return res.status(400).json({ error: "Nome (name) é obrigatório" });
      }

      const email = rawEmail ? rawEmail.toLowerCase().trim() : "";
        // Use finalName for further processing
        const processedName = finalName;

      if (!Array.isArray(selectedServices)) {
        return res.status(400).json({ error: "selectedServices deve ser um array" });
      }
      
      // Normaliza a data do evento para objeto Date tático
      const eventDateObj = eventDate ? (eventDate.includes("T") ? new Date(eventDate) : new Date(`${eventDate}T12:00:00`)) : new Date();

      // ── ANTI-FLOOD / DUPLICATE CHECK ──
      const recentEvent = await prisma.event.findFirst({
        where: {
          clientEmail: email,
          dataEvento: eventDateObj,
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
      const isQuote = (locationType === "OTHER" && req.body.flowType !== "PACKAGE");
      
      // ── LOGICA DE CONVOCAÇÃO TÁTICA (PROXIMIDADE) ──
      // Se houver profissional preferencial (indicado pelo cliente), ele é o titular
      let captacaoId: string | null = preferredProfessionalId || null;
      let fixoProfessionals: Array<{
        profissional: {
          user: { id: string; email: string; nome: string; };
        };
      }> = [];

      if (!captacaoId && locationType === "PARTNER" && selectedPartnerId) {
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
          const start = eventDateObj;
          const end = new Date(start.getTime() + (eventHours || 2) * 60 * 60 * 1000);

          // Tenta encontrar o primeiro profissional disponível
          for (const fp of cartorio.profissionais) {
            const userId = fp.profissional.user.id;
            let conflict = null;
            try {
              conflict = await (prisma as any).calendarSlot?.findFirst({
                where: {
                  userId,
                  status: { not: 'CANCELLED' },
                  startAt: { lt: end },
                  endAt: { gt: start },
                }
              });
            } catch {
              // CalendarSlot model não existe no schema — ignora e assume disponível
              conflict = null;
            }

            if (!conflict) {
              captacaoId = userId;
              break;
            }
          }

          if (!captacaoId) {
            console.warn(`[Quote] Bloqueio por Indisponibilidade: ${eventDate} para o parceiro ${selectedPartnerId}. Candidatos: ${fixoProfessionals.length}`);
            return res.status(422).json({ 
              error: "Indisponível", 
              message: "Desculpe, todos os nossos fotógrafos já possuem compromissos agendados para este horário. Por favor, escolha outra data." 
            });
          }
          
          console.log(`[Quote] Profissional disponível encontrado: ${captacaoId}`);
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
            nome: processedName,
            senha: hashedPass,
            role: "CLIENTE",
            whatsapp: whatsapp ? String(whatsapp).replace(/\D/g, "") : null
          }
        });
        console.log(`[Quote] Novo usuário criado para ${email}. Senha: ${tempPassForEmail}`);
      }

      // ── Resolve nomes legíveis dos serviços selecionados ──
      // selectedServices pode conter IDs dinâmicos do catálogo (CUIDs) ou IDs estáticos ("foto","video","reels","impresso")
      const STATIC_LABELS: Record<string, string> = {
        foto: "Fotografia Digital", video: "Vídeo Bruto",
        reels: "Reels / Mobile", impresso: "Álbum / Impressa",
        album_full: "Álbum Completo", live_print: "Live Print",
        foto_point: "Foto Point", flash_event: "Flash Event"
      };
      let serviceLabels: string[] = [];
      const dynamicIds = selectedServices.filter((id: string) => !STATIC_LABELS[id]);
      if (dynamicIds.length > 0) {
        const catalogServices = await prisma.serviceCatalog.findMany({
          where: { id: { in: dynamicIds } },
          select: { id: true, name: true }
        }).catch(() => [] as { id: string; name: string }[]);
        const nameMap: Record<string, string> = {};
        catalogServices.forEach((s: { id: string; name: string }) => { nameMap[s.id] = s.name; });
        serviceLabels = selectedServices.map((id: string) => STATIC_LABELS[id] || nameMap[id] || id);
      } else {
        serviceLabels = selectedServices.map((id: string) => STATIC_LABELS[id] || id);
      }

      // Detecta flags de serviço tanto para IDs estáticos quanto para catálogo dinâmico
      const hasFoto = selectedServices.some((id: string) => id === "foto" || serviceLabels.some((l, i) => selectedServices[i] === id && /foto|fotografia/i.test(l)));
      const hasVideo = selectedServices.some((id: string) => id === "video" || serviceLabels.some((l, i) => selectedServices[i] === id && /v[ií]deo/i.test(l)));
      const hasReels = selectedServices.some((id: string) => id === "reels" || serviceLabels.some((l, i) => selectedServices[i] === id && /reels|mobile/i.test(l)));
      const hasImpresso = selectedServices.some((id: string) => id === "impresso" || serviceLabels.some((l, i) => selectedServices[i] === id && /impresso|álbum|album/i.test(l)));

      // Gera slug único
      const slug = `event-${String(processedName).toLowerCase().replace(/\s+/g, "-")}-${Math.random().toString(36).substring(2, 6)}`;

      const event = await prisma.event.create({
        data: {
          title: processedName,
          slug,
          dataEvento: eventDateObj,
          eventHours: eventHours ? Number(eventHours) : 2,
          eventDays: eventDays ? Number(eventDays) : 1,
          location: req.body.location || (locationType === "PARTNER" ? "Ponto Fixo" : `CEP: ${customCep}`),
          city: city || null,
          description: `ORÇAMENTO AUTOMÁTICO\nConvidados: ${attendees}\nUso: ${usageType}\nPreferência: ${req.body.workflowPref || 'TRADICIONAL'}\nOrçamento Disponível: ${req.body.availableBudget || 'Não informado'}\nServiços: ${serviceLabels.join(", ")}\nDias: ${eventDays}\n\nDescrição do Cliente: ${description}`,
          usageType: usageType || "PESSOAL",
          category: category ? category : undefined,
          isQuote: isQuote,
          quoteStatus: isQuote ? "PENDING" : "APPROVED",
          priceBase: totalPrice,
          priceEarly: totalPrice,
          active: false,
          cartorioUserId: locationType === "PARTNER" ? selectedPartnerId : null,
          temFoto: hasFoto,
          temVideo: hasVideo,
          temReels: hasReels,
          temFotoImpressa: hasImpresso,
          clientEmail: email,
          clientName: processedName,
          captacaoId: captacaoId,
          captacaoStatus: "PENDING",
          retentionDays: 15,
          isPrivate: true,
          ticketUrl: ticketUrl ? String(ticketUrl) : null,
          fotoSegundoPromoCode: fotoSegundoPromoCode ? String(fotoSegundoPromoCode) : null
        }
      });

      // ── BLOQUEIO DE AGENDA (BOOKING) ──
      // Registra o bloqueio no calendário local para evitar overbooking
      if (captacaoId) {
        const start = eventDateObj;
        const end = new Date(start.getTime() + (eventHours || 2) * 60 * 60 * 1000);
        try {
          await (prisma as any).calendarSlot?.create({
            data: {
              userId: captacaoId,
              eventId: event.id,
              startAt: start,
              endAt: end,
              title: `Reserva: ${name}`,
              status: "BLOCKED",
              source: "BOOKING"
            }
          });
        } catch {
          // CalendarSlot model não existe no schema — ignora, booking prossegue normalmente
          console.warn("[Quote] calendarSlot.create indisponível, booking continua.");
        }
      }

      // Notifica todos os profissionais FIXOS da unidade sobre o novo evento
      fixoProfessionals.forEach(fp => {
        NotificationService.notifyProfessionalNewAssignment({
          to: fp.profissional.user.email,
          profissionalName: fp.profissional.user.nome,
          eventTitle: processedName,
          eventDate: eventDate,
          location: locationType === "PARTNER" ? "Ponto Fixo" : `CEP: ${customCep}`
        }).catch(e => console.error("Erro ao notificar profissional fixo:", e));
      });

      if (locationType === "PARTNER" || req.body.flowType === "PACKAGE") {
        const order = await prisma.order.create({
          data: {
            eventId: event.id,
            valor: totalPrice || 0,
            buyerEmail: email,
            clienteId: targetUser.id,
            tempPassword: tempPassForEmail,
            status: "PENDENTE",
            manualType: "Pagamento Integral",
            isGuestOrder: !!tempPassForEmail
          }
        });

        // Dispara e-mail de Boas-Vindas / Confirmação
        NotificationService.sendWelcomeEmail({
          to: email,
          name: processedName,
          tempPassword: tempPassForEmail
        }).catch(e => console.error("Erro ao enviar boas-vindas:", e));

        const checkoutUrl = `${APP_URL}/checkout/${order.id}`;
        
        return res.json({ success: true, eventId: event.id, checkoutUrl });
      }

      // Se for Orçamento (OTHER), apenas retorna sucesso. O Admin irá precificar depois.
      try {
        NotificationService.notifyNewLead({ name: processedName, email, eventDate, usageType, locationType });
      } catch (err) {
        console.error('Error notifying new lead:', err);
      }

      const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } });
      try {
        for (const admin of admins) {
          await NotificationService.createInApp({
            userId: admin.id,
            type: 'QUOTE_RECEIVED',
            title: '📋 Novo orçamento recebido',
            body: `${processedName} solicitou um orçamento para ${eventDate}. Acesse o Kanban para precificar.`,
            refId: event.id,
            refType: 'event'
          });
        }
      } catch (err) {
        console.error('Error sending admin notifications:', err);
      }
      
      NotificationService.sendWelcomeEmail({
        to: email,
        name: processedName,
        tempPassword: tempPassForEmail
      }).catch(e => console.error("Erro ao enviar boas-vindas (lead):", e));

      // Notificação in-app para o CLIENTE
      await NotificationService.createInApp({
        userId: targetUser.id,
        type: 'QUOTE_RECEIVED',
        title: '✨ Recebemos seu pedido!',
        body: `Olá ${processedName}, já estamos analisando seu pedido para ${eventDate}. Em breve enviaremos a proposta!`,
        refId: event.id,
        refType: 'event'
      }).catch(e => console.error("Erro notif cliente lead:", e));

      return res.json({ success: true, eventId: event.id, message: "Sua solicitação foi enviada! Em breve entraremos em contato com o orçamento detalhado." });

    } catch (error) {
      console.error("Erro ao processar orçamento:", error);
      const errorMsg = error instanceof Error ? error.message : "Erro desconhecido";
      return res.status(500).json({ error: "Falha na Máquina de Vendas. Tente novamente.", details: errorMsg });
    }
  }

  /**
   * POST /api/profissional/flash-event
   * Cria um evento instantâneo (Flash) para franqueados/profissionais em campo.
   */
  static async createFlashEvent(req: AuthRequest, res: Response) {
    const { name, pricePerPhoto, isPrivate, dataEvento, startTime, endTime, captacaoId: delegatedCaptacaoId, isPublicCall, city } = req.body;
    const { userId } = req.user!;

    if (!name) return res.status(400).json({ error: "Nome do evento é obrigatório" });

    try {
      const profile = await prisma.franchiseProfile.findUnique({
        where: { userId }
      });

      const slug = `${name.toLowerCase().replace(/\s+/g, "-")}-${Math.random().toString(36).substring(2, 6)}`;
      
      // Parse local time
      const finalStartTime = dataEvento && startTime ? new Date(`${dataEvento}T${startTime}:00-03:00`) : (dataEvento ? new Date(dataEvento) : new Date());
      const finalEndTime = dataEvento && endTime ? new Date(`${dataEvento}T${endTime}:00-03:00`) : null;

      const isNone = delegatedCaptacaoId === "NONE";

      const event = await prisma.event.create({
        data: {
          title: name,
          city: city || null,
          slug,
          type: "FLASH_EVENT",
          active: !delegatedCaptacaoId && !isPublicCall,
          captacaoId: isNone ? null : (delegatedCaptacaoId || (isPublicCall ? null : userId)),
          captacaoStatus: isNone ? "ACCEPTED" : ((delegatedCaptacaoId || isPublicCall) ? "PENDING" : "ACCEPTED"),
          dataEvento: finalStartTime,
          eventEndTime: finalEndTime,
          isPublicCall: !!isPublicCall,
          ownerId: userId,
          franchiseeId: profile?.id,
          pricePerPhoto: Number(pricePerPhoto) || 10,
          priceBase: Number(pricePerPhoto) || 30,
          priceEarly: Number(pricePerPhoto) || 30,
          description: "EVENTO FLASH - Criado instantaneamente via App Franqueado",
          temFoto: true,
          temFotoImpressa: true,
          quoteStatus: "APPROVED",
          isQuote: false,
          isPrivate: isPrivate ?? true,
          retentionDays: (isPrivate ?? true) ? 7 : 15
        }
      });

      return res.json({ success: true, eventId: event.id, slug: event.slug });
    } catch (error) {
      console.error("Erro ao criar evento flash:", error);
      return res.status(500).json({ error: "Erro ao criar evento instantâneo." });
    }
  }

  /**
   * POST /api/profissional/foto-point
   * Cria um ponto de venda por click para fotógrafos.
   */
  static async createFotoPoint(req: AuthRequest, res: Response) {
    const { 
      name, priceUnit, location, itinerary, references, 
      isPrivate, coverPhotoUrl, coverPosition, dataEvento, startTime, endTime,
      captacaoId: delegatedCaptacaoId, isPublicCall, city
    } = req.body;
    const { userId } = req.user!;

    if (!name) return res.status(400).json({ error: "Nome do ponto é obrigatório" });

    // Validate professional approval status
    const dbUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!dbUser || (!dbUser.isVerified && dbUser.verificationStatus !== "APPROVED")) {
      return res.status(403).json({ error: "Sua conta de profissional ainda não foi aprovada pelo administrador. Aguarde a aprovação para criar pontos de venda." });
    }

    // Converte link de compartilhamento do Google Drive para URL de thumbnail direto
    const normalizeCoverUrl = (url?: string): string | null => {
      if (!url) return null;
      const driveMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (driveMatch) {
        return `https://drive.google.com/thumbnail?id=${driveMatch[1]}&sz=w1200`;
      }
      return url;
    };

    try {
      const slug = `fp-${name.toLowerCase().replace(/\s+/g, "-")}-${Math.random().toString(36).substring(2, 6)}`;
      
      // Parse local time
      const finalStartTime = dataEvento && startTime ? new Date(`${dataEvento}T${startTime}:00-03:00`) : (dataEvento ? new Date(dataEvento) : new Date());
      const finalEndTime = dataEvento && endTime ? new Date(`${dataEvento}T${endTime}:00-03:00`) : null;

      const event = await prisma.event.create({
        data: {
          title: name,
          city: city || null,
          slug,
          type: "FOTO_POINT",
          dataEvento: finalStartTime,
          eventEndTime: finalEndTime,
          active: !delegatedCaptacaoId && !isPublicCall,
          captacaoId: delegatedCaptacaoId || (isPublicCall ? null : userId),
          captacaoStatus: (delegatedCaptacaoId || isPublicCall) ? "PENDING" : "ACCEPTED",
          isPublicCall: !!isPublicCall,
          ownerId: userId,
          priceUnit: Number(priceUnit) || 10,
          location,
          itinerary,
          references: references || [],
          isPrivate: isPrivate ?? true,
          isUnitSale: true,
          temFoto: true,
          quoteStatus: "APPROVED",
          isQuote: false,
          coverPhotoUrl: normalizeCoverUrl(coverPhotoUrl),
          coverPosition: coverPosition || "center",
          retentionDays: (isPrivate ?? true) ? 7 : 15
        }
      });

      return res.json({ success: true, eventId: event.id, slug: event.slug });
    } catch (error) {
      console.error("createFotoPoint:", error);
      return res.status(500).json({ error: "Falha ao criar Foto Point." });
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
          AND: [
            {
              OR: [
                { captacaoId: userId, captacaoStatus: { not: "REJECTED" } },
                { edicaoId: userId, edicaoStatus: { not: "REJECTED" } },
                { cartorioUserId: userId },
                { ownerId: userId },
                { isPublicCall: true, captacaoId: null, captacaoStatus: "PENDING" }
              ]
            },
            {
              NOT: {
                slug: { startsWith: "vault-" }
              }
            }
          ]
        },
        orderBy: { dataEvento: "desc" },
        include: {
          pedidos: {
            where: { status: "APROVADO" },
            select: { valor: true }
          },
          _count: { select: { pedidos: true } },
          cartorioUser: { include: { cartorio: { select: { razaoSocial: true, cidade: true } } } }
        }
      });

      const mapped = events.map((e: any) => ({
          ...e,
          city: e.city || (e as any).cartorioUser?.cartorio?.cidade || null,
          cartorio: e.cartorioUser?.cartorio?.razaoSocial || null,
          collected: e.pedidos.reduce((acc: number, o: any) => acc + Number(o.valor), 0)
        }));

      return res.json(mapped);
    } catch (error) {
      console.error("Erro ao listar eventos profissionais:", error);
      return res.status(500).json({ error: "Erro ao carregar sua agenda." });
    }
  }

  /**
   * PATCH /api/profissional/events/:id/foto-point
   * Atualiza as configurações de um Foto Point existente.
   */
  static async updateFotoPoint(req: AuthRequest, res: Response) {
    try {
      const id = String(req.params.id);
      const { 
        title, priceUnit, location, city, itinerary, 
        references, isPrivate, active, coverPhotoUrl, coverPosition,
        dataEvento, startTime, endTime, captacaoId, isPublicCall 
      } = req.body;

      const event = await prisma.event.findUnique({ where: { id } });
      if (!event) return res.status(404).json({ error: "Evento não encontrado." });

      const isOwner = req.user && (req.user.role === "ADMIN" || req.user.userId === event.captacaoId || req.user.userId === event.ownerId);
      if (!isOwner) return res.status(403).json({ error: "Acesso negado." });

      // Converte Google Drive share links to thumbnail direto
      const normalizeCoverUrl = (url?: string | null): string | null | undefined => {
        if (url === null) return null;
        if (!url) return undefined;
        const driveMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
        if (driveMatch) return `https://drive.google.com/thumbnail?id=${driveMatch[1]}&sz=w1200`;
        return url;
      };

      // Tratamento inteligente de captacaoId
      let finalCaptacaoId: string | null | undefined = undefined;
      let finalCaptacaoStatus: string | undefined = undefined;

      if (captacaoId !== undefined) {
        if (captacaoId === null || captacaoId === "null" || captacaoId === "NONE" || captacaoId === "") {
          finalCaptacaoId = null;
          finalCaptacaoStatus = "ACCEPTED";
        } else {
          finalCaptacaoId = String(captacaoId);
          // Se for o próprio criador do evento ou o usuário que está editando
          const isMyself = finalCaptacaoId === event.ownerId || finalCaptacaoId === req.user?.userId;
          finalCaptacaoStatus = isMyself ? "ACCEPTED" : "PENDING";
        }
      }

      if (isPublicCall !== undefined) {
        if (isPublicCall) {
          finalCaptacaoStatus = "PENDING";
          finalCaptacaoId = null;
        }
      }

      const updated = await prisma.event.update({
        where: { id },
        data: {
          title: title ?? undefined,
          priceUnit: priceUnit !== undefined ? Number(priceUnit) : undefined,
          location: location !== undefined ? String(location) : undefined,
          city: city !== undefined ? String(city) : undefined,
          itinerary: itinerary !== undefined ? String(itinerary) : undefined,
          references: references ?? undefined,
          isPrivate: isPrivate !== undefined ? !!isPrivate : undefined,
          active: active !== undefined ? !!active : undefined,
          coverPhotoUrl: coverPhotoUrl !== undefined ? normalizeCoverUrl(coverPhotoUrl) : undefined,
          ...(coverPosition !== undefined && { coverPosition: String(coverPosition) }),
          dataEvento: dataEvento && startTime ? new Date(`${dataEvento}T${startTime}:00-03:00`) : (dataEvento ? new Date(dataEvento) : undefined),
          eventEndTime: dataEvento && endTime ? new Date(`${dataEvento}T${endTime}:00-03:00`) : undefined,
          captacaoId: finalCaptacaoId,
          isPublicCall: isPublicCall !== undefined ? !!isPublicCall : undefined,
          captacaoStatus: finalCaptacaoStatus as AcceptanceStatus
        }
      });
      return res.json(updated);
    } catch (error) {
      console.error("updateFotoPoint:", error);
      return res.status(500).json({ error: "Erro ao atualizar Foto Point." });
    }
  }

  /**
   * GET /api/public/events/:eventId/media/:mediaId/download
   * Proxy unitário
   */
  static async downloadSingle(req: AuthRequest, res: Response) {
    try {
      const eventId = String(req.params.eventId);
      const mediaId = String(req.params.mediaId);
      const orderId = req.query.orderId ? String(req.query.orderId) : undefined;
      const guestToken = req.query.guestToken ? String(req.query.guestToken) : undefined;
      const authUser = req.user;

      const event = await prisma.event.findUnique({ where: { id: eventId } });
      if (!event) return res.status(404).json({ error: "Evento não encontrado" });

      const media = await prisma.eventMedia.findUnique({ where: { id: mediaId } });
      if (!media || media.eventId !== eventId) return res.status(404).json({ error: "Mídia não encontrada" });

      const isOwner = authUser?.userId === event.ownerId;
      let hasAccess = false;
      if (isOwner) {
        hasAccess = true;
      } else {
        const order = await prisma.order.findFirst({
          where: { OR: [{ id: String(orderId) }, { paymentId: String(orderId) }], eventId, status: "APROVADO" }
        });
        const isPaid = !!order && !order.isContribution;
        const anyPaidOrder = await prisma.order.findFirst({
          where: { eventId: event.id, status: "APROVADO", isContribution: false }
        });
        const isGloballyPaid = !!anyPaidOrder;
        hasAccess = isPaid || isGloballyPaid || (!!order && (!!guestToken || !!orderId));
      }

      if (event.isPrivate && !hasAccess && !(authUser && event.clientEmail && authUser.email === event.clientEmail)) {
         return res.status(403).json({ error: "Acesso negado" });
      }

      const response = await axios({ url: media.url, method: 'GET', responseType: 'stream' });
      res.setHeader('Content-Disposition', `attachment; filename="${media.id}.${media.type === 'VIDEO' ? 'mp4' : 'jpg'}"`);
      res.setHeader('Content-Type', response.headers['content-type'] || 'application/octet-stream');
      response.data.pipe(res);
    } catch (e) {
      console.error("[downloadSingle]", e);
      res.status(500).json({ error: "Erro no download" });
    }
  }

  /**
   * GET /api/public/events/:eventId/download-all
   * Lote em zip
   */
  static async downloadAll(req: AuthRequest, res: Response) {
    try {
      const eventId = String(req.params.eventId);
      const orderId = req.query.orderId ? String(req.query.orderId) : undefined;
      const guestToken = req.query.guestToken ? String(req.query.guestToken) : undefined;
      const authUser = req.user;

      const event = await prisma.event.findUnique({ where: { id: eventId }, include: { media: true } });
      if (!event) return res.status(404).json({ error: "Evento não encontrado" });

      const isOwner = authUser?.userId === event.ownerId;
      let hasAccess = false;
      if (isOwner) {
        hasAccess = true;
      } else {
        const order = await prisma.order.findFirst({
          where: { OR: [{ id: String(orderId) }, { paymentId: String(orderId) }], eventId, status: "APROVADO" }
        });
        const isPaid = !!order && !order.isContribution;
        const anyPaidOrder = await prisma.order.findFirst({
          where: { eventId: event.id, status: "APROVADO", isContribution: false }
        });
        const isGloballyPaid = !!anyPaidOrder;
        hasAccess = isPaid || isGloballyPaid || (!!order && (!!guestToken || !!orderId));
      }

      if (event.isPrivate && !hasAccess && !(authUser && event.clientEmail && authUser.email === event.clientEmail)) {
         return res.status(403).json({ error: "Acesso negado" });
      }

      if (event.media.length === 0) {
         return res.status(400).json({ error: "Evento não possui fotos." });
      }

      const archive = archiver("zip", { zlib: { level: 9 } });
      res.attachment(`${(event.slug || event.id).replace(/[^a-z0-9]/gi, '_').toLowerCase()}-fotos.zip`);
      archive.pipe(res);

      for (const m of event.media) {
        try {
          const mRes = await axios.get(m.url, { responseType: 'stream' });
          archive.append(mRes.data, { name: `${m.id}.${m.type === 'VIDEO' ? 'mp4' : 'jpg'}` });
        } catch (err) {
          console.error(`Erro baixar ${m.id}`, err);
        }
      }
      await archive.finalize();
    } catch (e) {
      console.error("[downloadAll]", e);
      if (!res.headersSent) res.status(500).json({ error: "Erro no download" });
    }
  }
}
