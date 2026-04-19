import { Request, Response } from "express";
import prisma from "../lib/prisma";

/**
 * GET /api/cliente/pedidos
 * Retorna todos os pedidos do usuário logado (clienteId).
 */
export async function getMeusPedidos(req: Request, res: Response): Promise<void> {
  const user = (req as any).user;
  
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
      hasPaid: p.status === "APROVADO",
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
export async function getMeuPedidoDetalhe(req: Request, res: Response): Promise<void> {
  const user = (req as any).user;
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
      event: {
        ...p.event,
        // Só expõe os links se o status for APROVADO no banco
        lightroomUrl: aprovado ? p.event?.lightroomUrl ?? null : null,
        driveUrl: aprovado ? p.event?.driveUrl ?? null : null,
      },
    });
  } catch (err) {
    console.error("getMeuPedidoDetalhe:", err);
    res.status(500).json({ error: "Erro ao buscar pedido." });
  }
}
