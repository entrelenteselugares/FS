import { prisma } from "../lib/prisma";
import crypto from "crypto";

export class RewardService {
  /**
   * Generates a free shipping coupon for a user upon profile completion.
   */
  static async grantProfileCompletionReward(userId: string) {
    try {
      const user = await prisma.user.findUnique({ 
        where: { id: userId },
        include: { pedidos: { take: 1 } }
      });

      if (!user || user.profileComplete) return null;

      // Check if user already has a welcome coupon
      const existingCoupon = await prisma.coupon.findFirst({
        where: { code: `WELCOME-${userId.slice(0, 5).toUpperCase()}` }
      });

      if (existingCoupon) return existingCoupon;

      const code = `WELCOME-${userId.slice(0, 5).toUpperCase()}`;
      
      // Create a 100% discount on shipping (handled via specific logic or just a fixed value)
      // For now, let's make it a R$ 20,00 discount (standard shipping)
      const coupon = await prisma.coupon.create({
        data: {
          code,
          discountAbs: 20.00,
          maxUses: 1,
          active: true,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        }
      });

      // Mark profile as complete
      await prisma.user.update({
        where: { id: userId },
        data: { profileComplete: true }
      });

      console.log(`[REWARD] Coupon ${code} granted to user ${userId}`);
      return coupon;
    } catch (error) {
      console.error("[REWARD ERROR]:", error);
      return null;
    }
  }
}
