"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentController = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const mercadopago_service_1 = require("../services/mercadopago.service");
class PaymentController {
    /**
     * POST /api/checkout
     * Inicia o fluxo de pagamento com precificação dinâmica.
     */
    static async checkout(req, res) {
        const { eventId, userId, email, method, token, installments, issuer_id } = req.body;
        try {
            // 1. Buscar evento com os parceiros vinculados
            const event = await prisma_1.default.event.findUnique({
                where: { id: eventId },
                include: {
                    captacao: true,
                    edicao: true,
                    cartorioUser: true
                }
            });
            if (!event)
                return res.status(404).json({ error: "Evento não encontrado" });
            // 2. Lógica de Precificação Dinâmica (Baseada no Evento)
            const now = new Date();
            const eventDate = new Date(event.dataEvento);
            eventDate.setHours(0, 0, 0, 0);
            // Se a data atual for anterior à data do evento, usa preço antecipado
            const preco = now.getTime() < eventDate.getTime()
                ? Number(event.priceEarly ?? 190)
                : Number(event.priceBase ?? 200);
            // 3. Preparar Split de Pagamentos (Regra: Repasse Manual)
            // Todo o valor vai para a Matriz para posterior repasse manual aos profissionais.
            const taxaMatriz = 1.0;
            const partnersList = [];
            console.log(`[Checkout] Repasse Manual: 100% para Matriz.`);
            // 4. Criar Pedido Pendente no Banco
            const order = await prisma_1.default.order.create({
                data: {
                    eventId,
                    clienteId: userId,
                    valor: preco,
                    status: "PENDENTE"
                }
            });
            // 5. Criar Preferência no Mercado Pago (Checkout Pro)
            const mpResponse = await mercadopago_service_1.MercadoPagoService.createPreference({
                transaction_amount: preco,
                description: `Fotos Evento: ${event.nomeNoivos}`,
                payer_email: email,
                notification_url: `${process.env.BACKEND_URL || "http://localhost:3001"}/api/webhooks/mercadopago`,
                orderId: order.id,
                partners: partnersList,
                matrizRate: taxaMatriz,
            });
            // 6. Vincular ID da Preferência ao Pedido (opcional, mas bom para tracking)
            await prisma_1.default.order.update({
                where: { id: order.id },
                data: { paymentId: String(mpResponse.id) }
            });
            return res.json({
                orderId: order.id,
                init_point: mpResponse.init_point, // URL para o Checkout Pro
                sandbox_init_point: mpResponse.sandbox_init_point
            });
        }
        catch (error) {
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
    static async webhook(req, res) {
        const { type, data } = req.body;
        // O MP envia o ID da transação em data.id quando o type é 'payment'
        if (type === "payment" && data?.id) {
            try {
                const paymentData = await mercadopago_service_1.MercadoPagoService.getPaymentStatus(data.id);
                if (paymentData.status === "approved") {
                    // Atualiza o pedido vinculado
                    await prisma_1.default.order.updateMany({
                        where: { paymentId: String(data.id) },
                        data: { status: "APROVADO" }
                    });
                    console.log(`✅ Pagamento ${data.id} aprovado e pedido liberado.`);
                }
            }
            catch (error) {
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
    static async processPayment(req, res) {
        const { eventId, userId, email, cpf, cardToken, installments, paymentMethodId } = req.body;
        try {
            // 1. Buscar evento
            const event = await prisma_1.default.event.findUnique({ where: { id: eventId } });
            if (!event)
                return res.status(404).json({ error: "Evento não encontrado" });
            // 2. Lógica de Precificação (Igual ao checkout Pro)
            const now = new Date();
            const eventDate = new Date(event.dataEvento);
            const preco = now.getTime() < eventDate.getTime()
                ? Number(event.priceEarly ?? 190)
                : Number(event.priceBase ?? 200);
            // 3. Criar Pedido
            const order = await prisma_1.default.order.create({
                data: {
                    eventId,
                    clienteId: userId || null, // Se não houver userId, fica null (permitido pelo schema)
                    valor: preco,
                    status: "PENDENTE"
                }
            });
            // 4. MOCK BYPASS para Testes Locais
            if (cardToken?.startsWith("mock-token-")) {
                console.log(`[Payment] Bypass MOCK detectado para Pedido ${order.id}.`);
                await prisma_1.default.order.update({
                    where: { id: order.id },
                    data: { status: "APROVADO", paymentId: "mock-pay-" + Date.now() }
                });
                return res.json({ orderId: order.id, status: "approved", hasPaid: true });
            }
            // 5. Chamada Real ao Mercado Pago
            const mpResponse = await mercadopago_service_1.MercadoPagoService.processPayment({
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
            });
            // 6. Atualizar Pedido
            const isApproved = mpResponse.status === "approved";
            await prisma_1.default.order.update({
                where: { id: order.id },
                data: {
                    status: isApproved ? "APROVADO" : "PENDENTE",
                    paymentId: String(mpResponse.id)
                }
            });
            return res.json({
                orderId: order.id,
                status: mpResponse.status,
                hasPaid: isApproved,
                details: mpResponse.status_detail
            });
        }
        catch (error) {
            console.error("[Process Payment Error]:", error.response?.data || error);
            return res.status(500).json({
                error: "Erro ao processar pagamento v2",
                details: error.response?.data || error.message
            });
        }
    }
}
exports.PaymentController = PaymentController;
