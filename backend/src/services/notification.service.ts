import nodemailer from "nodemailer";
import dotenv from "dotenv";
import https from "https";
import { FRONTEND_URL, APP_URL } from "../lib/config";
import { prisma } from "../lib/prisma";

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
      user: process.env.SMTP_USER, // Seu e-mail (ex: contatofotosegundo@gmail.com)
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
    guestToken?: string;
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
          <a href="${data.accessLink}${data.guestToken ? `?token=${data.guestToken}` : ''}" style="background: #000; color: #fff; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            ACESSAR MEUS ARQUIVOS
          </a>
        </div>

        ${data.guestToken ? `
        <div style="background: #fff8e1; border: 1px solid #ffe082; padding: 15px; border-radius: 4px; margin: 20px 0; font-size: 13px;">
          <p style="margin: 0;"><strong>Acesso Direto (Magic Link):</strong> Use o botão acima para acessar sem precisar de login.</p>
        </div>
        ` : ""}

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
    magicLink?: string;
    checkoutUrl?: string;
  }) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
       console.error("[Notification] ERRO: SMTP_USER ou SMTP_PASS não configurados para Boas-vindas.");
       return;
    }

    const htmlContent = `
      <div style="font-family: 'Outfit', sans-serif, Arial; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #111; background: #fff;">
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="font-size: 28px; letter-spacing: 6px; font-weight: 900; text-transform: uppercase; margin: 0;">FOTO SEGUNDO.</h1>
          <p style="font-size: 10px; letter-spacing: 4px; color: #85B9AC; text-transform: uppercase; margin-top: 10px; font-weight: bold;">Sincronizando Memórias</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin-top: 30px;" />
        </div>
        
        <p style="font-size: 16px; line-height: 1.6;">Olá, <strong>${data.name}</strong>,</p>
        <p style="font-size: 14px; line-height: 1.6; color: #444;">É um prazer ter você conosco! ${data.checkoutUrl ? 'Sua compra foi registrada. Para liberar o acesso à sua galeria, efetue o pagamento pelo link abaixo.' : 'Recebemos sua solicitação e nossa equipe já está trabalhando para garantir uma entrega impecável.'}</p>
         
         ${data.checkoutUrl ? `
         <div style="background: #f0faf8; border: 2px solid #85B9AC; padding: 30px; border-radius: 8px; margin: 35px 0; text-align: center;">
           <p style="font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; color: #85B9AC; margin-bottom: 15px;">⚡ Pagamento Pendente</p>
           <p style="font-size: 14px; color: #333; margin-bottom: 25px; line-height: 1.5;">Clique no botão abaixo para pagar via <strong>Pix, Cartão ou Boleto</strong>. Após a confirmação, seu acesso à galeria será liberado automaticamente.</p>
           <a href="${data.checkoutUrl}" style="background: #85B9AC; color: #fff; padding: 20px 40px; text-decoration: none; border-radius: 4px; font-size: 14px; font-weight: 900; text-transform: uppercase; letter-spacing: 3px; display: inline-block; box-shadow: 0 10px 30px rgba(133,185,172,0.4);">PAGAR AGORA →</a>
           <p style="font-size: 11px; color: #888; margin-top: 20px;">Pagamento 100% seguro via Mercado Pago. Acesso liberado em instantes após confirmação.</p>
         </div>
         ` : ''}

         ${data.tempPassword ? `
         <div style="background: #f8fcfb; border: 1px solid #e8f2f0; padding: 30px; border-radius: 4px; margin: 35px 0;">
           <p style="font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; color: #85B9AC; margin-bottom: 20px;">Sua Conta Exclusiva</p>
           <p style="font-size: 14px; margin: 8px 0; color: #222;">E-mail: <strong>${data.to}</strong></p>
           <p style="font-size: 14px; margin: 8px 0; color: #222;">Senha Provisória: <span style="background: #eee; padding: 4px 12px; font-family: monospace; font-size: 16px; font-weight: bold; border-radius: 4px;">${data.tempPassword}</span></p>
           <p style="font-size: 11px; color: #777; margin-top: 20px; line-height: 1.5;">⚠️ Altere sua senha após o primeiro acesso. Através do seu painel, você acompanhará o status do pedido e acessará sua galeria após o pagamento.</p>
         </div>
         ` : `
         <div style="padding: 20px 0; border-bottom: 1px solid #eee; margin-bottom: 30px;">
           <p style="font-size: 14px; color: #444;">Você já possui um cadastro ativo. Utilize suas credenciais habituais para acessar o portal.</p>
         </div>
         `}
         
         <div style="text-align: center; margin: 40px 0; display: flex; flex-direction: column; gap: 15px; align-items: center;">
           ${data.magicLink ? `
             <a href="${data.magicLink}" style="background: #85B9AC; color: #fff; padding: 18px 35px; text-decoration: none; border-radius: 2px; font-size: 13px; font-weight: 900; text-transform: uppercase; letter-spacing: 3px; display: inline-block; width: 280px; box-shadow: 0 10px 20px rgba(133,185,172,0.2);">Acessar Galeria</a>
           ` : ""}
           <a href="${APP_URL}/login" style="background: #111; color: #fff; padding: 18px 35px; text-decoration: none; border-radius: 2px; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 3px; display: inline-block; width: 280px;">Acessar Portal do Cliente</a>
         </div>
        </div>

        <div style="font-size: 11px; color: #999; line-height: 1.6; text-align: center; margin-top: 50px;">
          <p>Este é um e-mail automático. Para falar com um consultor, responda a este e-mail ou utilize nossos canais oficiais.</p>
          <hr style="border: 0; border-top: 1px solid #f5f5f5; margin: 30px 0;" />
          <p style="text-transform: uppercase; letter-spacing: 2px;">Foto Segundo &copy; ${new Date().getFullYear()} — Excelência e Tecnologia</p>
        </div>
      </div>
    `;

    const subject = data.checkoutUrl
      ? `Sua compra na Foto Segundo — Clique para pagar 🛒`
      : `Bem-vindo(a) à Foto Segundo! ✨`;

    try {
      await this.transporter.sendMail({
        from: `"Foto Segundo" <${process.env.SMTP_USER}>`,
        to: data.to,
        subject,
        html: htmlContent,
      });
      console.log(`[Notification] E-mail de boas-vindas enviado para ${data.to} | Checkout: ${!!data.checkoutUrl}`);
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
      <div style="font-family: 'Outfit', sans-serif, Arial; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #111; background: #fff;">
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="font-size: 28px; letter-spacing: 6px; font-weight: 900; text-transform: uppercase; margin: 0;">FOTO SEGUNDO.</h1>
          <p style="font-size: 10px; letter-spacing: 4px; color: #85B9AC; text-transform: uppercase; margin-top: 10px; font-weight: bold;">Proposta de Investimento</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin-top: 30px;" />
        </div>
        
        <p style="font-size: 16px; line-height: 1.6;">Olá, <strong>${data.clientName}</strong>,</p>
        <p style="font-size: 14px; line-height: 1.6; color: #444;">Temos o prazer de informar que o orçamento para o seu evento <strong>${data.eventTitle}</strong> foi finalizado por nossa diretoria técnica.</p>
        
        <div style="background: #f8fcfb; border: 1px solid #e8f2f0; padding: 35px; border-radius: 4px; margin: 35px 0; text-align: center;">
          <p style="font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 3px; color: #85B9AC; margin-bottom: 10px;">ID DA PROPOSTA</p>
          <p style="font-size: 18px; font-weight: 900; color: #111; margin-bottom: 30px; letter-spacing: 1px;">ORC-${data.checkoutUrl.split("orderId=")[1]?.slice(-4).toUpperCase() || 'PROPOSTA'}</p>
          
          <p style="font-size: 13px; color: #666; margin-bottom: 25px; line-height: 1.6;">Para garantir a disponibilidade da nossa equipe e as condições exclusivas desta proposta, você pode realizar a reserva através do link seguro abaixo:</p>
          
          <a href="${data.checkoutUrl}" style="background: #111; color: #fff; padding: 20px 40px; text-decoration: none; border-radius: 2px; font-size: 13px; font-weight: 900; text-transform: uppercase; letter-spacing: 3px; display: inline-block; box-shadow: 0 10px 20px rgba(0,0,0,0.1);">
            CONFIRMAR RESERVA IMEDIATA
          </a>
        </div>
        
        <div style="border-left: 3px solid #85B9AC; padding: 20px; margin: 30px 0; background: #fafafa;">
          <p style="font-size: 12px; color: #444; margin: 0; line-height: 1.6;">
            <strong>Próximos Passos:</strong><br/>
            1. Confirmação do pagamento seguro.<br/>
            2. Atribuição imediata da equipe técnica.<br/>
            3. Liberação do painel de acompanhamento tático.
          </p>
        </div>
        
        <p style="font-size: 11px; color: #999; text-align: center; margin-top: 40px;">
          Esta proposta tem validade de 48 horas. Após este período, a disponibilidade da data pode ser alterada.
        </p>
        
        <hr style="border: 0; border-top: 1px solid #eee; margin: 40px 0;" />
        <p style="text-align: center; font-size: 10px; color: #bbb; text-transform: uppercase; letter-spacing: 2px;">
          Foto Segundo &copy; ${new Date().getFullYear()} — Sincronizando Memórias com Excelência.
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
  static async notifyNewSale(data: { buyerEmail: string; eventTitle: string; orderId: string; amount: number }) {
    sendWhatsApp(
      `💰 *VENDA CONFIRMADA — Foto Segundo*\n\n` +
      `📸 Evento: ${data.eventTitle}\n` +
      `🆔 Pedido: ${data.orderId.slice(-8).toUpperCase()}\n` +
      `💵 Valor: R$ ${Number(data.amount).toFixed(2)}\n` +
      `📧 Comprador: ${data.buyerEmail}`
    );

    try {
      const adminUsers = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
      for (const admin of adminUsers) {
        await this.createInApp({
          userId: admin.id,
          type: "ORDER_CREATED",
          title: "Nova Venda Confirmada 💰",
          body: `Pedido ${data.orderId.slice(-8).toUpperCase()} de R$ ${Number(data.amount).toFixed(2)} confirmado para o evento ${data.eventTitle}.`,
          refId: data.orderId,
          refType: "order"
        });
      }
    } catch (e) {
      console.error("[Notification] Erro ao criar InApp para admin (notifyNewSale):", e);
    }
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

  /** Alerta de Baixo Estoque (B2B Hub) */
  static async notifyLowStock(data: { to: string; name: string; currentBalance: number }) {
    // Notificação Interna (CallMeBot Principal)
    sendWhatsApp(
      `⚠️ *ALERTA DE ESTOQUE — B2B Hub*\n\n` +
      `🏢 Franquia: ${data.name}\n` +
      `📉 Saldo Atual: ${data.currentBalance} créditos\n` +
      `🚨 Status: ABAIXO DO LIMITE CRÍTICO\n\n` +
      `Sugerida recompra imediata via painel.`
    );

    // Notificação para o Franqueado (Bot Direto)
    this.sendWhatsAppToClient(data.to, 
      `🚨 *ALERTA DE INSUMOS — Foto Segundo*\n\n` +
      `Olá, *${data.name}*! Notamos que seu saldo de créditos atingiu um nível crítico (*${data.currentBalance} fotos*).\n\n` +
      `Para evitar interrupções na sua máquina de impressão, realize a recarga agora pelo seu dashboard:\n` +
      `👉 ${APP_URL}/franquia`
    );
  }

  /** Mensagem de Re-engajamento (Loyalty) */
  static sendLoyaltyMessage(data: { clientName: string; eventTitle: string; whatsapp: string; type: "6_MONTHS" | "1_YEAR" }) {
    const timeLabel = data.type === "6_MONTHS" ? "6 meses" : "1 ano";
    const message = 
      `✨ *MEMÓRIAS ETERNAS — Foto Segundo*\n\n` +
      `Olá, *${data.clientName}*! Faz ${timeLabel} que vivemos as emoções do evento *${data.eventTitle}*.\n\n` +
      `Que tal transformar essas memórias digitais em algo palpável? 📸\n\n` +
      `Aproveite nossa condição exclusiva para álbuns impressos de luxo esta semana. Acesse sua galeria ou responda aqui para saber mais!`;

    // No NotificationService atual, sendWhatsApp usa CALLMEBOT_PHONE (notificação interna).
    // Para o bot de fidelidade, precisamos enviar para o CLIENTE.
    // Vou criar um helper sendWhatsAppToClient ou adaptar o sendWhatsApp.
    this.sendWhatsAppToClient(data.whatsapp, message);
  }

  private static sendWhatsAppToClient(phone: string, message: string): void {
    const apikey = (process.env.CALLMEBOT_APIKEY || "").replace(/"/g, "").trim();
    if (!apikey) return;

    // Limpa o telefone (apenas números)
    const cleanPhone = phone.replace(/\D/g, "");
    if (!cleanPhone) return;

    const encodedMsg = encodeURIComponent(message);
    const url = `https://api.callmebot.com/whatsapp.php?phone=${cleanPhone}&text=${encodedMsg}&apikey=${apikey}`;

    https.get(url, (res) => {
      console.log(`[LoyaltyBot] Enviado para ${cleanPhone} | Status: ${res.statusCode}`);
    }).on("error", (err) => {
      console.error("[LoyaltyBot] Erro:", err.message);
    });
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

  /** Notifica o dono que o evento foi encerrado automaticamente */
  static async notifyEventAutoClosed(data: { to: string; ownerName: string; eventTitle: string }) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return;

    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #000;">
        <h1 style="font-size: 20px; color: #ff4444;">Evento Encerrado 🔒</h1>
        <p>Olá, <strong>${data.ownerName}</strong>,</p>
        <p>O evento <strong>${data.eventTitle}</strong> atingiu o prazo limite e foi encerrado automaticamente pelo sistema.</p>
        <p>A galeria pública não está mais disponível para novas compras. Você ainda pode gerenciar o evento através do seu painel profissional.</p>
        <hr style="border: 0.5px solid #eee;" />
        <p style="font-size: 10px; color: #999; text-align: center;">Foto Segundo — Gestão Automatizada</p>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: `"Foto Segundo" <${process.env.SMTP_USER}>`,
        to: data.to,
        subject: `Evento Encerrado: ${data.eventTitle}`,
        html: htmlContent,
      });
    } catch (error) {
      console.error("[Notification] Erro ao notificar encerramento de evento:", error);
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
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error("[Notification] ERRO: SMTP_USER ou SMTP_PASS não configurados na Vercel.");
      return false;
    }

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

  /**
   * Notifica um profissional que ele foi adicionado à rede de outro profissional (Empatia)
   */
  static async notifyNewNetworkPartner(data: {
    to: string;
    partnerName: string;
    userName: string;
    whatsapp?: string | null;
  }) {
    // 1. Notificação por E-mail
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      const htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #000;">
          <h1 style="font-size: 20px; color: #85B9AC;">Você foi adicionado a uma Rede de Empatia! ✨</h1>
          <p>Olá, <strong>${data.partnerName}</strong>,</p>
          <p>O profissional <strong>${data.userName}</strong> acabou de adicionar você à rede de parceiros favoritos dele na Foto Segundo.</p>
          <p>Isso significa que ele confia no seu trabalho e poderá delegar eventos ou edições para você no futuro.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${APP_URL}/profissional" style="background: #000; color: #fff; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              VER MEU PAINEL
            </a>
          </div>
          <hr style="border: 0.5px solid #eee;" />
          <p style="font-size: 10px; color: #999; text-align: center;">Foto Segundo — Conectando os melhores talentos.</p>
        </div>
      `;

      try {
        await this.transporter.sendMail({
          from: `"Foto Segundo" <${process.env.SMTP_USER}>`,
          to: data.to,
          subject: `${data.userName} adicionou você à rede de parcerias! ✨`,
          html: htmlContent,
        });
      } catch (e: any) {
        console.error("[Notification] Erro e-mail parceria:", e.message);
      }
    }

    // 2. Notificação por WhatsApp (se disponível)
    if (data.whatsapp) {
      const msg = `✨ *NOVA CONEXÃO — Foto Segundo*\n\nOlá, *${data.partnerName}*! O profissional *${data.userName}* adicionou você à rede de parcerias dele.\n\nFique atento aos novos chamados de delegacia de eventos e edições! 📸`;
      this.sendWhatsAppToClient(data.whatsapp, msg);
    }
  }

  /**
   * Notifica um franqueado sobre um novo pedido de impressão (Cofre)
   */
  static async sendVaultOrderToFranchisee(data: {
    franchiseeEmail: string;
    franchiseePhone: string;
    franchiseeName: string;
    orderId: string;
    customerName: string;
    driveLink: string;
  }) {
    const message = `🖨️ *NOVO PEDIDO DE IMPRESSÃO — Foto Segundo*\n\n` +
      `Olá, *${data.franchiseeName}*! Você recebeu um novo pedido de materialização (Cofre).\n\n` +
      `👤 Cliente: ${data.customerName}\n` +
      `🆔 Pedido: ${data.orderId.slice(-8).toUpperCase()}\n\n` +
      `📸 *LINK PARA IMPRESSÃO (DRIVE):*\n${data.driveLink}\n\n` +
      `Por favor, processe o envio e atualize o status no painel.`;

    this.sendWhatsAppToClient(data.franchiseePhone, message);

    // E-mail para o Franqueado
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      const htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #000;">
          <h1 style="font-size: 20px; color: #111;">Novo Pedido de Impressão (Cofre) 🖨️</h1>
          <p>Olá, <strong>${data.franchiseeName}</strong>,</p>
          <p>Um novo pedido de materialização foi roteado para você devido à sua proximidade com o cliente.</p>
          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Pedido:</strong> ${data.orderId}</p>
            <p><strong>Cliente:</strong> ${data.customerName}</p>
            <p><strong>Fotos para Impressão:</strong> Até 36 fotos</p>
          </div>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${data.driveLink}" style="background: #000; color: #fff; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              ACESSAR FOTOS NO DRIVE
            </a>
          </p>
          <hr style="border: 0.5px solid #eee;" />
          <p style="font-size: 10px; color: #999; text-align: center;">Foto Segundo — Unidade de Produção Tática</p>
        </div>
      `;

      try {
        await this.transporter.sendMail({
          from: `"Foto Segundo" <${process.env.SMTP_USER}>`,
          to: data.franchiseeEmail,
          subject: `NOVO PEDIDO DE IMPRESSÃO: ${data.customerName} 🖨️`,
          html: htmlContent,
        });
      } catch (e) { console.error("[Notification] Erro e-mail franqueado:", e); }
    }
  }

  /**
   * Notifica a Matriz sobre um novo pedido de impressão (Cofre)
   */
  static async sendVaultOrderToMatrix(data: {
    orderId: string;
    customerName: string;
    driveLink: string;
  }) {
    const message = `🏢 *NOVO PEDIDO (MATRIZ) — Foto Segundo*\n\n` +
      `Nenhum franqueado próximo encontrado. Pedido roteado para a Matriz.\n\n` +
      `👤 Cliente: ${data.customerName}\n` +
      `🆔 Pedido: ${data.orderId.slice(-8).toUpperCase()}\n\n` +
      `📸 *LINK PARA IMPRESSÃO (DRIVE):*\n${data.driveLink}`;

    sendWhatsApp(message); // Notificação interna para o admin/matriz

    // E-mail para a Matriz
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      const htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #000;">
          <h1 style="font-size: 20px; color: #111;">Novo Pedido Matriz (Cofre) 🏢</h1>
          <p>O pedido <strong>${data.orderId}</strong> do cliente <strong>${data.customerName}</strong> foi roteado para a Matriz.</p>
          <p>Acesse o Drive para realizar a impressão:</p>
          <p><a href="${data.driveLink}">${data.driveLink}</a></p>
        </div>
      `;

      try {
        await this.transporter.sendMail({
          from: `"Foto Segundo" <${process.env.SMTP_USER}>`,
          to: process.env.ADMIN_EMAIL || "contatofotosegundo@gmail.com",
          subject: `NOVO PEDIDO MATRIZ: ${data.customerName} 🏢`,
          html: htmlContent,
        });
      } catch (e) { console.error("[Notification] Erro e-mail matriz:", e); }
    }
  }

  /**
   * Cria uma notificação in-app para um usuário específico.
   * Deduplicação: ignora se já existe (userId + type + refId) nos últimos 5 min.
   * Prune: mantém no máximo 200 notificações por usuário.
   */
  static async createInApp({
    userId, type, title, body, refId, refType
  }: {
    userId: string;
    type: string;
    title: string;
    body: string;
    refId?: string;
    refType?: string;
  }) {
    try {
      if (refId) {
        const recent = await prisma.notification.findFirst({
          where: { userId, type, refId, createdAt: { gt: new Date(Date.now() - 5 * 60 * 1000) } }
        });
        if (recent) return recent;
      }
      const count = await prisma.notification.count({ where: { userId } });
      if (count >= 200) {
        const oldest = await prisma.notification.findMany({
          where: { userId }, orderBy: { createdAt: "asc" }, take: count - 199, select: { id: true }
        });
        if (oldest.length > 0) {
          await prisma.notification.deleteMany({ where: { id: { in: oldest.map(n => n.id) } } });
        }
      }
      return await prisma.notification.create({
        data: { userId, type, title, body, refId, refType, read: false }
      });
    } catch (err) {
      console.error("[Notification] createInApp error:", err);
      return null;
    }
  }

  /** Notifica o admin de um novo serviço personalizado */
  static async notifyAdminNewService(data: { creatorName: string; serviceName: string; price: number; justification: string | null; isUpdate?: boolean }) {
    const title = data.isUpdate ? `Serviço Editado: ${data.serviceName}` : `Novo Serviço: ${data.serviceName}`;
    const action = data.isUpdate ? "editou" : "submeteu";
    
    // In-App Notification (para Admin)
    const adminUsers = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true, email: true } });
    for (const admin of adminUsers) {
      await this.createInApp({
        userId: admin.id,
        type: "ADMIN_SERVICE_PENDING",
        title: "Avaliação Pendente",
        body: `${data.creatorName} ${action} o serviço "${data.serviceName}".`
      });
    }

    sendWhatsApp(
      `🔔 *SERVIÇO PENDENTE — Foto Segundo*\n\n` +
      `👤 Criador: ${data.creatorName}\n` +
      `🛠️ Serviço: ${data.serviceName}\n` +
      `💵 Preço Base: R$ ${data.price.toFixed(2)}\n\n` +
      `Acesse o painel admin para avaliar.`
    );
  }

  /** Notifica o criador do serviço sobre o resultado da avaliação */
  static async notifyServiceReviewOutcome(data: { creatorEmail?: string | null; creatorName: string; serviceName: string; outcome: string; reason: string | null }) {
    let outcomeText = "avaliado";
    let statusEmoji = "📝";
    
    if (data.outcome === "NETWORK") { outcomeText = "Publicado na Rede"; statusEmoji = "🌐"; }
    else if (data.outcome === "EXCLUSIVE") { outcomeText = "Mantido Exclusivo"; statusEmoji = "✅"; }
    else if (data.outcome === "REJECTED") { outcomeText = "Recusado"; statusEmoji = "❌"; }
    else if (data.outcome === "NEEDS_ADJUSTMENT") { outcomeText = "Ajustes Solicitados"; statusEmoji = "✏️"; }

    if (data.creatorEmail && process.env.SMTP_USER && process.env.SMTP_PASS) {
      const htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #000;">
          <h1 style="font-size: 20px; color: #111;">Resultado da Avaliação de Serviço ${statusEmoji}</h1>
          <p>Olá, <strong>${data.creatorName}</strong>,</p>
          <p>O serviço personalizado <strong>${data.serviceName}</strong> foi avaliado pela administração.</p>
          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Status:</strong> ${outcomeText}</p>
            ${data.reason ? `<p><strong>Observação da Admin:</strong> ${data.reason}</p>` : ''}
          </div>
          <p>Acesse a aba Portfólio & Serviços do seu painel para ver mais detalhes.</p>
          <hr style="border: 0.5px solid #eee;" />
        </div>
      `;
      try {
        await this.transporter.sendMail({
          from: `"Foto Segundo" <${process.env.SMTP_USER}>`,
          to: data.creatorEmail,
          subject: `Avaliação do Serviço: ${data.serviceName} ${statusEmoji}`,
          html: htmlContent,
        });
      } catch (e) { console.error("[Notification] Erro e-mail review outcome:", e); }
    }
    
    if (data.creatorEmail) {
      const creator = await prisma.user.findUnique({ where: { email: data.creatorEmail }, select: { id: true, whatsapp: true } });
      if (creator) {
        await this.createInApp({
          userId: creator.id,
          type: "SERVICE_REVIEW",
          title: `Serviço ${outcomeText}`,
          body: `O serviço "${data.serviceName}" foi avaliado.`
        });
        
        if (creator.whatsapp) {
          this.sendWhatsAppToClient(creator.whatsapp, 
            `${statusEmoji} *AVALIAÇÃO DE SERVIÇO — Foto Segundo*\n\n` +
            `Seu serviço *${data.serviceName}* foi avaliado.\n` +
            `Status: ${outcomeText}\n` +
            (data.reason ? `Obs: ${data.reason}\n` : '') +
            `\nAcesse seu painel para detalhes.`
          );
        }
      }
    }
  }
}
