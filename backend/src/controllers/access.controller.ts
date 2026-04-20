import { Response } from "express";
import { AuthRequest } from "../lib/auth";
import { prisma } from "../lib/prisma";

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

    // Verifica se já foi escolhido (imutável após primeira escolha)
    if (order.accessType) {
      res.status(409).json({
        error: `Tipo de acesso já definido como ${order.accessType}. Esta escolha não pode ser alterada.`,
        accessType: order.accessType,
        accessExpiresAt: order.accessExpiresAt,
      });
      return;
    }

    // Verifica se o pagamento foi aprovado
    const aprovado = order.status === "APROVADO" || order.status === "APPROVED";
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

    // Se PUBLIC, o evento fica visível no portfolio
    if (accessType === "PUBLIC") {
      await prisma.event.update({
        where: { id: order.eventId },
        data: { active: true },
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
    const order = await prisma.order.findFirst({
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
          },
        },
      },
    }) as any; // Cast as any because Prisma's deep inclusion types sometimes conflict with simplified Controller return types

    if (!order) {
      res.status(404).json({ error: "Pedido não encontrado." });
      return;
    }

    const aprovado = order.status === "APROVADO" || order.status === "APPROVED";

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

    res.json({
      status: order.accessType ? (isGoalMet ? "ACTIVE" : "PENDING_GOAL") : aprovado ? "PENDING_CHOICE" : "PENDING_PAYMENT",
      accessType: order.accessType,
      isCrowdfund: order.event.isCrowdfund,
      isGoalMet,
      collectedAmount: order.event.collectedAmount,
      targetAmount: order.event.targetAmount,
      accessExpiresAt: order.accessExpiresAt,
      diasRestantes,
      // Links apenas se ativo e não expirado E meta atingida
      lightroomUrl: (order.accessType && !expirado && isGoalMet) ? order.event.lightroomUrl : null,
      driveUrl: (order.accessType && !expirado && isGoalMet) ? order.event.driveUrl : null,
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
