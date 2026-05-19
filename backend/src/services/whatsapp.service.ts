import axios from "axios";

export class WhatsAppService {
  private static get baseUrl() {
    return process.env.WA_WORKER_URL || "http://localhost:3005";
  }

  private static get headers() {
    return {
      "x-api-key": process.env.WA_SECRET_KEY || "dev-secret-key"
    };
  }

  static async getQrCode() {
    try {
      const { data } = await axios.get(`${this.baseUrl}/status`);
      return {
        connected: data.connected,
        qr: data.qrCode || "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=FOTOSEGUNDO_WA_STUB"
      };
    } catch (error) {
      console.warn("[WhatsAppService] Erro ao buscar status do motor:", error);
      return {
        connected: false,
        qr: "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=MOTOR_OFFLINE"
      };
    }
  }

  static async getStatus() {
    try {
      const { data } = await axios.get(`${this.baseUrl}/status`);
      return { 
        connected: data.connected,
        qrCode: data.qrCode || null
      };
    } catch (error) {
      return { connected: false, qrCode: null };
    }
  }

  static async sendMessage(phone: string, message: string) {
    try {
      console.log(`[WhatsAppService] Solicitando envio para ${phone}`);
      await axios.post(
        `${this.baseUrl}/send`,
        { phone, message },
        { headers: this.headers }
      );
      return true;
    } catch (error) {
      console.warn("[WhatsAppService] Falha ao enviar mensagem:", error);
      return false;
    }
  }
}
