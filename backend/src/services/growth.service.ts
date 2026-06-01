import prisma from "../lib/prisma";

export class GrowthService {
  /**
   * Validate and return a discount percentage for a given coupon code.
   * Rejects if inactive or expired.
   */
  static async validateCoupon(code: string) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.trim().toUpperCase() }
    });

    if (!coupon) {
      throw new Error("Cupom inválido.");
    }

    if (!coupon.active) {
      throw new Error("Este cupom não está mais ativo.");
    }

    if (coupon.expiresAt && new Date() > coupon.expiresAt) {
      throw new Error("Cupom expirado.");
    }

    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      throw new Error("Limite de uso atingido para este cupom.");
    }

    return {
      discountPct: coupon.discountPct ? Number(coupon.discountPct) : 0,
      discountAbs: coupon.discountAbs ? Number(coupon.discountAbs) : 0,
      isFreeShipping: !!coupon.isFreeShipping
    };
  }

  /**
   * Validate an affiliate ID
   */
  static async validateAffiliate(affiliateId: string) {
    const user = await prisma.user.findUnique({
      where: { id: affiliateId },
      select: { id: true, nome: true, role: true, active: true }
    });

    if (!user || !user.active) {
      throw new Error("Afiliado inválido ou inativo.");
    }

    if (user.role === "ADMIN") {
      throw new Error("Usuário não possui perfil de afiliado.");
    }

    return { id: user.id, nome: user.nome };
  }
}
