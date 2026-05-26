import nodemailer from 'nodemailer';

/**
 * Serviço de E-mail para comunicações táticas e transacionais.
 * Atualmente configurado para logar no console em desenvolvimento
 * ou usar SMTP se as variáveis de ambiente estiverem presentes.
 */
export const EmailService = {
  async sendEmail({ to, subject, html, text, attachments }: { to: string; subject: string; html?: string; text?: string, attachments?: any[] }) {
    console.log(`[EmailService] Simulando envio para: ${to}`);
    console.log(`[EmailService] Assunto: ${subject}`);
    
    // Configuração SMTP (opcional, para futura ativação)
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT) === 465,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        await transporter.sendMail({
          from: `"Foto Segundo" <${process.env.SMTP_USER}>`,
          to,
          subject,
          text,
          html,
          attachments,
        });

        console.log(`[EmailService] E-mail enviado com sucesso para ${to}`);
      } catch (error) {
        console.error(`[EmailService] Erro ao enviar e-mail real:`, error);
      }
    } else {
      console.log(`[EmailService] MOCK MODE: Conteúdo do e-mail omitido (Anexos: ${attachments?.length || 0})`);
    }
  },

  /**
   * Template: Lembrete de Carrinho Abandonado
   */
  async sendAbandonmentReminder(email: string, eventName: string, orderId: string, amount: number) {
    const checkoutUrl = `${process.env.FRONTEND_URL || 'https://fotosegundo.com'}/checkout/${orderId}`;
    
    await this.sendEmail({
      to: email,
      subject: `Esqueceu algo? Suas memórias de ${eventName} estão esperando!`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #000; color: #fff; padding: 40px; border: 1px solid #333;">
          <h2 style="font-style: italic; text-transform: uppercase; letter-spacing: -1px;">Não deixe suas memórias para trás</h2>
          <p style="font-size: 14px; color: #aaa; text-transform: uppercase; letter-spacing: 2px;">Vimos que você iniciou o checkout para o evento <strong>${eventName}</strong>.</p>
          
          <div style="margin: 30px 0; padding: 20px; border-left: 4px solid #14b8a6; background: #111;">
            <p style="margin: 0; font-size: 12px; color: #666; text-transform: uppercase;">Valor do Pedido</p>
            <p style="margin: 5px 0 0; font-size: 24px; font-weight: bold;">R$ ${amount.toFixed(2)}</p>
          </div>

          <p style="font-size: 14px; line-height: 1.6;">
            Garantimos que cada clique capturado é único. Não perca a oportunidade de eternizar esses momentos em alta resolução.
          </p>

          <a href="${checkoutUrl}" style="display: inline-block; background: #14b8a6; color: #000; text-decoration: none; padding: 15px 30px; font-weight: bold; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin-top: 20px;">
            Finalizar Compra Agora
          </a>

          <p style="margin-top: 40px; font-size: 10px; color: #444; border-top: 1px solid #222; pt: 20px;">
            Este é um e-mail automático do sistema Foto Segundo. Se você já finalizou este pedido, por favor desconsidere.
          </p>
        </div>
      `
    });
  },

  /**
   * Template: Aviso de expiração de Cofre (Vault)
   */
  async sendVaultExpiryWarning(email: string, vaultName: string, daysLeft: number, vaultId: string) {
    const vaultUrl = `${process.env.FRONTEND_URL || 'https://fotosegundo.com'}/vaults/${vaultId}`;
    
    await this.sendEmail({
      to: email,
      subject: `[Aviso] Seu cofre "${vaultName}" será bloqueado em ${daysLeft} dias!`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #000; color: #fff; padding: 40px; border: 1px solid #333;">
          <h2 style="font-style: italic; text-transform: uppercase; letter-spacing: -1px;">Seu período de teste está acabando</h2>
          <p style="font-size: 14px; color: #aaa;">O período gratuito de 30 dias para o cofre <strong>${vaultName}</strong> expira em <strong>${daysLeft} dias</strong>.</p>
          
          <div style="margin: 30px 0; padding: 20px; border-left: 4px solid #facc15; background: #111;">
            <p style="margin: 0; font-size: 14px; line-height: 1.6;">
              Após a expiração, as fotos ficarão bloqueadas para visualização e download até que você ative uma assinatura.
            </p>
          </div>

          <a href="${vaultUrl}" style="display: inline-block; background: #facc15; color: #000; text-decoration: none; padding: 15px 30px; font-weight: bold; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin-top: 10px;">
            Acessar Cofre e Assinar
          </a>
        </div>
      `
    });
  },

  /**
   * Template: Cofre Bloqueado
   */
  async sendVaultBlocked(email: string, vaultName: string, vaultId: string) {
    const vaultUrl = `${process.env.FRONTEND_URL || 'https://fotosegundo.com'}/vaults/${vaultId}`;
    
    await this.sendEmail({
      to: email,
      subject: `Seu cofre "${vaultName}" foi bloqueado.`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #000; color: #fff; padding: 40px; border: 1px solid #333;">
          <h2 style="font-style: italic; text-transform: uppercase; letter-spacing: -1px; color: #f87171;">Acesso Bloqueado</h2>
          <p style="font-size: 14px; color: #aaa;">O período gratuito de 30 dias para o cofre <strong>${vaultName}</strong> chegou ao fim.</p>
          
          <p style="font-size: 14px; line-height: 1.6;">
            Suas fotos ainda estão seguras conosco, mas o acesso (visualização e download) foi temporariamente suspenso.
            Para reativar o cofre imediatamente, inicie uma assinatura.
          </p>

          <a href="${vaultUrl}" style="display: inline-block; background: #f87171; color: #000; text-decoration: none; padding: 15px 30px; font-weight: bold; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin-top: 20px;">
            Reativar Cofre Agora
          </a>
        </div>
      `
    });
  }
};
