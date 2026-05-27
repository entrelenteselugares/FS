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

    const packPrices: Record<string, number> = {
      'CREDITS_100': 200.00,
      'CREDITS_500': 850.00,
      'PHYSICAL_KIT': 1200.00,
    };

    const packNames: Record<string, string> = {
      'CREDITS_100': '100 Créditos de Impressão',
      'CREDITS_500': '500 Créditos de Impressão',
      'PHYSICAL_KIT': 'Kit Físico Completo',
    };

    const price = packPrices[packType];
    if (price === undefined) throw new Error(`Invalid packType: ${packType}`);

    const order = await prisma.supplyOrder.create({
      data: {
        franchiseeId: profile.userId,
        total: price,
        paymentMethod: 'CHECKOUT', // PIX via checkout flow
        deliveryType: packType === 'PHYSICAL_KIT' ? 'SHIPPING' : 'MATRIZ',
        status: 'PENDING',
        items: {
          create: [{
            productId: packType.toLowerCase(),
            name: packNames[packType],
            price: price,
            quantity: 1,
          }]
        }
      },
      include: { items: true }
    });

    // Update last supply order timestamp
    await prisma.franchiseProfile.update({
      where: { id: franchiseId },
      data: { lastSupplyOrderAt: new Date() }
    });

    return order;
  }
}
