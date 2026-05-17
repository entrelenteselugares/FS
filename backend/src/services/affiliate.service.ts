import prisma from "../lib/prisma";

/**
 * AffiliateService
 * Gerencia o sistema de comissões em rede (Multi-Tier Referral).
 *
 * REGRAS DE NEGÓCIO:
 * - Todos os usuários têm um link de indicação (referralCode).
 * - Usuários STANDARD ganham comissão de Nível 1 (direto) conforme split_affiliate_l1 na PlatformConfig.
 * - Usuários VIP (primeiros 50 ou eleitos pelo admin) ganham adicional de Nível 2 (passivo) conforme split_affiliate_l2.
 * - As % são configuráveis pelo admin em /admin/configs sem necessidade de redeploy.
 */
export class AffiliateService {
  /**
   * Busca as taxas de comissão diretamente da PlatformConfig (configuráveis pelo admin).
   */
  static async getRates(): Promise<{ l1Rate: number; l2Rate: number }> {
    const configs = await prisma.platformConfig.findMany({
      where: { key: { in: ["split_affiliate_l1", "split_affiliate_l2"] } },
    });
    const getPct = (key: string) =>
      Number(configs.find((c) => c.key === key)?.value ?? 0) / 100;
    return {
      l1Rate: getPct("split_affiliate_l1"),
      l2Rate: getPct("split_affiliate_l2"),
    };
  }

  /**
   * Resolve a cadeia de afiliados a partir do usuário comprador.
   * Retorna o ID do indicador direto (L1) e o indicador do L1 (L2, somente se L1 for VIP).
   */
  static async resolveChain(buyerUserId: string): Promise<{
    l1Id: string | null;
    l2Id: string | null;
  }> {
    const buyer = await prisma.user.findUnique({
      where: { id: buyerUserId },
      select: { referredById: true },
    });

    if (!buyer?.referredById) return { l1Id: null, l2Id: null };

    const l1 = await prisma.user.findUnique({
      where: { id: buyer.referredById },
      select: { id: true, referredById: true, affiliateTier: true },
    });

    if (!l1) return { l1Id: null, l2Id: null };

    // L2 só recebe se L1 for VIP e tiver um padrinho cadastrado
    const l2Id =
      l1.affiliateTier === "VIP" && l1.referredById ? l1.referredById : null;

    return { l1Id: l1.id, l2Id };
  }

  /**
   * Calcula os valores de comissão L1 e L2 sobre o netAmount.
   * Usa as taxas configuradas na PlatformConfig.
   */
  static async calculateCommissions(
    netAmount: number,
    l1Id: string | null,
    l2Id: string | null
  ): Promise<{ l1Amount: number; l2Amount: number }> {
    if (!l1Id) return { l1Amount: 0, l2Amount: 0 };
    const { l1Rate, l2Rate } = await AffiliateService.getRates();
    const l1Amount = +(netAmount * l1Rate).toFixed(2);
    const l2Amount = l2Id ? +(netAmount * l2Rate).toFixed(2) : 0;
    return { l1Amount, l2Amount };
  }

  /**
   * Registra as comissões no ledger (affiliate_commissions) e credita em rewardCredits.
   */
  static async recordCommissions(
    orderId: string,
    l1Id: string | null,
    l1Amount: number,
    l2Id: string | null,
    l2Amount: number
  ): Promise<void> {
    const entries: { userId: string; orderId: string; level: number; amount: number }[] = [];
    if (l1Id && l1Amount > 0) entries.push({ userId: l1Id, orderId, level: 1, amount: l1Amount });
    if (l2Id && l2Amount > 0) entries.push({ userId: l2Id, orderId, level: 2, amount: l2Amount });
    if (!entries.length) return;

    await prisma.affiliateCommission.createMany({ data: entries });

    // Credita em rewardCredits para acesso imediato no dashboard do afiliado
    for (const e of entries) {
      await prisma.user.update({
        where: { id: e.userId },
        data: { rewardCredits: { increment: e.amount } },
      });
      console.log(
        `[Affiliate] Comissão L${e.level} creditada: R$ ${e.amount} → userId ${e.userId} (orderId ${orderId})`
      );
    }
  }

  /**
   * Retorna os dados completos do painel de afiliados de um usuário.
   */
  static async getDashboardData(userId: string) {
    const [user, commissions] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          referralCode: true,
          affiliateTier: true,
          rewardCredits: true,
          referrals: {
            select: {
              id: true,
              nome: true,
              createdAt: true,
              affiliateTier: true,
              referrals: {
                select: { id: true, nome: true, createdAt: true },
              },
            },
          },
        },
      }),
      prisma.affiliateCommission.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 30,
        include: {
          order: { select: { valor: true, createdAt: true } },
        },
      }),
    ]);

    const totalL1 = user?.referrals.length ?? 0;
    const totalL2 =
      user?.referrals.reduce((acc, r) => acc + r.referrals.length, 0) ?? 0;

    const commissionsL1 = commissions
      .filter((c: any) => c.level === 1)
      .reduce((acc, c) => acc + Number(c.amount), 0);

    const commissionsL2 = commissions
      .filter((c: any) => c.level === 2)
      .reduce((acc, c) => acc + Number(c.amount), 0);

    return {
      tier: user?.affiliateTier ?? "STANDARD",
      referralCode: user?.referralCode,
      totalL1,
      totalL2,
      commissionsL1,
      commissionsL2,
      pendingPayout: 0, // Placeholder, can be tied to actual withdrawal requests later
      availablePayout: Number(user?.rewardCredits ?? 0),
      // keep original ones just in case
      l1Count: totalL1,
      l2Count: totalL2,
      totalEarned: commissionsL1 + commissionsL2,
      referrals: user?.referrals ?? [],
      commissions,
    };
  }

  /**
   * Conta o total de usuários com tier VIP.
   */
  static async getVipCount(): Promise<number> {
    return prisma.user.count({ where: { affiliateTier: "VIP" } });
  }
}
