import { Response } from "express";
import { AuthRequest } from "../lib/auth";
import prisma from "../lib/prisma";
import { PayoutStatus } from "@prisma/client";
import { ReportService } from "../services/report.service";
import { EmailService } from "../services/email.service";

/**
 * GET /api/admin/finance/balances
 * Retorna o saldo disponível e pendente de todos os profissionais
 */
export async function getProfessionalBalances(req: AuthRequest, res: Response): Promise<void> {
  try {
    const pros = await prisma.user.findMany({
      where: { role: "PROFISSIONAL" },
      select: { id: true, nome: true, email: true, pixKey: true }
    });

    const balances = await Promise.all(pros.map(async (pro) => {
      // Busca ordens onde ele é captador ou editor
      const orders = await prisma.order.findMany({
        where: {
          status: "APROVADO",
          OR: [
            { event: { captacaoId: pro.id } },
            { event: { edicaoId: pro.id } }
          ],
          // payoutSettlements relation doesn't exist in schema
        },
        select: {
          id: true,
          splitCaptacao: true,
          splitEdicao: true,
          payoutStatus: true,
          event: { select: { captacaoId: true, edicaoId: true } }
        }
      });

      let available = 0;
      let pending = 0;

      orders.forEach(o => {
        let amount = 0;
        if (o.event.captacaoId === pro.id) amount += Number(o.splitCaptacao || 0);
        if (o.event.edicaoId === pro.id) amount += Number(o.splitEdicao || 0);

        if (o.payoutStatus === "AVAILABLE") available += amount;
        else if (o.payoutStatus === "PENDING") pending += amount;
      });

      return {
        userId: pro.id,
        nome: pro.nome,
        email: pro.email,
        pixKey: pro.pixKey,
        availableBalance: available,
        pendingBalance: pending,
        orderCount: orders.length
      };
    }));

    // Remove quem não tem saldo nenhum
    res.json(balances.filter(b => b.availableBalance > 0 || b.pendingBalance > 0));
  } catch (err) {
    console.error("getProfessionalBalances:", err);
    res.status(500).json({ error: "Erro ao calcular saldos." });
  }
}

/**
 * POST /api/admin/finance/settle
 * Liquida o saldo de um profissional criando um Payout consolidado
 */
export async function settleProfessional(req: AuthRequest, res: Response): Promise<void> {
  const { userId, notes } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) { res.status(404).json({ error: "Usuário não encontrado." }); return; }

    const result = await prisma.$transaction(async (tx) => {
        // 1. Busca todas as ordens AVAILABLE que ainda não foram liquidadas para este usuário
        const orders = await tx.order.findMany({
          where: {
            status: "APROVADO",
            payoutStatus: "AVAILABLE",
            OR: [
              { event: { captacaoId: userId } },
              { event: { edicaoId: userId } }
            ]
          },
          include: { event: true }
        });

        if (orders.length === 0) {
          throw new Error("Nenhum saldo disponível para liquidação.");
        }

        // 2. Calcula montante total e agrupa dados
        let totalAmount = 0;
        let grossRevenue = 0;
        orders.forEach(o => {
          grossRevenue += Number(o.valor);
          if (o.event.captacaoId === userId) totalAmount += Number(o.splitCaptacao || 0);
          if (o.event.edicaoId === userId) totalAmount += Number(o.splitEdicao || 0);
        });

        // 3. Cria um Payout consolidado (usando o modelo WeeklyPayout como base de transação)
        const payout = await tx.weeklyPayout.create({
          data: {
            weekStart: new Date(), // Representa o momento da liquidação
            weekEnd: new Date(),
            totalRevenue: grossRevenue,
            totalPayout: totalAmount,
            notesAdmin: notes || `Liquidação avulsa Hub: ${user.nome}`,
            status: "PAID",
            paidAt: new Date(),
            items: {
              create: {
                recipientId: userId,
                recipientName: user.nome,
                recipientType: "PROFISSIONAL",
                pixKey: user.pixKey,
                amount: totalAmount,
                grossRevenue: grossRevenue,
                orderCount: orders.length,
                splitPct: (totalAmount / grossRevenue) * 100,
                status: "PAID",
                paidAt: new Date()
              }
            }
          },
          include: { items: true }
        });

        // 4. Marca as ordens como pagas usando updateMany para otimizar conexões do banco
        await tx.order.updateMany({
          where: { id: { in: orders.map(o => o.id) } },
          data: { payoutStatus: "PAID" }
        });

        return { payout, payoutItem: payout.items[0], totalAmount };
      });

      const { payout, payoutItem, totalAmount } = result;

    // 5. Enviar Recibo por E-mail (Async)
    try {
      const pdfBuffer = await ReportService.generatePayoutReceiptPDF({
        ...payoutItem,
        amount: Number(payoutItem.amount),
        payout: payout
      });
      
      EmailService.sendEmail({
        to: user.email,
        subject: `[Foto Segundo] Seu repasse de R$ ${totalAmount.toFixed(2)} foi processado!`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333; padding: 40px; border: 1px solid #eee; background: #fff;">
            <h1 style="color: #14b8a6; text-transform: uppercase; letter-spacing: -1px; margin-top: 0;">Repasse Efetuado</h1>
            <p>Olá <strong>${user.nome}</strong>,</p>
            <p>Informamos que o seu repasse referente às vendas aprovadas foi processado e liquidado com sucesso.</p>
            
            <div style="background: #f9fafb; padding: 25px; margin: 30px 0; border-radius: 4px; border-left: 4px solid #14b8a6;">
              <p style="margin: 0; font-size: 10px; text-transform: uppercase; color: #666; letter-spacing: 2px;">Valor Total</p>
              <p style="margin: 5px 0 0; font-size: 28px; font-weight: bold; color: #000;">R$ ${totalAmount.toFixed(2)}</p>
            </div>

            <p style="font-size: 14px; line-height: 1.6;">
              O comprovante detalhado está em anexo a este e-mail para seu controle financeiro e fiscal.
            </p>

            <hr style="border: none; border-top: 1px solid #eee; margin: 40px 0;" />
            
            <p style="font-size: 12px; color: #999;">
              Este é um e-mail automático. Em caso de dúvidas sobre os valores, consulte seu dashboard no Hub de Finanças.
            </p>
          </div>
        `,
        attachments: [
          {
            filename: `recibo-repasse-${payoutItem.id.slice(-6).toUpperCase()}.pdf`,
            content: pdfBuffer
          }
        ]
      }).catch(e => console.error("[SettleEmail] Error in async send:", e));
    } catch (emailErr) {
      console.error("[Settle] Erro ao gerar PDF de recibo:", emailErr);
    }

    res.json({ success: true, payout });
  } catch (err) {
    console.error("settleProfessional:", err);
    res.status(500).json({ error: "Erro ao processar liquidação." });
  }
}

/**
 * GET /api/admin/finance/subscriptions-mrr
 * Retorna o MRR (Monthly Recurring Revenue) e o número de assinaturas ativas
 */
export async function getSubscriptionStats(req: AuthRequest, res: Response): Promise<void> {
  try {
    const subscriptions = await prisma.subscription.findMany({
      where: {
        status: "ACTIVE"
      },
      select: {
        planPrice: true
      }
    });

    const totalActive = subscriptions.length;
    const mrr = subscriptions.reduce((sum, sub) => sum + Number(sub.planPrice), 0);

    // Calcular também as trials para acompanhamento
    const trials = await prisma.sharedAlbum.count({
      where: { subscriptionStatus: "TRIAL" }
    });

    res.json({
      mrr,
      totalActive,
      trials
    });
  } catch (err) {
    console.error("getSubscriptionStats:", err);
    res.status(500).json({ error: "Erro ao buscar métricas de assinaturas." });
  }
}
