import { Response } from "express";
import { AuthRequest } from "../lib/auth";
import prisma from "../lib/prisma";
import { slugify } from "../lib/utils";
import { supabaseAdmin } from "../lib/supabase";
import { PricingService } from "../services/pricing.service";
import { NotificationService } from "../services/notification.service";
import { MercadoPagoService } from "../services/mercadopago.service";
import { audit } from "../lib/audit";
import { applyWatermark } from "../lib/image-processor";
import bcrypt from "bcryptjs";

export class MarketplaceController {
  /**
   * POST /api/marketplace/express-sale
   * A "Venda Rápida": Cria evento + Pedido Manual em um único clique.
   */
  static async expressSale(req: AuthRequest, res: Response) {
    const { 
      customerEmail, email, 
      customerName, 
      amount, valorTotal, 
      paymentMethod, method, 
      location, ponto, 
      date,
      captacaoId,
      internalNotes,
      whatsapp,
      cart // Array de shortIds selecionados
    } = req.body;

    const finalEmail = (customerEmail || email)?.toLowerCase().trim();
    const finalAmount = Number(amount || valorTotal);
    const finalMethod = (paymentMethod || method || "DINHEIRO").toUpperCase();
    const finalLocation = location || ponto || "Venda Direta";
    const finalName = customerName || finalEmail.split('@')[0].toUpperCase();

    if (!finalEmail || !finalAmount) {
      return res.status(400).json({ error: "E-mail e Valor são obrigatórios." });
    }

    let tempPassword: string | null = null;

    try {
      // 1. Garante que o cliente existe (Sincronizado com Supabase Auth)
      let user = await prisma.user.findUnique({ where: { email: finalEmail } });
      
      if (!user) {
        tempPassword = "FS-" + Math.random().toString(36).slice(-8).toUpperCase();
        try {
          const hash = await bcrypt.hash(tempPassword, 12);
          
          // 1a. Criar no Supabase Auth para permitir Login e Recuperação
          const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: finalEmail,
            password: tempPassword,
            email_confirm: true,
            user_metadata: { nome: finalName, role: "CLIENTE" }
          });

          if (authError) {
            if (authError.message.includes("already registered")) {
              // Sincroniza e ATUALIZA a senha para garantir acesso na venda rápida
              const { data: { users: sbUsers } } = await supabaseAdmin.auth.admin.listUsers({
                filter: `email.eq.${finalEmail}`
              } as any);
              const sbUser = sbUsers?.[0];
              if (sbUser) {
                // Atualiza senha no Supabase
                await supabaseAdmin.auth.admin.updateUserById(sbUser.id, { password: tempPassword });
                
                user = await prisma.user.upsert({
                  where: { email: finalEmail },
                  create: {
                    id: sbUser.id,
                    email: finalEmail,
                    nome: finalName,
                    senha: hash,
                    whatsapp: whatsapp || null,
                    role: "CLIENTE"
                  },
                  update: {
                    id: sbUser.id,
                    senha: hash
                  }
                });
              }
            } else {
              throw authError;
            }
          } else if (authData?.user) {
            // Caso de Sucesso: Novo usuário no Supabase
            user = await prisma.user.create({
              data: {
                id: authData.user.id,
                email: finalEmail,
                nome: finalName,
                senha: hash,
                whatsapp: whatsapp || null,
                role: "CLIENTE"
              }
            });
            console.log(`[ExpressSale] Novo usuário criado: ${finalEmail} (Senha Prov: ${tempPassword})`);
          }

          // O e-mail será enviado apenas uma vez ao final, se for novo usuário
        } catch (err: any) {
          console.error("[ExpressSale Auto-Register Error]:", err.message);
          const fallbackHash = await bcrypt.hash(tempPassword, 10);
          user = await prisma.user.create({
            data: {
              email: finalEmail,
              nome: finalName,
              senha: fallbackHash,
              whatsapp: whatsapp || null,
              role: "CLIENTE"
            }
          });
        }
      }

      if (!user) {
        return res.status(500).json({ error: "Falha ao identificar ou criar usuário para a venda." });
      }

      // 2. Cria o Evento (Operação de Marketplace)
      const eventDate = date ? new Date(date) : new Date();
      let slug = slugify(`express-${finalEmail.split('@')[0]}-${Date.now().toString(36)}`);
      
      const { editorId } = req.body; // Novo campo opcional

      const event = await prisma.event.create({
        data: {
          nomeNoivos: finalName,
          dataEvento: eventDate,
          location: finalLocation,
          type: "PHOTO_MARKETPLACE",
          active: true,
          isPrivate: true,
          slug,
          captacaoId: captacaoId || (req as any).user?.userId,
          edicaoId: editorId || captacaoId || (req as any).user?.userId, // Se não houver editor, o captador edita
          captacaoStatus: "ACCEPTED",
          edicaoStatus: editorId ? "PENDING" : "ACCEPTED", // Se delegou, fica pendente para o editor
          pricePerPhoto: 15, 
          isUnitSale: true,
          priceUnit: finalAmount
        }
      });

      // 3. Vincular mídias se houver carrinho
      let orderItems: Array<{ mediaId: string; price: number; quantity: number }> = [];
      if (Array.isArray(cart) && cart.length > 0) {
        const dbMedias = await prisma.eventMedia.findMany({
          where: {
            eventId: event.id,
            shortId: { in: cart }
          }
        });

        orderItems = dbMedias.map(m => ({
          mediaId: m.id,
          price: Number(m.price ?? event.pricePerPhoto ?? 15),
          quantity: 1
        }));
      }

      // 4. Cria o Pedido com Splits de Venda Direta
      const isDigital = finalMethod === "PIX" || finalMethod === "CARD";
      const { matriz, captacao, edicao, cartorio } = await PricingService.calculateSplits(finalAmount, {
        isExpressSale: true,
        paymentMethod: finalMethod,
        hasEditor: !!editorId
      });

      const order = await prisma.order.create({
        data: {
          eventId: event.id,
          clienteId: user.id,
          editorId: editorId || null,
          valor: finalAmount,
          status: isDigital ? "PENDENTE" : "APROVADO",
          hasPaid: !isDigital,
          isManual: !isDigital,
          manualType: finalMethod,
          contributorName: finalName,
          buyerEmail: finalEmail,
          buyerWhatsapp: whatsapp || null,
          internalNotes: internalNotes || null,
          splitMatriz: matriz,
          splitCaptacao: captacao,
          splitEdicao: edicao,
          splitCartorio: cartorio,
          items: {
            create: orderItems
          }
        }
      });
      
      // 5. INTEGRAÇÃO MERCADO PAGO (Para Venda Digital via Marketplace)
      let checkoutUrl = null;
      if (isDigital) {
        try {
          const preference = await MercadoPagoService.createPreference({
            transaction_amount: finalAmount,
            description: `FOTOS: ${event.nomeNoivos}`,
            payer_email: finalEmail,
            notification_url: `${process.env.BACKEND_URL}/api/webhooks/mercadopago`,
            orderId: order.id
          });
          checkoutUrl = preference.init_point;
        } catch (mpError) {
          console.error("[MP Preference Error]:", mpError);
          // Não trava a criação do pedido, mas avisa o erro
        }
      }

      // Audit — Registro de Venda Expressa (P0)
      await audit(req, "EXPRESS_SALE_CREATED", "Event", event.id, null, {
        type: event.type,
        amount: finalAmount,
        method: finalMethod,
        location: finalLocation,
        buyerEmail: finalEmail,
        orderId: order.id,
        isDigital,
        hasCheckout: !!checkoutUrl
      });

      // ENVIO DE E-MAIL (Apenas se for novo usuário)
      if (user && tempPassword) {
        NotificationService.sendWelcomeEmail({
          to: finalEmail,
          name: finalName,
          tempPassword: tempPassword
        }).catch(e => console.error("[ExpressSale Email Error]:", e));
      }

      return res.json({ 
        success: true, 
        eventId: event.id, 
        orderId: order.id,
        isDigital,
        checkoutUrl, // Enviando o link real para o frontend
        message: isDigital 
          ? "Venda registrada. Gerando link de pagamento..." 
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
      
      // Aplicar Marca d'água (Blindagem de Conteúdo)
      const watermarkedBuffer = await applyWatermark(buffer);
      
      const ext = String(mimeType).split("/")[1] || "jpg";
      const fileName = `marketplace/${String(eventId)}/${Date.now()}-${Math.random().toString(36).slice(-4)}.${ext}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from("eventos")
        .upload(fileName, watermarkedBuffer, {
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
