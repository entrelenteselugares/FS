import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { MercadoPagoService } from "../services/mercadopago.service";
import { NotificationService } from "../services/notification.service";
import { PricingService } from "../services/pricing.service";
import crypto from "crypto";
import { supabaseAdmin } from "../lib/supabase";
import { FRONTEND_URL } from "../lib/config";
import { audit } from "../lib/audit";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { AuthRequest } from "../lib/auth";
import { GamificationService } from "../services/gamification.service";
import { PhygitalService } from "../services/phygital.service";

export class PaymentController {
  /**
   * POST /api/checkout/pending
   * Cria um pedido pendente para ser processado no checkout padrão.
   */
  static async createPendingOrder(req: Request, res: Response) {
    const { eventId, userId, email, selectedServices, includeLivePrint, includeShipping, cart } = req.body;

    try {
      const event = await prisma.event.findUnique({ where: { id: eventId } });
      if (!event) return res.status(404).json({ error: "Evento não encontrado" });

      // 1. Cálculo de Preço (Simplificado para Upgrade)
      const cartItems = cart || [];
      const basePrice = PricingService.calculateEventPrice(event, 0, cartItems.length);
      
      const selectedServicesIds = selectedServices || [];
      let upgradePrice = 0;
      if (selectedServicesIds.length > 0) {
        const catalogItems = await prisma.serviceCatalog.findMany({
          where: { id: { in: selectedServicesIds } }
        });
        upgradePrice = catalogItems.reduce((acc, s) => acc + Number(s.basePrice), 0);
      }

      const phygitalPrice = (includeLivePrint ? 150 : 0) + (includeShipping ? 25 : 0);
      const total = basePrice + upgradePrice + phygitalPrice;

      // 2. Criação do Pedido
      const order = await prisma.order.create({
        data: {
          eventId,
          clienteId: userId || null,
          buyerEmail: email,
          valor: total,
          status: "PENDENTE",
          manualType: event.type === "PHOTO_MARKETPLACE" ? "Aquisição de Fotos" : "Upgrade de Serviços",
          internalNotes: JSON.stringify({
            type: event.type === "PHOTO_MARKETPLACE" ? "MARKETPLACE" : "UPGRADE",
            selectedServicesIds,
            includeLivePrint,
            includeShipping,
            cart: cartItems
          }),
        }
      });

      res.json({ orderId: order.id });
    } catch (err) {
      console.error("createPendingOrder error:", err);
      res.status(500).json({ error: "Erro ao gerar protocolo de upgrade." });
    }
  }

  /**
   * POST /api/checkout
   * Inicia o fluxo de pagamento com precificação dinâmica.
   */
  static async checkout(req: Request, res: Response) {
    const { eventId, userId, email, method, token, installments, issuer_id, contributionAmount, cart, printProductId, orderId: passedOrderId, includeLivePrint, includeShipping, selectedServices } = req.body;

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

      // 2. Lógica de Precificação Dinâmica & Splits (Centralizada)
      const cartItems = cart || [];
      const basePrice = PricingService.calculateEventPrice(event, contributionAmount, cartItems.length);
      
      // 2a. Produto Físico (Upsell Print Catalog)
      let finalPrintProductId = null;
      let finalPrintPrice = 0;
      if (printProductId) {
        const product = await prisma.printProduct.findUnique({ where: { id: printProductId } });
        if (product && product.active) {
          finalPrintProductId = product.id;
          finalPrintPrice = product.sellingPrice !== null ? Number(product.sellingPrice) : Number(product.supplierCost) * (1 + product.marginPct / 100);
        }
      }
      
      // 2c. Upgrades de Serviços (Service Catalog)
      const selectedServicesIds = req.body.selectedServices || [];
      let upgradePrice = 0;
      if (selectedServicesIds.length > 0) {
        const catalogItems = await prisma.serviceCatalog.findMany({
          where: { id: { in: selectedServicesIds } }
        });
        upgradePrice = catalogItems.reduce((acc, s) => acc + Number(s.basePrice), 0);
      }

      // 2d. Adicionais Phygital (Switches)
      const phygitalPrice = (includeLivePrint ? 150 : 0) + (includeShipping ? 25 : 0);

      // 2b. Respeitar valor do pedido se já existir (Ex: Reserva 50%)
      let preco = basePrice + finalPrintPrice + upgradePrice + phygitalPrice;
      let orderToUse = null;

      if (passedOrderId) {
        orderToUse = await prisma.order.findUnique({ where: { id: passedOrderId } });
        if (orderToUse && orderToUse.status === "PENDENTE") {
          preco = Number(orderToUse.valor);
          console.log(`[Checkout] Usando valor pré-definido do pedido ${passedOrderId}: ${preco}`);
        }
      }

      const { 
        matriz: splitMatriz, 
        captacao: splitCaptacao, 
        edicao: splitEdicao, 
        cartorio: splitCartorio,
        franchisee: splitFranchisee,
        passiveFranchiseeId 
      } = await PricingService.calculateSplits(preco, { professionalId: event.captacaoId || undefined });

      console.log(`[Checkout] Repasse Manual Calculado: Snapshot salvo. Valor: ${preco}`);

      // 3. Preparar itens do pedido (Marketplace)
      let orderItemsData: Prisma.OrderItemCreateManyOrderInput[] = [];
      if (cartItems.length > 0) {
        for (const shortId of cartItems) {
          // 1. Tenta achar em EventMedia
          let media = await prisma.eventMedia.findFirst({
            where: { eventId, shortId }
          });

          // 2. Se não achar, tenta PhygitalPrint e "promove" para Media
          if (!media) {
            const print = await prisma.phygitalPrint.findFirst({
              where: { eventId, referenceCode: shortId }
            });

            if (print) {
              media = await prisma.eventMedia.create({
                data: {
                  eventId,
                  shortId: print.referenceCode,
                  url: print.imageUrl,
                  price: event.pricePerPhoto || 15,
                  type: "PHOTO"
                }
              });
            }
          }

          if (media) {
            orderItemsData.push({
              mediaId: media.id,
              price: media.price || event.pricePerPhoto || 15,
              quantity: 1
            });
          }
        }
      }
      if (finalPrintProductId) {
        orderItemsData.push({
          printProductId: finalPrintProductId,
          price: finalPrintPrice,
          quantity: 1
        });
      }

      // 4. Criar ou Reutilizar Pedido no Banco
      let order;
      let existingPending = orderToUse;

      // Resolve email → userId para evitar pedido como "Convidado" quando usuário já existe
      let resolvedClienteId = userId || null;
      if (!resolvedClienteId && email) {
        const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
        if (existingUser) resolvedClienteId = existingUser.id;
      }

      if (!existingPending && email) {
        // Anti-duplicação: verifica pedido PENDENTE já existente para esse evento+email
        existingPending = await prisma.order.findFirst({
          where: {
            eventId,
            status: "PENDENTE",
            OR: [
              { buyerEmail: email.toLowerCase().trim() },
              { clienteId: resolvedClienteId ?? undefined }
            ]
          },
          orderBy: { createdAt: "desc" }
        });
      }

      if (existingPending) {
        console.log(`[Checkout] Reutilizando pedido existente ${existingPending.id} para evitar duplicata.`);
        // SEGURANÇA: Se não foi passado um orderId específico, e o pedido existente já tem um valor, 
        // e NÃO é um caso de marketplace (onde o valor muda conforme o carrinho), mantemos o valor original.
        const isCartUpdate = cartItems.length > 0 || !!finalPrintProductId;
        const finalPreco = (existingPending && !passedOrderId && !isCartUpdate) 
          ? Number(existingPending.valor) 
          : preco;

        // Recalcula os splits com o valor final que será usado
        const { 
          matriz: fMatriz, 
          captacao: fCaptacao, 
          edicao: fEdicao, 
          cartorio: fCartorio,
          franchisee: fFranchisee,
          passiveFranchiseeId: fPassiveId
        } = await PricingService.calculateSplits(finalPreco, { professionalId: event.captacaoId || undefined });

        order = await prisma.order.update({
          where: { id: existingPending.id },
          data: {
            valor: finalPreco,
            clienteId: resolvedClienteId ?? existingPending.clienteId,
            splitMatriz: fMatriz,
            splitCaptacao: fCaptacao,
            splitEdicao: fEdicao,
            splitCartorio: fCartorio,
            splitFranchisee: fFranchisee,
            passiveFranchiseeId: fPassiveId,
            items: orderItemsData.length > 0 ? {
              deleteMany: {},
              create: orderItemsData
            } : undefined
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
            splitCartorio,
            splitFranchisee,
            passiveFranchiseeId,
            items: orderItemsData.length > 0 ? {
              create: orderItemsData
            } : undefined
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

      audit(req, "CHECKOUT_PRO_STARTED", "Order", order.id, null, { eventId, amount: preco });

      return res.json({
        orderId: order.id,
        init_point: mpResponse.init_point, // URL para o Checkout Pro
        sandbox_init_point: mpResponse.sandbox_init_point
      });

    } catch (error: unknown) {
      const errorData = (error as { response?: { data?: unknown } })?.response?.data;
      const errorMessage = (error as { message?: string })?.message || String(error);
      console.error("[Checkout Error Full]:", errorData || errorMessage);
      
      const mpDetails = (errorData as { message?: string })?.message || errorMessage || "Erro desconhecido no MP";

      return res.status(500).json({ 
        error: "Erro no processamento do Mercado Pago",
        details: mpDetails,
        fullError: errorData || null
      });
    }
  }

  /**
   * POST /api/webhooks/mercadopago
   * Recebe notificações automáticas de atualização de status.
   */
  static async webhook(req: Request, res: Response) {
    const { type, data } = req.body;

    // Nota: Validação HMAC já foi feita pelo middleware requireMercadoPagoSignature.
    // Este método só é chamado com assinatura válida (ou em modo dev sem secret).

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
                hasPaid: true,
                paymentId: String(data.id), // Garante sincronização do ID real do MP
                paymentMethod: "MANUAL" // No webhook do Pro, geralmente é cartão/pix mas marcamos como processado
              }
            });

            // Usar o novo método unificado de finalização
            await PaymentController.finalizeApprovedOrder(order, order.event, req);
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
    const { eventId, userId, email, cpf, cardToken, installments, paymentMethodId, contributionAmount, accessType, cart, printProductId, orderId: passedOrderId, includeLivePrint, includeShipping, selectedServices } = req.body;

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

      // 2. Lógica de Precificação & Splits (Centralizada)
      const cartItems = cart || [];
      let basePrice = PricingService.calculateEventPrice(event, contributionAmount, cartItems.length);
      
      // 2a. Produto Físico (Upsell Print Catalog)
      let finalPrintProductId = null;
      let finalPrintPrice = 0;
      if (printProductId) {
        const product = await prisma.printProduct.findUnique({ where: { id: printProductId } });
        if (product && product.active) {
          finalPrintProductId = product.id;
          finalPrintPrice = product.sellingPrice !== null ? Number(product.sellingPrice) : Number(product.supplierCost) * (1 + product.marginPct / 100);
        }
      }

      // 2c. Upgrades de Serviços (Service Catalog)
      const selectedServicesIds = selectedServices || [];
      let upgradePrice = 0;
      if (selectedServicesIds.length > 0) {
        const catalogItems = await prisma.serviceCatalog.findMany({
          where: { id: { in: selectedServicesIds } }
        });
        upgradePrice = catalogItems.reduce((acc, s) => acc + Number(s.basePrice), 0);
      }

      // 2d. Adicionais Phygital (Switches)
      let finalIncludeLivePrint = includeLivePrint;
      let finalIncludeShipping = includeShipping;
      let finalSelectedServices = selectedServicesIds;
      let orderToUse = null;

      if (passedOrderId) {
        orderToUse = await prisma.order.findUnique({ where: { id: passedOrderId } });
        if (orderToUse && orderToUse.status === "PENDENTE") {
          // Se for upgrade, recupera as configs das notas
          if (orderToUse.internalNotes?.startsWith('{"type":"UPGRADE"')) {
            try {
              const upgradeData = JSON.parse(orderToUse.internalNotes);
              finalIncludeLivePrint = upgradeData.includeLivePrint;
              finalIncludeShipping = upgradeData.includeShipping;
              finalSelectedServices = upgradeData.selectedServicesIds;
            } catch (e) { console.error("Erro ao parsear upgrade notes:", e); }
          }
        }
      }

      const phygitalPrice = (finalIncludeLivePrint ? 150 : 0) + (finalIncludeShipping ? 25 : 0);

      // 2b. Respeitar valor do pedido se já existir (Ex: Reserva 50% ou Quitação)
      let preco = orderToUse ? Number(orderToUse.valor) : (basePrice + finalPrintPrice + upgradePrice + phygitalPrice);
      
      if (preco <= 0) {
        return res.status(400).json({ error: "O valor do pagamento deve ser superior a zero. Verifique os itens selecionados." });
      }

      const { 
        matriz: splitMatriz, 
        captacao: splitCaptacao, 
        edicao: splitEdicao, 
        cartorio: splitCartorio,
        franchisee: splitFranchisee,
        passiveFranchiseeId
      } = await PricingService.calculateSplits(preco, { professionalId: event.captacaoId || undefined });

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

          const hash = await bcrypt.hash(tempPassword, 12);
          try {
            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
              email: cleanEmail,
              password: tempPassword,
              email_confirm: true,
              user_metadata: { nome: buyerName, role: "CLIENTE" }
            });

            if (authError) {
              if (authError.message.includes("already registered")) {
                // Supabase já tem o usuário — busca por e-mail filtrado (O(1))
                const { data: { users: supabaseUsers } } = await supabaseAdmin.auth.admin.listUsers();
                const sUser = (supabaseUsers as { id: string, email?: string }[]).find(u => u.email === cleanEmail);
                if (sUser) {
                  const syncedUser = await prisma.user.upsert({
                    where: { email: cleanEmail },
                    create: { id: sUser.id, email: cleanEmail, senha: hash, nome: buyerName, role: "CLIENTE" },
                    update: { id: sUser.id, senha: hash }
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
                create: { id: authData.user.id, email: cleanEmail, senha: hash, nome: buyerName, role: "CLIENTE" },
                update: { senha: hash }
              });
              finalUserId = newUser.id;
              isNewUser = true;
            }
          } catch (err: unknown) {
            console.error("[Checkout Auto-Register Error]:", err instanceof Error ? err.message : String(err));
            // Fallback local se o Supabase falhar
            const newUser = await prisma.user.upsert({
              where: { email: cleanEmail },
              create: { email: cleanEmail, senha: hash, nome: buyerName, role: "CLIENTE" },
              update: { senha: hash }
            });
            finalUserId = newUser.id;
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

      // Anti-duplicação: query unificada com OR
      const cleanEmailForQuery = email ? email.toLowerCase().trim() : null;
      let existingPendingOrder = orderToUse; // Prioriza o pedido passado

      if (!existingPendingOrder && (cleanEmailForQuery || finalUserId)) {
        existingPendingOrder = await prisma.order.findFirst({
          where: {
            eventId,
            status: "PENDENTE",
            OR: [
              ...(cleanEmailForQuery ? [{ buyerEmail: cleanEmailForQuery }] : []),
              ...(finalUserId ? [{ clienteId: finalUserId }] : []),
            ],
          },
          orderBy: { createdAt: "desc" },
        });
      }

      // 4a. Busca as mídias reais para obter os IDs (Marketplace)
      let orderItemsData: Prisma.OrderItemCreateManyOrderInput[] = [];
      if (cartItems.length > 0) {
        for (const shortId of cartItems) {
          let media = await prisma.eventMedia.findFirst({
            where: { eventId, shortId }
          });

          if (!media) {
            const print = await prisma.phygitalPrint.findFirst({
              where: { eventId, referenceCode: shortId }
            });

            if (print) {
              media = await prisma.eventMedia.create({
                data: {
                  eventId,
                  shortId: print.referenceCode,
                  url: print.imageUrl,
                  price: event.pricePerPhoto || 15,
                  type: "PHOTO"
                }
              });
            }
          }

          if (media) {
            orderItemsData.push({
              mediaId: media.id,
              price: media.price || event.pricePerPhoto || 15,
              quantity: 1
            });
          }
        }
      }

      // Adiciona o produto impresso aos items se selecionado
      if (finalPrintProductId) {
        orderItemsData.push({
          printProductId: finalPrintProductId,
          price: finalPrintPrice,
          quantity: 1
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
            buyerWhatsapp: req.body.buyerWhatsapp || existingPendingOrder.buyerWhatsapp,
            valor: preco,
            accessType: accessType || existingPendingOrder.accessType || "PRIVATE",
            accessChosenAt: existingPendingOrder.accessChosenAt ?? new Date(),
            accessExpiresAt: existingPendingOrder.accessExpiresAt ?? expiresAt,
            splitMatriz,
            splitCaptacao,
            splitEdicao,
            splitCartorio,
            splitFranchisee,
            passiveFranchiseeId,
            tempPassword: isNewUser ? tempPassword : null,
            // Order Engine Fields
            deliveryType: req.body.deliveryType || existingPendingOrder.deliveryType || "DIGITAL_ONLY",
            paymentModel: event.paymentModel,
            shippingFee: req.body.shippingFee ? new Prisma.Decimal(req.body.shippingFee) : existingPendingOrder.shippingFee,
            shippingAddress: req.body.shippingAddress || existingPendingOrder.shippingAddress,
            isGuestOrder: !finalUserId,
            guestEmail: !finalUserId ? email : null,
            guestPhone: !finalUserId ? (req.body.buyerWhatsapp || null) : null,
            guestToken: !finalUserId ? (existingPendingOrder.guestToken || crypto.randomBytes(32).toString("hex")) : null,
            // Limpa itens antigos e recria se necessário
            items: orderItemsData.length > 0 ? {
              deleteMany: {},
              create: orderItemsData
            } : undefined
          }
        });
      } else {
        const isGuest = !finalUserId;
        order = await prisma.order.create({
          data: {
            eventId,
            clienteId: finalUserId,
            buyerEmail: email,
            buyerWhatsapp: req.body.buyerWhatsapp || null,
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
            splitFranchisee,
            passiveFranchiseeId,
            tempPassword: isNewUser ? tempPassword : null,
            // Order Engine Fields
            deliveryType: req.body.deliveryType || "DIGITAL_ONLY",
            paymentModel: event.paymentModel,
            shippingFee: req.body.shippingFee ? new Prisma.Decimal(req.body.shippingFee) : null,
            shippingAddress: req.body.shippingAddress || null,
            isGuestOrder: isGuest,
            guestEmail: isGuest ? email : null,
            guestPhone: isGuest ? (req.body.buyerWhatsapp || null) : null,
            guestToken: isGuest ? crypto.randomBytes(32).toString("hex") : null,
            items: orderItemsData.length > 0 ? {
              create: orderItemsData
            } : undefined
          }
        });
      }

      // 5. Pagamento em DINHEIRO (Cash) - Pulo do Gato
      if (req.body.method === "CASH") {
        // TODO: Validar se o executor tem permissão de Profissional/Franqueado
        const updatedOrder = await prisma.order.update({
          where: { id: order.id },
          data: {
            status: "APROVADO",
            hasPaid: true,
            paymentMethod: "CASH",
            paymentId: `CASH-${order.id}-${Date.now()}`
          }
        });

        // Ativa o evento/acesso imediatamente
        await this.finalizeApprovedOrder(updatedOrder, event, req);

        return res.json({
          success: true,
          orderId: order.id,
          status: "approved",
          hasPaid: true,
          method: "CASH",
          guestToken: order.guestToken
        });
      }

      // 6. Chamada Real ao Mercado Pago (Fluxo Normal)
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
          hasPaid: isApproved,
          paymentId: String(mpResponse.id),
          paymentMethod: isApproved ? (paymentMethodId?.includes("pix") ? "PIX" : "CREDIT_CARD") : null
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
        await PaymentController.finalizeApprovedOrder(order, event, req);
      } else if (mpResponse.status === "rejected") {
        // 7c. Alerta de pagamento rejeitado
        NotificationService.notifyPaymentIssue({
          orderId: order.id,
          status: mpResponse.status_detail || "rejected",
          eventTitle: event.nomeNoivos
        });
      }

      audit(req, "TRANSPARENT_PAYMENT_INITIATED", "Order", order.id, null, { status: mpResponse.status, paymentId: String(mpResponse.id) });

      return res.json({ 
        success: true, 
        orderId: order.id, 
        status: mpResponse.status,
        hasPaid: isApproved,
        details: mpResponse?.status_detail,
        // Dados de PIX para Checkout Transparente
        qr_code: mpResponse?.point_of_interaction?.transaction_data?.qr_code,
        qr_code_base64: mpResponse?.point_of_interaction?.transaction_data?.qr_code_base64,
        ticket_url: mpResponse?.point_of_interaction?.transaction_data?.ticket_url
      });

    } catch (error: unknown) {
      const errorData = (error as { response?: { data?: unknown } })?.response?.data;
      const errorMessage = (error as { message?: string })?.message || String(error);
      console.error("[Process Payment Error]:", errorData || errorMessage);
      return res.status(500).json({ 
        error: "Erro ao processar pagamento v2",
        details: errorData || errorMessage
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
          items: {
            include: {
              media: { select: { shortId: true, url: true } },
              printProduct: { select: { name: true, sku: true } }
            }
          },
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

      // 5. Auditoria de Checkout
      audit(req, "CHECKOUT_STARTED", "Order", order.id, null, { eventId: order.eventId, valor: order.valor });

      return res.json({
        id: order.id,
        amount: Number(order.valor),
        status: order.status,
        eventId: order.eventId,
        clienteId: order.clienteId,
        buyerEmail: order.buyerEmail || order.cliente?.email,
        event: order.event,
        contributorName: order.contributorName,
        manualType: order.manualType,
        isGuestOrder: order.isGuestOrder,
        deliveryType: order.deliveryType,
        paymentModel: order.paymentModel,
        shippingAddress: order.shippingAddress,
        items: order.items
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
          cliente: { select: { email: true, nome: true } }
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
          data: { status: "APROVADO", hasPaid: true }
        });

        // 1. Se for cota de presente, atualiza o montante do evento (Bug Fix: Polling Sync)
        if (order.isContribution && order.eventId) {
          await prisma.event.update({
            where: { id: order.eventId },
            data: { collectedAmount: { increment: order.valor } }
          });
        }

        // Busca o evento para verificar o tipo antes de ativar
        const evData = await prisma.event.findUnique({ where: { id: order.eventId }, select: { type: true, isPrivate: true } });
        const isMarketplace = evData?.type === 'PHOTO_MARKETPLACE';
        
        await prisma.event.update({
          where: { id: order.eventId },
          data: { 
            active: true, 
            isQuote: false,
            // Marketplace continua público para outros comprarem; outros eventos respeitam privacidade original ou liberam
            isPrivate: evData?.isPrivate ?? true
          }
        });

        NotificationService.notifyNewSale({
          buyerEmail: order.buyerEmail || order.cliente?.email || "desconhecido",
          eventTitle: order.event.nomeNoivos,
          orderId: order.id,
          amount: Number(order.valor)
        });

        // 2. E-mail de acesso ao comprador (Adicionado para Polling)
        const recipientEmail = order.buyerEmail || order.cliente?.email;
        if (recipientEmail) {
          NotificationService.sendAccessEmail({
            to: recipientEmail,
            buyerName: order.cliente?.nome || "Cliente",
            eventTitle: order.event.nomeNoivos,
            orderId: order.id,
            accessLink: `${FRONTEND_URL}/e/${order.eventId}`,
            tempPassword: order.tempPassword || undefined
          }).catch(e => console.error("Erro ao enviar e-mail via Polling:", e));
        }

        // 3. Auditoria
        audit(req, "PAYMENT_APPROVED_POLLING", "Order", order.id, null, { paymentId: order.paymentId });

        return res.json({ status: "APROVADO", eventId: order.eventId });
      }

      return res.json({ status: order.status });
    } catch (error) {
      console.error("[CheckPaymentStatus Error]:", error);
      return res.status(500).json({ error: "Erro ao verificar pagamento." });
    }
  }

  /**
   * POST /api/public/orders/:id/manual-payment
   * Baixa manual (DINHEIRO) feita por um operador autorizado (Admin/Profissional).
   */
  static async manualPayment(req: Request, res: Response) {
    const { id } = req.params;
    const { method } = req.body;
    const authReq = req as AuthRequest;

    try {
      // 1. Verificação de Poder (Apenas Admin, Profissional ou Franqueado Ativo)
      const user = await prisma.user.findUnique({
        where: { id: authReq.user?.userId },
        include: { franchiseProfile: true }
      });

      if (!user || (user.role !== "ADMIN" && user.role !== "PROFISSIONAL" && !user.franchiseProfile)) {
        return res.status(403).json({ error: "Acesso negado. Apenas operadores podem confirmar recebimento em dinheiro." });
      }

      const order = await prisma.order.findUnique({
        where: { id: String(id) },
        include: { event: true }
      });

      if (!order) return res.status(404).json({ error: "Pedido não localizado." });
      if (order.status === "APROVADO") return res.json({ success: true, alreadyPaid: true });

      // 2. Atualização Atômica para APROVADO
      const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "APROVADO",
          hasPaid: true,
          paymentMethod: method || "CASH",
          paymentId: `MANUAL-${user.id}-${Date.now()}`
        }
      });

      // 3. Finalização (Liberação de mídias, impressão, etc.)
      await PaymentController.finalizeApprovedOrder(updatedOrder, order.event, req);

      audit(req, "MANUAL_PAYMENT_CONFIRMED", "Order", order.id, null, { operatorId: user.id, method: method || "CASH" });

      return res.json({
        success: true,
        orderId: order.id,
        status: "approved"
      });

    } catch (error) {
      console.error("[ManualPayment Error]:", error);
      return res.status(500).json({ error: "Erro ao processar baixa manual." });
    }
  }

  /**
   * POST /api/orders/print
   * Cria um pedido para produto do catálogo de impressão.
   */
  static async createPrintOrder(req: Request, res: Response) {
    const { eventId, productId, quantity, notes, albumPhotos, deliveryMethod } = req.body;

    try {
      const product = await prisma.printProduct.findUnique({ where: { id: productId } });
      if (!product || !product.active) {
        return res.status(404).json({ error: "Produto não disponível" });
      }

      const event = await prisma.event.findUnique({ where: { id: eventId } });
      if (!event) {
        return res.status(404).json({ error: "Evento não encontrado" });
      }

      // 1. Calcula o preço final do produto
      const unitPrice = product.sellingPrice !== null 
        ? Number(product.sellingPrice) 
        : Number(product.supplierCost) * (1 + product.marginPct / 100);
      
      const subtotal = unitPrice * (quantity || 1);

      // 2. Lógica de Frete Tático (Fixo: R$ 25 se SHIPPING)
      const shippingFee = deliveryMethod === "SHIPPING" ? 25 : 0;
      const totalPrice = subtotal + shippingFee;

      // 3. Calcula Splits Reais baseados no custo e margem
      const { matriz, captacao, edicao, cartorio, franchisee, passiveFranchiseeId } = await PricingService.calculateSplits(totalPrice, {
        professionalId: event.captacaoId || undefined,
        productType: "ALBUM_IMPRESSO" // Trata como produto físico para splits
      });

      // 4. Prepara notas internas com fotos do álbum se houver
      let finalInternalNotes = notes || "";
      if (albumPhotos && Array.isArray(albumPhotos) && albumPhotos.length > 0) {
        finalInternalNotes += `\n\n--- FOTOS SELECIONADAS DO ÁLBUM ---\n${albumPhotos.join("\n")}`;
      }

      // 5. Cria o pedido unificado
      const order = await prisma.order.create({
        data: {
          eventId: event.id,
          valor: totalPrice,
          status: "PENDENTE",
          deliveryType: deliveryMethod || "LOCAL_PICKUP",
          shippingFee,
          manualType: `Físico: ${product.name} (x${quantity})`,
          internalNotes: finalInternalNotes.trim() || null,
          splitMatriz: matriz,
          splitCaptacao: captacao,
          splitEdicao: edicao,
          splitCartorio: cartorio,
          splitFranchisee: franchisee,
          passiveFranchiseeId,
          items: {
            create: [
              {
                printProductId: product.id,
                price: unitPrice,
                quantity: quantity || 1
              }
            ]
          }
        }
      });

      return res.json({ orderId: order.id });
    } catch (error) {
      console.error("[CreatePrintOrder Error]:", error);
      return res.status(500).json({ error: "Erro ao criar pedido de impressão." });
    }
  }

  /**
   * Método Unificado para Finalizar Pedidos Aprovados
   * (Usado por: Webhook, Transparent Checkout e Cash Payment)
   */
  static async finalizeApprovedOrder(order: any, event: any, req: Request) {
    const MAX_LOW_RISK_PAYOUT = 5000;
    const ESCROW_DAYS = 7;

    try {
      await prisma.$transaction(async (tx) => {
        const eventUpdateData: any = {
          active: true,
          isQuote: false,
          isPrivate: event.isPrivate ?? true
        };

        // 1. Atualizar Montante Arrecadado (Crowdfunding)
        if (order.isContribution && order.eventId) {
          eventUpdateData.collectedAmount = { increment: order.valor };
        }

        // 2. Lógica de Upgrades (Service Catalog) e Print Catalog
        const orderItems = await tx.orderItem.findMany({
          where: { orderId: order.id },
          include: { 
            service: true,
            printProduct: true
          }
        });

        const serviceItems = orderItems.filter(item => item.serviceId);
        if (serviceItems.length > 0) {
          if (serviceItems.some(i => i.service?.name.toLowerCase().includes("video"))) eventUpdateData.temVideo = true;
          if (serviceItems.some(i => i.service?.name.toLowerCase().includes("reels"))) eventUpdateData.temReels = true;
          if (serviceItems.some(i => i.service?.name.toLowerCase().includes("impressa"))) eventUpdateData.temFotoImpressa = true;
        }

        // 3. Lógica de Impressão Automática (Print Catalog Integration) e Routing
        const printItems = orderItems.filter(item => item.printProductId);
        if (printItems.length > 0) {
          eventUpdateData.temFotoImpressa = true;
          for (const item of printItems) {
            // Extraímos URLs das fotos se houver (ex: álbuns ou fotos avulsas selecionadas)
            let photos: string[] = [];
            if (order.internalNotes && order.internalNotes.includes("--- FOTOS SELECIONADAS DO ÁLBUM ---")) {
               const parts = order.internalNotes.split("--- FOTOS SELECIONADAS DO ÁLBUM ---");
               if (parts.length > 1) {
                 photos = parts[1].trim().split("\n").filter((url: string) => url.startsWith("http"));
               }
            }
            
            if (photos.length > 0) {
              const fulfillment = item.printProduct?.fulfillmentType || "LAB";
              if (fulfillment === "INSTANT_PRINT") {
                // Roteia para Fila Local (Raspberry Pi/IoT/ZPL)
                console.log(`[Fulfillment] Roteando pedido ${order.id} para INSTANT_PRINT (Fila Local IoT)`);
                await PhygitalService.createQueueEntryFromOrder(order, photos);
              } else {
                // Roteia para Laboratório Parceiro via API (Motor Logístico Externo)
                console.log(`[Fulfillment] Roteando pedido ${order.id} para LAB Parceiro Externo`);
                // TODO: Chamar IntegrationService.dispatchToLabPartner() quando API estiver pronta
                await tx.order.update({
                  where: { id: order.id },
                  data: {
                    internalNotes: order.internalNotes 
                      ? `${order.internalNotes}\n\n[LOGÍSTICA] Despachado para Lab Parceiro.`
                      : `[LOGÍSTICA] Despachado para Lab Parceiro.`
                  }
                });
              }
            }
          }
        }

        // 4. Lógica Phygital e Logística
        let logisticNote = "";
        if (order.deliveryType === "SHIPPING" || order.deliveryType === "LOCAL_PICKUP") {
          eventUpdateData.temFotoImpressa = true;
          if (order.shippingAddress) {
            try {
              const addr = typeof order.shippingAddress === 'string' ? JSON.parse(order.shippingAddress) : order.shippingAddress;
              logisticNote = `[LOGÍSTICA] Entrega via ${order.deliveryType}. Endereço: ${addr.rua}, ${addr.numero} - ${addr.cidade}/${addr.uf}`;
            } catch (e) {
              console.warn("Falha ao parsear endereço logístico:", e);
            }
          }
        }

        // 4. Executar Update Único do Evento
        await tx.event.update({
          where: { id: order.eventId },
          data: eventUpdateData
        });

        // 5. Lógica de Payout & Escrow
        const captacaoUser = event.captacaoId ? await tx.user.findUnique({ where: { id: event.captacaoId } }) : null;
        const isLowRisk = !!(captacaoUser?.isVerified && Number(order.valor) < MAX_LOW_RISK_PAYOUT);
        
        const payoutReadyAt = new Date(event.dataEvento);
        payoutReadyAt.setDate(payoutReadyAt.getDate() + ESCROW_DAYS);

        await tx.order.update({
          where: { id: order.id },
          data: {
            payoutStatus: isLowRisk ? "AVAILABLE" : "PENDING",
            payoutReadyAt: isLowRisk ? new Date() : payoutReadyAt,
            ...(logisticNote ? { internalNotes: logisticNote } : {})
          }
        });
      });

      // 5a. Processar Gamificação (Cashback)
      GamificationService.processOrderRewards(order.id).catch(e => console.error("Erro ao processar cashback:", e));

      // 6. Notificações (E-mail e WhatsApp) - Fora da transação para evitar rollback se falhar
      const recipientEmail = order.buyerEmail || order.cliente?.email;
      if (recipientEmail) {
        NotificationService.sendAccessEmail({
          to: recipientEmail,
          buyerName: order.cliente?.nome || "Cliente",
          eventTitle: event.nomeNoivos,
          orderId: order.id,
          accessLink: `${FRONTEND_URL}/e/${event.id}`,
          tempPassword: order.tempPassword || undefined,
          guestToken: order.isGuestOrder ? order.guestToken : undefined
        }).catch(e => console.error("Erro ao enviar e-mail de acesso:", e));
      }

      NotificationService.notifyNewSale({
        buyerEmail: recipientEmail || "desconhecido",
        eventTitle: event.nomeNoivos,
        orderId: order.id,
        amount: Number(order.valor)
      });

      // 7. Auditoria Final
      audit(req, "ORDER_FINALIZED_TX", "Order", order.id, null, { eventId: order.eventId });

    } catch (err) {
      console.error("[finalizeApprovedOrder Error]:", err);
      throw err; // Re-throw para garantir que o webhook receba erro se a TX falhar
    }
  }
}
