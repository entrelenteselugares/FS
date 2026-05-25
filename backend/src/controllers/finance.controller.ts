import { Response } from "express";
import { AuthRequest } from "../lib/auth";
import prisma from "../lib/prisma";

/**
 * Gera relatório de faturamento para o profissional, incluindo estimativa de impostos e taxas.
 * GET /api/profissional/finance/tax-report?start=YYYY-MM-DD&end=YYYY-MM-DD&format=csv
 */
export async function getTaxReport(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ error: "Não autenticado." });
    return;
  }

  const { start, end, format } = req.query;
  
  // Default: mês atual
  const startDate = start ? new Date(String(start)) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const endDate = end ? new Date(String(end)) : new Date();
  endDate.setHours(23, 59, 59, 999);

  try {
    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        status: { in: ["PAGO", "APROVADO"] },
        OR: [
          { event: { captacaoId: userId } },
          { editorId: userId }
        ]
      },
      include: {
        event: true
      },
      orderBy: { createdAt: "desc" }
    });

    const reportData = orders.map(o => {
      const isCaptacao = o.event.captacaoId === userId;
      // Pega o split correspondente ao papel do usuário no pedido
      const mySplit = isCaptacao ? Number(o.splitCaptacao || 0) : Number(o.splitEdicao || 0);
      const totalValue = Number(o.valor);
      const platformFee = totalValue - mySplit;
      const estimatedTax = mySplit * 0.06; // Estimativa padrão de 6% (Simples Nacional inicial)

      return {
        id: o.id,
        data: o.createdAt.toISOString().split('T')[0],
        evento: o.event.title,
        valorTotal: totalValue,
        taxaPlataforma: platformFee,
        recebimentoLiquido: mySplit,
        impostoEstimado: estimatedTax,
        tipo: isCaptacao ? "Captação" : "Edição"
      };
    });

    if (format === "csv") {
      let csv = "ID;Data;Evento;Tipo;Valor Total;Taxa Plataforma;Recebimento Liquido;Imposto Estimado (6%)\n";
      reportData.forEach(r => {
        csv += `${r.id};${r.data};${r.evento};${r.tipo};${r.valorTotal.toFixed(2).replace('.', ',')};${r.taxaPlataforma.toFixed(2).replace('.', ',')};${r.recebimentoLiquido.toFixed(2).replace('.', ',')};${r.impostoEstimado.toFixed(2).replace('.', ',')}\n`;
      });

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename=relatorio-tributario-${userId}-${Date.now()}.csv`);
      // BOM para Excel reconhecer UTF-8
      res.status(200).send("\uFEFF" + csv);
      return;
    }

    res.json({
      period: {
        start: startDate,
        end: endDate
      },
      summary: {
        totalOrders: reportData.length,
        totalRevenue: reportData.reduce((acc, r) => acc + r.valorTotal, 0),
        totalNet: reportData.reduce((acc, r) => acc + r.recebimentoLiquido, 0),
        totalTaxEstimate: reportData.reduce((acc, r) => acc + r.impostoEstimado, 0),
      },
      details: reportData
    });

  } catch (err) {
    console.error("[TaxReport] Erro:", err);
    res.status(500).json({ error: "Erro ao gerar relatório tributário." });
  }
}
