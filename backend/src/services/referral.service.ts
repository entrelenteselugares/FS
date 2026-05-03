import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export class ReferralService {
  /**
   * Generates a unique referral code for a user
   */
  static async generateCode(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    if (user.referralCode) return user.referralCode;

    // Generate a clean, short code: FS-NAME-RANDOM
    const namePart = user.nome.split(' ')[0].toUpperCase().replace(/[^A-Z0-0]/g, '');
    const randomPart = crypto.randomBytes(2).toString('hex').toUpperCase();
    const code = `FS-${namePart}-${randomPart}`;

    await prisma.user.update({
      where: { id: userId },
      data: { referralCode: code }
    });

    return code;
  }

  /**
   * Links a new professional to a franchisee's network via referral code
   */
  static async linkByCode(newUserId: string, referralCode: string) {
    const referrer = await prisma.user.findUnique({
      where: { referralCode },
      include: { franchiseProfile: true }
    });

    if (!referrer || !referrer.franchiseProfile) {
      console.warn(`[Referral] Invalid or non-franchise code: ${referralCode}`);
      return;
    }

    // Link in ProfessionalNetwork
    await prisma.professionalNetwork.upsert({
      where: {
        userId_partnerId: {
          userId: newUserId,
          partnerId: referrer.id
        }
      },
      update: {},
      create: {
        userId: newUserId,
        partnerId: referrer.id
      }
    });

    console.log(`[Referral] Linked user ${newUserId} to franchisee ${referrer.id}`);
  }
}
