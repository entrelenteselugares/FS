import { Response } from "express";
import { AuthRequest } from "../lib/auth";
import prisma from "../lib/prisma";

// POST /api/orders/:id/access-type
// Comprador escolhe PUBLIC ou PRIVATE após pagamento
export async function chooseAccessType(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { accessType } = req.body;
  const user = req.user;

  if (!user) {
    res.status(401).json({ error: "Não autenticado." });
    return;
  }

  if (!["PUBLIC", "PRIVATE"].includes(accessType)) {
    res.status(400).json({ error: "Tipo inválido. Use PUBLIC ou PRIVATE." });
    return;
  }

  try {
    // Busca o pedido
    const order = await prisma.order.findFirst({
      where: { id: String(id) },
      include: { event: true },
    });

    if (!order) {
      res.status(404).json({ error: "Pedido não encontrado." });
      return;
    }

    // ── Verificação LGPD ──────────────────────────────
    // O usuário logado deve ser o dono do pedido
    if (order.clienteId !== user.userId) {
      res.status(403).json({
        error: "Acesso negado. Apenas o titular do pedido pode definir a privacidade.",
      });
      return;
    }

    // Verifica se o pagamento foi aprovado
    const aprovado = order.status === "APROVADO";
    if (!aprovado) {
      res.status(403).json({ error: "Pagamento ainda não confirmado." });
      return;
    }

    // Calcula expiração baseado na escolha
    const now = new Date();
    const diasExpiracao = accessType === "PUBLIC" ? 90 : 15;
    const accessExpiresAt = new Date(now.getTime() + diasExpiracao * 24 * 60 * 60 * 1000);

    // Atualiza o pedido
    const updated = await prisma.order.update({
      where: { id: String(id) },
      data: {
        accessType,
        accessChosenAt: now,
        accessExpiresAt,
      },
    });

    // Se PUBLIC, o evento fica visível na Home
    // Se PRIVATE, ocultamos da vitrine
    // ── SEGURANÇA ────────────────────────────────────
    // Apenas o ADMIN ou o CLIENTE CONTRATANTE podem tornar o álbum público globalmente.
    const isPrimaryClient = order.event.clientEmail && user.email === order.event.clientEmail;
    const isAdmin = user.role === "ADMIN";

    if (isPrimaryClient || isAdmin) {
      await prisma.event.update({
        where: { id: order.eventId },
        data: { isPrivate: accessType === "PRIVATE" },
      });
    }

    res.json({
      accessType: updated.accessType,
      accessExpiresAt: updated.accessExpiresAt,
      diasRestantes: diasExpiracao,
      mensagem: accessType === "PUBLIC"
        ? `Seu álbum ficará público por 90 dias. Faça o download antes de ${accessExpiresAt.toLocaleDateString("pt-BR")}.`
        : `Você tem 15 dias para fazer o download. Após ${accessExpiresAt.toLocaleDateString("pt-BR")} os arquivos serão excluídos permanentemente.`,
    });

  } catch (err) {
    console.error("chooseAccessType:", err);
    res.status(500).json({ error: "Erro ao definir tipo de acesso." });
  }
}

// GET /api/orders/:id/access-status
// Verifica status do acesso (usado pelo frontend para mostrar prazo)
export async function getAccessStatus(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const user = req.user;

  if (!user) {
    res.status(401).json({ error: "Não autenticado." });
    return;
  }

  try {
    const orderRaw = await prisma.order.findFirst({
      where: { id: String(id), clienteId: user.userId },
      include: {
        event: {
          select: {
            nomeNoivos: true, 
            slug: true,
            lightroomUrl: true, 
            driveUrl: true,
            isCrowdfund: true,
            targetAmount: true,
            collectedAmount: true,
            clientEmail: true,
          },
        },
      },
    });
    
    interface AccessOrder {
      id: string;
      status: string;
      accessType: string | null;
      accessExpiresAt: Date | null;
      deletedAt: Date | null;
      showAlbum: boolean;
      showVideo: boolean;
      event: {
        nomeNoivos: string;
        slug: string;
        lightroomUrl: string | null;
        driveUrl: string | null;
        isCrowdfund: boolean;
        targetAmount: number | null;
        collectedAmount: number | null;
        clientEmail: string | null;
      };
    }

    const order = orderRaw as unknown as AccessOrder;

    if (!order) {
      res.status(404).json({ error: "Pedido não encontrado." });
      return;
    }

    const aprovado = order.status === "APROVADO";

    // Verifica se expirou
    const now = new Date();
    const expirado = order.accessExpiresAt ? new Date(order.accessExpiresAt) < now : false;
    const excluido = !!order.deletedAt;

    if (excluido || expirado) {
      res.json({
        status: "EXPIRED",
        mensagem: "Este conteúdo foi excluído permanentemente conforme os termos de uso.",
        lightroomUrl: null,
        driveUrl: null,
      });
      return;
    }

    const diasRestantes = order.accessExpiresAt
      ? Math.ceil((new Date(order.accessExpiresAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    const isGoalMet = !order.event.isCrowdfund || (Number(order.event.collectedAmount) >= Number(order.event.targetAmount || 0));

    const isPrimaryClient = !!(user.email && order.event.clientEmail && user.email === order.event.clientEmail);
    const status = order.accessType 
      ? (isGoalMet ? "ACTIVE" : "PENDING_GOAL") 
      : aprovado 
        ? (isPrimaryClient ? "PENDING_CHOICE" : "ACTIVE") // Se não for o dono, pula para ACTIVE (PUBLIC)
        : "PENDING_PAYMENT";

    res.json({
      status,
      accessType: order.accessType || (status === "ACTIVE" && !order.accessType ? "PUBLIC" : null),
      isCrowdfund: order.event.isCrowdfund,
      isGoalMet,
      collectedAmount: order.event.collectedAmount,
      targetAmount: order.event.targetAmount,
      accessExpiresAt: order.accessExpiresAt,
      diasRestantes,
      showAlbum: order.showAlbum,
      showVideo: order.showVideo,
      // Links apenas se ativo e não expirado E visível
      lightroomUrl: (status === "ACTIVE" && !expirado && order.showAlbum) ? order.event.lightroomUrl : null,
      driveUrl: (status === "ACTIVE" && !expirado && order.showVideo) ? order.event.driveUrl : null,
      eventTitle: order.event.nomeNoivos,
      eventSlug: order.event.slug,
    });

  } catch (err) {
    console.error("getAccessStatus:", err);
    res.status(500).json({ error: "Erro ao verificar status." });
  }
}

// POST /api/admin/orders/:id/delete-media — exclusão manual pelo admin
export async function deleteMediaAdmin(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    await prisma.order.update({
      where: { id: String(id) },
      data: { deletedAt: new Date() },
    });
    res.json({ ok: true, mensagem: "Mídia marcada como excluída." });
  } catch {
    res.status(500).json({ error: "Erro ao excluir mídia." });
  }
}

// POST /api/orders/:id/visibility
export async function toggleVisibility(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { showAlbum, showVideo } = req.body;
  const user = req.user;

  if (!user) {
    res.status(401).json({ error: "Não autenticado." });
    return;
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: String(id) },
    });

    if (!order || order.clienteId !== user.userId) {
      res.status(404).json({ error: "Pedido não encontrado ou acesso negado." });
      return;
    }

    const nextShowAlbum = showAlbum !== undefined ? !!showAlbum : order.showAlbum;
    const nextShowVideo = showVideo !== undefined ? !!showVideo : order.showVideo;

    // Regra: Se público, ao menos um deve ser verdadeiro
    if (order.accessType === "PUBLIC" && !nextShowAlbum && !nextShowVideo) {
      res.status(400).json({ error: "Em álbuns públicos, ao menos um item (Álbum ou Vídeo) deve estar visível." });
      return;
    }

    const updated = await prisma.order.update({
      where: { id: String(id) },
      data: {
        showAlbum: nextShowAlbum,
        showVideo: nextShowVideo,
      },
    });

    res.json({ ok: true, showAlbum: updated.showAlbum, showVideo: updated.showVideo });
  } catch (err) {
    console.error("toggleVisibility:", err);
    res.status(500).json({ error: "Erro ao atualizar visibilidade." });
  }
}
