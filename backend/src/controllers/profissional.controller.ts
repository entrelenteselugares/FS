import { Response } from "express";
import { AuthRequest } from "../lib/auth";
import prisma from "../lib/prisma";
import { Prisma } from "@prisma/client";
import { supabaseAdmin as supabase } from "../lib/supabase";
import { PricingService } from "../services/pricing.service";
import { NotificationService } from "../services/notification.service";
import { audit } from "../lib/audit";
import { FRONTEND_URL } from "../lib/config";

// GET /api/profissional/events — eventos atribuídos ao profissional logado
export async function getMeusEventos(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user?.userId;
  if (!userId) { res.status(401).json({ error: "Não autenticado." }); return; }

  try {
    const events = await prisma.event.findMany({
      where: {
        active: true,
        OR: [
          { captacaoId: userId, captacaoStatus: { not: "REJECTED" } },
          { edicaoId: userId, edicaoStatus: { not: "REJECTED" } },
        ],
      },
      select: {
        id: true,
        nomeNoivos: true,
        dataEvento: true,
        createdAt: true,
        cartorio: true,
        coverPhotoUrl: true,
        lightroomUrl: true,
        driveUrl: true,
        temFotoImpressa: true,
        captacaoId: true,
        captacaoStatus: true,
        edicaoId: true,
        edicaoStatus: true,
        _count: { select: { pedidos: true } },
      },
      orderBy: { dataEvento: "desc" },
    });

    res.json(events);
  } catch (err) {
    console.error("getMeusEventos:", err);
    res.status(500).json({ error: "Erro ao buscar eventos." });
  }
}

// PATCH /api/profissional/events/:id/links — atualiza lightroomUrl e driveUrl
export async function updateEventLinks(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { lightroomUrl, driveUrl } = req.body;
  const userId = req.user?.userId;
  if (!userId) { res.status(401).json({ error: "Não autenticado." }); return; }

  try {
    // Garante que o evento pertence a este profissional
    const event = await prisma.event.findFirst({
      where: {
        id: String(id),
        OR: [{ captacaoId: userId }, { edicaoId: userId }],
      },
    });
    if (!event) { res.status(403).json({ error: "Acesso negado a este evento." }); return; }

    // Valida URLs
    const urlPattern = /^https?:\/\/.+/;
    if (lightroomUrl && !urlPattern.test(String(lightroomUrl))) {
      res.status(400).json({ error: "URL inválida para o campo Lightroom/Portfolio." }); return;
    }
    if (driveUrl && !urlPattern.test(String(driveUrl))) {
      res.status(400).json({ error: "URL inválida para o Google Drive." }); return;
    }

    const updated = await prisma.event.update({
      where: { id: String(id) },
      data: {
        ...(lightroomUrl !== undefined && { lightroomUrl: String(lightroomUrl) || null }),
        ...(driveUrl !== undefined && { driveUrl: String(driveUrl) || null }),
      },
    });

    // P0 — Entrega do produto final: audit obrigatório para rastreabilidade em disputas
    await audit(req, "DELIVERY_LINKS_SAVED", "Event", String(id), null, {
      savedBy: userId,
      before: { lightroomUrl: event.lightroomUrl ?? null, driveUrl: event.driveUrl ?? null },
      after:  { lightroomUrl: lightroomUrl ?? null, driveUrl: driveUrl ?? null },
    });

    res.json(updated);
  } catch (err) {
    console.error("updateEventLinks:", err);
    res.status(500).json({ error: "Erro ao atualizar links." });
  }
}

// PATCH /api/profissional/events/:id/cover — upload da foto de capa (BASE64)
export async function uploadEventCover(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const userId = req.user?.userId;
  if (!userId) { res.status(401).json({ error: "Não autenticado." }); return; }

  // Recebe base64 do frontend em vez de multipart
  const { imageBase64, mimeType } = req.body;
  if (!imageBase64 || !mimeType) {
    res.status(400).json({ error: "Imagem e MimeType são obrigatórios." });
    return;
  }

  try {
    const event = await prisma.event.findFirst({
      where: {
        id: String(id),
        OR: [{ captacaoId: userId }, { edicaoId: userId }],
      },
    });
    if (!event) { res.status(403).json({ error: "Acesso negado ao arquivo." }); return; }

    // Converte base64 para buffer
    const base64Data = String(imageBase64).replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    const ext = String(mimeType).split("/")[1] || "jpg";
    const fileName = `covers/${id}-${Date.now()}.${ext}`;

    // Upload para o Supabase Storage (Bucket: eventos)
    const { error: uploadError } = await supabase.storage
      .from("eventos")
      .upload(fileName, buffer, {
        contentType: String(mimeType),
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // Obtém a URL pública final
    const { data: { publicUrl } } = supabase.storage
      .from("eventos")
      .getPublicUrl(fileName);

    const updated = await prisma.event.update({
      where: { id: String(id) },
      data: { coverPhotoUrl: publicUrl },
      select: { id: true, coverPhotoUrl: true },
    });

    // P1 — Upload de capa: rastrear mudanças de identidade visual do evento
    await audit(req, "EVENT_COVER_UPLOADED", "Event", String(id), null, {
      uploadedBy: userId,
      coverPhotoUrl: publicUrl,
    });

    res.json(updated);
  } catch (err) {
    console.error("uploadEventCover:", err);
    res.status(500).json({ error: "Erro ao sincronizar capa no Cloud Storage." });
  }
}

// GET /api/profissional/me — retorna dados do perfil profissional
export async function getProfile(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user?.userId;
  if (!userId) { res.status(401).json({ error: "Não autenticado." }); return; }

  try {
    const profile = await prisma.profissional.findUnique({
      where: { userId },
      include: { 
        user: { select: { nome: true, email: true, whatsapp: true } },
        cartorios: {
          where: { status: "ACCEPTED" },
          include: { cartorio: { select: { razaoSocial: true } } }
        },
        proServices: { include: { catalog: true } }
      }
    });

    // Calcula ganhos totais (PayoutItems pagos + Pedidos liquidados ainda não processados)
    const totalPaid = await prisma.payoutItem.aggregate({
      where: { recipientId: userId, status: "PAID" },
      _sum: { amount: true }
    });

    const pendingOrders = await prisma.order.aggregate({
      where: { 
        status: { in: ["PAGO", "APROVADO"] },
        OR: [
          { event: { captacaoId: userId } },
          { event: { edicaoId: userId } }
        ]
      },
      _sum: { splitCaptacao: true, splitEdicao: true }
    });

    // Filtra o split correto baseado na função do profissional no evento (Captador ou Editor)
    // Para simplificar e ser preciso, vamos buscar os pedidos onde ele é captador ou editor explicitamente
    const ordersAsCaptador = await prisma.order.aggregate({
      where: { status: { in: ["PAGO", "APROVADO"] }, event: { captacaoId: userId } },
      _sum: { splitCaptacao: true }
    });
    const ordersAsEditor = await prisma.order.aggregate({
      where: { status: { in: ["PAGO", "APROVADO"] }, event: { edicaoId: userId } },
      _sum: { splitEdicao: true }
    });

    const totalEstimated = Number(ordersAsCaptador._sum.splitCaptacao ?? 0) + Number(ordersAsEditor._sum.splitEdicao ?? 0);

    // Ganhos do mês atual (Liquidados no mês)
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const monthOrdersAsCaptador = await prisma.order.aggregate({
      where: { 
        status: { in: ["PAGO", "APROVADO"] }, 
        event: { captacaoId: userId },
        createdAt: { gte: firstDayOfMonth }
      },
      _sum: { splitCaptacao: true }
    });
    const monthOrdersAsEditor = await prisma.order.aggregate({
      where: { 
        status: { in: ["PAGO", "APROVADO"] }, 
        event: { edicaoId: userId },
        createdAt: { gte: firstDayOfMonth }
      },
      _sum: { splitEdicao: true }
    });

    const monthEstimated = Number(monthOrdersAsCaptador._sum.splitCaptacao ?? 0) + Number(monthOrdersAsEditor._sum.splitEdicao ?? 0);

    // Contagem de eventos concluídos (links preenchidos)
    const completedEvents = await prisma.event.count({
      where: {
        OR: [{ captacaoId: userId }, { edicaoId: userId }],
        lightroomUrl: { not: null }
      }
    });

    res.json({
      ...profile,
      stats: {
        totalEarnings: totalEstimated, // Mostra o total real acumulado
        monthEarnings: monthEstimated, // Mostra o acumulado do mês
        completedEvents
      }
    });
  } catch (err) {
    console.error("getProfile:", err);
    res.status(500).json({ error: "Erro ao buscar perfil." });
  }
}

// PATCH /api/profissional/me — atualiza dados do perfil profissional
export async function updateProfile(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user?.userId;
  if (!userId) { res.status(401).json({ error: "Não autenticado." }); return; }

  const { services, equipmentList, otherHabilities, experienceYears, hourlyRate } = req.body;

  try {
    // ── LÓGICA DE EQUAÇÃO TÁTICA (AUTOMAÇÃO DE PRECIFICAÇÃO) ──
    let calculatedMultiplier = 1.0;
    
    // 1. Fator Equipamento: +0.2 a cada R$ 5.000 investidos
    if (Array.isArray(equipmentList)) {
      const totalValue = equipmentList.reduce((acc: number, curr: any) => acc + (Number(curr.value) || 0), 0);
      calculatedMultiplier += (totalValue / 5000) * 0.2;
    }

    // 2. Fator Maturidade: +0.1 por ano de experiência
    if (experienceYears) {
      calculatedMultiplier += (Number(experienceYears) * 0.1);
    }

    // 3. Normalização: Piso 1.0 | Teto 5.0
    const finalMultiplier = Number(Math.min(Math.max(calculatedMultiplier, 1.0), 5.0).toFixed(2));

    const updated = await prisma.profissional.update({
      where: { userId },
      data: {
        ...(services !== undefined && { services }),
        ...(equipmentList !== undefined && { equipmentList }),
        ...(otherHabilities !== undefined && { otherHabilities }),
        ...(experienceYears !== undefined && { experienceYears: Number(experienceYears) }),
        ...(hourlyRate !== undefined && { hourlyRate: Number(hourlyRate) }),
        equipmentMultiplier: finalMultiplier // Campo agora é automatizado pelo sistema
      }
    });

    // P1 — Alteração de perfil profissional (Auditando nova equação)
    await audit(req, "PROFISSIONAL_PROFILE_UPDATED", "Profissional", userId, null, {
      experienceYears,
      equipmentValue: Array.isArray(equipmentList) ? equipmentList.reduce((a, c) => a + Number(c.value), 0) : 0,
      newMultiplier: finalMultiplier
    });

    res.json(updated);
  } catch (err) {
    console.error("updateProfile:", err);
    res.status(500).json({ error: "Erro ao atualizar perfil." });
  }
}

// PATCH /api/profissional/events/:id/respond — aceita ou recusa um convite
export async function respondToEvent(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { status } = req.body; // 'ACCEPTED' | 'REJECTED'
  const userId = req.user?.userId;
  if (!userId) { res.status(401).json({ error: "Não autenticado." }); return; }

  if (!['ACCEPTED', 'REJECTED'].includes(status)) {
    res.status(400).json({ error: "Status inválido." });
    return;
  }

  try {
    const event = await prisma.event.findFirst({
      where: {
        id: String(id),
        OR: [{ captacaoId: userId }, { edicaoId: userId }]
      }
    }) as any;

    if (!event) {
      res.status(404).json({ error: "Evento não encontrado ou acesso negado." });
      return;
    }

    const updateData: any = {};
    if (event.captacaoId === userId) updateData.captacaoStatus = status as "ACCEPTED" | "REJECTED" | "PENDING";
    if (event.edicaoId === userId) updateData.edicaoStatus = status as "ACCEPTED" | "REJECTED" | "PENDING";

    // ─── LOGICA DE REDIRECIONAMENTO AUTOMÁTICO ───
    if (status === "REJECTED" && event.captacaoId === userId && event.cartorioUserId) {
      // 1. Atualiza lista de rejeições
      const rejectedArray = Array.isArray(event.rejectedBy) ? [...event.rejectedBy] : [];
      if (!rejectedArray.includes(userId)) {
        rejectedArray.push(userId);
      }
      updateData.rejectedBy = rejectedArray;

      // 2. Busca próximo profissional disponível na unidade
      const unit = await prisma.cartorio.findUnique({
        where: { userId: event.cartorioUserId },
        include: { 
          profissionais: { 
            where: { status: "ACCEPTED" }, 
            include: { profissional: { include: { user: true } } } 
          } 
        }
      });

      const nextPro = unit?.profissionais.find(p => !rejectedArray.includes(p.profissional.user.id));

      if (nextPro) {
        console.log(`[Redirecionamento] Evento ${id} passado de ${userId} para ${nextPro.profissional.user.id}`);
        updateData.captacaoId = nextPro.profissional.user.id;
        updateData.captacaoStatus = "PENDING";

        // Notifica o novo profissional
        NotificationService.notifyProfessionalNewAssignment({
          to: nextPro.profissional.user.email,
          profissionalName: nextPro.profissional.user.nome,
          eventTitle: event.nomeNoivos,
          eventDate: event.dataEvento.toISOString(),
          location: event.location || "Ponto Fixo"
        }).catch(e => console.error("Erro ao notificar novo profissional redirecionado:", e));
      } else {
        console.log(`[Redirecionamento] Nenhum outro profissional disponível na unidade para o evento ${id}`);
        // Se ninguém puder, o captacaoId permanece como o último que rejeitou, mas o status fica REJECTED. 
        // O Admin verá isso no painel.
      }
    }

    const updated = await prisma.event.update({
      where: { id: String(id) },
      data: updateData
    });

    // P1 — Resposta a convite: rastrear aceitações e rejeições de trabalho
    await audit(req, "EVENT_INVITE_RESPONDED", "Event", String(id), null, {
      respondedBy: userId,
      decision: status,
      role: event.captacaoId === userId ? "CAPTACAO" : "EDICAO",
    });

    res.json(updated);
  } catch (err) {
    console.error("respondToEvent:", err);
    res.status(500).json({ error: "Erro ao responder ao convite." });
  }
}

// POST /api/profissional/events/:id/manual-sale — registra uma venda física (Cartão SD, etc)
export async function registerManualSale(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { customerName, customerEmail, whatsapp, amount, manualType, internalNotes } = req.body;
  const userId = req.user?.userId;
  if (!userId) { res.status(401).json({ error: "Não autenticado." }); return; }

  try {
    const event = await prisma.event.findFirst({
      where: {
        id: String(id),
        OR: [{ captacaoId: userId }, { edicaoId: userId }],
      },
    });
    if (!event) { res.status(403).json({ error: "Acesso negado." }); return; }

    // Calcula splits usando a inteligência centralizada
    const { matriz, captacao, edicao, cartorio } = await PricingService.calculateSplits(Number(amount));

    // Cria o pedido aprovado com a tag de manual
    const order = await prisma.order.create({
      data: {
        eventId: event.id,
        valor: Number(amount),
        status: "APROVADO",
        isManual: true,
        manualType: manualType || "SD_CARD",
        buyerEmail: customerEmail || null,
        buyerWhatsapp: whatsapp || null,
        internalNotes: internalNotes || null,
        contributorName: customerName || null,
        splitMatriz: matriz,
        splitCaptacao: captacao,
        splitEdicao: edicao,
        splitCartorio: cartorio,
        hasPaid: true
      }
    });

    // Forçar o evento como privado ao registrar venda (Privacidade LGPD)
    await prisma.event.update({
      where: { id: event.id },
      data: { isPrivate: true }
    });

    // 3. Notificações (Auditoria: Adicionando fluxos de alerta)
    NotificationService.notifyNewSale({
      buyerEmail: customerEmail || "venda-manual@fotosegundo.com",
      eventTitle: event.nomeNoivos,
      orderId: order.id,
      amount: Number(amount)
    });

    if (customerEmail) {
      NotificationService.sendAccessEmail({
        to: customerEmail,
        buyerName: customerName || "Cliente",
        eventTitle: event.nomeNoivos,
        orderId: order.id,
        accessLink: `${FRONTEND_URL}/e/${event.id}`
      }).catch((e: any) => console.error("Erro e-mail venda manual:", e));
    }

    // P0 — Venda física (Cartão SD / Álbum): rastrear transação sem checkout digital
    await audit(req, "MANUAL_SALE_REGISTERED", "Order", order.id, null, {
      registeredBy: userId,
      eventId: event.id,
      customerEmail: customerEmail ?? null,
      amount: Number(amount),
      manualType: manualType || "SD_CARD",
      splits: { matriz, captacao, edicao, cartorio },
    });

    res.json(order);
  } catch (err) {
    console.error("registerManualSale:", err);
    res.status(500).json({ error: "Erro ao registrar venda física." });
  }
}

/**
 * GET /api/profissional/unidades/convites
 * Lista convites pendentes de unidades fixas.
 */
export async function getConvitesUnidade(req: AuthRequest, res: Response) {
  const userId = req.user?.userId;
  if (!userId) { res.status(401).json({ error: "Não autenticado." }); return; }

  try {
    const profissional = await prisma.profissional.findUnique({ where: { userId } });
    if (!profissional) { 
      res.json([]); 
      return; 
    }

    const invites = await prisma.cartorioProfissional.findMany({
      where: { profissionalId: profissional.id, status: "PENDING" },
      include: { cartorio: { select: { id: true, razaoSocial: true, cidade: true } } }
    });

    res.json(invites);
  } catch (err) {
    console.error("getConvitesUnidade:", err);
    res.status(500).json({ error: "Erro ao buscar convites de unidades." });
  }
}

/**
 * PATCH /api/profissional/unidades/convites/:id/respond
 * Aceita ou recusa convite de unidade.
 */
export async function respondConviteUnidade(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const { status } = req.body; // "ACCEPTED" | "REJECTED"
  const userId = req.user?.userId;
  if (!userId) { res.status(401).json({ error: "Não autenticado." }); return; }

  if (!["ACCEPTED", "REJECTED"].includes(status)) {
    res.status(400).json({ error: "Status inválido." });
    return;
  }

  try {
    const profissional = await prisma.profissional.findUnique({ where: { userId } });
    if (!profissional) { res.status(404).json({ error: "Profissional não encontrado." }); return; }

    const invite = await prisma.cartorioProfissional.findFirst({
      where: { id: String(id), profissionalId: profissional.id }
    });

    if (!invite) { res.status(404).json({ error: "Convite não encontrado." }); return; }

    const updated = await prisma.cartorioProfissional.update({
      where: { id: String(id) },
      data: { status: String(status) }
    });

    res.json(updated);
  } catch (err) {
    console.error("respondConviteUnidade:", err);
    res.status(500).json({ error: "Erro ao processar resposta do convite." });
  }
}

// ── SERVIÇOS DO PROFISSIONAL ──────────────────────────────────────────────────
export async function addProService(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user?.userId;
  if (!userId) { res.status(401).json({ error: "Não autenticado." }); return; }

  try {
    const prof = await prisma.profissional.findUnique({ where: { userId } });
    if (!prof) { res.status(404).json({ error: "Profissional não encontrado." }); return; }

    const { catalogId, name, description, price } = req.body;
    if (!name || price === undefined) {
      res.status(400).json({ error: "Nome e preço são obrigatórios." });
      return;
    }

    const service = await prisma.professionalService.create({
      data: {
        profissionalId: prof.id,
        catalogId: catalogId || null,
        name,
        description,
        price: Number(price),
      }
    });
    res.status(201).json(service);
  } catch (err) {
    console.error("addProService:", err);
    res.status(500).json({ error: "Erro ao adicionar serviço." });
  }
}

export async function updateProService(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user?.userId;
  if (!userId) { res.status(401).json({ error: "Não autenticado." }); return; }

  try {
    const id = req.params.id as string;
    const { name, description, price, active } = req.body;

    const existing = await prisma.professionalService.findUnique({ where: { id }, include: { profissional: true } });
    if (!existing || existing.profissional.userId !== userId) {
      res.status(404).json({ error: "Serviço não encontrado." }); return;
    }

    const updated = await prisma.professionalService.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: Number(price) }),
        ...(active !== undefined && { active }),
      }
    });
    res.json(updated);
  } catch (err) {
    console.error("updateProService:", err);
    res.status(500).json({ error: "Erro ao atualizar serviço." });
  }
}

export async function deleteProService(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user?.userId;
  if (!userId) { res.status(401).json({ error: "Não autenticado." }); return; }

  try {
    const id = req.params.id as string;
    const existing = await prisma.professionalService.findUnique({ where: { id }, include: { profissional: true } });
    if (!existing || existing.profissional.userId !== userId) {
      res.status(404).json({ error: "Serviço não encontrado." }); return;
    }

    await prisma.professionalService.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    console.error("deleteProService:", err);
    res.status(500).json({ error: "Erro ao deletar serviço." });
  }
}

export async function listProServices(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user?.userId;
  if (!userId) { res.status(401).json({ error: "Não autenticado." }); return; }

  try {
    const prof = await prisma.profissional.findUnique({ where: { userId } });
    if (!prof) { res.status(404).json({ error: "Profissional não encontrado." }); return; }

    const services = await prisma.professionalService.findMany({
      where: { profissionalId: prof.id },
      include: { catalog: true },
      orderBy: { createdAt: "desc" }
    });
    res.json(services);
  } catch (err) {
    console.error("listProServices:", err);
    res.status(500).json({ error: "Erro ao listar serviços." });
  }
}

// ── REDE DE EMPATIA (PARCERIAS) ─────────────────────────────────────────────

/**
 * Busca profissionais na plataforma para parcerias.
 */
export async function searchProfessionals(req: AuthRequest, res: Response): Promise<void> {
  const { query } = req.query;
  const userId = req.user?.userId;
  if (!userId) { res.status(401).json({ error: "Não autenticado." }); return; }

  try {
    const pros = await prisma.user.findMany({
      where: {
        role: { in: ["PROFISSIONAL", "ADMIN"] },
        id: { not: userId },
        OR: [
          { nome: { contains: String(query || ""), mode: "insensitive" } },
          { email: { contains: String(query || ""), mode: "insensitive" } }
        ]
      },
      select: { id: true, nome: true, email: true, whatsapp: true },
      take: 10
    });
    res.json(pros);
  } catch (err) {
    console.error("searchProfessionals:", err);
    res.status(500).json({ error: "Erro ao buscar profissionais." });
  }
}

/**
 * Adiciona ou remove um profissional da rede de favoritos (Empatia).
 */
export async function toggleFavorite(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user?.userId;
  const { partnerId } = req.body;
  if (!userId) { res.status(401).json({ error: "Não autenticado." }); return; }

  try {
    const existing = await prisma.professionalNetwork.findUnique({
      where: { userId_partnerId: { userId, partnerId } }
    });

    if (existing) {
      await prisma.professionalNetwork.delete({ where: { id: existing.id } });
      res.json({ status: "REMOVED", message: "Parceiro removido da rede." });
    } else {
      await prisma.professionalNetwork.create({
        data: { userId, partnerId }
      });
      res.json({ status: "ADDED", message: "Parceiro adicionado à rede de empatia." });
    }
  } catch (err) {
    console.error("toggleFavorite:", err);
    res.status(500).json({ error: "Erro ao atualizar rede de parcerias." });
  }
}

/**
 * Lista a rede de parceiros favoritos do profissional.
 */
export async function getNetwork(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user?.userId;
  if (!userId) { res.status(401).json({ error: "Não autenticado." }); return; }

  try {
    const network = await prisma.professionalNetwork.findMany({
      where: { userId },
      include: { 
        partner: { 
          select: { id: true, nome: true, email: true, whatsapp: true } 
        } 
      },
      orderBy: { createdAt: "desc" }
    });
    res.json(network.map(n => n.partner));
  } catch (err) {
    console.error("getNetwork:", err);
    res.status(500).json({ error: "Erro ao buscar rede de parcerias." });
  }
}
