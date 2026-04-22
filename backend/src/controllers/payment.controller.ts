import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { MercadoPagoService } from "../services/mercadopago.service";
import { NotificationService } from "../services/notification.service";
import { calculateEventPrice } from "../lib/pricing";
import crypto from "crypto";

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

      // 2. Lógica de Precificação Dinâmica
      const preco = calculateEventPrice(event as any, contributionAmount);

      // 3. Preparar Split de Pagamentos (Regra: Repasse Manual via Snapshot)
      const configs = await prisma.platformConfig.findMany({
        where: { key: { in: ["split_matriz", "split_captacao", "split_edicao", "split_cartorio"] } },
      });
      const getPct = (key: string) => Number(configs.find((c) => c.key === key)?.value ?? 0) / 100;

      const splitMatriz   = preco * getPct("split_matriz");
      const splitCaptacao = preco * getPct("split_captacao");
      const splitEdicao   = preco * getPct("split_edicao");
      const splitCartorio = preco * getPct("split_cartorio");

      console.log(`[Checkout] Repasse Manual: 100% para Matriz. Snapshot salvo.`);

      // 4. Criar ou Reutilizar Pedido no Banco
      let order;
      const existingOrderId = req.body.orderId;

      if (existingOrderId) {
        order = await prisma.order.findUnique({ where: { id: existingOrderId } });
        if (!order) return res.status(404).json({ error: "Pedido original não encontrado." });
        
        // Atualiza o valor caso tenha mudado (ex: cotação atualizada)
        order = await prisma.order.update({
          where: { id: order.id },
          data: {
            valor: preco,
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
            clienteId: userId || null,
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

    // ── VALIDAÇÃO DE ASSINATURA OBRIGATÓRIA ──
    if (!process.env.MP_WEBHOOK_SECRET) {
      console.error("[CRITICAL] MP_WEBHOOK_SECRET não configurada! Webhook rejeitado por segurança.");
      return res.status(500).json({ error: "Segurança do webhook não configurada." });
    }

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

    // O MP envia o ID da transação em data.id quando o type é 'payment'
    if (type === "payment" && data?.id) {
      try {
        const mpPaymentId = String(data.id);

        // ── IDEMPOTÊNCIA: Verifica se já foi processado (Regra Absoluta 7.3) ──
        const jaProcessado = await prisma.order.findFirst({
          where: { 
            paymentId: mpPaymentId,
            status: { in: ["APROVADO", "APPROVED"] as any }
          }
        });

        if (jaProcessado) {
          console.log(`[Webhook] Pagamento ${mpPaymentId} já processado. Ignorando.`);
          return res.json({ ok: true, skipped: true });
        }

        const paymentData = await MercadoPagoService.getPaymentStatus(mpPaymentId);
        
        if (paymentData.status === "approved") {
          // 1. Atualiza o pedido vinculado
          const updatedOrders = await prisma.order.findMany({ 
            where: { paymentId: String(data.id) },
            include: { event: true, cliente: true }
          });

          for (const order of updatedOrders) {
            await prisma.order.update({
              where: { id: order.id },
              data: { status: "APROVADO" }
            });

            // Se for cota de presente, atualiza o montante do evento
            if (order.isContribution && order.eventId) {
               await prisma.event.update({
                 where: { id: order.eventId },
                 data: { collectedAmount: { increment: order.valor } }
               });
            }

            // 2. Ativa o evento automaticamente (Sincronização Lead -> Sale)
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
                accessLink: `${process.env.FRONTEND_URL || "http://localhost:5173"}/e/${order.eventId}`
              }).catch(e => console.error("Erro ao enviar e-mail via Webhook:", e));
            }
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
    const { eventId, userId, email, cpf, cardToken, installments, paymentMethodId, contributionAmount } = req.body;

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

      // 2. Lógica de Precificação
      const preco = calculateEventPrice(event as any, contributionAmount);

      // 3. Cálculo de Split — Snapshot obrigatório via PlatformConfig
      const configs = await prisma.platformConfig.findMany({
        where: { key: { in: ["split_matriz", "split_captacao", "split_edicao", "split_cartorio"] } },
      });
      const getPct = (key: string) => Number(configs.find((c) => c.key === key)?.value ?? 0) / 100;

      const splitMatriz   = +(preco * getPct("split_matriz")).toFixed(2);
      const splitCaptacao = +(preco * getPct("split_captacao")).toFixed(2);
      const splitEdicao   = +(preco * getPct("split_edicao")).toFixed(2);
      const splitCartorio = +(preco * getPct("split_cartorio")).toFixed(2);

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
          const newUser = await prisma.user.create({
             data: {
               email: cleanEmail,
               senha: tempPassword, // O cliente poderá trocar depois via "Esqueci Senha"
               nome: req.body.buyerName || cleanEmail.split("@")[0],
               role: "CLIENTE"
             }
          });
          finalUserId = newUser.id;
          isNewUser = true;
        }
      }

      if (!finalUserId) {
        return res.status(400).json({ error: "E-mail obrigatório para processar o pagamento." });
      }

      const order = await prisma.order.create({
        data: {
          eventId,
          clienteId: finalUserId,
          buyerEmail: email,
          valor: preco,
          status: "PENDENTE",
          isContribution: event.isCrowdfund,
          contributorName: event.isCrowdfund ? (req.body.contributorName || null) : null,
          // Salva snapshot dos calculos para referencia no repasse manual
          splitMatriz,
          splitCaptacao,
          splitEdicao,
          splitCartorio
        }
      });

      // 4. MOCK BYPASS para Testes Locais
      if (cardToken?.startsWith("mock-token-")) {
        console.log(`[Payment] Bypass MOCK detectado para Pedido ${order.id}.`);
        await prisma.order.update({
          where: { id: order.id },
          data: { status: "APROVADO", paymentId: "mock-pay-" + Date.now() }
        });
        return res.json({ orderId: order.id, status: "approved", hasPaid: true });
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

        NotificationService.sendAccessEmail({
          to: email,
          buyerName: req.body.buyerName || "Cliente",
          eventTitle: event.nomeNoivos,
          orderId: order.id,
          accessLink: `${process.env.FRONTEND_URL || "https://foto-segundo.vercel.app"}/e/${event.id}`,
          tempPassword: isNewUser ? tempPassword : undefined
        }).catch(e => console.error("Erro ao enviar e-mail no checkout:", e));

      }

      return res.json({
        orderId: order.id,
        status: mpResponse.status,
        hasPaid: isApproved,
        details: mpResponse.status_detail,
        // Dados de PIX para Checkout Transparente
        qr_code: mpResponse.point_of_interaction?.transaction_data?.qr_code,
        qr_code_base64: mpResponse.point_of_interaction?.transaction_data?.qr_code_base64,
        ticket_url: mpResponse.point_of_interaction?.transaction_data?.ticket_url
      });

    } catch (error: any) {
      const errorData = error.response?.data;
      console.error("[Process Payment FATAL]:", {
        message: error.message,
        data: errorData,
        stack: error.stack,
        body: req.body
      });
      return res.status(500).json({ 
        error: "Erro ao processar pagamento v2",
        details: errorData || error.message,
        code: error.code // Para erros do Prisma
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
        amount: order.valor,
        status: order.status,
        eventId: order.eventId,
        clienteId: order.clienteId,
        event: (order as any).event,
        isContribution: order.isContribution,
        contributorName: order.contributorName
      });

    } catch (error) {
      console.error("[GetOrderPublic Error]:", error);
      return res.status(500).json({ error: "Erro ao recuperar dados do pedido." });
    }
  }
}

