
import { Response } from "express";
import { AuthRequest } from "../lib/auth";
import prisma from "../lib/prisma";

/**
 * GET /api/admin/events/:id
 * Retorna detalhes completos do evento para edição administrativa.
 */
export async function adminGetEventById(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    const event = await prisma.event.findUnique({
      where: { id: String(id) },
      include: {
        cartorioUser: true,
        captacao: true,
        edicao: true,
        _count: { select: { pedidos: true } }
      }
    });

    if (!event) {
      res.status(404).json({ error: "Evento não encontrado." });
      return;
    }

    res.json(event);
  } catch (err) {
    console.error("adminGetEventById:", err);
    res.status(500).json({ error: "Erro ao buscar detalhes do evento." });
  }
}
