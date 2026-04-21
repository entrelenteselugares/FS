import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { MercadoPagoService } from "../services/mercadopago.service";
import { NotificationService } from "../services/notification.service";
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

      // 2. Lógica de Precificação Dinâmica (Baseada no Evento)
      const now = new Date();
      const eventDate = new Date(event.dataEvento);
      eventDate.setHours(0, 0, 0, 0);
      
      // Se a data atual for anterior à data do evento, usa preço antecipado
      let preco = now.getTime() < eventDate.getTime() 
        ? Number(event.priceEarly ?? 190) 
        : Number(event.priceBase ?? 200);

      // Se for Compra Coletiva, o valor é o enviado pelo usuário (cota)
      if (event.isCrowdfund && contributionAmount) {
        preco = Number(contributionAmount);
      }

      // 3. Preparar Split de Pagamentos (Regra: Repasse Manual)
      // Todo o valor vai para a Matriz para posterior repasse manual aos profissionais.
      // BUSCA CONFIGS NO MOMENTO DA COMPRA (SNAPSHOT)
      const configs = await prisma.platformConfig.findMany({
        where: { key: { in: ["split_matriz", "split_captacao", "split_edicao", "split_cartorio"] } },
      });
      const getPct = (key: string) => Number(configs.find((c) => c.key === key)?.value ?? 0) / 100;

      const splitMatriz   = preco * getPct("split_matriz");
      const splitCaptacao = preco * getPct("split_captacao");
      const splitEdicao   = preco * getPct("split_edicao");
      const splitCartorio = preco * getPct("split_cartorio");

      console.log(`[Checkout] Repasse Manual: 100% para Matriz. Snapshot salvo.`);

      // 4. Criar Pedido Pendente no Banco
      const order = await prisma.order.create({
        data: {
          eventId,
          clienteId: userId,
          valor: preco,
          status: "PENDENTE",
          isContribution: event.isCrowdfund,
          contributorName: event.isCrowdfund ? (req.body.contributorName || null) : null,
          // Snapshot dos splits
          splitMatriz,
          splitCaptacao,
          splitEdicao,
          splitCartorio
        }
      });

      // 5. Criar Preferência no Mercado Pago (Checkout Pro)
      const mpResponse = await MercadoPagoService.createPreference({
        transaction_amount: preco,
        description: `Fotos Evento: ${event.nomeNoivos}`,
        payer_email: email,
        notification_url: `${process.env.BACKEND_URL || "http://localhost:3001"}/api/webhooks/mercadopago`,
        orderId: order.id,
        partners: [],
        matrizRate: 1.0,
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
      console.error("[Checkout Error Full]:", error.response?.data || error);
      // Retorna o objeto de erro real do Mercado Pago para debug visual no frontend
      return res.status(500).json({ 
        error: "Erro no processamento do Mercado Pago",
        details: error.response?.data || error.message
      });
    }
  }

  /**
   * POST /api/webhooks/mercadopago
   * Recebe notificações automáticas de atualização de status.
   */
  static async webhook(req: Request, res: Response) {
    const { type, data } = req.body;

    // ── VALIDAÇÃO DE ASSINATURA (Opcional se configurado) ──
    if (process.env.MP_WEBHOOK_SECRET) {
      const sig    = (req.headers["x-signature"] as string) ?? "";
      const reqId  = (req.headers["x-request-id"] as string) ?? "";
      const dataId = (req.query["data.id"] as string) ?? "";
      const [tsPart, v1Part] = sig.split(",");
      const ts = tsPart?.split("=")[1];
      const v1 = v1Part?.split("=")[1];
      
      if (!ts || !v1) {
        console.warn("[Webhook] Headers de assinatura ausentes ou malformados.");
        // Se o secret está configurado mas a assinatura veio vazia (ex: simulador),
        // respondemos 200 para não pendurar o sistema, mas não processamos.
        return res.status(200).json({ ok: true, message: "Ignorado (Headers ausentes)" });
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

        // ── IDEMPOTÊNCIA: Verifica se já foi processado APPROVED ──
        const statusCheck = await prisma.order.findFirst({
          where: { 
            paymentId: mpPaymentId,
            status: { in: ["APROVADO", "APPROVED"] as any }
          }
        });

        if (statusCheck) {
          console.log(`[Webhook] Pagamento ${mpPaymentId} já processado como APROVADO. Ignorando.`);
          return res.status(200).json({ ok: true, skipped: true });
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
      const now = new Date();
      const eventDate = new Date(event.dataEvento);
      let preco = now.getTime() < eventDate.getTime() 
        ? Number(event.priceEarly ?? 190) 
        : Number(event.priceBase ?? 200);

      // Gift Quota logic
      if (event.isCrowdfund && contributionAmount) {
        preco = Number(contributionAmount);
      }

      // 3. Cálculo de Split — Referência para Repasse Manual (Modelo Uber)
      // 100% do valor vai para a conta master. Os splits são salvos apenas para
      // mostrar quanto transferir via PIX para cada parceiro após os 7 dias.
      const pctCapt = event.captacao?.profissional?.captPct ?? 30;
      const pctEdit = event.edicao?.profissional?.editPct ?? 20;
      const pctCart = event.cartorioUser?.cartorio?.splitPct ?? 10;
      const matrizPct = 1 - (pctCapt + pctEdit + pctCart) / 100;
      const applicationFeeCalculated = preco * matrizPct;

      // 4. Criar Pedido (Identidade Obrigatória)
      if (!userId) {
        return res.status(401).json({ error: "Identificação obrigatória para realizar o pagamento." });
      }

      const order = await prisma.order.create({
        data: {
          eventId,
          clienteId: userId,
          valor: preco,
          status: "PENDENTE",
          isContribution: event.isCrowdfund,
          contributorName: event.isCrowdfund ? (req.body.contributorName || null) : null,
          // Salva snapshot dos calculos para referencia no repasse manual
          splitMatriz: applicationFeeCalculated,
          splitCaptacao: preco * (pctCapt / 100),
          splitEdicao: preco * (pctEdit / 100),
          splitCartorio: preco * (pctCart / 100)
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
          accessLink: `${process.env.FRONTEND_URL || "http://localhost:5173"}/e/${event.id}`
        }).catch(e => console.error("Erro ao enviar e-mail no checkout:", e));

      }

      return res.json({
        orderId: order.id,
        status: mpResponse.status,
        hasPaid: isApproved,
        details: mpResponse.status_detail
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
        where: { id },
        include: {
          event: {
            select: {
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
        event: order.event,
        isContribution: order.isContribution,
        contributorName: order.contributorName
      });

    } catch (error) {
      console.error("[GetOrderPublic Error]:", error);
      return res.status(500).json({ error: "Erro ao recuperar dados do pedido." });
    }
  }
}

