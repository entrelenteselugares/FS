import { Response } from "express";
import { AuthRequest } from "../lib/auth";
import prisma from "../lib/prisma";
import { slugify } from "../lib/utils";
import { supabaseAdmin } from "../lib/supabase";
import { PricingService } from "../services/pricing.service";
import { audit } from "../lib/audit";

export class MarketplaceController {
  /**
   * POST /api/marketplace/express-sale
   * A "Venda Rápida": Cria evento + Pedido Manual em um único clique.
   */
  static async expressSale(req: AuthRequest, res: Response) {
    // Unifica as chaves vindas do frontend (suporta ambos os formatos para segurança)
    const { 
      customerName, 
      customerEmail, 
      email, // fallback
      whatsapp,
      amount, 
      valorTotal, // fallback
      location, 
      ponto, // fallback
      date,
      captacaoId,
      paymentMethod,
      method, // fallback
      internalNotes
    } = req.body;

    const finalEmail = (customerEmail || email)?.toLowerCase().trim();
    const finalAmount = Number(amount || valorTotal);
    const finalMethod = (paymentMethod || method || "DINHEIRO").toUpperCase();
    const finalLocation = location || ponto || "Venda Direta";
    const finalName = customerName || finalEmail.split('@')[0].toUpperCase();
    const finalContributorName = internalNotes ? `${finalName} | OBS: ${internalNotes}` : finalName;

    if (!finalEmail || !finalAmount) {
      return res.status(400).json({ error: "E-mail e Valor são obrigatórios." });
    }

    try {
      // 1. Garante que o cliente existe
      let user = await prisma.user.findUnique({ where: { email: finalEmail } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            email: finalEmail,
            nome: customerName || finalName,
            senha: "AUTH_EXTERNAL_SUPABASE", // Placeholder
            whatsapp: whatsapp || null,
            role: "CLIENTE"
          }
        });
      } else if (whatsapp) {
        await prisma.user.update({
          where: { id: user.id },
          data: { whatsapp }
        });
      }

      // 2. Cria o Evento (Operação) - Já nasce ACEITO e ATIVO
      const eventDate = date ? new Date(date) : new Date();
      let slug = slugify(`express-${finalEmail.split('@')[0]}-${Date.now().toString(36)}`);
      
      const event = await prisma.event.create({
        data: {
          nomeNoivos: finalName,
          dataEvento: eventDate,
          location: finalLocation,
          type: "PHOTO_MARKETPLACE",
          active: false, // Oculta da homepage por padrão
          isPrivate: true, // Garante que não apareça em listas públicas
          slug,
          captacaoId: captacaoId || (req as any).user?.userId,
          captacaoStatus: "ACCEPTED", // Não precisa aceitar convite
          pricePerPhoto: 15, 
          isUnitSale: true,
          priceUnit: finalAmount
        }
      });

      // 3. Cria o Pedido (PAGO se for Dinheiro)
      const isDigital = finalMethod === "PIX" || finalMethod === "CARD";
      
      // Calcula splits usando a inteligência centralizada (IGUAL À VENDA MANUAL)
      const { matriz, captacao, edicao, cartorio } = await PricingService.calculateSplits(finalAmount);

      const order = await prisma.order.create({
        data: {
          eventId: event.id,
          clienteId: user.id,
          valor: finalAmount,
          status: isDigital ? "PENDENTE" : "PAGO",
          hasPaid: !isDigital,
          isManual: !isDigital,
          manualType: finalMethod,
          contributorName: finalContributorName,
          buyerEmail: finalEmail,
          splitMatriz: matriz,
          splitCaptacao: captacao,
          splitEdicao: edicao,
          splitCartorio: cartorio
        }
      });
      
      // Audit — Registro de Venda Expressa (P0)
      await audit(req, "EXPRESS_SALE_CREATED", "Event", event.id, null, {
        type: event.type,
        amount: finalAmount,
        method: finalMethod,
        location: finalLocation,
        buyerEmail: finalEmail,
        buyerWhatsapp: whatsapp || null,
        internalNotes: internalNotes || null,
        orderId: order.id,
        isDigital
      });

      return res.json({ 
        success: true, 
        eventId: event.id, 
        orderId: order.id,
        isDigital,
        message: isDigital 
          ? "Venda registrada. Redirecionando para pagamento..." 
          : "Venda registrada e liquidada com sucesso!"
      });

    } catch (error) {
      console.error("Erro na Venda Expressa:", error);
      return res.status(500).json({ error: "Falha ao registrar venda expressa." });
    }
  }

  /**
   * POST /api/marketplace/events/:id/media
   * Fotógrafo sobe fotos individuais (Base64)
   */
  static async addMedia(req: AuthRequest, res: Response) {
    const { id: eventId } = req.params;
    const { imageBase64, mimeType, price } = req.body;
    const userId = req.user?.userId;

    if (!imageBase64 || !mimeType) {
      return res.status(400).json({ error: "Imagem e MimeType são obrigatórios." });
    }

    try {
      // 1. Validar propriedade do evento
      const event = await prisma.event.findFirst({
        where: {
          id: String(eventId),
          OR: [{ captacaoId: userId }, { edicaoId: userId }]
        }
      });
      if (!event) return res.status(403).json({ error: "Acesso negado." });

      // 2. Upload para Supabase Storage
      const base64Data = String(imageBase64).replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      const ext = String(mimeType).split("/")[1] || "jpg";
      const fileName = `marketplace/${String(eventId)}/${Date.now()}-${Math.random().toString(36).slice(-4)}.${ext}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from("eventos")
        .upload(fileName, buffer, {
          contentType: String(mimeType),
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabaseAdmin.storage
        .from("eventos")
        .getPublicUrl(fileName);

      // 3. Gerar ShortID
      const count = await prisma.eventMedia.count({ where: { eventId: String(eventId) } });
      const shortId = `F${(count + 1).toString().padStart(3, '0')}`;

      const media = await prisma.eventMedia.create({
        data: {
          eventId: String(eventId),
          url: publicUrl,
          shortId,
          price: price ? Number(price) : null
        }
      });

      // Audit — Upload de Mídia (P2)
      await audit(req, "MEDIA_UPLOADED", "EventMedia", media.id, null, {
        eventId: String(eventId),
        url: publicUrl,
        shortId,
        price: media.price
      });

      return res.json(media);
    } catch (error) {
      console.error("[AddMedia Error]:", error);
      return res.status(500).json({ error: "Erro ao adicionar mídia ao storage." });
    }
  }

  /**
   * GET /api/marketplace/events/:id/media
   * Cliente visualiza fotos para compra.
   * Trava de Privacidade: Se o evento for privado, exige vínculo com o usuário.
   */
  static async listMedia(req: AuthRequest, res: Response) {
    const { id: eventId } = req.params;
    const authUser = (req as any).user;

    try {
      // 1. Busca o evento para verificar privacidade
      const event = await prisma.event.findUnique({
        where: { id: String(eventId) },
        select: { 
          id: true, 
          isPrivate: true, 
          captacaoId: true, 
          edicaoId: true, 
          cartorioUserId: true 
        }
      });

      if (!event) return res.status(404).json({ error: "Evento não encontrado." });

      // 2. Se for privado, exige autorização
      if (event.isPrivate) {
        if (!authUser) {
          return res.status(401).json({ error: "Este álbum é privado. Por favor, faça login para acessar." });
        }

        const isOwner = 
          authUser.role === "ADMIN" || 
          authUser.userId === event.captacaoId || 
          authUser.userId === event.edicaoId || 
          authUser.userId === event.cartorioUserId;

        if (!isOwner) {
          // Verifica se o usuário tem algum pedido para este evento
          const order = await prisma.order.findFirst({
            where: { 
              eventId: event.id, 
              clienteId: authUser.userId,
              status: { not: "CANCELADO" }
            }
          });

          if (!order) {
            return res.status(403).json({ error: "Você não tem permissão para visualizar este álbum privado." });
          }
        }
      }

      // 3. Retorna as mídias
      const media = await prisma.eventMedia.findMany({
        where: { eventId: String(eventId) },
        orderBy: { shortId: "asc" }
      });

      return res.json(media);
    } catch (error) {
      console.error("[Marketplace.listMedia] Erro:", error);
      return res.status(500).json({ error: "Erro ao listar mídias." });
    }
  }
}
