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
        status: "APROVADO",
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
      grossRevenue: number;
      orderCount: number;
      amount: number; // Valor líquido a receber
    }> = {};

    const addSplit = (
      type: string,
      userId: string,
      name: string,
      orderAmount: number,
      splitValue: number,
      isMoneySale: boolean
    ) => {
      const key = `${type}_${userId}`;
      if (!beneficiarios[key]) {
        beneficiarios[key] = {
          recipientType: type,
          recipientId: userId,
          recipientName: name,
          pixKey: null,
          grossRevenue: 0,
          orderCount: 0,
          amount: 0,
        };
      }
      
      const b = beneficiarios[key];
      b.grossRevenue += orderAmount;
      b.orderCount += 1;

      if (isMoneySale) {
        // Modelo UBER: Se a venda foi em dinheiro, o profissional já está com 100% do valor.
        // Se ele é o "Captador" (quem faz a venda), ele deve abater o que NÃO é dele.
        // Se ele é o "Editor" e a venda foi em dinheiro, ele NÃO recebe nada agora (pois o dinheiro está com o captador).
        if (type === "CAPTACAO") {
          // O captador já tem o valor total. Ele deve o split da Matriz, Edição e Cartório.
          // Logo, o "valor a receber" dele para este pedido é NEGATIVO (o que ele deve repassar).
          // Valor a Repassar = Valor Total - Meu Split de Captação
          const divida = orderAmount - splitValue;
          b.amount -= divida;
        } else {
          // Editor ou Cartório em venda de dinheiro: Eles têm crédito, mas quem paga é o Captador via abatimento.
          // Para a plataforma, o Editor tem R$ X a receber.
          b.amount += splitValue;
        }
      } else {
        // Venda Digital (Pix/Cartão): A plataforma tem o dinheiro, então apenas soma o crédito.
        b.amount += splitValue;
      }
    };

    for (const order of orders) {
      const amount = Number(order.valor);
      const isMoney = order.manualType === "MONEY" || (order.isManual && order.manualType?.toUpperCase() === "DINHEIRO");
      const { captacao, edicao, cartorioUser } = order.event;

      // Usamos os splits gravados no pedido (garante integridade histórica)
      if (captacao) addSplit("CAPTACAO", captacao.id, captacao.nome, amount, Number(order.splitCaptacao || 0), isMoney);
      if (edicao)   addSplit("EDICAO", edicao.id, edicao.nome, amount, Number(order.splitEdicao || 0), isMoney);
      if (cartorioUser) addSplit("CARTORIO", cartorioUser.id, cartorioUser.nome, amount, Number(order.splitCartorio || 0), isMoney);
    }

    // Busca chaves Pix dos usuários em lote (evita N+1 query)
    const recipientIds = Object.values(beneficiarios)
      .filter(b => b.amount > 0)
      .map(b => b.recipientId);

    const users = await prisma.user.findMany({
      where: { id: { in: recipientIds } },
      select: { id: true, pixKey: true, whatsapp: true },
    });
    const userMap: Record<string, { pixKey: string | null; whatsapp: string | null }> = {};
    for (const u of users) userMap[u.id] = { pixKey: u.pixKey, whatsapp: u.whatsapp };

    const items = [];
    for (const key of Object.keys(beneficiarios)) {
      const b = beneficiarios[key];
      if (b.amount <= 0) continue;

      const u = userMap[b.recipientId];
      b.pixKey = u?.pixKey ?? u?.whatsapp ?? null;

      items.push({
        ...b,
        splitPct: Number(((b.amount / b.grossRevenue) * 100).toFixed(2)) || 0
      });
    }

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

    let csv = "\uFEFF" + "ID_Repasse,Semana,Beneficiario,Tipo,Valor,Pix,Status,Data_Pagamento,ID_Transacao\n";
    
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

// GET /api/payouts/me — retorna repasses do usuário logado (Parceiro/Profissional)
export async function getMeusRepasses(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user?.userId;
  if (!userId) { res.status(401).json({ error: "Não autenticado." }); return; }

  try {
    const items = await prisma.payoutItem.findMany({
      where: { recipientId: userId },
      include: { payout: true },
      orderBy: { payout: { weekStart: "desc" } }
    });
    res.json(items);
  } catch {
    res.status(500).json({ error: "Erro ao listar meus repasses." });
  }
}

/**
 * GET /api/me/payout-summary
 * Resumo de saldo para o profissional logado
 */
export async function getMeuSaldoSummary(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user?.userId;
  if (!userId) { res.status(401).json({ error: "Não autenticado." }); return; }

  try {
    const orders = await prisma.order.findMany({
      where: {
        status: "APROVADO",
        OR: [
          { event: { captacaoId: userId } },
          { event: { edicaoId: userId } }
        ],
        payoutStatus: { in: ["PENDING", "AVAILABLE"] }
      },
      select: {
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
      if (o.event.captacaoId === userId) amount += Number(o.splitCaptacao || 0);
      if (o.event.edicaoId === userId) amount += Number(o.splitEdicao || 0);

      if (o.payoutStatus === "AVAILABLE") available += amount;
      else if (o.payoutStatus === "PENDING") pending += amount;
    });

    const bookings = await prisma.serviceBooking.findMany({
      where: { profissionalId: userId, status: { in: ["PAID", "RELEASED"] } }
    });

    bookings.forEach(b => {
      if (b.status === "PAID") pending += Number(b.bookingFee);
      if (b.status === "RELEASED") available += Number(b.bookingFee);
    });

    res.json({ available, pending, totalCount: orders.length + bookings.length });
  } catch (err) {
    console.error("getMeuSaldoSummary:", err);
    res.status(500).json({ error: "Erro ao calcular saldo." });
  }
}
