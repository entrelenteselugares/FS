import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

/**
 * Serviço de Notificações Centralizado
 * Inicialmente via E-mail (SMTP / Gmail)
 */
export class NotificationService {
  private static transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 465,
    secure: true, // true para port 465
    auth: {
      user: process.env.SMTP_USER, // Seu e-mail (ex: contato@fotosegundo.com.br)
      pass: process.env.SMTP_PASS, // Sua Senha de App do Google
    },
  });

  /**
   * Envia o e-mail de acesso aos arquivos após aprovação do pagamento
   */
  static async sendAccessEmail(data: {
    to: string;
    buyerName: string;
    eventTitle: string;
    orderId: string;
    accessLink: string;
  }) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn("[Notification] SMTP credentials missing. Skipping email send.");
      return;
    }

    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #000;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="font-size: 24px; letter-spacing: 2px;">FOTO SEGUNDO.</h1>
          <hr style="border: 0.5px solid #eee;" />
        </div>
        
        <p>Olá, <strong>${data.buyerName}</strong>,</p>
        <p>Suas memórias estão prontas! O seu pagamento para o evento <strong>${data.eventTitle}</strong> foi confirmado com sucesso.</p>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 8px; text-align: center; margin: 30px 0;">
          <p style="font-size: 14px; color: #666; margin-bottom: 20px;">Clique no botão abaixo para acessar sua galeria exclusiva:</p>
          <a href="${data.accessLink}" style="background: #000; color: #fff; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            ACESSAR MEUS ARQUIVOS
          </a>
        </div>
        
        <p style="font-size: 12px; color: #999;">
          Número do Pedido: ${data.orderId}<br/>
          Caso tenha dúvidas, responda a este e-mail.
        </p>
        
        <hr style="border: 0.5px solid #eee; margin: 30px 0;" />
        <p style="text-align: center; font-size: 10px; color: #bbb; text-transform: uppercase; letter-spacing: 1px;">
          Foto Segundo &copy; ${new Date().getFullYear()} — Sincronizando memórias.
        </p>
      </div>
    `;

    try {
      const info = await this.transporter.sendMail({
        from: `"Foto Segundo" <${process.env.SMTP_USER}>`,
        to: data.to,
        subject: `Sua galeria está pronta! 📸 ${data.eventTitle}`,
        html: htmlContent,
      });
      console.log("[Notification] E-mail enviado:", info.messageId);
      return info;
    } catch (error) {
      console.error("[Notification] Erro ao enviar e-mail:", error);
    }
  }
}
