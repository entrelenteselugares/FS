import { Response } from "express";
import { AuthRequest } from "../lib/auth";
import prisma from "../lib/prisma";

// Gera o relatório semanal de repasse
export async function generateWeeklyPayout(req: AuthRequest, res: Response): Promise<void> {
  try {
    // Semana anterior: segunda a domingo (pois geramos na segunda o repasse da semana que passou)
    // Para simplificar, vamos pegar os últimos 7 dias ou a semana atual se o usuário preferir.
    // O pedido do usuário sugere "semana atual".
    
    const now = new Date();
    const day = now.getDay(); // 0=dom, 1=seg...
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() + diffToMonday);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // Busca configurações de split
    const configs = await prisma.platformConfig.findMany({
      where: { key: { in: ["split_captacao", "split_edicao", "split_cartorio"] } },
    });
    const getConfig = (key: string) =>
      Number(configs.find((c) => c.key === key)?.value ?? 0) / 100;

    // Pedidos aprovados na semana
    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: weekStart, lte: weekEnd },
        status: { in: ["APPROVED", "APROVADO"] as any },
      },
      include: {
        event: {
          include: {
            cartorioUser: true,
            captacao: true,
            edicao:   true,
          },
        },
      },
    });

    if (orders.length === 0) {
      res.status(400).json({ error: "Nenhum pedido aprovado nesta semana." });
      return;
    }

    const totalRevenue = orders.reduce((acc, o) => acc + Number(o.valor), 0);

    // Agrega por beneficiário
    const beneficiarios: Record<string, {
      recipientType: string;
      recipientId: string;
      recipientName: string;
      pixKey: string | null;
      splitPct: number;
      grossRevenue: number;
      orderCount: number;
    }> = {};

    const addBeneficiario = (
      type: string,
      userId: string,
      name: string,
      splitPct: number,
      orderAmount: number
    ) => {
      const key = `${type}_${userId}`;
      if (!beneficiarios[key]) {
        beneficiarios[key] = {
          recipientType: type,
          recipientId: userId,
          recipientName: name,
          pixKey: null,
          splitPct: splitPct * 100,
          grossRevenue: 0,
          orderCount: 0,
        };
      }
      beneficiarios[key].grossRevenue += orderAmount;
      beneficiarios[key].orderCount += 1;
    };

    for (const order of orders) {
      const amount = Number(order.valor);
      const { captacao, edicao, cartorioUser } = order.event;

      if (captacao) addBeneficiario("CAPTACAO", captacao.id, captacao.nome, getConfig("split_captacao"), amount);
      if (edicao)   addBeneficiario("EDICAO", edicao.id, edicao.nome, getConfig("split_edicao"), amount);
      if (cartorioUser) addBeneficiario("CARTORIO", cartorioUser.id, cartorioUser.nome, getConfig("split_cartorio"), amount);
    }

    // Busca chaves Pix dos usuários
    for (const key of Object.keys(beneficiarios)) {
      const b = beneficiarios[key];
      const user = await prisma.user.findUnique({
        where: { id: b.recipientId },
        select: { pixKey: true, whatsapp: true },
      });
      beneficiarios[key].pixKey = user?.pixKey ?? user?.whatsapp ?? null;
    }

    // Calcula valores
    const items = Object.values(beneficiarios).map((b) => ({
      ...b,
      amount: Number((b.grossRevenue * (b.splitPct / 100)).toFixed(2)),
    }));

    const totalPayout = items.reduce((acc, i) => acc + i.amount, 0);

    // Cria o relatório
    const payout = await prisma.weeklyPayout.create({
      data: {
        weekStart,
        weekEnd,
        totalRevenue,
        totalPayout,
        items: {
          create: items.map((item) => ({
            recipientType: item.recipientType,
            recipientId: item.recipientId,
            recipientName: item.recipientName,
            pixKey: item.pixKey,
            orderCount: item.orderCount,
            grossRevenue: item.grossRevenue,
            splitPct: item.splitPct,
            amount: item.amount,
          })),
        },
      },
      include: { items: true },
    });

    res.status(201).json(payout);
  } catch (err) {
    console.error("generateWeeklyPayout:", err);
    res.status(500).json({ error: "Erro ao gerar relatório." });
  }
}

// GET /api/admin/payouts
export async function listPayouts(req: AuthRequest, res: Response): Promise<void> {
  try {
    const payouts = await prisma.weeklyPayout.findMany({
      orderBy: { weekStart: "desc" },
      include: {
        items: true,
        _count: { select: { items: true } },
      },
    });
    res.json(payouts);
  } catch {
    res.status(500).json({ error: "Erro ao listar repasses." });
  }
}

// PATCH /api/admin/payouts/:id/items/:itemId/paid — marcar item como pago
export async function markItemPaid(req: AuthRequest, res: Response): Promise<void> {
  const { itemId } = req.params;
  const { pixTxId } = req.body;

  try {
    const item = await prisma.payoutItem.update({
      where: { id: String(itemId) },
      data: {
        status: "PAID",
        paidAt: new Date(),
        pixTxId: pixTxId ?? null,
      },
    });

    // Verifica se todos os itens do payout foram pagos
    const allItems = await prisma.payoutItem.findMany({
      where: { payoutId: item.payoutId },
    });
    const allPaid = allItems.every((i) => i.status === "PAID");
    if (allPaid) {
      await prisma.weeklyPayout.update({
        where: { id: item.payoutId },
        data: { status: "PAID", paidAt: new Date() },
      });
    }

    res.json(item);
  } catch {
    res.status(500).json({ error: "Erro ao marcar pagamento." });
  }
}

// GET /api/admin/payouts/export — exporta todos os itens de repasse em CSV
export async function exportPayoutCSV(req: AuthRequest, res: Response): Promise<void> {
  try {
    const items = await prisma.payoutItem.findMany({
      include: { payout: true },
      orderBy: { payout: { weekStart: "desc" } }
    });

    let csv = "ID_Repasse,Semana,Beneficiario,Tipo,Valor,Pix,Status,Data_Pagamento,ID_Transacao\n";
    
    for (const i of items) {
      const week = `${i.payout.weekStart.toLocaleDateString()} - ${i.payout.weekEnd.toLocaleDateString()}`;
      csv += `${i.id},${week},${i.recipientName},${i.recipientType},${i.amount},${i.pixKey || ""},${i.status},${i.paidAt ? i.paidAt.toLocaleDateString() : ""},${i.pixTxId || ""}\n`;
    }

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=repasses-foto-segundo-${Date.now()}.csv`);
    res.status(200).send(csv);
  } catch (err) {
    console.error("exportPayoutCSV:", err);
    res.status(500).json({ error: "Erro ao exportar CSV." });
  }
}
