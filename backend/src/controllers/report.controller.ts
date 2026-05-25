import { Response } from "express";
import { AuthRequest } from "../lib/auth";
import prisma from "../lib/prisma";
import { ReportService } from "../services/report.service";

// Tipo local para compatibilidade com ReportService
interface SettlementRecord {
  amount: number | string;
  role: string;
  orderId: string;
  order: {
    total: number | string;
    createdAt: Date | string;
    event?: { title?: string } | null;
  };
}

/**
 * GET /api/profissional/reports/tax
 * Gera o relatório tributário consolidado do mês
 */
export async function getTaxReport(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user?.userId;
  if (!userId) { res.status(401).json({ error: "Não autorizado" }); return; }

  const { month, year, format } = req.query;
  const m = Number(month) || new Date().getMonth() + 1;
  const y = Number(year) || new Date().getFullYear();

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) { res.status(404).json({ error: "Usuário não encontrado" }); return; }

    const startOfMonth = new Date(y, m - 1, 1);
    const endOfMonth = new Date(y, m, 0, 23, 59, 59);

    const orders = await prisma.order.findMany({
      where: {
        status: "APROVADO",
        createdAt: { gte: startOfMonth, lte: endOfMonth },
        OR: [
          { event: { captacaoId: userId } },
          { event: { edicaoId: userId } }
        ]
      },
      include: {
        event: true
      }
    });

    const settlements: SettlementRecord[] = orders.map(o => {
      let amount = 0;
      let role = "";
      if (o.event.captacaoId === userId) {
        amount += Number(o.splitCaptacao || 0);
        role += "CAPTAÇÃO";
      }
      if (o.event.edicaoId === userId) {
        amount += Number(o.splitEdicao || 0);
        role += (role ? " + " : "") + "EDIÇÃO";
      }

      return {
        amount,
        role,
        orderId: o.id,
        order: {
          total: Number(o.valor),
          createdAt: o.createdAt,
          event: o.event
        }
      };
    });

    if (format === 'csv') {
      const csv = ReportService.generateTaxReportCSV(settlements);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=relatorio-fiscal-${m}-${y}.csv`);
      res.status(200).send(csv);
    } else {
      const pdfBuffer = await ReportService.generateTaxReportPDF(user, y, m, settlements);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=relatorio-fiscal-${m}-${y}.pdf`);
      res.status(200).send(pdfBuffer);
    }
  } catch (err) {
    console.error("[ReportController] Error generating tax report:", err);
    res.status(500).json({ error: "Erro ao gerar relatório." });
  }
}

/**
 * GET /api/profissional/reports/receipt/:payoutItemId
 * Gera o recibo de um repasse específico
 */
export async function getPayoutReceipt(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user?.userId;
  const id = req.params.id as string;

  try {
    const payoutItem = await prisma.payoutItem.findUnique({
      where: { id },
      include: {
        payout: true
      }
    });

    if (!payoutItem) { res.status(404).json({ error: "Recibo não encontrado" }); return; }
    
    // Segurança: Somente o destinatário ou Admin pode ver
    if (payoutItem.recipientId !== userId && req.user?.role !== 'ADMIN') {
      res.status(403).json({ error: "Acesso negado" });
      return;
    }

    const pdfBuffer = await ReportService.generatePayoutReceiptPDF({
      ...payoutItem,
      amount: Number(payoutItem.amount),
      payout: payoutItem.payout,
    });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=recibo-repasse-${id}.pdf`);
    res.status(200).send(pdfBuffer);
  } catch (err) {
    console.error("[ReportController] Error generating receipt:", err);
    res.status(500).json({ error: "Erro ao gerar recibo." });
  }
}

/**
 * GET /api/profissional/cashflow/projection
 * Retorna a projeção de recebimentos para os próximos 30 dias
 */
export async function getCashflowProjection(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user?.userId;
  if (!userId) { res.status(401).json({ error: "Não autorizado" }); return; }

  try {
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    const pendingOrders = await prisma.order.findMany({
      where: {
        status: "APROVADO",
        payoutStatus: "PENDING",
        OR: [
          { event: { captacaoId: userId } },
          { event: { edicaoId: userId } }
        ]
      },
      include: {
        event: true
      }
    });

    // Mapeamos para semanas
    const projection: Record<string, number> = {};

    pendingOrders.forEach(o => {
      let amount = 0;
      if (o.event.captacaoId === userId) amount += Number(o.splitCaptacao || 0);
      if (o.event.edicaoId === userId) amount += Number(o.splitEdicao || 0);

      // Data de liberação = createdAt do pedido + 7 dias
      const releaseDate = new Date(o.createdAt);
      releaseDate.setDate(releaseDate.getDate() + 7);

      if (releaseDate >= now && releaseDate <= thirtyDaysFromNow) {
        // Encontrar o início da semana (domingo ou segunda)
        const day = releaseDate.getDay();
        const diff = releaseDate.getDate() - day + (day === 0 ? -6 : 1); // Segunda-feira
        const weekStart = new Date(releaseDate.setDate(diff));
        const weekLabel = `Semana ${weekStart.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`;

        projection[weekLabel] = (projection[weekLabel] || 0) + amount;
      }
    });

    const data = Object.entries(projection).map(([week, amount]) => ({ week, amount }));
    res.json(data.sort());
  } catch (err) {
    console.error("[ReportController] Error calculating cashflow:", err);
    res.status(500).json({ error: "Erro ao calcular fluxo de caixa." });
  }
}
