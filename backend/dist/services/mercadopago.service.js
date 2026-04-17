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
const payment = new mercadopago_1.Payment(client);
class MercadoPagoService {
    /**
     * Gera a URL de autorização OAuth para o parceiro
     */
    static getAuthorizationUrl(userId) {
        if (!this.clientId || !this.redirectUri) {
            throw new Error("Configurações de OAuth do Mercado Pago (MP_CLIENT_ID ou MP_REDIRECT_URI) ausentes no .env");
        }
        // O Mercado Pago exige o uso do client_id para gerar a URL de autorização
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
     * Cria uma intenção de pagamento com SPLIT DINÂMICO (Marketplace)
     */
    static async createPayment(data) {
        try {
            // Taxa da Matriz (Foto Segundo) - Padrão 40%
            const taxaMatriz = Number(process.env.TAXA_MATRIZ || 0.40);
            const applicationFee = Number((data.transaction_amount * taxaMatriz).toFixed(2));
            // Montagem dos desembolsos (disbursements)
            // O MP espera que os disbursements somem o valor total líquido após a taxa da aplicação
            const disbursements = data.partners.map(p => ({
                id: p.mpUserId,
                amount: Number(p.amount.toFixed(2)),
            }));
            const body = {
                transaction_amount: data.transaction_amount,
                description: data.description,
                payment_method_id: data.payment_method_id,
                notification_url: data.notification_url,
                payer: {
                    email: data.payer_email,
                },
                application_fee: applicationFee,
                disbursements: disbursements.length > 0 ? disbursements : undefined,
                metadata: {
                    event_partners: data.partners,
                    source: "fotosegundo_app"
                },
                token: (data.payment_method_id !== "pix" && data.token) ? data.token : undefined,
                installments: (data.payment_method_id !== "pix" && data.token) ? data.installments || 1 : undefined,
                issuer_id: (data.payment_method_id !== "pix" && data.token) ? Number(data.issuer_id) : undefined,
            };
            console.log(`[MP] Criando pagamento: R$ ${data.transaction_amount} | Fee: R$ ${applicationFee}`);
            const response = await payment.create({ body });
            return response;
        }
        catch (error) {
            const axiosErr = error;
            console.error("[MP Error CreatePayment]:", axiosErr.response?.data || axiosErr.message);
            throw error;
        }
    }
    static async getPaymentStatus(paymentId) {
        try {
            const response = await payment.get({ id: paymentId });
            return response;
        }
        catch (error) {
            console.error("Erro ao consultar pagamento:", error);
            throw error;
        }
    }
}
exports.MercadoPagoService = MercadoPagoService;
MercadoPagoService.clientId = process.env.MP_CLIENT_ID;
MercadoPagoService.clientSecret = process.env.MP_CLIENT_SECRET;
MercadoPagoService.redirectUri = process.env.MP_REDIRECT_URI;
