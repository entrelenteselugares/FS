import { prisma } from '../lib/prisma';
import { EmailService } from './email.service';

/**
 * CRMService: Inteligência de retenção e automação de vendas.
 */
export const CRMService = {
  /**
   * Processa carrinhos abandonados e envia e-mails de recuperação.
   * Regra: Pedidos PENDING, criados entre 2h e 24h atrás, que ainda não receberam lembrete.
   */
  async processAbandonedCarts() {
    console.log('[CRMService] Iniciando processamento de carrinhos abandonados...');
    
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    try {
      const pendingOrders = await prisma.order.findMany({
        where: {
          status: 'PENDENTE',
          hasPaid: false,
          abandonedEmailSentAt: null,
          createdAt: {
            lt: twoHoursAgo,
            gt: twentyFourHoursAgo
          }
        },
        include: {
          event: {
            select: {
              nomeNoivos: true
            }
          },
          cliente: {
            select: {
              email: true,
              nome: true
            }
          }
        }
      });

      console.log(`[CRMService] Encontrados ${pendingOrders.length} pedidos elegíveis para recuperação.`);

      for (const order of pendingOrders) {
        const targetEmail = order.cliente?.email || order.buyerEmail;
        
        if (!targetEmail) {
          console.warn(`[CRMService] Pedido ${order.id} sem e-mail de contato. Pulando.`);
          continue;
        }

        try {
          await EmailService.sendAbandonmentReminder(
            targetEmail,
            order.event.nomeNoivos,
            order.id,
            Number(order.valor)
          );

          // Marca como enviado para não repetir
          await prisma.order.update({
            where: { id: order.id },
            data: { abandonedEmailSentAt: new Date() }
          });

          console.log(`[CRMService] E-mail de recuperação enviado para ${targetEmail} (Pedido: ${order.id})`);
        } catch (error) {
          console.error(`[CRMService] Erro ao processar recuperação do pedido ${order.id}:`, error);
        }
      }

      return { processed: pendingOrders.length };
    } catch (error) {
      console.error('[CRMService] Erro crítico ao processar carrinhos abandonados:', error);
      throw error;
    }
  }
};
