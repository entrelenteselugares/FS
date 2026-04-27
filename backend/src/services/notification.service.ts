import nodemailer from "nodemailer";
import dotenv from "dotenv";
import https from "https";

dotenv.config();

// ─── CallMeBot WhatsApp Helper ────────────────────────────────────────────────
function sendWhatsApp(message: string): void {
  // Remove aspas extras que surgem de env vars mal formatadas na Vercel
  const phone  = (process.env.CALLMEBOT_PHONE  || "").replace(/"/g, "").trim();
  const apikey = (process.env.CALLMEBOT_APIKEY || "").replace(/"/g, "").trim();

  if (!phone || !apikey) {
    console.warn("[WhatsApp] CALLMEBOT_PHONE ou CALLMEBOT_APIKEY não configurados.",
      { phoneSet: !!phone, apikeySet: !!apikey });
    return;
  }

  const encodedMsg = encodeURIComponent(message);
  const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodedMsg}&apikey=${apikey}`;

  console.log(`[WhatsApp] Disparando notificação para ${phone}...`);

  https.get(url, (res) => {
    let body = "";
    res.on("data", (chunk) => { body += chunk; });
    res.on("end", () => {
      console.log(`[WhatsApp] CallMeBot | HTTP ${res.statusCode} | ${body.slice(0, 150)}`);
    });
  }).on("error", (err) => {
    console.error("[WhatsApp] Erro ao enviar notificação:", err.message);
  });
}


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
    tempPassword?: string;
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

        ${data.tempPassword ? `
        <div style="border: 1px dashed #ccc; padding: 20px; margin: 20px 0; font-size: 13px;">
          <p><strong>Aviso:</strong> Criamos uma conta automática para você gerenciar suas compras.</p>
          <p>E-mail: ${data.to}</p>
          <p>Senha Temporária: <strong>${data.tempPassword}</strong></p>
          <p style="color: #666; font-size: 11px;">Recomendamos alterar sua senha no primeiro acesso ao painel do cliente.</p>
        </div>
        ` : ""}
        
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

  /**
   * Envia boas-vindas e senha provisória para novo usuário
   */
  static async sendWelcomeEmail(data: {
    to: string;
    name: string;
    tempPassword?: string;
  }) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return;

    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #000;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="font-size: 24px; letter-spacing: 2px;">FOTO SEGUNDO.</h1>
          <hr style="border: 0.5px solid #eee;" />
        </div>
        
        <p>Olá, <strong>${data.name}</strong>,</p>
        <p>Seja bem-vindo(a) à Foto Segundo! Recebemos sua solicitação de reserva.</p>
        
        ${data.tempPassword ? `
        <div style="background: #f9f9f9; padding: 30px; border-radius: 8px; margin: 30px 0;">
          <p style="font-size: 14px; font-weight: bold; margin-bottom: 15px;">Seus dados de acesso:</p>
          <p style="font-size: 13px; margin: 5px 0;">E-mail: <strong>${data.to}</strong></p>
          <p style="font-size: 13px; margin: 5px 0;">Senha Temporária: <strong>${data.tempPassword}</strong></p>
          <p style="font-size: 11px; color: #666; margin-top: 15px;">Você poderá acompanhar seus pedidos e acessar seus álbuns em nosso painel do cliente.</p>
        </div>
        ` : `
        <p>Você já possui cadastro conosco. Utilize seu e-mail e senha habituais para acessar o painel e acompanhar seu pedido.</p>
        `}
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.APP_URL}/login" style="background: #000; color: #fff; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-size: 12px; font-weight: bold; text-transform: uppercase;">Acessar Meu Painel</a>
        </div>

        <hr style="border: 0.5px solid #eee; margin: 30px 0;" />
        <p style="text-align: center; font-size: 10px; color: #bbb; text-transform: uppercase; letter-spacing: 1px;">
          Foto Segundo &copy; ${new Date().getFullYear()} — Memórias que duram.
        </p>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: `"Foto Segundo" <${process.env.SMTP_USER}>`,
        to: data.to,
        subject: `Bem-vindo(a) à Foto Segundo! ✨`,
        html: htmlContent,
      });
      console.log(`[Notification] E-mail de boas-vindas enviado para ${data.to}`);
    } catch (error) {
      console.error("[Notification] Erro ao enviar e-mail de boas-vindas:", error);
    }
  }

  /**
   * Envia o e-mail de orçamento pronto após o Admin precificar
   */
  static async sendQuotationPricedEmail(data: {
    to: string;
    clientName: string;
    eventTitle: string;
    checkoutUrl: string;
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
        
        <p>Olá, <strong>${data.clientName}</strong>,</p>
        <p>O orçamento para o seu evento <strong>${data.eventTitle}</strong> já está disponível e pronto para reserva!</p>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 8px; text-align: center; margin: 30px 0;">
          <p style="font-size: 14px; color: #666; margin-bottom: 20px;">Para garantir sua data e confirmar a equipe, clique no botão abaixo para realizar o pagamento:</p>
          <a href="${data.checkoutUrl}" style="background: #85B9AC; color: #fff; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            CONFIRMAR RESERVA AGORA
          </a>
        </div>
        
        <p style="font-size: 12px; color: #666;">
          <strong>Importante:</strong> Após a confirmação do pagamento, seu álbum será gerado automaticamente e você poderá compartilhar o link com seus convidados.
        </p>
        
        <hr style="border: 0.5px solid #eee; margin: 30px 0;" />
        <p style="text-align: center; font-size: 10px; color: #bbb; text-transform: uppercase; letter-spacing: 1px;">
          Foto Segundo &copy; ${new Date().getFullYear()} — Excelência em fotografia.
        </p>
      </div>
    `;

    try {
      const info = await this.transporter.sendMail({
        from: `"Foto Segundo" <${process.env.SMTP_USER}>`,
        to: data.to,
        subject: `Seu Orçamento está pronto! ✨ ${data.eventTitle}`,
        html: htmlContent,
      });
      console.log("[Notification] E-mail de orçamento enviado:", info.messageId);
      return info;
    } catch (error) {
      console.error("[Notification] Erro ao enviar e-mail de orçamento:", error);
    }
  }

  // ─── WhatsApp Alerts (CallMeBot) ───────────────────────────────────────────

  /** Alerta para nova venda confirmada */
  static notifyNewSale(data: { buyerEmail: string; eventTitle: string; orderId: string; amount: number }) {
    sendWhatsApp(
      `💰 *VENDA CONFIRMADA — Foto Segundo*\n\n` +
      `📸 Evento: ${data.eventTitle}\n` +
      `🆔 Pedido: ${data.orderId.slice(-8).toUpperCase()}\n` +
      `💵 Valor: R$ ${Number(data.amount).toFixed(2)}\n` +
      `📧 Comprador: ${data.buyerEmail}`
    );
  }

  /** Alerta para novo lead/orçamento recebido */
  static notifyNewLead(data: { name: string; email: string; eventDate?: string; usageType?: string; locationType?: string }) {
    sendWhatsApp(
      `📋 *NOVO LEAD — Foto Segundo*\n\n` +
      `👤 Nome: ${data.name}\n` +
      `📧 E-mail: ${data.email}\n` +
      `📅 Data: ${data.eventDate || "Não informada"}\n` +
      `📍 Tipo: ${data.locationType === "PARTNER" ? "Unidade Fixa" : "Outro Local"} · ${data.usageType || ""}`
    );
  }

  /** Alerta para pagamento com status inesperado */
  static notifyPaymentIssue(data: { orderId: string; status: string; eventTitle: string }) {
    sendWhatsApp(
      `⚠️ *ALERTA DE PAGAMENTO — Foto Segundo*\n\n` +
      `📸 Evento: ${data.eventTitle}\n` +
      `🆔 Pedido: ${data.orderId.slice(-8).toUpperCase()}\n` +
      `❌ Status: ${data.status}`
    );
  }
  
  /** Alerta para orçamento aprovado (precificado) */
  static notifyQuotationApproved(data: { clientName: string; eventTitle: string; finalPrice: number }) {
    sendWhatsApp(
      `✨ *ORÇAMENTO PRECIFICADO — Foto Segundo*\n\n` +
      `👤 Cliente: ${data.clientName}\n` +
      `📸 Evento: ${data.eventTitle}\n` +
      `💵 Valor Final: R$ ${Number(data.finalPrice).toFixed(2)}\n\n` +
      `O cliente recebeu o e-mail para pagamento.`
    );
  }

  /** Alerta por E-mail para o Profissional quando um novo evento é atribuído a ele */
  static async notifyProfessionalNewAssignment(data: { 
    to: string; 
    profissionalName: string; 
    eventTitle: string; 
    eventDate: string;
    location: string;
  }) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return;

    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #000;">
        <h1 style="font-size: 20px; color: #85B9AC;">Novo Evento Atribuído! 📸</h1>
        <p>Olá, <strong>${data.profissionalName}</strong>,</p>
        <p>Um novo evento foi agendado em uma de suas unidades fixas e você foi designado para a captação.</p>
        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Evento:</strong> ${data.eventTitle}</p>
          <p><strong>Data:</strong> ${new Date(data.eventDate).toLocaleDateString("pt-BR")}</p>
          <p><strong>Local:</strong> ${data.location}</p>
        </div>
        <p>Acesse seu painel profissional para ver mais detalhes e confirmar a agenda.</p>
        <hr style="border: 0.5px solid #eee;" />
        <p style="font-size: 10px; color: #999; text-align: center;">Foto Segundo — Sistema de Gestão Tática</p>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: `"Foto Segundo" <${process.env.SMTP_USER}>`,
        to: data.to,
        subject: `Novo Evento: ${data.eventTitle} 📅`,
        html: htmlContent,
      });
    } catch (error: unknown) {
      console.error("[Notification] Erro ao notificar profissional:", error instanceof Error ? error.message : error);
    }
  }

  /**
   * Envia e-mail de recuperação de senha
   */
  static async sendPasswordRecoveryEmail(data: {
    to: string;
    name: string;
    recoveryLink: string;
  }) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return;

    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #000;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="font-size: 24px; letter-spacing: 2px;">FOTO SEGUNDO.</h1>
          <hr style="border: 0.5px solid #eee;" />
        </div>
        
        <p>Olá, <strong>${data.name}</strong>,</p>
        <p>Recebemos uma solicitação para redefinir a sua senha. Caso não tenha sido você, ignore este e-mail.</p>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 8px; text-align: center; margin: 30px 0;">
          <p style="font-size: 14px; color: #666; margin-bottom: 20px;">Clique no botão abaixo para escolher uma nova senha:</p>
          <a href="${data.recoveryLink}" style="background: #000; color: #fff; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            REDEFINIR MINHA SENHA
          </a>
        </div>
        
        <p style="font-size: 11px; color: #999;">
          O link acima é válido por tempo limitado. Caso o botão não funcione, copie e cole o endereço abaixo no seu navegador:<br/>
          ${data.recoveryLink}
        </p>
        
        <hr style="border: 0.5px solid #eee; margin: 30px 0;" />
        <p style="text-align: center; font-size: 10px; color: #bbb; text-transform: uppercase; letter-spacing: 1px;">
          Foto Segundo &copy; ${new Date().getFullYear()} — Segurança e confiança.
        </p>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: `"Foto Segundo" <${process.env.SMTP_USER}>`,
        to: data.to,
        subject: `Recuperação de Senha 🔒`,
        html: htmlContent,
      });
      console.log(`[Notification] E-mail de recuperação enviado para ${data.to}`);
      return true;
    } catch (error) {
      console.error("[Notification] Erro ao enviar e-mail de recuperação:", error);
      return false;
    }
  }
}
