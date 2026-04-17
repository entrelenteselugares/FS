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
                    fotografo: true,
                    editor: true,
                    cartorioUser: true
                }
            });
            if (!event)
                return res.status(404).json({ error: "Evento não encontrado" });
            // 2. Lógica de Precificação Dinâmica
            const now = new Date();
            const eventDate = new Date(event.dataEvento);
            eventDate.setHours(0, 0, 0, 0);
            const preco = now.getTime() < eventDate.getTime() ? 190 : 200;
            // 3. Preparar Split de Pagamentos (Marketplace)
            // Divisão: 10% Cartório, 30% Fotógrafo, 20% Editor, 40% Foto Segundo (Matrix)
            const partnersList = [];
            if (event.fotografo?.mpUserId) {
                partnersList.push({
                    mpUserId: event.fotografo.mpUserId,
                    amount: preco * 0.30,
                    role: "FOTOGRAFO"
                });
            }
            if (event.editor?.mpUserId) {
                partnersList.push({
                    mpUserId: event.editor.mpUserId,
                    amount: preco * 0.20,
                    role: "EDITOR"
                });
            }
            if (event.cartorioUser?.mpUserId) {
                partnersList.push({
                    mpUserId: event.cartorioUser.mpUserId,
                    amount: preco * 0.10,
                    role: "CARTORIO"
                });
            }
            console.log(`[Checkout] Iniciando split para ${partnersList.length} parceiros conectados.`);
            // 4. Criar Pedido Pendente no Banco
            const order = await prisma_1.default.order.create({
                data: {
                    eventId,
                    clienteId: userId,
                    valor: preco,
                    status: "PENDENTE"
                }
            });
            // 5. Criar Pagamento no Mercado Pago
            const mpResponse = await mercadopago_service_1.MercadoPagoService.createPayment({
                transaction_amount: preco,
                description: `Fotos Evento: ${event.nomeNoivos}`,
                payment_method_id: method,
                payer_email: email,
                notification_url: `${process.env.BACKEND_URL}/api/webhooks/mercadopago`,
                token: token,
                installments: installments,
                issuer_id: issuer_id,
                partners: partnersList
            });
            // 6. Vincular ID do Pagamento do MP ao Pedido
            await prisma_1.default.order.update({
                where: { id: order.id },
                data: { paymentId: String(mpResponse.id) }
            });
            return res.json({
                orderId: order.id,
                payment: mpResponse
            });
        }
        catch (error) {
            console.error("Erro no checkout:", error);
            return res.status(500).json({ error: error.message || "Erro no processamento do pagamento" });
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
}
exports.PaymentController = PaymentController;
