import { prisma } from "../lib/prisma";

export async function runExpirationJob(): Promise<void> {
  const now = new Date();
  console.log(`[EXPIRATION JOB] Rodando em ${now.toISOString()}`);

  // ── 1. Envia aviso 3 dias antes da expiração ──────
  const tresDiasParaFrente = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const proximosDeExpirar = await prisma.order.findMany({
    where: {
      accessType: { not: null as any },
      accessExpiresAt: {
        gte: now,
        lte: tresDiasParaFrente,
      },
      warningsSent: { lt: 1 },
      deletedAt: null,
    },
    include: {
      event: { select: { nomeNoivos: true } },
    },
  });

  for (const order of proximosDeExpirar) {
    const dias = Math.ceil(
      ((new Date(order.accessExpiresAt!).getTime() ?? 0) - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    console.log(`[EXPIRATION JOB] Aviso: pedido ${order.id} expira em ${dias} dias`);

    // TODO: enviar e-mail/WhatsApp para order.buyerEmail
    // await sendExpirationWarning(order.buyerEmail, order.event.nomeNoivos, dias);

    await prisma.order.update({
      where: { id: order.id },
      data: { warningsSent: { increment: 1 } },
    });
  }

  // ── 2. Marca como excluído os pedidos expirados ───
  const expirados = await prisma.order.findMany({
    where: {
      accessType: { not: null as any },
      accessExpiresAt: { lt: now },
      deletedAt: null,
    },
    include: {
      event: { select: { nomeNoivos: true, id: true } },
    },
  });

  for (const order of expirados) {
    console.log(`[EXPIRATION JOB] Excluindo mídia do pedido ${order.id}`);

    await prisma.order.update({
      where: { id: order.id },
      data: { deletedAt: now },
    });

    // Se era PUBLIC, verifica se ainda há outros pedidos ativos no evento
    if (order.accessType === "PUBLIC") {
      const outrosAtivos = await prisma.order.count({
        where: {
          eventId: order.eventId,
          accessType: "PUBLIC",
          deletedAt: null,
          accessExpiresAt: { gte: now },
        },
      });

      // Se não há mais pedidos públicos ativos, desativa o evento do portfolio
      if (outrosAtivos === 0) {
        await prisma.event.update({
          where: { id: order.eventId },
          data: { active: false },
        });
      }
    }
  }

  console.log(`[EXPIRATION JOB] Concluído. ${proximosDeExpirar.length} avisos, ${expirados.length} exclusões.`);
}
