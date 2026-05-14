import { Response } from "express";
import { AuthRequest } from "../lib/auth";
import prisma from "../lib/prisma";
import { Prisma, Role } from "@prisma/client";
import { slugify } from "../lib/utils";
import bcrypt from "bcryptjs";
import { supabaseAdmin as supabase } from "../lib/supabase";
import { NotificationService } from "../services/notification.service";
import { audit } from "../lib/audit";
import { FRONTEND_URL } from "../lib/config";

// â”€â”€ DASHBOARD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function adminUploadCover(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { imageBase64, mimeType } = req.body;

  if (!imageBase64 || !mimeType) {
    res.status(400).json({ error: "Imagem e MimeType sÃ£o obrigatÃ³rios." });
    return;
  }

  try {
    const exists = await prisma.event.findUnique({ where: { id: String(id) } });
    if (!exists) { res.status(404).json({ error: "Evento nÃ£o encontrado." }); return; }

    const base64Data = String(imageBase64).replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    const ext = String(mimeType).split("/")[1] || "jpg";
    const fileName = `covers/admin-${id}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("eventos")
      .upload(fileName, buffer, { contentType: String(mimeType), upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage.from("eventos").getPublicUrl(fileName);

    const updated = await prisma.event.update({
      where: { id: String(id) },
      data: { coverPhotoUrl: publicUrl },
      select: { id: true, coverPhotoUrl: true },
    });

    await audit(req, "ADMIN_UPLOAD_COVER", "Event", String(id), null, { publicUrl });

    console.log(`[STORAGE] Cover uploaded for event ${id}: ${publicUrl}`);
    res.json(updated);
  } catch (err) {
    console.error("adminUploadCover:", err);
    res.status(500).json({ error: "Erro ao salvar capa via Admin." });
  }
}

export async function adminUploadPreview(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { imageBase64, mimeType, index } = req.body;

  if (!imageBase64 || !mimeType || index === undefined) {
    res.status(400).json({ error: "Imagem, MimeType e Index sÃ£o obrigatÃ³rios." });
    return;
  }

  try {
    const event = await prisma.event.findUnique({ where: { id: String(id) } });
    if (!event) { res.status(404).json({ error: "Evento nÃ£o encontrado." }); return; }

    const base64Data = String(imageBase64).replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    const ext = String(mimeType).split("/")[1] || "jpg";
    const fileName = `previews/admin-${id}-${index}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("eventos")
      .upload(fileName, buffer, { contentType: String(mimeType), upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage.from("eventos").getPublicUrl(fileName);

    // Atualiza o array de previews
    let previews: string[] = [];
    try {
      previews = event.previewPhotos ? JSON.parse(event.previewPhotos) : [];
    } catch {
      previews = [];
    }

    // Garante que o array tenha espaÃ§o
    while (previews.length < 4) previews.push("");
    
    previews[Number(index)] = publicUrl;

    const updated = await prisma.event.update({
      where: { id: String(id) },
      data: { previewPhotos: JSON.stringify(previews) },
      select: { id: true, previewPhotos: true },
    });

    await audit(req, "ADMIN_UPLOAD_PREVIEW", "Event", String(id), null, { index, publicUrl });

    res.json(updated);
  } catch (err) {
    console.error("adminUploadPreview:", err);
    res.status(500).json({ error: "Erro ao salvar prÃ©via via Admin." });
  }
}

export async function getDashboardStats(req: AuthRequest, res: Response): Promise<void> {
  try {
    // Consultas sequenciais para evitar sobrecarga na pool de conexÃµes
    const totalEvents = await prisma.event.count({ 
      where: { 
        active: true, 
        isQuote: false,
        OR: [
          { type: { not: "PHOTO_MARKETPLACE" } },
          { pedidos: { some: { hasPaid: true } } }
        ]
      } 
    });
    const totalOrders = await prisma.order.count({ where: { status: "APROVADO" } });
    const totalRevenueResult = await prisma.order.aggregate({
      where: { status: "APROVADO" },
      _sum: { valor: true },
    });
    const recentOrdersRaw = await prisma.order.findMany({
      where: { status: "APROVADO" },
      include: {
        event: { select: { nomeNoivos: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    });
    const pendingEvents = await prisma.event.findMany({
      where: {
        active: true,
        isQuote: false,
        OR: [
          { coverPhotoUrl: null },
          { lightroomUrl: null },
        ],
      },
      select: { id: true, nomeNoivos: true, dataEvento: true, coverPhotoUrl: true, lightroomUrl: true },
      orderBy: { dataEvento: "asc" },
      take: 5,
    });
    const pendingQuotesCount = await prisma.event.count({ where: { isQuote: true, quoteStatus: { in: ["PENDING", "PRICED"] } } });
    
    const pendingInvitesCount = await prisma.event.count({
      where: {
        active: true,
        isQuote: false,
        OR: [
          { captacaoStatus: "PENDING", captacaoId: { not: null } },
          { edicaoStatus: "PENDING", edicaoId: { not: null } },
        ]
      }
    });

    const missingLinksCount = await prisma.event.count({
      where: {
        active: true,
        isQuote: false,
        OR: [
          { lightroomUrl: null },
          { driveUrl: null },
        ],
        pedidos: { some: { status: "APROVADO" } }
      }
    });

    // â”€â”€ MÃ‰TRICAS DE PERFORMANCE (30 DIAS) â”€â”€
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(now.getDate() - 60);

    const revenue30dResult = await prisma.order.aggregate({
      where: { status: "APROVADO", updatedAt: { gte: thirtyDaysAgo } },
      _sum: { valor: true },
    });
    const revenue30d = Number(revenue30dResult._sum.valor || 0);

    const revenuePrev30dResult = await prisma.order.aggregate({
      where: { status: "APROVADO", updatedAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
      _sum: { valor: true },
    });
    const revenuePrev30d = Number(revenuePrev30dResult._sum.valor || 0);

    let growth = 0;
    if (revenuePrev30d > 0) growth = ((revenue30d - revenuePrev30d) / revenuePrev30d) * 100;
    else if (revenue30d > 0) growth = 100;

    const totalRevenue = totalRevenueResult._sum.valor ? Number(totalRevenueResult._sum.valor) : 0;
    const totalUsers = await prisma.user.count();

    res.json({
      stats: {
        activeEvents: totalEvents || 0,
        totalOrders: totalOrders || 0,
        totalRevenue,
        revenue30d,
        growth: Number(growth.toFixed(1)),
        totalUsers: totalUsers || 0,
        pendingQuotesCount: pendingQuotesCount || 0,
        pendingInvitesCount: pendingInvitesCount || 0,
        missingLinksCount: missingLinksCount || 0,
      },
      recentOrders: recentOrdersRaw.map(o => ({
        ...o,
        total: Number(o.valor || 0)
      })),
      pendingEvents: pendingEvents.map(e => ({
        id: e.id,
        title: e.nomeNoivos,
        coverPhotoUrl: e.coverPhotoUrl,
        lightroomUrl: e.lightroomUrl
      })),
    });
  } catch (err) {
    console.error("getDashboardStats Error:", err);
    res.status(500).json({ 
      error: "Erro ao carregar dashboard.", 
      details: err instanceof Error ? err.message : String(err)
    });
  }
}

// â”€â”€ EVENTOS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function adminListEvents(req: AuthRequest, res: Response): Promise<void> {
  const { q, page = "1", status } = req.query;
  const take = 15;
  const skip = (Number(page) - 1) * take;

  try {
    const where: Prisma.EventWhereInput = { 
      isQuote: false,
      OR: [
        { type: { not: "PHOTO_MARKETPLACE" } }, 
        { pedidos: { some: { hasPaid: true } } } 
      ]
    };
    if (status === "active") where.active = true;
    if (status === "inactive") where.active = false;
    
    const searchString = q ? String(q) : undefined;
    if (searchString) {
      where.AND = [
        {
          OR: [
            { nomeNoivos: { contains: searchString, mode: "insensitive" } },
            { location: { contains: searchString, mode: "insensitive" } },
          ]
        }
      ];
    }

    // Isola eventos por Franquia se o usuÃ¡rio for um FRANQUEADO
    if (req.user?.role === 'FRANCHISEE') {
      const profile = await prisma.franchiseProfile.findUnique({ where: { userId: req.user.userId } });
      (where as any).franchiseeId = profile?.id ?? 'non-existent';
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        cartorioUser: { select: { nome: true, cartorio: { select: { razaoSocial: true, cidade: true } } } },
        captacao: { select: { nome: true } },
        edicao:   { select: { nome: true } },
        _count:   { select: { pedidos: true } },
      },
      orderBy: { dataEvento: "desc" },
      take,
      skip,
    });

    const total = await prisma.event.count({ where });

    res.json({ 
      events: events.map(e => ({ 
        ...e, 
        city: e.city || (e as any).cartorioUser?.cartorio?.cidade || null,
        title: e.nomeNoivos, 
        date: e.dataEvento, 
        isCrowdfund: e.isCrowdfund,
        targetAmount: e.targetAmount,
        collectedAmount: e.collectedAmount,
        _count: { orders: e._count?.pedidos || 0 } 
      })), 
      total, 
      page: Number(page), 
      pages: Math.ceil(total / take) 
    });
  } catch (err) {
    console.error("adminListEvents:", err);
    res.status(500).json({ error: "Erro ao listar eventos." });
  }
}

export async function adminCreateEvent(req: AuthRequest, res: Response): Promise<void> {
  const {
    title, date, location, city, description,
    lightroomUrl, driveUrl, previewPhotos, priceBase, priceEarly,
    cartorioId, captacaoId, edicaoId,
    temFoto, temVideo, temReels, temFotoImpressa,
    eventHours,
    isCrowdfund, targetAmount,
    type, pricePerPhoto, marketplaceConfigs, verticalConfigs,
    clientEmail, clientName,
    preSaleEnabled, postSaleEnabled
  } = req.body;

  if (!title || !date || !location) {
    res.status(400).json({ error: "TÃ­tulo (Noivos), data e local sÃ£o obrigatÃ³rios." });
    return;
  }

  try {
    // Gera slug Ãºnico
    let slug = slugify(`${title}-${new Date(date).getFullYear()}`);
    const exists = await prisma.event.findUnique({ where: { slug } });
    if (exists) slug = `${slug}-${Date.now().toString(36)}`;

    let finalCaptacaoId = captacaoId || null;

    // â”€â”€ LOGICA DE CONVOCAÃ‡ÃƒO TÃTICA â”€â”€
    // Se selecionou um cartÃ³rio e nÃ£o selecionou profissional, busca o FIXO da unidade
    if (!finalCaptacaoId && cartorioId) {
      const cartorio = await prisma.cartorio.findUnique({
        where: { userId: cartorioId },
        include: { profissionais: { where: { tipo: "FIXO" }, take: 1, include: { profissional: true } } }
      });
      if (cartorio?.profissionais?.length) {
        finalCaptacaoId = cartorio.profissionais[0].profissional.userId;
        console.log(`[AdminCreate] Auto-atribuindo profissional FIXO titular: ${finalCaptacaoId}`);
      }
    }

    const event = await prisma.event.create({
      data: {
        nomeNoivos: title,
        slug,
        dataEvento: new Date(date),
        location, city,
        description,
        lightroomUrl: lightroomUrl || null,
        driveUrl: driveUrl || null,
        previewPhotos: previewPhotos ? JSON.stringify(previewPhotos) : null,
        priceBase: priceBase ?? 200,
        priceEarly: priceEarly ?? 190,
        active: true, // Eventos criados pelo Admin jÃ¡ nascem ativos
        cartorioUserId: cartorioId || null,
        captacaoId: finalCaptacaoId,
        edicaoId: edicaoId || null,
        temFoto: temFoto ?? true,
        temVideo: temVideo ?? false,
        temReels: temReels ?? false,
        temFotoImpressa: temFotoImpressa ?? false,
        eventHours: eventHours ? Number(eventHours) : 2,
        isCrowdfund: isCrowdfund ?? false,
        targetAmount: targetAmount ? Number(targetAmount) : null,
        // @ts-ignore
        isPrivate: req.body.isPrivate ?? true,
        // @ts-ignore
        isUnitSale: req.body.isUnitSale ?? false,
        // @ts-ignore
        priceUnit: req.body.priceUnit ? Number(req.body.priceUnit) : 10,
        type: type || "ALBUM_FULL",
        pricePerPhoto: pricePerPhoto ? Number(pricePerPhoto) : null,
        marketplaceConfigs: marketplaceConfigs || {},
        verticalConfigs: verticalConfigs || {},
        clientEmail: clientEmail || null,
        clientName: clientName || null,
        preSaleEnabled: preSaleEnabled ?? false,
        postSaleEnabled: postSaleEnabled ?? true,
        // @ts-ignore
        retentionDays: req.body.retentionDays ? Number(req.body.retentionDays) : (req.body.isPrivate ? 7 : 15),
      },
      include: {
        captacao: { select: { nome: true } },
        edicao:   { select: { nome: true } },
      },
    });

    await audit(req, "EVENT_CREATED", "Event", event.id, null, event);

    res.status(201).json(event);
  } catch (err) {
    if (err instanceof Error && (err as NodeJS.ErrnoException & { code?: string }).code === "P2002") {
      res.status(409).json({ error: "Slug duplicado. Tente um tÃ­tulo diferente." });
      return;
    }
    console.error("adminCreateEvent:", err);
    res.status(500).json({ error: "Erro ao criar evento." });
  }
}

export async function adminUpdateEvent(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const data: Prisma.EventUncheckedUpdateInput = {};
  
  try {
    // 1. Busca estado atual para saber se o usuÃ¡rio Ã© o dono e se links estÃ£o sendo adicionados
    const currentEvent = await prisma.event.findUnique({ where: { id: String(id) } });
    if (!currentEvent) {
      res.status(404).json({ error: "Evento nÃ£o encontrado." });
      return;
    }

    // Mapeamento de campos do body para o schema v4.0
    if (req.body.title) data.nomeNoivos = req.body.title;
    if (req.body.date) data.dataEvento = new Date(req.body.date);
    if (req.body.location) data.location = req.body.location;
    if (req.body.city) data.city = req.body.city;
    if (req.body.description) data.description = req.body.description;
    if (req.body.lightroomUrl !== undefined) data.lightroomUrl = req.body.lightroomUrl || null;
    if (req.body.driveUrl !== undefined) data.driveUrl = req.body.driveUrl || null;
    if (req.body.previewPhotos !== undefined) data.previewPhotos = req.body.previewPhotos ? JSON.stringify(req.body.previewPhotos) : null;
    if (req.body.priceBase !== undefined) data.priceBase = Number(req.body.priceBase);
    if (req.body.priceEarly !== undefined) data.priceEarly = Number(req.body.priceEarly);
    if (req.body.cartorioId !== undefined) data.cartorioUserId = req.body.cartorioId || null;
    if (req.body.captacaoId !== undefined) data.captacaoId = req.body.captacaoId || null;
    if (req.body.edicaoId !== undefined) data.edicaoId = req.body.edicaoId || null;
    if (req.body.active !== undefined) data.active = req.body.active;
    if (req.body.temFoto !== undefined) data.temFoto = req.body.temFoto;
    if (req.body.temVideo !== undefined) data.temVideo = req.body.temVideo;
    if (req.body.temReels !== undefined) data.temReels = req.body.temReels;
    if (req.body.temFotoImpressa !== undefined) data.temFotoImpressa = req.body.temFotoImpressa;
    if (req.body.coverPhotoUrl !== undefined) data.coverPhotoUrl = req.body.coverPhotoUrl || null;
    if (req.body.eventHours !== undefined) data.eventHours = Number(req.body.eventHours);
    if (req.body.isCrowdfund !== undefined) data.isCrowdfund = req.body.isCrowdfund;
    if (req.body.targetAmount !== undefined) data.targetAmount = req.body.targetAmount ? Number(req.body.targetAmount) : null;
    if (req.body.isPrivate !== undefined) {
      // REGRA ABSOLUTA: Apenas o dono do Ã¡lbum (clientEmail) pode mudar a privacidade.
      // Profissionais e Unidades Fixas (mesmo se ADMIN) nÃ£o tÃªm autonomia se o clientEmail estiver definido.
      const canChangePrivacy = !currentEvent.clientEmail || req.user?.email === currentEvent.clientEmail;
      if (canChangePrivacy) {
        (data as Prisma.EventUpdateInput).isPrivate = req.body.isPrivate;
      } else {
        console.warn(`[SECURITY] UsuÃ¡rio ${req.user?.email} tentou mudar privacidade do evento ${id} sem ser o dono.`);
      }
    }
    if (req.body.isUnitSale !== undefined) (data as Prisma.EventUpdateInput).isUnitSale = req.body.isUnitSale;
    if (req.body.priceUnit !== undefined) (data as Prisma.EventUpdateInput).priceUnit = Number(req.body.priceUnit);
    if (req.body.type !== undefined) (data as Prisma.EventUpdateInput).type = req.body.type;
    if (req.body.pricePerPhoto !== undefined) (data as Prisma.EventUpdateInput).pricePerPhoto = Number(req.body.pricePerPhoto);
    if (req.body.marketplaceConfigs !== undefined) (data as Prisma.EventUpdateInput).marketplaceConfigs = req.body.marketplaceConfigs;
    if (req.body.clientEmail !== undefined) data.clientEmail = req.body.clientEmail || null;
    if (req.body.clientName !== undefined) data.clientName = req.body.clientName || null;
    // @ts-ignore
    if (req.body.retentionDays !== undefined) data.retentionDays = Number(req.body.retentionDays);
    if (req.body.preSaleEnabled !== undefined) (data as any).preSaleEnabled = req.body.preSaleEnabled;
    if (req.body.postSaleEnabled !== undefined) (data as any).postSaleEnabled = req.body.postSaleEnabled;
    if (req.body.eventEndTime !== undefined) data.eventEndTime = req.body.eventEndTime ? new Date(req.body.eventEndTime) : null;
    if (req.body.verticalConfigs !== undefined) (data as any).verticalConfigs = req.body.verticalConfigs || {};

    const wasEmpty = !currentEvent.lightroomUrl && !currentEvent.driveUrl;
    const isAddingLinks = (data.lightroomUrl || data.driveUrl) && wasEmpty;

    // Se estiver adicionando links pela primeira vez, registra o momento da entrega para o SLA
    if (isAddingLinks) {
      data.galleryUploadTime = new Date();
    }

    // 2. Executa a atualizaÃ§Ã£o do evento
    const event = await prisma.event.update({
      where: { id: String(id) },
      data,
      include: {
        cartorioUser: { select: { cartorio: { select: { razaoSocial: true } } } },
        captacao: { select: { nome: true } },
        edicao:   { select: { nome: true } },
        _count:   { select: { pedidos: true } },
      },
    });

    // 3. Processa GamificaÃ§Ã£o de Agilidade (SLA)
    if (isAddingLinks) {
      const { GamificationService } = require("../services/gamification.service");
      GamificationService.processSLA(event.id).catch((e: any) => console.error("Erro ao processar SLA:", e));
    }

    // 4. Se os links foram liberados agora, dispara os prazos de expiraÃ§Ã£o dos pedidos
    if (isAddingLinks) {
      console.log(`[FAIR EXPIRE] Links adicionados ao evento ${id}. Disparando prazos...`);
      
      const orders = await prisma.order.findMany({
        where: { eventId: event.id, status: "APROVADO" }
      });

      for (const order of orders) {
        const type = order.accessType || "PRIVATE"; // Default fallback
        const days = type === "PUBLIC" ? 90 : 15;
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + days);

        await prisma.order.update({
          where: { id: order.id },
          data: { 
            accessExpiresAt: expiresAt,
            accessChosenAt: order.accessChosenAt || new Date() // Garante que tenha uma data de escolha
          }
        });
      }
    }

    await audit(req, "EVENT_UPDATED", "Event", String(id), null, data);

    res.json({ 
      ...event, 
      title: event.nomeNoivos, 
      date: event.dataEvento, 
      _count: { orders: event._count?.pedidos || 0 } 
    });
  } catch (err) {
    if (err instanceof Error && (err as NodeJS.ErrnoException & { code?: string }).code === "P2025") {
      res.status(404).json({ error: "Evento nÃ£o encontrado." });
      return;
    }
    console.error("adminUpdateEvent:", err);
    res.status(500).json({ error: "Erro ao atualizar evento." });
  }
}

export async function adminDeleteEvent(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const hardDelete = req.query.hard === "true";

  try {
    const event = await prisma.event.findUnique({
      where: { id: String(id) },
      include: { _count: { select: { pedidos: { where: { status: "APROVADO" } } } } }
    });

    if (!event) {
      res.status(404).json({ error: "Evento nÃ£o encontrado." });
      return;
    }

    const hasPaidOrders = event._count.pedidos > 0;

    // Se o usuÃ¡rio pediu hard delete OU se nÃ£o tem pedidos aprovados, deletamos fisicamente
    if (hardDelete || !hasPaidOrders) {
      console.log(`[AdminDelete] Executando HARD DELETE para o evento ${id}`);
      
      await prisma.$transaction([
        // Limpeza profunda de dependÃªncias
        prisma.photoLike.deleteMany({ where: { eventId: String(id) } }),
        prisma.calendarSlot.deleteMany({ where: { eventId: String(id) } }),
        prisma.eventMedia.deleteMany({ where: { eventId: String(id) } }),
        prisma.phygitalPrint.deleteMany({ where: { eventId: String(id) } }),
        prisma.orderItem.deleteMany({ where: { order: { eventId: String(id) } } }),
        prisma.order.deleteMany({ where: { eventId: String(id), status: { not: "APROVADO" } } }),
        
        // Se houver pedidos aprovados e ainda assim for HARD DELETE (forÃ§ado), deleta eles tambÃ©m
        ...(hardDelete ? [prisma.order.deleteMany({ where: { eventId: String(id) } })] : []),

        // Finalmente deleta o evento
        prisma.event.delete({ where: { id: String(id) } })
      ]);
    } else {
      console.log(`[AdminDelete] Executando SOFT DELETE para o evento ${id} (possui pedidos pagos)`);
      await prisma.event.update({
        where: { id: String(id) },
        data: { active: false },
      });
    }

    await audit(req, "EVENT_DELETED", "Event", String(id), null, { hard: hardDelete || !hasPaidOrders });

    res.json({ ok: true, deleted: hardDelete || !hasPaidOrders });
  } catch (err: any) {
    console.error("adminDeleteEvent Error:", err);
    res.status(500).json({ 
      error: "Erro ao excluir evento.", 
      details: err.message || "Verifique se existem dependÃªncias ativas que impedem a exclusÃ£o fÃ­sica." 
    });
  }
}

export async function adminDeleteOrder(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    // 1. Verifica se o pedido existe
    const order = await prisma.order.findUnique({
      where: { id: String(id) }
    });

    if (!order) {
      res.status(404).json({ error: "Pedido nÃ£o encontrado." });
      return;
    }

    // 2. Deleta o pedido (Prisma deve lidar com o cascade nos OrderItems se configurado, senÃ£o deletamos manual)
    await prisma.$transaction([
      prisma.orderItem.deleteMany({ where: { orderId: String(id) } }),
      prisma.order.delete({ where: { id: String(id) } })
    ]);

    await audit(req, "ORDER_DELETED", "Order", String(id), null, { valor: order.valor });

    res.json({ ok: true });
  } catch (err: unknown) {
    console.error("adminDeleteOrder Error:", err);
    res.status(500).json({ error: "Erro ao excluir pedido.", details: err instanceof Error ? err.message : String(err) });
  }
}

// â”€â”€ USUÃRIOS / PROFISSIONAIS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function adminListUsers(req: AuthRequest, res: Response): Promise<void> {
  const { role, q } = req.query;
  try {
    const where: Prisma.UserWhereInput = {};
    if (role) where.role = String(role) as Role;
    if (q) {
      const searchString = String(q);
      where.OR = [
        { nome: { contains: searchString, mode: "insensitive" } },
        { email: { contains: searchString, mode: "insensitive" } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true, nome: true, email: true, role: true, active: true, createdAt: true,
        profissional: {
          select: { id: true, services: true, cameras: true, captPct: true, editPct: true, otherHabilities: true, equipment: true, workflowType: true },
        },
        cartorio: { select: { id: true, razaoSocial: true } },
        franchiseProfile: { select: { id: true, printCredits: true, active: true } },
        pixKey: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(users.map(u => ({ 
      ...u, 
      name: u.nome,
      _count: { events: 0 } 
    })));
  } catch (err) {
    console.error("adminListUsers:", err);
    res.status(500).json({ error: "Erro ao listar usuÃ¡rios." });
  }
}

export async function adminCreateUser(req: AuthRequest, res: Response): Promise<void> {
  const { 
    name, email, password, role, pixKey, 
    captPct, editPct, equipment, otherHabilities 
  } = req.body;
  if (!name || !email || !password || !role) {
    res.status(400).json({ error: "Todos os campos sÃ£o obrigatÃ³rios." });
    return;
  }

  try {
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) { res.status(409).json({ error: "E-mail jÃ¡ cadastrado." }); return; }

    const hash = await bcrypt.hash(password, 12);

    // 1. Criar no Supabase Auth (Fonte da Verdade)
    const { data: sbData, error: sbError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nome: name, role }
    });

    if (sbError) {
      console.error("Erro Supabase Auth:", sbError);
      res.status(500).json({ error: `Erro na autenticaÃ§Ã£o externa: ${sbError.message}` });
      return;
    }

    const sbUser = sbData.user;
    if (!sbUser) throw new Error("Supabase nÃ£o retornou usuÃ¡rio.");

    // 2. Criar no Prisma com o mesmo ID
    const user = await prisma.user.create({
      data: { 
        id: sbUser.id,
        nome: name, 
        email, 
        senha: hash, 
        role, 
        pixKey 
      },
    });

    // Cria perfil especÃ­fico baseado no role
    if (role === "PROFISSIONAL") {
      await prisma.profissional.create({
        data: { 
          userId: user.id, 
          services: [], 
          cameras: [], 
          lenses: [], 
          lighting: [],
          captPct: captPct ? Number(captPct) : 30,
          editPct: editPct ? Number(editPct) : 10,
          equipment: equipment || null,
          otherHabilities: otherHabilities || null
        },
      });
    } else if (role === "CARTORIO") {
      await prisma.cartorio.create({
        data: {
          userId: user.id,
          razaoSocial: name, // Usa o nome cadastrado como RazÃ£o Social inicial
        },
      });
    }

    await audit(req, "USER_CREATED", "User", user.id, null, { email: user.email, role: user.role });

    res.status(201).json({
      id: user.id, name: user.nome, email: user.email, role: user.role,
    });
  } catch (err) {
    console.error("adminCreateUser:", err);
    res.status(500).json({ error: "Erro ao criar usuÃ¡rio." });
  }
}

export async function adminUpdateUser(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { 
    name, role, active, captPct, editPct, pixKey, 
    priceFoto, priceVideo, priceReels, priceImpresso, splitPct, cidade 
  } = req.body;

  try {
    await prisma.user.update({
      where: { id: String(id) },
      data: {
        ...(name && { nome: name }),
        ...(role && { role }),
        ...(active !== undefined && { active }),
        ...(pixKey !== undefined && { pixKey }),
        ...(req.body.isVerified !== undefined && { isVerified: req.body.isVerified }),
        ...(req.body.verificationStatus && { verificationStatus: req.body.verificationStatus }),
      },
    });

    // Atualiza percentuais do profissional se enviados
    if (role === "PROFISSIONAL" && (captPct !== undefined || editPct !== undefined || req.body.otherHabilities !== undefined || req.body.equipment !== undefined)) {
      await prisma.profissional.update({
        where: { userId: String(id) },
        data: {
          ...(captPct !== undefined && { captPct }),
          ...(editPct !== undefined && { editPct }),
          ...(req.body.otherHabilities !== undefined && { otherHabilities: req.body.otherHabilities || null }),
          ...(req.body.equipment !== undefined && { equipment: req.body.equipment || null }),
        },
      });
    }

    // Atualiza campos do cartÃ³rio se enviados
    if (role === "CARTORIO") {
      await prisma.cartorio.update({
        where: { userId: String(id) },
        data: {
          ...(splitPct !== undefined && { splitPct }),
          ...(cidade !== undefined && { cidade }),
          ...(priceFoto !== undefined && { priceFoto }),
          ...(priceVideo !== undefined && { priceVideo }),
          ...(priceReels !== undefined && { priceReels }),
          ...(priceImpresso !== undefined && { priceImpresso }),
        }
      });
    }

    // â”€â”€ GESTÃƒO DE FRANQUIA â”€â”€
    const { isFranchise, printCredits } = req.body;
    if (isFranchise !== undefined) {
      if (isFranchise) {
        // Habilita ou atualiza perfil de franquia
        await prisma.franchiseProfile.upsert({
          where: { userId: String(id) },
          create: { userId: String(id), printCredits: printCredits || 0 },
          update: { 
            active: true,
            ...(printCredits !== undefined && { printCredits })
          }
        });

        // Se crÃ©ditos mudaram, registra transaÃ§Ã£o de ajuste/recarga
        if (printCredits !== undefined) {
           const profile = await prisma.franchiseProfile.findUnique({ where: { userId: String(id) } });
           if (profile) {
              await prisma.creditTransaction.create({
                data: {
                  profileId: profile.id,
                  amount: printCredits, // Aqui estamos setando o valor total, talvez devesse ser delta?
                  // Por simplicidade neste MVP, setamos o valor absoluto enviado pelo Admin.
                  type: 'ADJUSTMENT',
                  description: `Ajuste administrativo de saldo: ${printCredits} crÃ©ditos.`
                }
              });
           }
        }
      } else {
        // Desabilita perfil de franquia (apenas desativa, nÃ£o deleta o histÃ³rico)
        await prisma.franchiseProfile.updateMany({
          where: { userId: String(id) },
          data: { active: false }
        });
      }
    }

    await audit(req, "USER_UPDATED", "User", String(id), null, req.body);

    res.json({ ok: true });
  } catch (err) {
    console.error("adminUpdateUser:", err);
    res.status(500).json({ error: "Erro ao atualizar usuÃ¡rio." });
  }
}

export async function adminDeleteUser(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { id: String(id) },
      include: {
        profissional: true,
        cartorio: true
      }
    });

    if (!user) {
      res.status(404).json({ error: "UsuÃ¡rio nÃ£o encontrado." });
      return;
    }

    // 1. Remover do Supabase Auth
    try {
      const { error: sbError } = await supabase.auth.admin.deleteUser(user.id);
      if (sbError) {
        console.warn(`[Supabase] Erro ao remover usuÃ¡rio auth: ${sbError.message}`);
        // Prosseguimos mesmo com erro no Supabase (ex: usuÃ¡rio jÃ¡ removido lÃ¡)
      }
    } catch (err) {
      console.warn(`[Supabase] ExceÃ§Ã£o ao remover usuÃ¡rio auth`, err);
    }

    // 2. Remover perfis associados (Opcional se houver cascade, mas vamos garantir)
    if (user.profissional) {
      await prisma.profissional.delete({ where: { id: user.profissional.id } });
    }
    if (user.cartorio) {
      await prisma.cartorio.delete({ where: { id: user.cartorio.id } });
    }

    // 3. Remover do Prisma
    await prisma.user.delete({
      where: { id: user.id }
    });

    await audit(req, "USER_DELETED", "User", String(id), null, { email: user.email });

    res.json({ ok: true });
  } catch (err) {
    console.error("adminDeleteUser:", err);
    res.status(500).json({ error: "Erro ao excluir usuÃ¡rio. Verifique se existem dependÃªncias (eventos/pedidos)." });
  }
}

// â”€â”€ PEDIDOS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function adminUpdateOrderLogistics(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { fulfillmentStatus, trackingCode } = req.body;
  try {
    const order = await prisma.order.update({
      where: { id: String(id) },
      data: {
        ...(fulfillmentStatus && { fulfillmentStatus: fulfillmentStatus as any }),
        ...(trackingCode !== undefined && { trackingCode })
      }
    });
    await audit(req, "ORDER_LOGISTICS_UPDATED", "Order", order.id, null, { fulfillmentStatus, trackingCode });
    res.json({ ok: true, order });
  } catch (err: any) {
    console.error("adminUpdateOrderLogistics:", err);
    res.status(500).json({ error: "Erro ao atualizar logística." });
  }
}

export async function adminListOrders(req: AuthRequest, res: Response): Promise<void> {
  const { status, page = "1", q, readyForPayout, payoutStatus } = req.query;
  const take = 20;
  const skip = (Number(page) - 1) * take;

  try {
    const where: Prisma.OrderWhereInput = {};
    if (status) where.status = String(status);
    if (payoutStatus) where.payoutStatus = String(payoutStatus) as any;
    
    // Filtro Phase 06: Pronto para Repasse
    if (readyForPayout === "true") {
      where.status = "APROVADO";
      // Include orders that are AVAILABLE or PENDING (including those without payoutReadyAt)
      where.AND = [{
        OR: [
          { payoutStatus: "AVAILABLE" },
          { payoutStatus: "PENDING", payoutReadyAt: { lte: new Date() } },
          { payoutStatus: "PENDING", payoutReadyAt: null }
        ]
      }];
    }

    if (q) {
      const searchString = String(q);
      where.OR = [
        { buyerEmail: { contains: searchString, mode: "insensitive" } },
        { event: { nomeNoivos: { contains: searchString, mode: "insensitive" } } },
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        event: { 
          select: { 
            nomeNoivos: true, slug: true, dataEvento: true, location: true, city: true,
            captacao: { select: { id: true, nome: true, pixKey: true, profissional: { select: { captPct: true } } } },
            edicao:   { select: { id: true, nome: true, pixKey: true, profissional: { select: { editPct: true } } } },
            cartorioUser: { select: { id: true, nome: true, pixKey: true, cartorio: { select: { splitPct: true } } } }
          } 
        },
        cliente:  { select: { nome: true, email: true } },
        passiveFranchisee: { select: { nome: true } },
        items: {
          include: {
            service: { select: { name: true } },
            printProduct: { select: { id: true, name: true, sku: true } },
            media: { select: { id: true } }
          }
        }
      },
      orderBy: { updatedAt: "desc" },
      take,
      skip,
    });

    const total = await prisma.order.count({ where });

    res.json({ 
      orders: orders.map(o => ({ 
        ...o, 
        amount: o.valor, 
        user: o.cliente, 
        items: o.items.map(item => ({
          ...item,
          printProduct: item.printProduct ? {
            ...item.printProduct,
            title: item.printProduct.name // Mapeia name -> title para o frontend
          } : null
        })),
          event: { 
            title: o.event.nomeNoivos, 
            slug: o.event.slug,
            date: o.event.dataEvento,
            location: o.event.location,
            city: o.event.city,
          partners: {
            captacao: o.event.captacao,
            edicao: o.event.edicao,
            cartorio: o.event.cartorioUser
          },
          passiveFranchisee: o.passiveFranchisee?.nome
        } 
      })), 
      total, page: Number(page), pages: Math.ceil(total / take) 
    });
  } catch (err) {
    console.error("adminListOrders:", err);
    res.status(500).json({ error: "Erro ao listar pedidos." });
  }
}

export async function adminMarkPayoutPaid(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  try {
    const order = await prisma.order.update({
      where: { id: String(id) },
      data: { 
        payoutStatus: "PAID",
        payoutPaidAt: new Date()
      }
    });
    
    await audit(req, "PAYOUT_MARK_PAID", "Order", order.id, null, { valor: order.valor });
    res.json({ ok: true, order });
  } catch (err) {
    console.error("adminMarkPayoutPaid:", err);
    res.status(500).json({ error: "Erro ao liquidar repasse." });
  }
}

// â”€â”€ ORÃ‡AMENTOS (LEADS) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function adminListQuotes(req: AuthRequest, res: Response): Promise<void> {
  const { page = "1", q } = req.query;
  const take = 20;
  const skip = (Number(page) - 1) * take;

  try {
    const baseFilter: Prisma.EventWhereInput = {
      NOT: { quoteStatus: null },
      type: { notIn: ['PHOTO_MARKETPLACE', 'FOTO_POINT', 'FLASH_EVENT'] }
    };
    const where: Prisma.EventWhereInput = q ? {
      AND: [baseFilter, { OR: [
        { clientEmail: { contains: String(q), mode: "insensitive" } },
        { clientName: { contains: String(q), mode: "insensitive" } },
        { nomeNoivos: { contains: String(q), mode: "insensitive" } },
      ]}]
    } : baseFilter;

    const quotes = await prisma.event.findMany({
      where,
      include: {
        pedidos: {
          where: { status: "APROVADO" }
        }
      },
      orderBy: { createdAt: "desc" },
      take,
      skip,
    });

    const total = await prisma.event.count({ where });

    res.json({ quotes, total, page: Number(page), pages: Math.ceil(total / take) });
  } catch (err) {
    console.error("adminListQuotes:", err);
    res.status(500).json({ error: "Erro ao listar orÃ§amentos." });
  }
}

export async function adminCreateQuote(req: AuthRequest, res: Response): Promise<void> {
  const {
    nomeNoivos, clientName, clientEmail, clientPhone,
    dataEvento, location, description, priceBase,
    urgency, temFoto, temVideo, temReels, usageType
  } = req.body;

  if (!nomeNoivos || !dataEvento) {
    res.status(400).json({ error: "Título do evento e data são obrigatórios." });
    return;
  }

  try {
    // Gera slug único para o lead
    let slug = slugify(`quote-${nomeNoivos}-${new Date(dataEvento).getFullYear()}`);
    const exists = await prisma.event.findUnique({ where: { slug } });
    if (exists) slug = `${slug}-${Date.now().toString(36)}`;

    const quote = await prisma.event.create({
      data: {
        nomeNoivos,
        slug,
        dataEvento: new Date(dataEvento),
        location: location || "",
        description: description || null,
        clientName: clientName || null,
        clientEmail: clientEmail || null,
        priceBase: priceBase ? Number(priceBase) : 0,
        isQuote: true,
        quoteStatus: "PENDING",
      }
    });

    res.status(201).json(quote);
  } catch (err) {
    console.error("adminCreateQuote:", err);
    res.status(500).json({ error: "Erro ao criar orçamento." });
  }
}


export async function adminPriceQuote(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { finalPrice, breakdown } = req.body;

  try {
    const quote = await prisma.event.findUnique({ where: { id: String(id) } });

    if (!quote || !quote.isQuote) {
      res.status(404).json({ error: "Orçamento não encontrado." });
      return;
    }

    // Salva o breakdown e move para "Em Análise" (PRICED) sem disparar e-mail/pedido
    const updatedQuote = await prisma.event.update({
      where: { id: String(id) },
      data: {
        ...(finalPrice > 0 && { priceBase: Number(finalPrice) }),
        quoteStatus: "PRICED",
        description: breakdown
          ? `[BUDGET_BREAKDOWN] ${JSON.stringify(breakdown)}\n\nOriginal: ${quote.description}`
          : quote.description,
      },
    });

    await audit(req, "QUOTE_PRICED", "Event", String(id), null, { finalPrice });

    res.json({ success: true, updatedQuote });
  } catch (err) {
    console.error("adminPriceQuote:", err);
    res.status(500).json({ error: "Erro ao salvar análise do orçamento." });
  }
}

export async function adminApproveQuote(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { finalPrice } = req.body;

  try {
    const quote = await prisma.event.findUnique({
      where: { id: String(id) }
    });

    if (!quote || !quote.isQuote) {
      res.status(404).json({ error: "Orçamento não encontrado." });
      return;
    }

    // [P1] Guard: clientEmail obrigatório para emitir proposta
    if (!quote.clientEmail) {
      res.status(400).json({ error: "Este lead não possui e-mail. Adicione o e-mail do cliente antes de disparar a proposta." });
      return;
    }

    // 1. Atualizar o evento com o preço, status e breakdown no description (JSON)
    const updatedQuote = await prisma.event.update({
      where: { id: String(id) },
      data: {
        priceBase: Number(finalPrice),
        priceEarly: Number(finalPrice),
        quoteStatus: "APPROVED", // Proposta enviada ao cliente
        active: true, // Ativa para que o profissional veja o convite
        description: req.body.breakdown ? 
          `[BUDGET_BREAKDOWN] ${JSON.stringify(req.body.breakdown)}\n\nOriginal: ${quote.description}` : 
          quote.description
      }
    });

    // 2. Criar ou Atualizar o(s) pedido(s) (Idempotência)
    const isSplit = req.body.isSplit === true;
    let order;

    // Busca o usuário pelo e-mail para vincular o pedido
    const targetUser = await prisma.user.findUnique({ where: { email: quote.clientEmail! } });

    if (isSplit) {
      const halfPrice = Number(finalPrice) / 2;
      
      // Upsert Pedido 1: Reserva (50%)
      const existingReserva = await prisma.order.findFirst({
        where: { eventId: updatedQuote.id, manualType: "Reserva (50%)", status: "PENDENTE" }
      });

      if (existingReserva) {
        order = await prisma.order.update({
          where: { id: existingReserva.id },
          data: { valor: halfPrice, clienteId: targetUser?.id }
        });
      } else {
        order = await prisma.order.create({
          data: {
            eventId: updatedQuote.id,
            valor: halfPrice,
            buyerEmail: quote.clientEmail,
            clienteId: targetUser?.id,
            status: "PENDENTE",
            manualType: "Reserva (50%)",
            paymentId: `QUOTE-RESERVA-${Date.now()}`
          }
        });
      }

      // Upsert Pedido 2: Quitação (50%)
      const existingQuitacao = await prisma.order.findFirst({
        where: { eventId: updatedQuote.id, manualType: "Quitação (50%)", status: "PENDENTE" }
      });

      if (existingQuitacao) {
        await prisma.order.update({
          where: { id: existingQuitacao.id },
          data: { valor: halfPrice, clienteId: targetUser?.id }
        });
      } else {
        await prisma.order.create({
          data: {
            eventId: updatedQuote.id,
            valor: halfPrice,
            buyerEmail: quote.clientEmail,
            clienteId: targetUser?.id,
            status: "PENDENTE",
            manualType: "Quitação (50%)",
            paymentId: `QUOTE-FINAL-${Date.now()}`
          }
        });
      }
    } else {
      // Pedido único
      const existingSingle = await prisma.order.findFirst({
        where: { eventId: updatedQuote.id, manualType: null, status: "PENDENTE" }
      });

      if (existingSingle) {
        order = await prisma.order.update({
          where: { id: existingSingle.id },
          data: { valor: Number(finalPrice), clienteId: targetUser?.id }
        });
      } else {
        order = await prisma.order.create({
          data: {
            eventId: updatedQuote.id,
            valor: Number(finalPrice),
            buyerEmail: quote.clientEmail,
            clienteId: targetUser?.id,
            status: "PENDENTE"
          }
        });
      }
    }

    // 3. Gerar link de checkout
    const checkoutUrl = `${FRONTEND_URL}/checkout?orderId=${order.id}`;

    // 4. Enviar E-mail Automático
    await NotificationService.sendQuotationPricedEmail({
      to: quote.clientEmail!,
      clientName: quote.clientName || "Cliente",
      eventTitle: quote.nomeNoivos,
      checkoutUrl
    });

    // 4.5. In-App Notification (Client)
    if (targetUser) {
      await NotificationService.createInApp({
        userId: targetUser.id,
        type: 'QUOTE_PRICED',
        title: '💰 Seu orçamento chegou!',
        body: `Preparamos uma proposta exclusiva para ${quote.nomeNoivos}. Clique para ver e confirmar.`,
        refId: quote.id,
        refType: 'event'
      });
    }

    // 5. Alerta WhatsApp (Admin)
    NotificationService.notifyQuotationApproved({
      clientName: quote.clientName || "Cliente",
      eventTitle: quote.nomeNoivos,
      finalPrice: Number(finalPrice)
    });

    // [P2] Notificação in-app para o profissional atribuído (captacaoId)
    if (updatedQuote.captacaoId) {
      await NotificationService.createInApp({
        userId: updatedQuote.captacaoId,
        type: 'EVENT_INVITE',
        title: '📸 Novo evento confirmado!',
        body: `Uma proposta foi aprovada para "${quote.nomeNoivos}". Verifique sua agenda e os detalhes do evento.`,
        refId: quote.id,
        refType: 'event'
      });
    }

    await audit(req, "QUOTE_APPROVED", "Event", String(id), null, { finalPrice });

    res.json({ success: true, updatedQuote, checkoutUrl });
  } catch (err) {
    console.error("adminApproveQuote:", err);
    res.status(500).json({ error: "Erro ao aprovar orÃ§amento." });
  }
}

export async function adminRejectQuote(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { reason } = req.body;

  try {
    const quote = await prisma.event.findUnique({ where: { id: String(id) } });
    if (!quote) {
      res.status(404).json({ error: "Orçamento não encontrado." });
      return;
    }

    await prisma.event.update({
      where: { id: String(id) },
      data: { 
        quoteStatus: "REJECTED",
        active: false,
        description: reason ? `${quote.description}\n\n[REJECTED_REASON] ${reason}` : quote.description
      }
    });

    await audit(req, "QUOTE_REJECTED", "Event", String(id), null, { reason });

    res.json({ success: true });
  } catch (err) {
    console.error("adminRejectQuote:", err);
    res.status(500).json({ error: "Erro ao rejeitar orçamento." });
  }
}

export async function adminArchiveQuote(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    const quote = await prisma.event.findUnique({ where: { id: String(id) } });
    if (!quote) {
      res.status(404).json({ error: "Orçamento não encontrado." });
      return;
    }

    await prisma.event.update({
      where: { id: String(id) },
      data: { 
        quoteStatus: "ARCHIVED",
        active: false,
      }
    });

    await audit(req, "QUOTE_ARCHIVED", "Event", String(id), null, {});

    res.json({ success: true });
  } catch (err) {
    console.error("adminArchiveQuote:", err);
    res.status(500).json({ error: "Erro ao arquivar orçamento." });
  }
}

// â”€â”€ LEGACY COMPATIBILITY â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export class AdminEventController {
  static cartorioStats = async (req: AuthRequest, res: Response) => {
    try {
      const { cartorioName } = req.query;
      const cName = cartorioName ? String(cartorioName) : undefined;
      const events = await prisma.event.findMany({
        where: cName ? { cartorio: cName } : {},
        include: { pedidos: { where: { status: "APROVADO" } } },
        orderBy: { dataEvento: "desc" },
      });
      res.json({ eventos: events });
    } catch {
      res.status(500).json({ error: "Erro ao carregar dados do cartÃ³rio." });
    }
  }
}

// â”€â”€ AUDIT LOGS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function adminGetLogs(req: AuthRequest, res: Response): Promise<void> {
  try {
    const page   = Math.max(1, parseInt(String(req.query.page  ?? "1")));
    const limit  = Math.min(100, parseInt(String(req.query.limit ?? "50")));
    const action = req.query.action ? String(req.query.action) : undefined;

    const where = action ? { action: { contains: action } } : {};

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await prisma.auditLog.count({ where });

    res.json({ logs, total, page, limit });
  } catch (err) {
    console.error("adminGetLogs:", err);
    res.status(500).json({ error: "Erro ao carregar logs de auditoria." });
  }
}

export async function adminCreateManualSale(req: AuthRequest, res: Response): Promise<void> {
  const { eventId, customerName, customerEmail, whatsapp, amount, manualType, internalNotes } = req.body;

  if (!eventId || !customerName || !customerEmail || !amount) {
    res.status(400).json({ error: "Todos os campos sÃ£o obrigatÃ³rios." });
    return;
  }

  try {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      res.status(404).json({ error: "Evento nÃ£o encontrado." });
      return;
    }

    // 1. Encontrar ou criar usuÃ¡rio (Sincronizado com Supabase Auth)
    let user = await prisma.user.findUnique({ where: { email: customerEmail } });
    
    if (!user) {
      const tempPassword = "FS-" + Math.random().toString(36).slice(-8).toUpperCase();
      
      try {
        // 1a. Criar no Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: customerEmail,
          password: tempPassword,
          email_confirm: true,
          user_metadata: { nome: customerName, role: "CLIENTE" }
        });

        if (authError) {
          if (authError.message.includes("already registered")) {
            // Sincroniza se jÃ¡ existe no Supabase
            const { data: { users: sbUsers } } = await supabase.auth.admin.listUsers();
            const sbUser = (sbUsers as { id: string, email?: string }[]).find(u => u.email === customerEmail);
            if (sbUser) {
              const hash = await bcrypt.hash(tempPassword, 12);
              user = await prisma.user.create({
                data: {
                  id: sbUser.id,
                  nome: customerName,
                  email: customerEmail,
                  senha: hash,
                  role: "CLIENTE",
                  active: true,
                }
              });
            }
          } else {
            throw authError;
          }
        } else if (authData?.user) {
          const hash = await bcrypt.hash(tempPassword, 12);
          user = await prisma.user.create({
            data: {
              id: authData.user.id,
              nome: customerName,
              email: customerEmail,
              senha: hash,
              role: "CLIENTE",
              active: true,
            }
          });
          console.log(`[ADMIN] Novo usuÃ¡rio criado no Supabase: ${customerEmail} (Pass: ${tempPassword})`);
        }
      } catch (err: unknown) {
        console.error("[ADMIN Manual Sale Auto-Register Error]:", err instanceof Error ? err.message : String(err));
        // Fallback local
        const hashedPassword = await bcrypt.hash(tempPassword, 10);
        user = await prisma.user.create({
          data: {
            nome: customerName,
            email: customerEmail,
            senha: hashedPassword,
            role: "CLIENTE",
            active: true,
          }
        });
      }
    }

    if (!user) {
      res.status(500).json({ error: "Falha ao identificar ou criar usuÃ¡rio para a venda manual." });
      return;
    }

    // 2. Criar pedido aprovado
    const order = await prisma.order.create({
      data: {
        clienteId: user.id,
        eventId: event.id,
        valor: Number(amount),
        status: "APROVADO",
        paymentId: `MANUAL-${Date.now()}`,
        accessType: "TOTAL",
        isManual: true,
        manualType: manualType || "ADMIN_DIRECT",
        contributorName: customerName,
        buyerEmail: customerEmail,
        buyerWhatsapp: whatsapp || null,
        internalNotes: internalNotes || null,
        hasPaid: true,
        payoutStatus: "AVAILABLE",
        payoutReadyAt: new Date()
      }
    });

    // 3. ForÃ§ar o evento como privado ao registrar venda (Privacidade LGPD)
    // SEGURANÃ‡A: Apenas se o usuÃ¡rio for o dono ou se nÃ£o houver dono definido ainda.
    const canForcePrivate = !event.clientEmail || req.user?.email === event.clientEmail;
    if (canForcePrivate) {
      await prisma.event.update({
        where: { id: event.id },
        data: { isPrivate: true }
      });
    }

    await audit(req, "ADMIN_MANUAL_SALE", "Order", order.id, null, { 
      eventId, 
      customerEmail, 
      buyerWhatsapp: whatsapp || null,
      internalNotes: internalNotes || null,
      amount 
    });

    // 3. NotificaÃ§Ãµes (Auditoria: Corrigindo lacuna de comunicaÃ§Ã£o)
    NotificationService.notifyNewSale({
      buyerEmail: customerEmail,
      eventTitle: event.nomeNoivos,
      orderId: order.id,
      amount: Number(amount)
    });

    NotificationService.sendAccessEmail({
      to: customerEmail,
      buyerName: customerName,
      eventTitle: event.nomeNoivos,
      orderId: order.id,
      accessLink: `${FRONTEND_URL}/e/${event.id}`
    }).catch(e => console.error("Erro e-mail venda manual admin:", e));

    res.json({ message: "Venda registrada com sucesso!", orderId: order.id, userEmail: user.email });
  } catch (err) {
    console.error("adminCreateManualSale Error:", err);
    res.status(500).json({ error: "Erro ao registrar venda manual.", details: err instanceof Error ? err.message : String(err) });
  }
}


/**
 * GET /api/diag/db
 * Diagnóstico ultra-rápido de conectividade com o banco para debug em produção.
 */
export async function checkDbStatus(_req: any, res: any) {
  try {
    const counts = await Promise.race([
      Promise.all([
        prisma.event.count(),
        prisma.event.count({ where: { active: true, isPrivate: false, isQuote: false } }),
        prisma.user.count()
      ]),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout na conexão com o banco")), 5000))
    ]);

    return res.json({
      status: "CONNECTED",
      database: "Supabase Postgres",
      timestamp: new Date().toISOString(),
      counts: {
        totalEvents: (counts as any)[0],
        publicEvents: (counts as any)[1],
        users: (counts as any)[2]
      },
      env: {
        node_env: process.env.NODE_ENV,
        has_db_url: !!process.env.DATABASE_URL
      }
    });
  } catch (error: any) {
    console.error("[DIAG] Erro no banco:", error);
    return res.status(500).json({
      status: "ERROR",
      message: "Falha na conexão com o banco de dados.",
      error: error.message,
      env: {
        node_env: process.env.NODE_ENV,
        has_db_url: !!process.env.DATABASE_URL
      }
    });
  }
}

/**
 * Admin: Lista todos os produtos com seus níveis de estoque e movimentos recentes
 */
export async function adminListInventory(req: AuthRequest, res: Response): Promise<void> {
  try {
    const products = await prisma.printProduct.findMany({
      include: {
        stockMovements: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      },
      orderBy: { name: 'asc' }
    });
    res.json(products);
  } catch (err) {
    console.error("adminListInventory Error:", err);
    res.status(500).json({ error: "Erro ao listar estoque." });
  }
}

/**
 * Admin: Ajusta o nível de estoque de um produto (Entrada/Saída/Ajuste)
 */
export async function adminAdjustStock(req: AuthRequest, res: Response): Promise<void> {
  const { productId, quantity, type, description } = req.body;
  if (!productId || quantity === undefined || !type) {
    res.status(400).json({ error: "Dados incompletos para ajuste de estoque." });
    return;
  }

  try {
    const [updatedProduct, movement] = await prisma.$transaction([
      prisma.printProduct.update({
        where: { id: productId },
        data: { stockLevel: { increment: Number(quantity) } }
      }),
      prisma.stockMovement.create({
        data: {
          productId,
          quantity: Number(quantity),
          type,
          description: description || `Ajuste manual via admin`
        }
      })
    ]);

    await audit(req, "STOCK_ADJUSTED", "PrintProduct", productId, null, { quantity, type, description });
    res.json({ success: true, product: updatedProduct, movement });
  } catch (err) {
    console.error("adminAdjustStock Error:", err);
    res.status(500).json({ error: "Erro ao ajustar estoque." });
  }
}
