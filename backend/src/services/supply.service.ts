import { PrismaClient } from '@prisma/client';
import { NotificationService } from './notification.service';

const prisma = new PrismaClient();

export class SupplyService {
  /**
   * Calculates the real-time available credits for a franchisee
   * by cross-referencing total recharged credits and actual usage.
   */
  static async getFranchiseInventory(franchiseId: string) {
    const profile = await prisma.franchiseProfile.findUnique({
      where: { id: franchiseId },
      include: {
        _count: {
          select: { prints: true }
        }
      }
    });

    if (!profile) throw new Error("Franchise not found");

    const used = profile._count.prints;
    const remaining = profile.printCredits; // In our system, printCredits is the available balance (recharge - usage)

    return {
      available: remaining,
      threshold: profile.inventoryAlertThreshold,
      isLow: remaining <= profile.inventoryAlertThreshold
    };
  }

  /**
   * Background task to check all franchises for low stock and trigger alerts
   */
  static async auditAllInventory() {
    const franchises = await prisma.franchiseProfile.findMany({
      where: { active: true },
      include: { user: true }
    });

    for (const f of franchises) {
      if (f.printCredits <= f.inventoryAlertThreshold) {
        console.log(`[SUPPLY ALERT] Franchise ${f.user.nome} is LOW: ${f.printCredits} credits.`);
        
        // Trigger WhatsApp/Email Alert
        if (f.user.whatsapp) {
          NotificationService.notifyLowStock({
            to: f.user.whatsapp,
            name: f.user.nome,
            currentBalance: f.printCredits
          }).catch(e => console.error("Failed to send supply alert:", e));
        }
      }
    }
  }

  /**
   * Generates a 1-click order for supply replenishment
   */
  static async createSupplyOrder(franchiseId: string, packType: 'CREDITS_100' | 'CREDITS_500' | 'PHYSICAL_KIT') {
    const profile = await prisma.franchiseProfile.findUnique({
      where: { id: franchiseId },
      include: { user: true }
    });

    if (!profile) throw new Error("Franchise not found");

    const prices = {
      'CREDITS_100': 200.00,
      'CREDITS_500': 850.00,
      'PHYSICAL_KIT': 1200.00
    };

    const order = await prisma.order.create({
      data: {
        valor: prices[packType],
        status: 'PENDENTE',
        buyerEmail: profile.user.email,
        paymentMethod: 'PIX',
        isManual: true,
        manualType: 'SUPPLY_RECHARGE',
        internalNotes: `[REABASTECIMENTO] ${packType} para ${profile.user.nome}`,
        eventId: 'SUPPLY_SYSTEM_EVENT', // Virtual event for supply orders
      }
    });

    // Update last supply order timestamp
    await prisma.franchiseProfile.update({
      where: { id: franchiseId },
      data: { lastSupplyOrderAt: new Date() }
    });

    return order;
  }
}
