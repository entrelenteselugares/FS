"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MercadoPagoService = void 0;
const mercadopago_1 = require("mercadopago");
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Configuração do Cliente para Pagamentos (usando Access Token principal)
const client = new mercadopago_1.MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN || "",
    options: { timeout: 5000 }
});
const preference = new mercadopago_1.Preference(client);
class MercadoPagoService {
    /**
     * Gera a URL de autorização OAuth para o parceiro
     */
    static getAuthorizationUrl(userId) {
        if (!this.clientId || !this.redirectUri) {
            throw new Error("Configurações de OAuth do Mercado Pago (MP_CLIENT_ID ou MP_REDIRECT_URI) ausentes no .env");
        }
        return `https://auth.mercadopago.com.br/authorization?client_id=${this.clientId}&response_type=code&platform_id=mp&state=${userId}&redirect_uri=${encodeURIComponent(this.redirectUri)}`;
    }
    /**
     * Troca o código de autorização pelo Access Token do parceiro
     */
    static async exchangeCode(code) {
        try {
            const response = await axios_1.default.post("https://api.mercadopago.com/oauth/token", {
                client_secret: this.clientSecret,
                client_id: this.clientId,
                grant_type: "authorization_code",
                code: code,
                redirect_uri: this.redirectUri,
            });
            return response.data;
        }
        catch (error) {
            const axiosErr = error;
            console.error("Erro ao trocar código MP:", axiosErr.response?.data || axiosErr.message);
            throw new Error("Falha na autenticação com Mercado Pago");
        }
    }
    /**
     * Cria uma PREFERÊNCIA de pagamento (Checkout Pro) com suporte a Marketplace/Split
     */
    static async createPreference(data) {
        try {
            const taxaMatriz = data.matrizRate ?? Number(process.env.TAXA_MATRIZ || 0.40);
            const marketplaceFee = Number((data.transaction_amount * taxaMatriz).toFixed(2));
            // Importante: No Checkout Pro como Marketplace, a taxa da plataforma (nossa comissão)
            // é enviada como marketplace_fee. Os parceiros conectados (disbursements)
            // recebem o valor subtraído dessa taxa.
            const body = {
                items: [
                    {
                        id: data.orderId,
                        title: data.description,
                        unit_price: Number(data.transaction_amount.toFixed(2)),
                        quantity: 1,
                        currency_id: "BRL"
                    }
                ],
                payer: {
                    email: data.payer_email,
                },
                external_reference: data.orderId,
                marketplace_fee: marketplaceFee,
                metadata: {
                    order_id: data.orderId,
                    partners: data.partners
                },
                // Em produção, se a URL for localhost, o MP pode rejeitar. 
                // Vamos omitir a notification_url apenas se detectarmos localhost em produção para testes rápidos.
                ...(data.notification_url?.includes("localhost") || data.notification_url?.includes("127.0.0.1")
                    ? {}
                    : { notification_url: data.notification_url }),
                back_urls: {
                    success: `${process.env.FRONTEND_URL || "http://localhost:5173"}/success`,
                    failure: `${process.env.FRONTEND_URL || "http://localhost:5173"}/failure`,
                    pending: `${process.env.FRONTEND_URL || "http://localhost:5173"}/pending`
                },
                auto_return: "approved",
            };
            console.log(`[MP] Criando Preferência: R$ ${data.transaction_amount} | Fee Matriz: R$ ${marketplaceFee}`);
            const response = await preference.create({ body });
            return response;
        }
        catch (error) {
            if (error.response?.data) {
                console.error("[MP API ERROR]:", JSON.stringify(error.response.data, null, 2));
            }
            else {
                console.error("[MP Error CreatePreference]:", error.message || error);
            }
            throw error;
        }
    }
    static async getPaymentStatus(paymentId) {
        try {
            const response = await axios_1.default.get(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
                headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` }
            });
            return response.data;
        }
        catch (error) {
            console.error("Erro ao consultar pagamento:", error.response?.data || error.message);
            throw error;
        }
    }
    /**
     * Processa um pagamento direto usando um TOKEN de cartão (Checkout Transparente)
     */
    static async processPayment(data) {
        try {
            const response = await axios_1.default.post("https://api.mercadopago.com/v1/payments", {
                transaction_amount: Number(data.transaction_amount.toFixed(2)),
                token: data.token,
                description: data.description,
                installments: data.installments,
                payment_method_id: data.payment_method_id,
                payer: data.payer,
                notification_url: data.notification_url,
                external_reference: data.external_reference,
            }, {
                headers: {
                    Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
                    "X-Idempotency-Key": `pay-${Date.now()}`
                }
            });
            return response.data;
        }
        catch (error) {
            console.error("[MP API ERROR - Payment]:", JSON.stringify(error.response?.data || error.message, null, 2));
            throw error;
        }
    }
}
exports.MercadoPagoService = MercadoPagoService;
MercadoPagoService.clientId = process.env.MP_CLIENT_ID;
MercadoPagoService.clientSecret = process.env.MP_CLIENT_SECRET;
MercadoPagoService.redirectUri = process.env.MP_REDIRECT_URI;
