import cron from "node-cron";
import { prisma } from "../lib/prisma";

export class SanfonaCycleService {
  static async processMonthlyBatches() {
    console.log("[SanfonaCycle] Iniciando processamento de virada de mês...");
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    // Busca assinaturas ativas do Sanfona
    const subscriptions = await prisma.subscription.findMany({
      where: {
        type: "ALBUM_SANFONA",
        status: "ACTIVE"
      }
    });

    let createdCount = 0;

    for (const sub of subscriptions) {
      // Verifica se o lote do mês atual já existe
      const existing = await prisma.albumSanfonaBatch.findUnique({
        where: {
          userId_month: {
            userId: sub.userId,
            month: currentMonth
          }
        }
      });

      if (!existing) {
        // Cria lote DRAFT pro mês
        await prisma.albumSanfonaBatch.create({
          data: {
            userId: sub.userId,
            month: currentMonth,
            status: "DRAFT",
            photos: []
          }
        });
        createdCount++;
      }
    }

    console.log(`[SanfonaCycle] Concluído. ${createdCount} lotes DRAFT gerados para assinantes no ciclo ${currentMonth}.`);
  }
}

// Roda todo dia 1º de cada mês às 00:05
export function runSanfonaCycleJob() {
  cron.schedule("5 0 1 * *", async () => {
    try {
      await SanfonaCycleService.processMonthlyBatches();
    } catch (error) {
      console.error("[SanfonaCycleJob] Error:", error);
    }
  });
}
