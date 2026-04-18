import { MercadoPagoConfig, Preference } from "mercadopago";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

// Limpeza rigorosa do Access Token para evitar caracteres invisíveis no Header Authorization
const rawToken = process.env.MP_ACCESS_TOKEN || "";
const accessToken = rawToken
  .trim()
  .replace(/[\r\n\t]/g, "")
  .replace(/[^\x20-\x7E]/g, "");

if (accessToken) {
  console.log(`[MP] Token Sanitized. Length: ${accessToken.length} | Prefix: ${accessToken.slice(0, 10)}...`);
} else {
  console.error("[MP] CRITICAL: MP_ACCESS_TOKEN is missing or empty after sanitization!");
}

// Configuração do Cliente para Pagamentos
const client = new MercadoPagoConfig({
  accessToken: accessToken,
  options: { timeout: 5000 }
});

const preference = new Preference(client);

export interface SplitPartner {
  mpUserId: string;
  amount: number;
  role: string;
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
   * Cria uma PREFERÊNCIA de pagamento (Checkout Pro) com suporte a Marketplace/Split
   */
  static async createPreference(data: {
    transaction_amount: number;
    description: string;
    payer_email: string;
    notification_url: string;
    orderId: string;
    partners: SplitPartner[]; 
    matrizRate?: number;
  }) {
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
        auto_return: "approved" as const,
      };

      console.log(`[MP] Criando Preferência: R$ ${data.transaction_amount} | Fee Matriz: R$ ${marketplaceFee}`);
      
      const response = await preference.create({ body });
      return response;
    } catch (error: any) {
      if (error.response?.data) {
        console.error("[MP API ERROR]:", JSON.stringify(error.response.data, null, 2));
      } else {
        console.error("[MP Error CreatePreference]:", error.message || error);
      }
      throw error;
    }
  }

  static async getPaymentStatus(paymentId: string) {
    try {
      const response = await axios.get(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      return response.data;
    } catch (error: any) {
      console.error("Erro ao consultar pagamento:", error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Processa um pagamento direto usando um TOKEN de cartão (Checkout Transparente)
   */
  static async processPayment(data: {
    transaction_amount: number;
    token: string;
    description: string;
    installments: number;
    payment_method_id: string;
    payer: {
      email: string;
      identification?: { type: string; number: string };
    };
    notification_url?: string;
    external_reference?: string;
  }) {
    try {
      const response = await axios.post(
        "https://api.mercadopago.com/v1/payments",
        {
          transaction_amount: Number(data.transaction_amount.toFixed(2)),
          token: data.token,
          description: data.description,
          installments: data.installments,
          payment_method_id: data.payment_method_id,
          payer: data.payer,
          notification_url: data.notification_url,
          external_reference: data.external_reference,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "X-Idempotency-Key": `pay-${Date.now()}`
          }
        }
      );
      return response.data;
    } catch (error: any) {
      console.error("[MP API ERROR - Payment]:", JSON.stringify(error.response?.data || error.message, null, 2));
      throw error;
    }
  }
}
