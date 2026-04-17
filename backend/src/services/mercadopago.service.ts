import { MercadoPagoConfig, Payment } from "mercadopago";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

// Configuração do Cliente para Pagamentos (usando Access Token principal)
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN || "",
  options: { timeout: 5000 }
});

const payment = new Payment(client);

export interface SplitPartner {
  mpUserId: string;
  amount: number;
}

export class MercadoPagoService {
  private static clientId = process.env.MP_CLIENT_ID;
  private static clientSecret = process.env.MP_CLIENT_SECRET;
  private static redirectUri = process.env.MP_REDIRECT_URI;

  /**
   * Gera a URL de autorização OAuth para o parceiro
   */
  static getAuthorizationUrl(userId: string) {
    if (!this.clientId || !this.redirectUri) {
      throw new Error("Configurações de OAuth do Mercado Pago (MP_CLIENT_ID ou MP_REDIRECT_URI) ausentes no .env");
    }
    // O Mercado Pago exige o uso do client_id para gerar a URL de autorização
    return `https://auth.mercadopago.com.br/authorization?client_id=${this.clientId}&response_type=code&platform_id=mp&state=${userId}&redirect_uri=${encodeURIComponent(this.redirectUri!)}`;
  }

  /**
   * Troca o código de autorização pelo Access Token do parceiro
   */
  static async exchangeCode(code: string) {
    try {
      const response = await axios.post("https://api.mercadopago.com/oauth/token", {
        client_secret: this.clientSecret,
        client_id: this.clientId,
        grant_type: "authorization_code",
        code: code,
        redirect_uri: this.redirectUri,
      });
      return response.data;
    } catch (error: unknown) {
      const axiosErr = error as { response?: { data?: unknown }; message: string };
      console.error("Erro ao trocar código MP:", axiosErr.response?.data || axiosErr.message);
      throw new Error("Falha na autenticação com Mercado Pago");
    }
  }

  /**
   * Cria uma intenção de pagamento com SPLIT DINÂMICO (Marketplace)
   */
  static async createPayment(data: {
    transaction_amount: number;
    description: string;
    payment_method_id: string;
    payer_email: string;
    notification_url: string;
    partners: SplitPartner[]; 
    token?: string; 
    installments?: number;
    issuer_id?: number;
    matrizRate?: number; // Taxa dinâmica passada pelo controller
  }) {
    try {
      // Usa a taxa passada (Fase 5: Redistribuição) ou fallback do ENV/0.40
      const taxaMatriz = data.matrizRate ?? Number(process.env.TAXA_MATRIZ || 0.40);
      const applicationFee = Number((data.transaction_amount * taxaMatriz).toFixed(2));

      // Montagem dos desembolsos (disbursements)
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

      console.log(`[MP] Criando pagamento: R$ ${data.transaction_amount} | Fee: R$ ${applicationFee} (${(taxaMatriz * 100).toFixed(0)}%)`);
      
      const response = await payment.create({ body });
      return response;
    } catch (error: unknown) {
      const axiosErr = error as { response?: { data?: unknown }; message: string };
      console.error("[MP Error CreatePayment]:", axiosErr.response?.data || axiosErr.message);
      throw error;
    }
  }

  static async getPaymentStatus(paymentId: string) {
    try {
      const response = await payment.get({ id: paymentId });
      return response;
    } catch (error) {
      console.error("Erro ao consultar pagamento:", error);
      throw error;
    }
  }
}
