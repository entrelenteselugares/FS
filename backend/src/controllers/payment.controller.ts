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
import { IntegrationService } from "../services/integration.service";
import { RoutingService } from "../services/routing.service";
import { SubscriptionService } from "../services/subscription.service";
import { ShippingService, ShippingItem } from "../services/shipping.service";
import { LogisticsService } from "../services/logistics.service";
import { ReferralService } from "../services/referral.service";
import { AffiliateService } from "../services/affiliate.service";

export class PaymentController {
  /**
   * POST /api/checkout/pending
   * Cria um pedido pendente para ser processado no checkout padrão.
   */
  static async createPendingOrder(req: Request, res: Response) {
    const { eventId, userId, email, selectedServices, includeLivePrint, includeShipping, cart, physicalItems } = req.body;

    try {
      const event = await prisma.event.findUnique({ where: { id: eventId } });
      if (!event) return res.status(404).json({ error: "Evento não encontrado" });

      // 1. Cálculo de Preço Híbrido
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

      let physicalPrice = 0;
      let totalSupplierCost = 0;
      const items = physicalItems || [];
      for (const item of items) {
        const product = await prisma.printProduct.findUnique({ where: { id: item.id } });
        if (product && product.active) {
          const qty = Number(item.quantity) || 1;
          const pPrice = product.sellingPrice !== null ? Number(product.sellingPrice) : Number(product.supplierCost) * (1 + product.marginPct / 100);
          physicalPrice += pPrice * qty;
          totalSupplierCost += Number(product.supplierCost) * qty;
        }
      }

      const phygitalPrice = (includeLivePrint ? 150 : 0);
      const total = basePrice + upgradePrice + physicalPrice + phygitalPrice;

      // 2. Criação do Pedido
      const order = await prisma.order.create({
        data: {
          eventId,
          clienteId: userId || null,
          buyerEmail: email,
          valor: total,
          status: "PENDENTE",
          manualType: items.length > 0 ? "Pedido Híbrido (Digital + Físico)" : (event.type === "PHOTO_MARKETPLACE" ? "Aquisição de Fotos" : "Upgrade de Serviços"),
          internalNotes: JSON.stringify({
            type: items.length > 0 ? "HYBRID" : (event.type === "PHOTO_MARKETPLACE" ? "MARKETPLACE" : "UPGRADE"),
            selectedServicesIds,
            includeLivePrint,
            includeShipping,
            cart: cartItems,
            physicalItems: items,
            supplierCost: totalSupplierCost
          }),
        }
      });

      res.json({ orderId: order.id });
    } catch (err) {
      console.error("createPendingOrder error:", err);
      res.status(500).json({ error: "Erro ao gerar protocolo de checkout." });
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
      let totalSupplierCost = 0;
      
      // 2a. Produto Físico (Upsell Print Catalog)
      // 2a. Produtos Físicos (Hybrid Cart Support)
      let finalPrintPrice = 0;
      let physicalItems = req.body.physicalItems || []; // [{ id, quantity }]
      if (printProductId && !physicalItems.find((i: any) => i.id === printProductId)) {
        physicalItems.push({ id: printProductId, quantity: 1 });
      }

      for (const item of physicalItems) {
        const product = await prisma.printProduct.findUnique({ where: { id: item.id } });
        if (product && product.active) {
          const qty = Number(item.quantity) || 1;
          const pPrice = product.sellingPrice !== null ? Number(product.sellingPrice) : Number(product.supplierCost) * (1 + product.marginPct / 100);
          finalPrintPrice += pPrice * qty;
          totalSupplierCost += Number(product.supplierCost) * qty;
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

      // Resolve email → userId para evitar pedido como "Convidado" quando usuário já existe e permitir cálculo de afiliado
      let resolvedClienteId = userId || null;
      if (!resolvedClienteId && email) {
        const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
        if (existingUser) resolvedClienteId = existingUser.id;
      }

      const { 
        matriz: splitMatriz, 
        captacao: splitCaptacao, 
        edicao: splitEdicao, 
        cartorio: splitCartorio,
        franchisee: splitFranchisee,
        passiveFranchiseeId,
        ambassadorId,
        affiliateL1Id,
        affiliateL2Id,
        affiliateL1Amount: splitAffiliateL1,
        affiliateL2Amount: splitAffiliateL2,
        owner: splitOwner
      } = await PricingService.calculateSplits(preco, { 
        professionalId: event.captacaoId || undefined,
        supplierCost: totalSupplierCost,
        shippingFee: Number(req.body.shippingFee || 0),
        ambassadorId: req.cookies?.fs_referral,
        buyerUserId: resolvedClienteId || undefined,
        eventId: eventId
      });

      console.log(`[Checkout] Repasse Manual Calculado: Snapshot salvo. Valor: ${preco}`);

      // 3. Preparar itens do pedido (Marketplace)
      let orderItemsData: Prisma.OrderItemCreateManyOrderInput[] = [];
      let activeCartItems = [...cartItems];

      if (activeCartItems.length > 0 && resolvedClienteId) {
        const hasFullAlbum = await prisma.order.findFirst({
          where: {
            clienteId: resolvedClienteId,
            eventId,
            status: { in: ["PAGO", "APROVADO", "PROCESSANDO", "CONCLUIDO"] },
            manualType: { in: ["ALBUM_FULL", "VAULT_CYCLE", "VAULT_ONDEMAND"] }
          }
        });
        if (hasFullAlbum) {
          console.warn(`[Checkout] Usuário já possui acesso completo ao evento ${eventId}. Esvaziando carrinho digital.`);
          activeCartItems = [];
        }
      }

      if (activeCartItems.length > 0) {
        for (const shortId of activeCartItems) {
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
            if (resolvedClienteId) {
              const alreadyBought = await prisma.orderItem.findFirst({
                where: {
                  mediaId: media.id,
                  order: {
                    clienteId: resolvedClienteId,
                    status: { in: ["PAGO", "APROVADO", "PROCESSANDO", "CONCLUIDO"] }
                  }
                }
              });
              if (alreadyBought) {
                console.warn(`[Checkout] Tentativa de compra duplicada ignorada para media ${media.id}`);
                continue;
              }
            }

            orderItemsData.push({
              mediaId: media.id,
              price: media.price || event.pricePerPhoto || 15,
              quantity: 1
            });
          }
        }
      }
      // 5. Adiciona os itens físicos se selecionados
      for (const item of physicalItems) {
        const product = await prisma.printProduct.findUnique({ where: { id: item.id } });
        if (product && product.active) {
          const qty = Number(item.quantity) || 1;
          const pPrice = product.sellingPrice !== null ? Number(product.sellingPrice) : Number(product.supplierCost) * (1 + product.marginPct / 100);
          orderItemsData.push({
            printProductId: product.id,
            price: pPrice,
            quantity: qty,
            selectedPhotos: item.selectedPhotos || []
          });
        }
      }

      // 4. Criar ou Reutilizar Pedido no Banco
      let order;
      let existingPending = orderToUse;

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
        const isCartUpdate = cartItems.length > 0 || physicalItems.length > 0;
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
          passiveFranchiseeId: fPassiveId,
          affiliateL1Id: fAffiliateL1Id,
          affiliateL2Id: fAffiliateL2Id,
          affiliateL1Amount: fSplitAffiliateL1,
          affiliateL2Amount: fSplitAffiliateL2,
          owner: fSplitOwner
        } = await PricingService.calculateSplits(finalPreco, { 
          professionalId: event.captacaoId || undefined,
          buyerUserId: resolvedClienteId || undefined,
          eventId: eventId
        });

        order = await prisma.order.update({
          where: { id: existingPending.id },
          data: {
            valor: finalPreco,
            clienteId: resolvedClienteId ?? existingPending.clienteId,
            splitMatriz: fMatriz,
            splitCaptacao: fCaptacao,
            splitEdicao: fEdicao,
            splitCartorio: fCartorio,
            splitOwner: fSplitOwner,
            splitFranchisee: fFranchisee,
            passiveFranchiseeId: fPassiveId,
            ambassadorId: req.cookies?.fs_referral,
            affiliateL1Id: fAffiliateL1Id,
            affiliateL2Id: fAffiliateL2Id,
            splitAffiliateL1: fSplitAffiliateL1,
            splitAffiliateL2: fSplitAffiliateL2,
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
            splitOwner,
            splitFranchisee,
            passiveFranchiseeId,
            ambassadorId: req.cookies?.fs_referral,
            affiliateL1Id,
            affiliateL2Id,
            splitAffiliateL1,
            splitAffiliateL2,
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
        description: `Fotos Evento: ${event.title}`,
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

        // ── IDEMPOTÊNCIA ATÔMICA (v17) ──────────────────────────────────────────
        // A verificação antiga usava findFirst + update separados = race condition.
        // Agora usamos updateMany com WHERE status = 'PENDENTE'.
        // Se count === 0, o webhook já foi processado. Sem race condition.

        const paymentData = await MercadoPagoService.getPaymentStatus(mpPaymentId);
        
        if (paymentData.status === "approved") {
          // 1. Busca os pedidos vinculados (Tentando por PaymentId ou ExternalReference)
          let updatedOrders = await prisma.order.findMany({ 
            where: { paymentId: String(data.id) },
            include: { event: true, cliente: true }
          });

          // Fallback tático: Caso o checkout Pro ainda não tenha salvo o PaymentID, usamos a Referência Externa
          if (updatedOrders.length === 0 && paymentData.external_reference) {
            const [realOrderId] = String(paymentData.external_reference).split(":");
            console.log(`[Webhook] Pedido não achado por ID ${data.id}. Tentando por Ref: ${realOrderId} (Original: ${paymentData.external_reference})`);
            
            // ── VERIFICA SE É BOOKING ESCROW ──
            if (realOrderId.startsWith("booking-")) {
              const bookingId = realOrderId.replace("booking-", "");
              // ATÔMICO: Só atualiza se status != PAID (impede duplicação)
              const bookingResult = await prisma.serviceBooking.updateMany({
                where: { id: bookingId, status: { not: "PAID" } },
                data: { status: "PAID", paymentId: String(data.id) }
              });
              if (bookingResult.count > 0) {
                console.log(`✅ Booking Escrow ${bookingId} aprovado via Webhook.`);
              } else {
                console.log(`[Webhook] Booking ${bookingId} já processado. Ignorando duplicata.`);
              }
              return res.json({ ok: true, type: "booking", idempotent: bookingResult.count === 0 });
            }

            // ── VERIFICA SE É ASSINATURA (COFRE) ──
            const sub = await prisma.subscription.findUnique({
              where: { id: realOrderId }
            });
            if (sub) {
              // Assinaturas usam handleSubscriptionPayment que já tem sua própria lógica interna
              await SubscriptionService.handleSubscriptionPayment(sub.gatewaySubId || String(data.id), paymentData.status);
              console.log(`✅ Assinatura ${sub.id} ativada via Webhook.`);
              return res.json({ ok: true, type: "subscription" });
            }

            const orderRef = await prisma.order.findUnique({
              where: { id: realOrderId },
              include: { event: true, cliente: true }
            });
            if (orderRef) updatedOrders = [orderRef];

            // ── VERIFICA SE É PEDIDO DE SUPRIMENTOS (B2B) ──
            if (updatedOrders.length === 0) {
              const supplyOrder = await prisma.supplyOrder.findUnique({
                where: { id: realOrderId },
                include: { items: true, franchisee: { include: { franchiseProfile: true } } }
              });
              if (supplyOrder) {
                // ATÔMICO: Só atualiza se status != PAID
                const supplyResult = await prisma.supplyOrder.updateMany({
                  where: { id: supplyOrder.id, status: { not: "PAID" } },
                  data: { status: "PAID", paymentId: String(data.id) }
                });

                if (supplyResult.count === 0) {
                  console.log(`[Webhook] SupplyOrder ${supplyOrder.id} já processado. Ignorando duplicata.`);
                  return res.json({ ok: true, type: "supply_order", idempotent: true });
                }

                // Auto-credita créditos de impressão (só executa se o update acima deu count > 0)
                if (supplyOrder.franchisee?.franchiseProfile) {
                  for (const item of supplyOrder.items) {
                    if (item.productId.startsWith('credits_')) {
                      const amountStr = item.productId.split('_')[1];
                      const amount = parseInt(amountStr) * item.quantity;
                      if (!isNaN(amount) && amount > 0) {
                        await prisma.$transaction([
                          prisma.franchiseProfile.update({
                            where: { id: supplyOrder.franchisee.franchiseProfile.id },
                            data: { printCredits: { increment: amount } }
                          }),
                          prisma.creditTransaction.create({
                            data: {
                              profileId: supplyOrder.franchisee.franchiseProfile.id,
                              amount: amount,
                              type: 'PURCHASE',
                              description: `Recarga automática via Pedido #${supplyOrder.id.slice(-6).toUpperCase()}`
                            }
                          })
                        ]);
                        console.log(`✅ ${amount} créditos creditados ao franqueado ${supplyOrder.franchisee.email}`);
                      }
                    }
                  }
                }

                // Notify admin about the B2B supply order
                const adminUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });
                if (adminUser) {
                  await prisma.notification.create({
                    data: {
                      userId: adminUser.id,
                      type: "PAYMENT_CONFIRMED",
                      title: "Nova Compra de Franqueado",
                      body: `O franqueado ${supplyOrder.franchisee?.email || ''} realizou a compra do Pedido #${supplyOrder.id.slice(-6).toUpperCase()} no valor de R$ ${Number(supplyOrder.total).toFixed(2)}.`,
                      refId: supplyOrder.id,
                      refType: "supply_order"
                    }
                  }).catch(console.error);
                }

                console.log(`✅ Pedido de Suprimentos ${supplyOrder.id} aprovado e créditos processados via Webhook.`);
                return res.json({ ok: true, type: "supply_order" });
              }
            }
          }

          for (const order of updatedOrders) {
            // ── TRANSIÇÃO ATÔMICA: PENDENTE → APROVADO ──────────────────────────
            // updateMany com WHERE status != APROVADO garante que apenas UM webhook
            // consegue efetuar a transição. Se count === 0, outro webhook já processou.
            const result = await prisma.order.updateMany({
              where: { 
                id: order.id,
                status: { not: "APROVADO" } // Só transiciona se AINDA não foi aprovado
              },
              data: { 
                status: "APROVADO",
                hasPaid: true,
                paymentId: String(data.id),
                paymentMethod: "MANUAL"
              }
            });

            if (result.count === 0) {
              console.log(`[Webhook] Pedido ${order.id} já aprovado. Ignorando duplicata do MP (paymentId: ${data.id}).`);
              continue; // Pula a finalização — já foi feita pelo primeiro webhook
            }

            // Usar o novo método unificado de finalização (só roda se o update acima deu count > 0)
            await PaymentController.finalizeApprovedOrder(order, order.event, req);
            console.log(`✅ Pedido ${order.id} aprovado atomicamente via Webhook (paymentId: ${data.id}).`);
          }
        }
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Erro desconhecido";
        console.error("Erro ao processar webhook:", msg);
      }
    }

    // Responder sempre 200 para o MP parar de tentar enviar
    return res.status(200).send("OK");
  }

  /**
   * POST /api/checkout/payment
   * Processa o pagamento transparente vindo do frontend.
   */
  static async processPayment(req: Request, res: Response) {
    const { eventId, userId, email, cpf, cardToken, installments, paymentMethodId, contributionAmount, accessType, cart, printProductId, orderId: passedOrderId, includeLivePrint, includeShipping, selectedServices, couponCode } = req.body;

    try {
      // 0. BYPASS para Loja da Franquia (B2B)
      if (eventId === "FRANCHISE_SHOP") {
        const supplyOrder = await prisma.supplyOrder.findUnique({
          where: { id: passedOrderId },
          include: { items: true }
        });

        if (!supplyOrder) return res.status(404).json({ error: "Pedido de suprimentos não localizado." });

        const mpResponse = await MercadoPagoService.processPayment({
          transaction_amount: Number(supplyOrder.total),
          token: cardToken,
          description: `Suprimentos Franquia - Pedido #${supplyOrder.id}`,
          installments: Number(installments) || 1,
          payment_method_id: paymentMethodId || "visa",
          payer: {
            email: email || "contatofotosegundo@gmail.com",
            identification: cpf ? { type: "CPF", number: cpf } : undefined
          },
          external_reference: supplyOrder.id
        });

        const isApproved = mpResponse.status === "approved";
        
        // Sempre salva o paymentId para permitir polling em pagamentos PENDING (ex: PIX)
        await prisma.supplyOrder.update({
          where: { id: supplyOrder.id },
          data: { 
            paymentId: String(mpResponse.id),
            ...(isApproved && { status: "PAID" })
          }
        });

        if (isApproved) {
          const fullSupplyOrder = await prisma.supplyOrder.findUnique({
            where: { id: supplyOrder.id },
            include: { items: true, franchisee: { include: { franchiseProfile: true } } }
          });
          
          if (fullSupplyOrder?.franchisee?.franchiseProfile) {
            for (const item of fullSupplyOrder.items) {
              if (item.productId.startsWith('credits_')) {
                const amountStr = item.productId.split('_')[1];
                const amount = parseInt(amountStr) * item.quantity;
                if (!isNaN(amount) && amount > 0) {
                  await prisma.$transaction([
                    prisma.franchiseProfile.update({
                      where: { id: fullSupplyOrder.franchisee.franchiseProfile.id },
                      data: { printCredits: { increment: amount } }
                    }),
                    prisma.creditTransaction.create({
                      data: {
                        profileId: fullSupplyOrder.franchisee.franchiseProfile.id,
                        amount: amount,
                        type: 'PURCHASE',
                        description: `Recarga via Checkout Pro #${fullSupplyOrder.id.slice(-6).toUpperCase()}`
                      }
                    })
                  ]);
                }
              }
            }

            const adminUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });
            if (adminUser) {
              await prisma.notification.create({
                data: {
                  userId: adminUser.id,
                  type: "PAYMENT_CONFIRMED",
                  title: "Nova Compra de Franqueado",
                  body: `O franqueado ${fullSupplyOrder.franchisee?.email || ''} realizou a compra do Pedido #${fullSupplyOrder.id.slice(-6).toUpperCase()} no valor de R$ ${Number(fullSupplyOrder.total).toFixed(2)}.`,
                  refId: fullSupplyOrder.id,
                  refType: "supply_order"
                }
              }).catch(console.error);
            }
          }
        }

        return res.json({
          success: true,
          orderId: supplyOrder.id,
          status: mpResponse.status,
          hasPaid: isApproved,
          details: mpResponse?.status_detail,
          qr_code: mpResponse?.point_of_interaction?.transaction_data?.qr_code,
          qr_code_base64: mpResponse?.point_of_interaction?.transaction_data?.qr_code_base64,
          ticket_url: mpResponse?.point_of_interaction?.transaction_data?.ticket_url
        });
      }

      // 0b. BYPASS para Assinatura de Cofre (Clube)
      if (eventId === "VAULT_SUBSCRIPTION") {
        const subscription = await prisma.subscription.findUnique({
          where: { id: passedOrderId },
          include: { album: true, user: true }
        });

        if (!subscription) return res.status(404).json({ error: "Assinatura não localizada." });

        const mpResponse = await MercadoPagoService.processPayment({
          transaction_amount: Number(subscription.planPrice || 49.90),
          token: cardToken,
          description: `Assinatura Mensal Cofre: ${subscription.album?.nome || "Cofre de Memórias"}`,
          installments: Number(installments) || 1,
          payment_method_id: paymentMethodId || "visa",
          payer: {
            email: email || subscription.user?.email || "contatofotosegundo@gmail.com",
            identification: cpf ? { type: "CPF", number: cpf } : undefined
          },
          external_reference: subscription.id
        });

        const isApproved = mpResponse.status === "approved";
        
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { 
            gatewaySubId: String(mpResponse.id),
            ...(isApproved && { status: "ACTIVE" })
          }
        });

        if (isApproved) {
          try {
            await SubscriptionService.handleSubscriptionPayment(String(mpResponse.id), "approved");
          } catch (e) {
            console.error("Erro ao rodar pós-aprovação da assinatura no bypass:", e);
          }
        }

        return res.json({
          success: true,
          orderId: subscription.id,
          status: mpResponse.status,
          hasPaid: isApproved,
          details: mpResponse?.status_detail,
          qr_code: mpResponse?.point_of_interaction?.transaction_data?.qr_code,
          qr_code_base64: mpResponse?.point_of_interaction?.transaction_data?.qr_code_base64,
          ticket_url: mpResponse?.point_of_interaction?.transaction_data?.ticket_url
        });
      }

      let resolvedEventId = eventId;
      let orderToUse = null;

      if (passedOrderId) {
        orderToUse = await prisma.order.findUnique({ where: { id: passedOrderId } });
        if (orderToUse) {
          resolvedEventId = resolvedEventId || orderToUse.eventId;
        }
      }

      // 1. Buscar evento com parceiros para cálculo de split
      if (!resolvedEventId) {
        return res.status(400).json({ error: "Identificação do evento ou pedido obrigatória" });
      }

      const event = await prisma.event.findUnique({ 
        where: { id: resolvedEventId },
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
      let totalSupplierCost = 0;
      
      // 2a. Produto Físico (Upsell Print Catalog)
      // 2a. Produtos Físicos (Hybrid Cart Support)
      let finalPrintPrice = 0;
      let physicalItems = req.body.physicalItems || []; // [{ id, quantity }]
      if (printProductId && !physicalItems.find((i: any) => i.id === printProductId)) {
        physicalItems.push({ id: printProductId, quantity: 1 });
      }

      let orderItemsData: Prisma.OrderItemCreateManyOrderInput[] = [];

      for (const item of physicalItems) {
        const product = await prisma.printProduct.findUnique({ where: { id: item.id } });
        if (product && product.active) {
          const qty = Number(item.quantity) || 1;
          const pPrice = product.sellingPrice !== null ? Number(product.sellingPrice) : Number(product.supplierCost) * (1 + product.marginPct / 100);
          
          finalPrintPrice += pPrice * qty;
          totalSupplierCost += Number(product.supplierCost) * qty;

          orderItemsData.push({
            printProductId: product.id,
            price: pPrice,
            quantity: qty,
            selectedPhotos: item.selectedPhotos || []
          });
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

      const phygitalPrice = (finalIncludeLivePrint ? 150 : 0) + (finalIncludeShipping ? 25 : 0);

      // 2b. Respeitar valor do pedido se já existir (Ex: Reserva 50% ou Quitação)
      let preco = orderToUse ? Number(orderToUse.valor) : (basePrice + finalPrintPrice + upgradePrice + phygitalPrice);
      
      // 2e. Aplicação de Cupom de Desconto
      let appliedCoupon = null;
      if (couponCode) {
        const coupons: any[] = await prisma.$queryRaw`SELECT * FROM "coupons" WHERE code = ${String(couponCode).trim()}`;
        appliedCoupon = coupons.length > 0 ? coupons[0] : null;
        if (
          appliedCoupon && 
          appliedCoupon.active && 
          (!appliedCoupon.expiresAt || appliedCoupon.expiresAt > new Date()) && 
          (!appliedCoupon.maxUses || appliedCoupon.usedCount < appliedCoupon.maxUses) && 
          (!appliedCoupon.eventId || appliedCoupon.eventId === eventId)
        ) {
          if (appliedCoupon.discountPct) {
            preco = preco * (1 - Number(appliedCoupon.discountPct) / 100);
          } else if (appliedCoupon.discountAbs) {
            preco = Math.max(0, preco - Number(appliedCoupon.discountAbs));
          }
        } else {
          appliedCoupon = null; // Inválido ou expirado
        }
      }

      if (isNaN(preco) || preco < 0) {
        console.error("[Process Payment] Valor inválido:", { preco, cart, contributionAmount });
        return res.status(400).json({ error: "O valor do pagamento não pode ser negativo. Verifique os itens selecionados." });
      }

      let finalShippingFee = Number(req.body.shippingFee || 0);
      if (appliedCoupon && appliedCoupon.isFreeShipping) {
        finalShippingFee = 0;
      }

      const { 
        matriz: splitMatriz, 
        captacao: splitCaptacao, 
        edicao: splitEdicao, 
        cartorio: splitCartorio,
        franchisee: splitFranchisee,
        passiveFranchiseeId,
        ambassadorId,
        owner: splitOwner
      } = await PricingService.calculateSplits(preco, { 
        professionalId: event.captacaoId || undefined,
        shippingFee: finalShippingFee,
        supplierCost: totalSupplierCost,
        ambassadorId: req.cookies?.fs_referral,
        eventId: eventId
      });

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
      // orderItemsData já foi inicializado com produtos físicos se houver (Regra Híbrida)
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

      // 5. Adiciona os itens físicos processados anteriormente
      // (orderItemsData já contém os produtos físicos se houver)

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
            splitOwner,
            splitFranchisee,
            passiveFranchiseeId,
            ambassadorId: req.cookies?.fs_referral,
            couponId: appliedCoupon ? appliedCoupon.id : null,
            tempPassword: isNewUser ? tempPassword : null,
            // Order Engine Fields
            deliveryType: req.body.deliveryType || existingPendingOrder.deliveryType || "DIGITAL_ONLY",
            paymentModel: event.paymentModel,
            shippingFee: new Prisma.Decimal(finalShippingFee),
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
            splitOwner,
            splitFranchisee,
            passiveFranchiseeId,
            ambassadorId: req.cookies?.fs_referral,
            couponId: appliedCoupon ? appliedCoupon.id : null,
            tempPassword: isNewUser ? tempPassword : null,
            // Order Engine Fields
            deliveryType: req.body.deliveryType || "DIGITAL_ONLY",
            paymentModel: event.paymentModel,
            shippingFee: new Prisma.Decimal(finalShippingFee),
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

      // Se aplicou cupom válido, incrementar contador
      if (appliedCoupon) {
        await prisma.$executeRaw`UPDATE "coupons" SET "usedCount" = "usedCount" + 1 WHERE id = ${appliedCoupon.id}`;
      }

      // 4b. Bypass para Pedidos GRATUITOS (Cupom 100% OFF ou valor R$ 0)
      if (preco === 0) {
        const updatedOrder = await prisma.order.update({
          where: { id: order.id },
          data: {
            status: "APROVADO",
            hasPaid: true,
            paymentMethod: "FREE",
            paymentId: `FREE-${order.id}-${Date.now()}`
          }
        });

        if (finalUserId) {
          await prisma.order.updateMany({
            where: {
              eventId: event.id,
              clienteId: finalUserId,
              status: "PENDENTE",
              id: { not: order.id }
            },
            data: {
              status: "APROVADO",
              hasPaid: true,
              paymentMethod: "FREE",
              paymentId: `FREE-LINKED-${Date.now()}`
            }
          });
        }

        await PaymentController.finalizeApprovedOrder(updatedOrder, event, req);

        return res.json({
          success: true,
          orderId: order.id,
          status: "approved",
          hasPaid: true,
          method: "FREE",
          guestToken: order.guestToken
        });
      }

      // 5. Pagamento em DINHEIRO (Cash) - Pulo do Gato
      if (req.body.method === "CASH") {
        // Validação de Segurança: Apenas Profissionais, Franqueados ou Admins podem aprovar CASH
        const authUser = (req as any).user;
        const canApproveCash = authUser && ["ADMIN", "PROFISSIONAL", "CARTORIO", "FRANCHISEE"].includes(authUser.role);

        if (!canApproveCash) {
          console.warn(`[SECURITY ALERT] Tentativa de pagamento CASH não autorizada por usuário: ${authUser?.email || 'ANÔNIMO'}`);
          return res.status(403).json({ 
            error: "Não autorizado", 
            message: "Apenas profissionais autorizados podem registrar pagamentos em dinheiro." 
          });
        }
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
        await PaymentController.finalizeApprovedOrder(updatedOrder, event, req);

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
        description: `Fotos Evento: ${event.title}`,
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
          eventTitle: event.title
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
   * POST /api/test/mock-payment
   * Simula um Webhook do Mercado Pago para testes E2E.
   */
  static async mockWebhook(req: Request, res: Response) {
    if (process.env.NODE_ENV !== "test" && process.env.NODE_ENV !== "development") {
       return res.status(403).json({ error: "Only available in test/development environment." });
    }
    
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ error: "orderId is required" });

    try {
      const order = await prisma.order.findUnique({
        where: { id: String(orderId) },
        include: { event: true, cliente: true }
      });

      if (!order) return res.status(404).json({ error: "Order not found" });

      const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "APROVADO",
          hasPaid: true,
          paymentMethod: "PIX",
          paymentId: `MOCK-${Date.now()}`
        }
      });

      await PaymentController.finalizeApprovedOrder(updatedOrder, order.event, req);

      return res.json({ success: true, mocked: true, status: "APROVADO" });
    } catch (error) {
      console.error("[Mock Webhook Error]:", error);
      return res.status(500).json({ error: "Error mocking payment" });
    }
  }

  static async getOrderPublic(req: Request, res: Response) {
    const { id } = req.params;

    try {
      let order = await prisma.order.findUnique({
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
              title: true,
              dataEvento: true,
              location: true,
              coverPhotoUrl: true,
              isCrowdfund: true,
              customBrandColor: true,
              customLogoUrl: true,
              priceHistory: true,
              priceBase: true,
              cartorioUser: { select: { tenantBrandColor: true, tenantLogoUrl: true } }
            }
          }
        }
      });

      if (!order) {
        // Tenta buscar na tabela de SupplyOrder (Loja da Franquia)
        const supplyOrder = await prisma.supplyOrder.findUnique({
          where: { id: String(id) },
          include: {
            items: true,
            franchisee: { select: { email: true, nome: true } }
          }
        });

        if (supplyOrder) {
          return res.json({
            id: supplyOrder.id,
            amount: Number(supplyOrder.total),
            status: supplyOrder.status,
            eventId: "FRANCHISE_SHOP",
            clienteId: supplyOrder.franchiseeId,
            buyerEmail: supplyOrder.franchisee?.email,
            event: {
              id: "FRANCHISE_SHOP",
              title: "Loja da Franquia",
              dataEvento: supplyOrder.createdAt,
              location: "Portal do Franqueado",
              coverPhotoUrl: "/logo-fs.png",
              isCrowdfund: false
            },
            manualType: "Pedido de Suprimentos",
            isGuestOrder: false,
            deliveryType: supplyOrder.deliveryType || "DIGITAL_ONLY",
            shippingAddress: supplyOrder.address,
            items: supplyOrder.items.map(it => ({
              id: it.id,
              price: Number(it.price),
              quantity: it.quantity,
              printProduct: { name: it.name, sku: it.productId }
            }))
          });
        }

        // Tenta buscar na tabela de Subscription (Assinatura do Clube)
        const subscription = await prisma.subscription.findUnique({
          where: { id: String(id) },
          include: {
            user: { select: { email: true, nome: true } },
            album: { select: { nome: true } }
          }
        });

        if (subscription) {
          return res.json({
            id: subscription.id,
            amount: Number(subscription.planPrice || 49.90),
            status: subscription.status === "ACTIVE" ? "APROVADO" : "PENDENTE",
            eventId: "VAULT_SUBSCRIPTION",
            clienteId: subscription.userId,
            buyerEmail: subscription.user?.email,
            event: {
              id: "VAULT_SUBSCRIPTION",
              title: `Assinatura: ${subscription.album?.nome || "Cofre de Memórias"}`,
              dataEvento: subscription.createdAt,
              location: "Plataforma Foto Segundo",
              coverPhotoUrl: "/logo-fs.png",
              isCrowdfund: false
            },
            manualType: "Assinatura do Clube",
            isGuestOrder: false,
            deliveryType: "DIGITAL_ONLY",
            items: [{
              id: subscription.id,
              price: Number(subscription.planPrice || 49.90),
              quantity: 1,
              printProduct: { name: `Plano Mensal - Limite ${subscription.planLimit || 36} Fotos`, sku: "VAULT_SUB" }
            }]
          });
        }
        
        return res.status(404).json({ error: "Pedido não localizado." });
      }

      // 5. Auditoria de Checkout
      audit(req, "CHECKOUT_STARTED", "Order", order.id, null, { eventId: order.eventId, valor: order.valor });

      return res.json({
        id: order.id,
        amount: Number(order.valor),
        status: order.status,
        eventId: order.eventId,
        clienteId: order.clienteId,
        buyerEmail: order.buyerEmail || order.cliente?.email,
        event: order.event ? {
          ...order.event,
          tenantBrandColor: order.event.customBrandColor || (order.event as any).cartorioUser?.tenantBrandColor || null,
          tenantLogoUrl: order.event.customLogoUrl || (order.event as any).cartorioUser?.tenantLogoUrl || null
        } : null,
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
   * GET /api/checkout/shipping-quote
   * Calcula o frete para um carrinho/pedido baseado no CEP.
   */
  static async calculateShipping(req: Request, res: Response) {
    const { cep, orderId, cart, printProductId } = req.query;

    try {
      if (!cep) return res.status(400).json({ error: "CEP é obrigatório." });

      // 1. Identificar produtos no carrinho
      let items: ShippingItem[] = [];

      if (orderId) {
        const order = await prisma.order.findUnique({
          where: { id: String(orderId) },
          include: { items: true }
        });
        if (order) {
          items = order.items
            .filter(i => i.printProductId)
            .map(i => ({ id: i.printProductId!, quantity: i.quantity }));
        }
      } else if (printProductId) {
        items.push({ id: String(printProductId), quantity: 1 });
      } else if (req.query.physicalItems) {
        try {
          const pItems = typeof req.query.physicalItems === 'string' ? JSON.parse(req.query.physicalItems) : req.query.physicalItems;
          if (Array.isArray(pItems)) {
            items = pItems.map((i: any) => ({ id: i.id, quantity: Number(i.quantity) || 1 }));
          }
        } catch (e) { console.error("Error parsing physicalItems for shipping:", e); }
      }

      // Se houver cartItems (digital) ou o pedido já tiver itens, mas nenhum físico, frete é zero
      const cartItems = Array.isArray(cart) ? cart : (cart ? [cart] : []);
      const order = orderId ? await prisma.order.findUnique({ where: { id: String(orderId) }, include: { items: true } }) : null;
      
      if (items.length === 0 && (cartItems.length > 0 || (order && order.items.length > 0))) {
        return res.json({ quotes: [{ id: 'free', name: 'Entrega Digital (E-mail)', price: 0, currency: 'BRL', deliveryTimeDays: 0 }] });
      }

      if (items.length === 0) {
        return res.status(400).json({ error: "Nenhum produto físico identificado para cálculo de frete." });
      }

      // 2. Buscar CEP de Origem (do Evento ou da Franquia vinculada)
      // Por simplicidade na Phase 12, usamos um CEP fixo de origem (CD Central)
      const originCep = "01001000"; 

      // 3. Chamar ShippingService
      const quotes = await ShippingService.calculateFreight(originCep, String(cep), items);

      return res.json({ quotes });
    } catch (err) {
      console.error("calculateShipping error:", err);
      res.status(500).json({ error: "Erro ao calcular frete." });
    }
  }

  /**
   * GET /api/public/orders/:id/check-payment
   * Polling direto no MP — detecta aprovação de Pix sem depender de webhook.
   */
  static async checkPaymentStatus(req: Request, res: Response) {
    const { id } = req.params;
    try {
      let order = await prisma.order.findUnique({
        where: { id: String(id) },
        include: {
          event: { select: { id: true, title: true } },
          cliente: { select: { email: true, nome: true } }
        }
      });

      if (!order) {
        const supplyOrder = await prisma.supplyOrder.findUnique({
          where: { id: String(id) }
        });
        if (supplyOrder) {
          if (supplyOrder.status === "PAID") return res.json({ status: "APROVADO", eventId: "FRANCHISE_SHOP" });
          if (!supplyOrder.paymentId) return res.json({ status: supplyOrder.status });
          
          const mpData = await MercadoPagoService.getPaymentStatus(supplyOrder.paymentId);
          if (mpData.status === "approved") {
            await prisma.supplyOrder.update({ where: { id: supplyOrder.id }, data: { status: "PAID" } });
            return res.json({ status: "APROVADO", eventId: "FRANCHISE_SHOP" });
          }
          return res.json({ status: supplyOrder.status });
        }

        const subscription = await prisma.subscription.findUnique({
          where: { id: String(id) }
        });
        if (subscription) {
          if (subscription.status === "ACTIVE") return res.json({ status: "APROVADO", eventId: "VAULT_SUBSCRIPTION" });
          if (!subscription.gatewaySubId) return res.json({ status: subscription.status });
          
          const mpData = await MercadoPagoService.getPaymentStatus(subscription.gatewaySubId);
          if (mpData.status === "approved") {
            await prisma.subscription.update({ where: { id: subscription.id }, data: { status: "ACTIVE" } });
            try {
              await SubscriptionService.handleSubscriptionPayment(subscription.gatewaySubId, "approved");
            } catch (e) {
              console.error("Erro no pós-aprovação do polling da assinatura:", e);
            }
            return res.json({ status: "APROVADO", eventId: "VAULT_SUBSCRIPTION" });
          }
          return res.json({ status: subscription.status });
        }

        return res.status(404).json({ error: "Pedido não encontrado." });
      }

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
          eventTitle: order.event.title,
          orderId: order.id,
          amount: Number(order.valor)
        });

        // 2. E-mail de acesso ao comprador (Adicionado para Polling)
        const recipientEmail = order.buyerEmail || order.cliente?.email;
        if (recipientEmail) {
          NotificationService.sendAccessEmail({
            to: recipientEmail,
            buyerName: order.cliente?.nome || "Cliente",
            eventTitle: order.event.title,
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
      const { matriz, captacao, edicao, cartorio, franchisee, passiveFranchiseeId, owner } = await PricingService.calculateSplits(totalPrice, {
        professionalId: event.captacaoId || undefined,
        productType: "ALBUM_IMPRESSO", // Trata como produto físico para splits
        eventId: event.id
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
          splitOwner: owner,
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
          isPrivate: event.isPrivate ?? true,
          ...(event.isQuote && { quoteStatus: "CONVERTED" })
        };

        // 1. Atualizar Montante Arrecadado (Crowdfunding)
        if (order.isContribution && order.eventId) {
          eventUpdateData.collectedAmount = { increment: order.valor };
        }

        // 1.5. Increment Coupon Usage
        if (order.couponId) {
          await tx.coupon.update({
            where: { id: order.couponId },
            data: { usedCount: { increment: 1 } }
          });
        }

        // 2. Lógica de Upgrades (Service Catalog) e Print Catalog
        const orderItems = await tx.orderItem.findMany({
          where: { orderId: order.id },
          include: { 
            service: true,
            printProduct: true,
            media: true
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
            const photos = item.selectedPhotos || [];
            
            if (photos.length > 0) {
              const fulfillment = item.printProduct?.fulfillmentType || "LAB";
              if (fulfillment === "INSTANT_PRINT") {
                // Roteia para Fila Local (Raspberry Pi/IoT/ZPL)
                console.log(`[Fulfillment] Roteando pedido ${order.id} para INSTANT_PRINT (Fila Local IoT)`);
                await PhygitalService.createQueueEntryFromOrder(order, photos);
              } else {
                // Roteia para Laboratório Parceiro via API (Motor Logístico Externo)
                console.log(`[Fulfillment] Roteando pedido ${order.id} para LAB Parceiro Externo`);
                await IntegrationService.dispatchToLabPartner(order.id, [item], photos);
              }
            }
          }
        }

        // 3.5. Criação Automática de Álbum (Vault) para Fotos Digitais Compradas
        const isFullDigitalAccess = order.internalNotes?.includes('"type":"HYBRID"') || 
                                    order.internalNotes?.includes('"type":"ALBUM_FULL"') ||
                                    event.type === 'ALBUM_FULL';
        const mediaItems = orderItems.filter(item => item.mediaId && item.media);
        if ((mediaItems.length > 0 || isFullDigitalAccess) && order.clienteId) {
          const vaultSlug = `vault-${order.eventId}-${order.clienteId}`;
          
          let album = await tx.sharedAlbum.findUnique({ where: { slug: vaultSlug } });
          
          if (!album) {
            console.log(`[Fulfillment] Criando Álbum Automático para Fotos Digitais. Slug: ${vaultSlug}`);
            album = await tx.sharedAlbum.create({
              data: {
                nome: event.title || "Meu Álbum Digital",
                slug: vaultSlug,
                goalPoses: Math.max(36, mediaItems.length),
                status: "OPEN",
                subscriptionStatus: "ACTIVE", // Libera o álbum permanentemente para essas fotos
                ownerId: order.clienteId,
                members: {
                  create: {
                    userId: order.clienteId,
                    role: "OWNER"
                  }
                }
              }
            });
          }

          // Vincular as fotos digitais compradas (ou todas se for acesso total) ao álbum
          let photosToLink = mediaItems.map(i => i.media!);
          if (isFullDigitalAccess) {
            photosToLink = await tx.eventMedia.findMany({ where: { eventId: order.eventId, type: "PHOTO" } });
          }

          for (const m of photosToLink) {
            const existingMedia = await tx.sharedAlbumMedia.findFirst({
              where: { albumId: album.id, fileId: m.id }
            });
            if (!existingMedia) {
              await tx.sharedAlbumMedia.create({
                data: {
                  albumId: album.id,
                  fileId: m.id,
                  webViewLink: m.url,
                  thumbnailLink: m.url,
                  uploadedById: order.clienteId,
                  status: 'APPROVED',
                  type: m.type || 'PHOTO'
                }
              });
            }
          }
        }

        // 4. Lógica Phygital e Logística (Roteamento Inteligente)
        let logisticNote = "";
        const unit = await LogisticsService.routeOrderLogistics(order.id);
        if (unit) {
          logisticNote = `[ROTEAMENTO] Pedido direcionado para Unidade: ${unit.user.nome}`;
        }

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

        // 5. Lógica de Payout & Escrow (F-02, F-03)
        const captacaoUser = event.captacaoId ? await tx.user.findUnique({ where: { id: event.captacaoId } }) : null;
        
        // Immediate release if: Verified Professional OR Franchisee OR Low Value (< 5000) for Verified members
        const isProOrFranchise = !!(captacaoUser?.isVerified || captacaoUser?.role === "FRANCHISEE" || captacaoUser?.role === "ADMIN");
        const isLowRisk = isProOrFranchise && Number(order.valor) < MAX_LOW_RISK_PAYOUT;
        
        // Standard Escrow: 7 days from sale (now) or event date (whichever is later)
        const escrowDate = new Date(Math.max(new Date().getTime(), new Date(event.dataEvento).getTime()));
        const payoutReadyAt = new Date(escrowDate);
        payoutReadyAt.setDate(payoutReadyAt.getDate() + ESCROW_DAYS);

        await tx.order.update({
          where: { id: order.id },
          data: {
            payoutStatus: isLowRisk ? "AVAILABLE" : "PENDING",
            payoutReadyAt: isLowRisk ? new Date() : payoutReadyAt,
            internalNotes: logisticNote ? (order.internalNotes ? `${order.internalNotes}\n${logisticNote}` : logisticNote) : order.internalNotes
          }
        });
      });

      // 5a. Processar Gamificação (Cashback)
      try {
        await GamificationService.processOrderRewards(order.id);
      } catch (e) {
        console.error("Erro ao processar cashback:", e);
      }

      // 5b. Processar Recompensa de Embaixador
      if (order.ambassadorId) {
        try {
          const campaign = await prisma.referralCampaign.findFirst({
            where: { ownerId: order.ambassadorId, active: true }
          });
          if (campaign) {
            await ReferralService.processConversion(campaign.id, { 
              newUserId: order.clienteId || undefined, 
              orderId: order.id 
            });
          }
        } catch (e) {
          console.error("Erro ao processar recompensa embaixador:", e);
        }
      }

      // 5c. Processar Comissão de Afiliados Multinível
      if (order.affiliateL1Id) {
        try {
          await AffiliateService.recordCommissions(
            order.id,
            order.affiliateL1Id,
            Number(order.splitAffiliateL1 || 0),
            order.affiliateL2Id,
            Number(order.splitAffiliateL2 || 0)
          );
        } catch (e) {
          console.error("Erro ao registrar comissão de afiliado:", e);
        }
      }

      // 6. Notificações (E-mail e WhatsApp) - Fora da transação para evitar rollback se falhar
      const recipientEmail = order.buyerEmail || order.cliente?.email;
      if (recipientEmail) {
        NotificationService.sendAccessEmail({
          to: recipientEmail,
          buyerName: order.cliente?.nome || "Cliente",
          eventTitle: event.title,
          orderId: order.id,
          accessLink: `${FRONTEND_URL}/e/${event.id}`,
          tempPassword: order.tempPassword || undefined,
          guestToken: order.isGuestOrder ? order.guestToken : undefined
        }).catch(e => console.error("Erro ao enviar e-mail de acesso:", e));
      }

      NotificationService.notifyNewSale({
        buyerEmail: recipientEmail || "desconhecido",
        eventTitle: event.title,
        orderId: order.id,
        amount: Number(order.valor)
      });

      if (order.clienteId) {
        await NotificationService.createInApp({
          userId: order.clienteId,
          type: 'PAYMENT_CONFIRMED',
          title: '✅ Pagamento confirmado!',
          body: `Seu pagamento foi confirmado com sucesso. Em breve você receberá os detalhes.`,
          refId: order.eventId,
          refType: 'event'
        });
      }

      // 7. Roteamento Logístico para Cofres (Vaults)
      if (order.manualType === "VAULT_ONDEMAND" || order.manualType === "VAULT_CYCLE") {
        RoutingService.routeVaultOrder(order.id).catch(e => console.error("[Routing] Erro ao rotear pedido de cofre:", e));
      }

      // 8. Auditoria Final
      audit(req, "ORDER_FINALIZED_TX", "Order", order.id, null, { eventId: order.eventId });

    } catch (err) {
      console.error("[finalizeApprovedOrder Error]:", err);
      throw err; // Re-throw para garantir que o webhook receba erro se a TX falhar
    }
  }
}
