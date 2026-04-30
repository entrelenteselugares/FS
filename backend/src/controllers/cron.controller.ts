import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { NotificationService } from "../services/notification.service";

/**
 * GET /api/cron/loyalty-bot
 * Endpoint disparado via Vercel Cron ou manualmente
 */
export async function runLoyaltyBot(req: Request, res: Response): Promise<void> {
  const secret = req.headers["x-cron-secret"];
  if (process.env.NODE_ENV === "production" && secret !== process.env.CRON_SECRET) {
    res.status(401).json({ error: "Não autorizado" });
    return;
  }

  try {
    const today = new Date();
    
    // Calcula datas alvo (aprox. 6 meses e 1 ano)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(today.getMonth() - 6);
    
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(today.getFullYear() - 1);

    // Busca eventos nessas datas (considerando uma janela de 24h para não perder ninguém)
    const findEventsForDate = async (targetDate: Date, type: "6_MONTHS" | "1_YEAR") => {
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      const events = await prisma.event.findMany({
        where: {
          dataEvento: {
            gte: startOfDay,
            lte: endOfDay,
          },
          active: true,
          // Busca pedidos relacionados para pegar o WhatsApp do comprador
          pedidos: {
            some: {
              status: "PAGO",
              buyerWhatsapp: { not: null }
            }
          }
        },
        include: {
          pedidos: {
            where: { status: "PAGO", buyerWhatsapp: { not: null } },
            select: { buyerWhatsapp: true, buyerEmail: true }
          }
        }
      });

      for (const event of events) {
        // Pega o WhatsApp do primeiro pedido pago (geralmente é o mesmo cliente)
        const whatsapp = event.pedidos[0]?.buyerWhatsapp;
        if (whatsapp) {
          console.log(`[LoyaltyBot] Enviando para ${event.clientName} (${type})`);
          NotificationService.sendLoyaltyMessage({
            clientName: event.clientName || "Cliente",
            eventTitle: event.nomeNoivos,
            whatsapp: whatsapp,
            type: type
          });
        }
      }
      return events.length;
    };

    const count6m = await findEventsForDate(sixMonthsAgo, "6_MONTHS");
    const count1y = await findEventsForDate(oneYearAgo, "1_YEAR");

    res.json({
      success: true,
      processed: {
        sixMonths: count6m,
        oneYear: count1y
      }
    });
  } catch (err) {
    console.error("[LoyaltyBot] Erro na execução:", err);
    res.status(500).json({ error: "Erro interno" });
  }
}
