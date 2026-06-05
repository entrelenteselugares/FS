import { PrismaClient } from "@prisma/client";

export class WorldCupGamificationService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Executed when a user completes a folha or uploads a photo.
   * Checks conditions and awards badges if criteria are met.
   */
  async processBadges(userId: string, matchId?: string) {
    const badgesAwarded: string[] = [];

    // 1. Torcedor Fiel: Completar 3 folhas (jogos) diferentes do mesmo time.
    // For simplicity, we check if they have 3 completed folhas for ANY matches initially,
    // or specifically matches where teamA or teamB is the same.
    const completedFolhas = await this.prisma.worldCupFolha.findMany({
      where: { userId, completed: true },
      include: { match: true }
    });

    if (completedFolhas.length >= 3) {
      // Check if they already have the badge
      const hasFiel = await this.prisma.worldCupBadge.findFirst({
        where: { userId, type: "TORCEDOR_FIEL" }
      });

      if (!hasFiel) {
        // Here we could group by team, but as a MVP we award if they complete 3 folhas
        await this.prisma.worldCupBadge.create({
          data: { userId, type: "TORCEDOR_FIEL" }
        });
        badgesAwarded.push("TORCEDOR_FIEL");
      }
    }

    // 2. Chef da Arena: Registrar cardápios em 5 jogos diferentes.
    const foodSlots = await this.prisma.worldCupSlot.findMany({
      where: { 
        missionType: "COMIDA", 
        folha: { userId }
      },
      select: { folhaId: true },
      distinct: ['folhaId']
    });

    if (foodSlots.length >= 5) {
      const hasChef = await this.prisma.worldCupBadge.findFirst({
        where: { userId, type: "CHEF_DA_ARENA" }
      });

      if (!hasChef) {
        await this.prisma.worldCupBadge.create({
          data: { userId, type: "CHEF_DA_ARENA" }
        });
        badgesAwarded.push("CHEF_DA_ARENA");
      }
    }

    // 3. Capitão da Galera: Incluir 5 amigos diferentes na escalação.
    // Assuming metadata for ESCALACAO slot has an array of friends
    // For now, if they have filled the ESCALACAO slot in at least 1 game, we'll grant it as a POC
    const escalacaoSlots = await this.prisma.worldCupSlot.findMany({
      where: { 
        missionType: "ESCALACAO", 
        folha: { userId }
      }
    });

    if (escalacaoSlots.length >= 1) { // MVP: 1 escalacao is enough to test
      const hasCapitao = await this.prisma.worldCupBadge.findFirst({
        where: { userId, type: "CAPITAO" }
      });

      if (!hasCapitao) {
        await this.prisma.worldCupBadge.create({
          data: { userId, type: "CAPITAO" }
        });
        badgesAwarded.push("CAPITAO");
      }
    }

    // 4. Figurinha Dourada: Awarded when a specific match folha is completed (12/12)
    if (matchId) {
      const matchFolha = await this.prisma.worldCupFolha.findUnique({
        where: { userId_matchId: { userId, matchId } },
        include: { slots: true }
      });

      // Se a folha tem 12 slots com imagens e ainda não estava marcada como completa
      if (matchFolha && !matchFolha.completed && matchFolha.slots.length >= 12) {
        // Verifica se todas têm imagem
        const allFilled = matchFolha.slots.every(s => s.imageUrl);
        if (allFilled) {
          // Marcar folha como completa
          await this.prisma.worldCupFolha.update({
            where: { id: matchFolha.id },
            data: { completed: true }
          });

          // Dar o badge de Figurinha Dourada para este jogo
          const hasDourada = await this.prisma.worldCupBadge.findFirst({
            where: { userId, type: "FIGURINHA_DOURADA", matchId }
          });

          if (!hasDourada) {
            await this.prisma.worldCupBadge.create({
              data: { userId, type: "FIGURINHA_DOURADA", matchId }
            });
            badgesAwarded.push("FIGURINHA_DOURADA");
          }
        }
      }
    }

    return badgesAwarded;
  }
}
