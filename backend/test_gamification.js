const { PrismaClient } = require('@prisma/client');
const { Prisma } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const orderId = 'cmpihoafl0002la04eo98typs';
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { cliente: true }
  });

  if (!order || !order.clienteId || !order.hasPaid) {
     console.log("No order, or no clienteId, or hasPaid is false");
     return;
  }

  const cashbackPct = 0.05;
  const rewardAmount = new Prisma.Decimal(Number(order.valor) * cashbackPct).toDecimalPlaces(2);

  if (rewardAmount.lte(0)) {
     console.log("Reward amount <= 0");
     return;
  }
  
  console.log("Would create ledger with amount:", rewardAmount);

  try {
      await prisma.$transaction(async (tx) => {
        await tx.gamificationLedger.create({
          data: {
            userId: order.clienteId,
            type: "EARN_CASHBACK",
            amount: rewardAmount,
            points: Math.floor(rewardAmount.toNumber() * 10),
            description: `Cashback de 5% sobre o pedido ${orderId.slice(-6).toUpperCase()}`,
            orderId: order.id
          }
        });

        await tx.user.update({
          where: { id: order.clienteId },
          data: {
            rewardCredits: { increment: rewardAmount }
          }
        });
      });
      console.log("Success transaction!");
  } catch (err) {
      console.error("Error in transaction:", err);
  }
}

main().finally(() => prisma.$disconnect());
