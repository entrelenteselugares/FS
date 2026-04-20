import { Response } from "express";
import { AuthRequest } from "../lib/auth";
import prisma from "../lib/prisma";

/**
 * GET /api/cliente/pedidos
 * Retorna todos os pedidos do usuário logado (clienteId).
 */
export async function getMeusPedidos(req: AuthRequest, res: Response): Promise<void> {
  const user = req.user;
  if (!user) { res.status(401).json({ error: "Não autenticado." }); return; }
  
  try {
    const pedidos = await prisma.order.findMany({
      where: { clienteId: user.userId },
      include: {
        event: {
          select: {
            id: true,
            nomeNoivos: true,
            dataEvento: true,
            location: true,
            city: true,
            coverPhotoUrl: true,
            temFoto: true,
            temVideo: true,
            temReels: true,
            temFotoImpressa: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const resultado = pedidos.map((p: any) => ({
      id: p.id,
      status: p.status,
      amount: Number(p.valor),
      createdAt: p.createdAt,
      event: p.event,
      hasPaid: p.status === "APROVADO" || p.status === "APPROVED",
      accessType: p.accessType,
      accessExpiresAt: p.accessExpiresAt,
    }));

    res.json(resultado);
  } catch (err) {
    console.error("getMeusPedidos:", err);
    res.status(500).json({ error: "Erro ao buscar pedidos." });
  }
}

/**
 * GET /api/cliente/pedidos/:id
 * Retorna o detalhe de um pedido específico com links de acesso se pago.
 */
export async function getMeuPedidoDetalhe(req: AuthRequest, res: Response): Promise<void> {
  const user = req.user;
  if (!user) { res.status(401).json({ error: "Não autenticado." }); return; }
  const { id } = req.params;

  try {
    const pedido = await prisma.order.findFirst({
      where: { id: id as string, clienteId: user.userId },
      include: {
        event: {
          select: {
            id: true,
            nomeNoivos: true,
            dataEvento: true,
            location: true,
            city: true,
            coverPhotoUrl: true,
            lightroomUrl: true,
            driveUrl: true,
            temFoto: true,
            temVideo: true,
            temReels: true,
            temFotoImpressa: true,
          },
        },
      },
    });

    if (!pedido) {
      res.status(404).json({ error: "Pedido não encontrado." });
      return;
    }

    const aprovado = pedido.status === "APROVADO";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p = pedido as any;
    res.json({
      id: p.id,
      status: p.status,
      amount: Number(p.valor),
      createdAt: p.createdAt,
      hasPaid: aprovado,
      accessType: p.accessType,
      accessExpiresAt: p.accessExpiresAt,
      event: {
        ...p.event,
        // Só expõe os links se aprovado INTEGRALMENTE e NÃO expirado/excluído
        lightroomUrl: (aprovado && !p.deletedAt && (!p.accessExpiresAt || new Date(p.accessExpiresAt) > new Date())) 
          ? p.event?.lightroomUrl ?? null : null,
        driveUrl: (aprovado && !p.deletedAt && (!p.accessExpiresAt || new Date(p.accessExpiresAt) > new Date())) 
          ? p.event?.driveUrl ?? null : null,
      },
    });
  } catch (err) {
    console.error("getMeuPedidoDetalhe:", err);
    res.status(500).json({ error: "Erro ao buscar pedido." });
  }
}
