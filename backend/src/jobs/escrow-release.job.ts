import prisma from "../lib/prisma";

export async function runEscrowReleaseJob() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  console.log(`[EscrowReleaseJob] Procurando bookings pagos antes de ${sevenDaysAgo.toISOString()}`);

  try {
    const bookingsToRelease = await prisma.serviceBooking.findMany({
      where: {
        status: "PAID",
        hasActiveDispute: false,
        createdAt: {
          lte: sevenDaysAgo
        }
      }
    });

    for (const booking of bookingsToRelease) {
      // 1. Atualizar status para RELEASED
      await prisma.serviceBooking.update({
        where: { id: booking.id },
        data: { status: "RELEASED" }
      });
      console.log(`[EscrowReleaseJob] Escrow liberado para booking: ${booking.id}`);
    }

    return bookingsToRelease.length;
  } catch (err) {
    console.error("[EscrowReleaseJob] Erro na execução:", err);
    throw err;
  }
}
