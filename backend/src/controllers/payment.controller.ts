import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { MercadoPagoService } from "../services/mercadopago.service";
import { NotificationService } from "../services/notification.service";
import { PricingService } from "../services/pricing.service";
import crypto from "crypto";
import { supabaseAdmin } from "../lib/supabase";

export class PaymentController {
  /**
   * POST /api/checkout
   * Inicia o fluxo de pagamento com precificação dinâmica.
   */
  static async checkout(req: Request, res: Response) {
    const { eventId, userId, email, method, token, installments, issuer_id, contributionAmount } = req.body;

    try {
      // 1. Buscar evento com os parceiros vinculados
      const event = await prisma.event.findUnique({ 
        where: { id: eventId },
        include: {
          captacao: true,
          edicao: true,
          cartorioUser: true
        }
      });

      if (!event) return res.status(404).json({ error: "Evento não encontrado" });
      const eventBase = event as any; // Temporary cast until Prisma types are updated

      // 2. Lógica de Precificação Dinâmica & Splits (Centralizada)
      const preco = PricingService.calculateEventPrice(eventBase, contributionAmount);
      const { matriz: splitMatriz, captacao: splitCaptacao, edicao: splitEdicao, cartorio: splitCartorio } = 
        await PricingService.calculateSplits(preco);

      console.log(`[Checkout] Repasse Manual Calculado: Snapshot salvo.`);

      // 4. Criar ou Reutilizar Pedido no Banco
      let order;
      const existingOrderId = req.body.orderId;

      // Resolve email → userId para evitar pedido como "Convidado" quando usuário já existe
      let resolvedClienteId = userId || null;
      if (!resolvedClienteId && email) {
        const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
        if (existingUser) resolvedClienteId = existingUser.id;
      }

      if (existingOrderId) {
        order = await prisma.order.findUnique({ where: { id: existingOrderId } });
        if (!order) return res.status(404).json({ error: "Pedido original não encontrado." });
        
        order = await prisma.order.update({
          where: { id: order.id },
          data: {
            valor: preco,
            clienteId: resolvedClienteId ?? order.clienteId,
            splitMatriz,
            splitCaptacao,
            splitEdicao,
            splitCartorio
          }
        });
      } else {
        // Anti-duplicação: verifica pedido PENDENTE já existente para esse evento+email
        const existingPending = email ? await prisma.order.findFirst({
          where: {
            eventId,
            status: "PENDENTE",
            OR: [
              { buyerEmail: email.toLowerCase().trim() },
              { clienteId: resolvedClienteId ?? undefined }
            ]
          },
          orderBy: { createdAt: "desc" }
        }) : null;

        if (existingPending) {
          console.log(`[Checkout] Reutilizando pedido existente ${existingPending.id} para evitar duplicata.`);
          order = await prisma.order.update({
            where: { id: existingPending.id },
            data: {
              valor: preco,
              clienteId: resolvedClienteId ?? existingPending.clienteId,
              splitMatriz,
              splitCaptacao,
              splitEdicao,
              splitCartorio
            }
          });
        } else {
          order = await prisma.order.create({
            data: {
              eventId,
              clienteId: resolvedClienteId,
              buyerEmail: email || null,
              valor: preco,
              status: "PENDENTE",
              isContribution: event.isCrowdfund,
              contributorName: event.isCrowdfund ? (req.body.contributorName || null) : null,
              splitMatriz,
              splitCaptacao,
              splitEdicao,
              splitCartorio
            }
          });
        }
      }

      // 5. Criar Preferência no Mercado Pago (Checkout Pro)
      const backendUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
      const isLocal = backendUrl.includes("localhost") || backendUrl.includes("127.0.0.1");

      const mpResponse = await MercadoPagoService.createPreference({
        transaction_amount: preco,
        description: `Fotos Evento: ${event.nomeNoivos}`,
        payer_email: email,
        notification_url: isLocal 
          ? "" 
          : `${backendUrl}/api/webhooks/mercadopago`,
        orderId: order.id
      });

      // 6. Vincular ID da Preferência ao Pedido (opcional, mas bom para tracking)
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentId: String(mpResponse.id) }
      });

      return res.json({
        orderId: order.id,
        init_point: mpResponse.init_point, // URL para o Checkout Pro
        sandbox_init_point: mpResponse.sandbox_init_point
      });

    } catch (error: any) {
      console.error("[Checkout Error Full]:", error.response?.data || error.message || error);
      
      const mpDetails = error.response?.data?.message || error.message || "Erro desconhecido no MP";

      return res.status(500).json({ 
        error: "Erro no processamento do Mercado Pago",
        details: mpDetails,
        fullError: error.response?.data || null
      });
    }
  }

  /**
   * POST /api/webhooks/mercadopago
   * Recebe notificações automáticas de atualização de status.
   */
  static async webhook(req: Request, res: Response) {
    const { type, data } = req.body;

    // ── VALIDAÇÃO DE ASSINATURA ──
    // Se o secret estiver configurado, valida HMAC. Caso contrário, processa com aviso.
    if (!process.env.MP_WEBHOOK_SECRET) {
      console.warn("[Webhook] MP_WEBHOOK_SECRET não configurada. Processando sem validação de assinatura (modo não-seguro).");
    } else {
      const sig    = (req.headers["x-signature"] as string) ?? "";
      const reqId  = (req.headers["x-request-id"] as string) ?? "";
      const dataId = (req.query["data.id"] as string) ?? "";
      const [tsPart, v1Part] = sig.split(",");
      const ts = tsPart?.split("=")[1];
      const v1 = v1Part?.split("=")[1];

      if (!ts || !v1) {
        console.warn("[Webhook] Headers de assinatura ausentes.");
        return res.status(401).json({ error: "Assinatura ausente." });
      }

      const manifest = `id:${dataId};request-id:${reqId};ts:${ts};`;
      const hmac = crypto
        .createHmac("sha256", process.env.MP_WEBHOOK_SECRET)
        .update(manifest)
        .digest("hex");

      if (hmac !== v1) {
        console.error("[Webhook] Assinatura Inválida.");
        return res.status(401).json({ error: "Assinatura inválida." });
      }
    }

    // O MP envia o ID da transação em data.id quando o type é 'payment'
    if (type === "payment" && data?.id) {
      try {
        const mpPaymentId = String(data.id);

        // ── IDEMPOTÊNCIA: Verifica se já foi processado (Regra Absoluta 7.3) ──
        const jaProcessado = await prisma.order.findFirst({
          where: { 
            paymentId: mpPaymentId,
            status: "APROVADO"
          }
        });

        if (jaProcessado) {
          console.log(`[Webhook] Pagamento ${mpPaymentId} já processado. Ignorando.`);
          return res.json({ ok: true, skipped: true });
        }

        const paymentData = await MercadoPagoService.getPaymentStatus(mpPaymentId);
        
        if (paymentData.status === "approved") {
          // 1. Busca os pedidos vinculados (Tentando por PaymentId ou ExternalReference)
          let updatedOrders = await prisma.order.findMany({ 
            where: { paymentId: String(data.id) },
            include: { event: true, cliente: true }
          });

          // Fallback tático: Caso o checkout Pro ainda não tenha salvo o PaymentID, usamos a Referência Externa
          if (updatedOrders.length === 0 && paymentData.external_reference) {
            console.log(`[Webhook] Pedido não achado por ID ${data.id}. Tentando por Ref: ${paymentData.external_reference}`);
            const orderRef = await prisma.order.findUnique({
              where: { id: paymentData.external_reference },
              include: { event: true, cliente: true }
            });
            if (orderRef) updatedOrders = [orderRef];
          }

          for (const order of updatedOrders) {
            await prisma.order.update({
              where: { id: order.id },
              data: { 
                status: "APROVADO",
                paymentId: String(data.id) // Garante sincronização do ID real do MP
              }
            });

            // Se for cota de presente, atualiza o montante do evento
            if (order.isContribution && order.eventId) {
               await prisma.event.update({
                 where: { id: order.eventId },
                 data: { collectedAmount: { increment: order.valor } }
               });
            }

            // 2. O evento torna-se ativo e deixa de ser orçamento
            await prisma.event.update({
              where: { id: order.eventId },
              data: { active: true, isQuote: false }
            });

            // 3. Dispara e-mail automático
            const recipientEmail = order.buyerEmail || order.cliente?.email || paymentData.payer?.email;
            if (recipientEmail) {
              NotificationService.sendAccessEmail({
                to: recipientEmail,
                buyerName: order.cliente?.nome || "Cliente",
                eventTitle: order.event.nomeNoivos,
                orderId: order.id,
                accessLink: `${process.env.FRONTEND_URL || "https://foto-segundo.vercel.app"}/e/${order.eventId}`,
                tempPassword: order.tempPassword || undefined
              }).catch(e => console.error("Erro ao enviar e-mail via Webhook:", e));
            }

            // 4. Alerta WhatsApp para o admin
            NotificationService.notifyNewSale({
              buyerEmail: order.buyerEmail || order.cliente?.email || "desconhecido",
              eventTitle: order.event.nomeNoivos,
              orderId: order.id,
              amount: Number(order.valor)
            });
          }
          console.log(`✅ Pagamento ${data.id} aprovado e notificação enviada.`);
        }
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Erro desconhecido";
        console.error("Erro ao processar webhook:", msg);
      }
    }

    // Responder sempre 200 ou 201 para o MP parar de tentar enviar
    return res.status(200).send("OK");
  }

  /**
   * POST /api/checkout/payment
   * Processa o pagamento transparente vindo do frontend.
   */
  static async processPayment(req: Request, res: Response) {
    const { eventId, userId, email, cpf, cardToken, installments, paymentMethodId, contributionAmount, accessType, cart } = req.body;

    try {
      // 1. Buscar evento com parceiros para cálculo de split
      const event = await prisma.event.findUnique({ 
        where: { id: eventId },
        include: {
          captacao: { include: { profissional: true } },
          edicao: { include: { profissional: true } },
          cartorioUser: { include: { cartorio: true } }
        }
      });
      if (!event) return res.status(404).json({ error: "Evento não encontrado" });
      const eventBase = event as any;

      // 2. Lógica de Precificação & Splits (Centralizada)
      const cartItems = cart || [];
      const preco = PricingService.calculateEventPrice(eventBase, contributionAmount, cartItems.length);
      
      if (preco <= 0) {
        return res.status(400).json({ error: "O valor do pagamento deve ser superior a zero. Verifique os itens selecionados." });
      }

      const { matriz: splitMatriz, captacao: splitCaptacao, edicao: splitEdicao, cartorio: splitCartorio } = 
        await PricingService.calculateSplits(preco);

      // 4. Identificação do Comprador (Lead -> Customer)
      let finalUserId = userId;
      let isNewUser = false;
      let tempPassword = "";

      if (!finalUserId && email) {
        const cleanEmail = email.toLowerCase().trim();
        const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
        if (existing) {
          finalUserId = existing.id;
        } else {
          // Auto-cadastro tático para convidados
          tempPassword = "FS-" + Math.random().toString(36).slice(-8).toUpperCase();
          const buyerName = req.body.buyerName || cleanEmail.split("@")[0];

          try {
            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
              email: cleanEmail,
              password: tempPassword,
              email_confirm: true,
              user_metadata: { nome: buyerName, role: "CLIENTE" }
            });

            if (authError) {
              if (authError.message.includes("already registered")) {
                // Supabase já tem o usuário — sincroniza com Prisma via upsert
                const { data: listUsers } = await supabaseAdmin.auth.admin.listUsers();
                const sUser = listUsers.users.find(u => u.email === cleanEmail);
                if (sUser) {
                  const syncedUser = await prisma.user.upsert({
                    where: { email: cleanEmail },
                    create: { id: sUser.id, email: cleanEmail, senha: "AUTH_EXTERNAL_SUPABASE", nome: buyerName, role: "CLIENTE" },
                    update: { id: sUser.id }
                  });
                  finalUserId = syncedUser.id;
                  isNewUser = true;
                }
              } else {
                throw authError;
              }
            } else if (authData?.user) {
              // Upsert no Prisma para evitar duplicata por race condition
              const newUser = await prisma.user.upsert({
                where: { email: cleanEmail },
                create: { id: authData.user.id, email: cleanEmail, senha: "AUTH_EXTERNAL_SUPABASE", nome: buyerName, role: "CLIENTE" },
                update: {}
              });
              finalUserId = newUser.id;
              isNewUser = true;
            }
          } catch (err: any) {
            console.error("[Checkout Auto-Register Error]:", err.message);
          }
        }
      }

      if (!finalUserId) {
        return res.status(400).json({ error: "E-mail obrigatório para processar o pagamento." });
      }

      const finalAccessType = accessType || "PRIVATE";
      const expiresAt = new Date();
      if (finalAccessType === "PRIVATE") expiresAt.setDate(expiresAt.getDate() + 15);
      else expiresAt.setDate(expiresAt.getDate() + 90);

      // Anti-duplicação: query Prisma sem .filter() que quebrava silenciosamente
      const cleanEmailForQuery = email ? email.toLowerCase().trim() : null;
      let existingPendingOrder = null;

      if (cleanEmailForQuery) {
        existingPendingOrder = await prisma.order.findFirst({
          where: { eventId, status: "PENDENTE", buyerEmail: cleanEmailForQuery },
          orderBy: { createdAt: "desc" }
        });
      }
      if (!existingPendingOrder && finalUserId) {
        existingPendingOrder = await prisma.order.findFirst({
          where: { eventId, status: "PENDENTE", clienteId: finalUserId },
          orderBy: { createdAt: "desc" }
        });
      }

      let order;
      if (existingPendingOrder) {
        console.log(`[processPayment] Reutilizando pedido ${existingPendingOrder.id} (anti-duplicata).`);
        order = await prisma.order.update({
          where: { id: existingPendingOrder.id },
          data: {
            clienteId: finalUserId,
            buyerEmail: email,
            valor: preco,
            accessType: accessType || existingPendingOrder.accessType || "PRIVATE",
            accessChosenAt: existingPendingOrder.accessChosenAt ?? new Date(),
            accessExpiresAt: existingPendingOrder.accessExpiresAt ?? expiresAt,
            splitMatriz,
            splitCaptacao,
            splitEdicao,
            splitCartorio,
            tempPassword: isNewUser ? tempPassword : null,
            // Limpa itens antigos e recria se necessário
            items: cartItems.length > 0 ? {
              deleteMany: {},
              create: cartItems.map((shortId: string) => ({
                shortId,
                amount: Number(event.pricePerPhoto || 15)
              }))
            } : undefined
          }
        });
      } else {
        order = await prisma.order.create({
          data: {
            eventId,
            clienteId: finalUserId,
            buyerEmail: email,
            valor: preco,
            status: "PENDENTE",
            isContribution: event.isCrowdfund,
            contributorName: event.isCrowdfund ? (req.body.contributorName || null) : null,
            accessType: accessType || "PRIVATE",
            accessChosenAt: new Date(),
            accessExpiresAt: expiresAt,
            splitMatriz,
            splitCaptacao,
            splitEdicao,
            splitCartorio,
            tempPassword: isNewUser ? tempPassword : null,
            items: cartItems.length > 0 ? {
              create: cartItems.map((shortId: string) => ({
                shortId,
                amount: Number(event.pricePerPhoto || 15)
              }))
            } : undefined
          }
        });
      }

      // 5. Chamada Real ao Mercado Pago
      const mpResponse = await MercadoPagoService.processPayment({
        transaction_amount: preco,
        token: cardToken,
        description: `Fotos Evento: ${event.nomeNoivos}`,
        installments: Number(installments) || 1,
        payment_method_id: paymentMethodId || "visa",
        payer: {
          email: email,
          identification: cpf ? { type: "CPF", number: cpf } : undefined
        },
        external_reference: order.id
        // application_fee REMOVIDA: 100% para master
      });

      // 6. Atualizar Pedido com Status Real
      const isApproved = mpResponse.status === "approved";
      let finalStatus = "PENDENTE";
      if (isApproved) finalStatus = "APROVADO";
      if (mpResponse.status === "rejected") finalStatus = "REJEITADO";

      await prisma.order.update({
        where: { id: order.id },
        data: { 
          status: finalStatus,
          paymentId: String(mpResponse.id)
        }
      });

      // Se aprovado e for cota, atualiza evento
      if (isApproved && event.isCrowdfund) {
        await prisma.event.update({
          where: { id: event.id },
          data: { collectedAmount: { increment: preco } }
        });
      }

      // 7. Ativa o evento IMEDIATAMENTE (Checkout Transparente)
      if (isApproved) {
        await prisma.event.update({
          where: { id: eventId },
          data: { active: true, isQuote: false }
        });

        // 7a. E-mail de acesso ao comprador
        NotificationService.sendAccessEmail({
          to: email,
          buyerName: req.body.buyerName || "Cliente",
          eventTitle: event.nomeNoivos,
          orderId: order.id,
          accessLink: `${process.env.FRONTEND_URL || "https://foto-segundo.vercel.app"}/e/${event.id}`,
          tempPassword: isNewUser ? tempPassword : undefined
        }).catch(e => console.error("Erro ao enviar e-mail no checkout:", e));

        // 7b. Alerta WhatsApp para o admin (era disparado APENAS no webhook — bug corrigido)
        NotificationService.notifyNewSale({
          buyerEmail: email,
          eventTitle: event.nomeNoivos,
          orderId: order.id,
          amount: Number(preco)
        });

      } else if (mpResponse.status === "rejected") {
        // 7c. Alerta de pagamento rejeitado
        NotificationService.notifyPaymentIssue({
          orderId: order.id,
          status: mpResponse.status_detail || "rejected",
          eventTitle: event.nomeNoivos
        });
      }

      return res.json({
        orderId: order.id,
        status: mpResponse?.status,
        hasPaid: isApproved,
        details: mpResponse?.status_detail,
        // Dados de PIX para Checkout Transparente
        qr_code: mpResponse?.point_of_interaction?.transaction_data?.qr_code,
        qr_code_base64: mpResponse?.point_of_interaction?.transaction_data?.qr_code_base64,
        ticket_url: mpResponse?.point_of_interaction?.transaction_data?.ticket_url
      });

    } catch (error: any) {
      const errorData = error.response?.data;
      console.error("[Process Payment Error]:", errorData || error.message);
      return res.status(500).json({ 
        error: "Erro ao processar pagamento v2",
        details: errorData || error.message
      });
    }
  }
  /**
   * GET /api/public/orders/:id
   * Busca resumo do pedido para o checkout público.
   */
  static async getOrderPublic(req: Request, res: Response) {
    const { id } = req.params;

    try {
      const order = await prisma.order.findUnique({
        where: { id: String(id) },
        include: {
          cliente: { select: { email: true, nome: true } },
          event: {
            select: {
              id: true,
              nomeNoivos: true,
              dataEvento: true,
              location: true,
              coverPhotoUrl: true,
              isCrowdfund: true
            }
          }
        }
      });

      if (!order) return res.status(404).json({ error: "Pedido não localizado." });

      return res.json({
        id: order.id,
        amount: Number(order.valor),
        status: order.status,
        eventId: order.eventId,
        clienteId: order.clienteId,
        buyerEmail: order.buyerEmail || (order as any).cliente?.email,
        event: (order as any).event,
        contributorName: order.contributorName,
        manualType: order.manualType
      });

    } catch (error) {
      console.error("[GetOrderPublic Error]:", error);
      return res.status(500).json({ error: "Erro ao recuperar dados do pedido." });
    }
  }

  /**
   * GET /api/public/orders/:id/check-payment
   * Polling direto no MP — detecta aprovação de Pix sem depender de webhook.
   */
  static async checkPaymentStatus(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const order = await prisma.order.findUnique({
        where: { id: String(id) },
        include: {
          event: { select: { id: true, nomeNoivos: true } },
          cliente: { select: { email: true } }
        }
      });
      if (!order) return res.status(404).json({ error: "Pedido não encontrado." });

      if (order.status === "APROVADO") {
        return res.json({ status: "APROVADO", eventId: order.eventId });
      }

      if (!order.paymentId) {
        return res.json({ status: order.status });
      }

      const mpData = await MercadoPagoService.getPaymentStatus(order.paymentId);

      if (mpData.status === "approved") {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: "APROVADO" }
        });
        await prisma.event.update({
          where: { id: order.eventId },
          data: { active: true, isQuote: false }
        });
        NotificationService.notifyNewSale({
          buyerEmail: order.buyerEmail || order.cliente?.email || "desconhecido",
          eventTitle: (order.event as any)?.nomeNoivos || order.eventId,
          orderId: order.id,
          amount: Number(order.valor)
        });

        // 2. E-mail de acesso ao comprador (Adicionado para Polling)
        const recipientEmail = order.buyerEmail || order.cliente?.email;
        if (recipientEmail) {
          NotificationService.sendAccessEmail({
            to: recipientEmail,
            buyerName: (order.cliente as any)?.nome || "Cliente",
            eventTitle: (order.event as any)?.nomeNoivos || "Evento",
            orderId: order.id,
            accessLink: `${process.env.FRONTEND_URL || "https://foto-segundo.vercel.app"}/e/${order.eventId}`,
            tempPassword: order.tempPassword || undefined
          }).catch(e => console.error("Erro ao enviar e-mail via Polling:", e));
        }

        return res.json({ status: "APROVADO", eventId: order.eventId });
      }

      return res.json({ status: order.status });
    } catch (error) {
      console.error("[CheckPaymentStatus Error]:", error);
      return res.status(500).json({ error: "Erro ao verificar pagamento." });
    }
  }
}
