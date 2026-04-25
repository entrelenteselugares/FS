import { Response } from "express";
import { AuthRequest } from "../lib/auth";
import prisma from "../lib/prisma";
import { Prisma } from "@prisma/client";
import { supabaseAdmin as supabase } from "../lib/supabase";
import { PricingService } from "../services/pricing.service";

// GET /api/profissional/events — eventos atribuídos ao profissional logado
export async function getMeusEventos(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user?.userId;
  if (!userId) { res.status(401).json({ error: "Não autenticado." }); return; }

  try {
    const events = await prisma.event.findMany({
      where: {
        active: true,
        OR: [
          { captacaoId: userId },
          { edicaoId: userId },
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
      include: { user: { select: { nome: true, email: true, whatsapp: true } } }
    });

    // Calcula ganhos totais (baseado em PayoutItems pagos)
    const totalEarnings = await prisma.payoutItem.aggregate({
      where: { recipientId: userId, status: "PAID" },
      _sum: { amount: true }
    });

    // Ganhos do mês atual
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEarnings = await prisma.payoutItem.aggregate({
      where: { recipientId: userId, status: "PAID", paidAt: { gte: firstDayOfMonth } },
      _sum: { amount: true }
    });

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
        totalEarnings: Number(totalEarnings._sum.amount ?? 0),
        monthEarnings: Number(monthEarnings._sum.amount ?? 0),
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

  const { services, equipment, otherHabilities } = req.body;

  try {
    const updated = await prisma.profissional.update({
      where: { userId },
      data: {
        ...(services !== undefined && { services }),
        ...(equipment !== undefined && { equipment }),
        ...(otherHabilities !== undefined && { otherHabilities }),
      }
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
    });

    if (!event) {
      res.status(404).json({ error: "Evento não encontrado ou acesso negado." });
      return;
    }

    const updateData: Prisma.EventUpdateInput = {};
    if (event.captacaoId === userId) updateData.captacaoStatus = status as "ACCEPTED" | "REJECTED" | "PENDING";
    if (event.edicaoId === userId) updateData.edicaoStatus = status as "ACCEPTED" | "REJECTED" | "PENDING";

    const updated = await prisma.event.update({
      where: { id: String(id) },
      data: updateData
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
  const { customerName, customerEmail, amount, manualType } = req.body;
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
        // @ts-ignore - Prisma types not updated yet due to Windows file lock
        isManual: true,
        // @ts-ignore
        manualType: manualType || "SD_CARD",
        buyerEmail: customerEmail || null,
        contributorName: customerName || null,
        splitMatriz: matriz,
        splitCaptacao: captacao,
        splitEdicao: edicao,
        splitCartorio: cartorio,
        hasPaid: true
      }
    });

    res.json(order);
  } catch (err) {
    console.error("registerManualSale:", err);
    res.status(500).json({ error: "Erro ao registrar venda física." });
  }
}
