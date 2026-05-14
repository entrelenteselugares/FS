import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { CRMService } from '../services/crm.service';
import { EmailService } from '../services/email.service';

export const CRMController = {
  /**
   * Captura um novo lead.
   */
  async captureLead(req: Request, res: Response) {
    try {
      const { email, eventId, source, metadata } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email é obrigatório' });
      }

      const lead = await prisma.lead.create({
        data: {
          email,
          eventId,
          source: source || 'EVENT_GALLERY',
          metadata: metadata || {},
        },
        include: {
          event: { select: { nomeNoivos: true } }
        }
      });

      // Gatilho de Boas-vindas (Assíncrono)
      EmailService.sendEmail({
        to: email,
        subject: `Bem-vindo ao Foto Segundo | ${lead.event?.nomeNoivos || 'Galeria Profissional'}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #000; color: #fff; padding: 40px; border: 1px solid #333;">
            <h2 style="font-style: italic; text-transform: uppercase; letter-spacing: -1px;">Olá tático!</h2>
            <p>Seu e-mail foi cadastrado com sucesso para o evento <strong>${lead.event?.nomeNoivos || 'da nossa rede'}</strong>.</p>
            <p>Você receberá alertas exclusivos quando novas fotos forem liberadas e cupons táticos para suas compras.</p>
            <hr style="border: 0; border-top: 1px solid #333; margin: 20px 0;">
            <p style="font-size: 10px; color: #666;">Foto Segundo - O melhor da sua memória, eternizado.</p>
          </div>
        `
      }).catch(err => console.error('[CRM] Error sending welcome email:', err));

      return res.status(201).json(lead);
    } catch (error: any) {
      console.error('[CRM] Error capturing lead:', error);
      return res.status(500).json({ error: 'Erro ao capturar lead' });
    }
  },

  /**
   * Lista carrinhos abandonados (Pedidos PENDING há mais de 1 hora).
   */
  async getAbandonedCarts(req: Request, res: Response) {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      const abandonedOrders = await prisma.order.findMany({
        where: {
          status: 'PENDENTE',
          createdAt: {
            lt: oneHourAgo,
          },
          hasPaid: false,
        },
        include: {
          event: {
            select: {
              nomeNoivos: true,
            },
          },
          cliente: {
            select: {
              nome: true,
              email: true,
              whatsapp: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return res.json(abandonedOrders);
    } catch (error: any) {
      console.error('[CRM] Error fetching abandoned carts:', error);
      return res.status(500).json({ error: 'Erro ao buscar carrinhos abandonados' });
    }
  },

  /**
   * Lista todos os leads capturados.
   */
  async getLeads(req: Request, res: Response) {
    try {
      const leads = await prisma.lead.findMany({
        include: {
          event: {
            select: {
              nomeNoivos: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return res.json(leads);
    } catch (error: any) {
      console.error('[CRM] Error fetching leads:', error);
      return res.status(500).json({ error: 'Erro ao buscar leads' });
    }
  },

  /**
   * Gatilho manual/cron para processar recuperação.
   */
  async runRecoveryCron(req: Request, res: Response) {
    try {
      // Proteção simples por token via header (opcional, igual aos outros crons)
      const token = req.headers["authorization"];
      if (process.env.CRON_SECRET && token !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: "Não autorizado." });
      }

      const result = await CRMService.processAbandonedCarts();
      return res.json({ success: true, ...result });
    } catch (error: any) {
      console.error('[CRM] Error running recovery cron:', error);
      return res.status(500).json({ error: 'Erro ao executar cron de CRM' });
    }
  },

  /**
   * Estatísticas de conversão do CRM.
   */
  async getStats(req: Request, res: Response) {
    try {
      // 1. Total de e-mails de recuperação enviados
      const totalSent = await prisma.order.count({
        where: { recoverySentAt: { not: null } }
      });

      // 2. Total recuperado (Pedidos que receberam e-mail e foram PAGOS)
      const recoveredOrders = await prisma.order.findMany({
        where: {
          recoverySentAt: { not: null },
          hasPaid: true
        },
        select: { valor: true }
      });

      const recoveredRevenue = recoveredOrders.reduce((acc, curr) => acc + Number(curr.valor), 0);

      return res.json({
        totalSent,
        recoveredCount: recoveredOrders.length,
        recoveredRevenue
      });
    } catch (error: any) {
      console.error('[CRM] Error fetching stats:', error);
      return res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
  }
};
