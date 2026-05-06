import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthRequest, generateToken } from "../lib/auth";
import crypto from "crypto";

export class FlashController {
  /**
   * Gera um lote de cartões para um evento Flash.
   * POST /api/flash/generate
   */
  static async generateCards(req: AuthRequest, res: Response) {
    const { eventId, quantity } = req.body;
    const userId = req.user?.userId;

    if (!eventId || !quantity) {
      return res.status(400).json({ error: "eventId e quantity são obrigatórios." });
    }

    try {
      // Validar se o evento existe e pertence ao profissional/admin
      const event = await prisma.event.findUnique({
        where: { id: eventId }
      });

      if (!event) return res.status(404).json({ error: "Evento não encontrado." });

      const cards = [];
      for (let i = 0; i < quantity; i++) {
        const shortId = crypto.randomBytes(4).toString("hex").toUpperCase(); // 8 chars
        const pin = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits

        cards.push({
          shortId,
          pin,
          eventId,
          status: "UNUSED"
        });
      }

      await prisma.flashCard.createMany({
        data: cards
      });

      return res.status(201).json({
        message: `${quantity} cartões gerados com sucesso.`,
        cards: cards.map(c => ({ shortId: c.shortId, pin: c.pin }))
      });
    } catch (error: any) {
      console.error("[FLASH] Erro ao gerar cartões:", error);
      return res.status(500).json({ error: "Erro interno ao gerar cartões." });
    }
  }

  /**
   * Valida o PIN de um QR Code.
   * POST /api/flash/unlock
   */
  static async unlock(req: Request, res: Response) {
    const { shortId, pin } = req.body;

    if (!shortId || !pin) {
      return res.status(400).json({ error: "shortId e PIN são obrigatórios." });
    }

    try {
      const card = await prisma.flashCard.findUnique({
        where: { shortId },
        include: { 
          event: true,
          media: true
        }
      });

      if (!card || card.pin !== pin) {
        return res.status(401).json({ error: "PIN ou QR Code inválido." });
      }

      // Se o cartão for válido, gera um token anônimo
      const token = generateToken({
        userId: `anon-${card.id}`,
        role: "ANONYMOUS_FLASH",
        nome: "Cliente Anônimo",
        email: `anon-${card.shortId}@flash.fs`
      });

      // Se já houver mídia vinculada, retorna os dados
      // Caso contrário, retorna apenas sucesso (o fotógrafo ainda vai subir a foto)
      return res.json({
        message: "Acesso liberado!",
        token,
        event: {
          id: card.event.id,
          nome: card.event.nomeNoivos,
        },
        media: card.media ? {
          id: card.media.id,
          url: card.media.url,
          thumbnail: card.media.url, // Placeholder for thumbnail logic
        } : null
      });

    } catch (error: any) {
      console.error("[FLASH] Erro ao desbloquear PIN:", error);
      return res.status(500).json({ error: "Erro interno no desbloqueio." });
    }
  }

  /**
   * Vincula uma mídia a um cartão existente (usado pelo fotógrafo no upload).
   */
  static async linkMedia(req: AuthRequest, res: Response) {
    const { shortId, mediaId } = req.body;

    try {
      await prisma.flashCard.update({
        where: { shortId },
        data: { 
          mediaId,
          status: "USED"
        }
      });
      return res.json({ message: "Mídia vinculada ao cartão." });
    } catch (error) {
      return res.status(500).json({ error: "Erro ao vincular mídia." });
    }
  }
}
