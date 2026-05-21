const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const emails = ['unidade-sp@brasil.com.br', 'unidade-rj@brasil.com.br', 'unidade-mg@brasil.com.br'];
  
  for (const email of emails) {
    console.log(`\n=================== DELETING ${email} ===================`);
    
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        profissional: true,
        cartorio: true,
        franchiseProfile: true,
      }
    });

    if (!user) {
      console.log(`User ${email} not found.`);
      continue;
    }

    try {
      await prisma.$transaction(async (tx) => {
        // 1. Desassociar chaves estrangeiras em tabelas históricas/compartilhadas para evitar violação de FK
        await tx.order.updateMany({
          where: { clienteId: user.id },
          data: { clienteId: null }
        });
        await tx.order.updateMany({
          where: { editorId: user.id },
          data: { editorId: null }
        });
        await tx.order.updateMany({
          where: { passiveFranchiseeId: user.id },
          data: { passiveFranchiseeId: null }
        });
        await tx.order.updateMany({
          where: { ambassadorId: user.id },
          data: { ambassadorId: null }
        });
        await tx.order.updateMany({
          where: { affiliateL1Id: user.id },
          data: { affiliateL1Id: null }
        });
        await tx.order.updateMany({
          where: { affiliateL2Id: user.id },
          data: { affiliateL2Id: null }
        });

        await tx.event.updateMany({
          where: { captacaoId: user.id },
          data: { captacaoId: null }
        });
        await tx.event.updateMany({
          where: { edicaoId: user.id },
          data: { edicaoId: null }
        });
        await tx.event.updateMany({
          where: { cartorioUserId: user.id },
          data: { cartorioUserId: null }
        });

        await tx.user.updateMany({
          where: { referredById: user.id },
          data: { referredById: null }
        });

        // 2. Deletar registros exclusivos vinculados ao usuário
        await tx.pushSubscription.deleteMany({ where: { userId: user.id } });
        await tx.notification.deleteMany({ where: { userId: user.id } });
        await tx.userPoints.deleteMany({ where: { userId: user.id } });
        await tx.photoLike.deleteMany({ where: { userId: user.id } });
        await tx.professionalNetwork.deleteMany({
          where: { OR: [{ userId: user.id }, { partnerId: user.id }] }
        });
        await tx.calendarSlot.deleteMany({ where: { userId: user.id } });
        await tx.gamificationLedger.deleteMany({ where: { userId: user.id } });
        await tx.printRedemption.deleteMany({ where: { userId: user.id } });
        await tx.affiliateCommission.deleteMany({ where: { userId: user.id } });
        await tx.userCalendarCredential.deleteMany({ where: { userId: user.id } });
        await tx.flashCard.deleteMany({ where: { userId: user.id } });
        await tx.phygitalPrint.deleteMany({ where: { userId: user.id } });
        await tx.referralCampaign.deleteMany({ where: { ownerId: user.id } });
        await tx.sharedAlbum.deleteMany({ where: { ownerId: user.id } });
        await tx.albumMember.deleteMany({ where: { userId: user.id } });
        await tx.mediaVote.deleteMany({ where: { userId: user.id } });
        await tx.subscription.deleteMany({ where: { userId: user.id } });

        // Deletar perfis e intermediários
        if (user.profissional) {
          await tx.cartorioProfissional.deleteMany({ where: { profissionalId: user.profissional.id } });
          await tx.professionalService.deleteMany({ where: { profissionalId: user.profissional.id } });
          await tx.portfolioAlbum.deleteMany({ where: { profissionalId: user.profissional.id } });
          await tx.profissional.delete({ where: { id: user.profissional.id } });
        }
        if (user.cartorio) {
          await tx.cartorioProfissional.deleteMany({ where: { cartorioId: user.cartorio.id } });
          await tx.cartorio.delete({ where: { id: user.cartorio.id } });
        }
        if (user.franchiseProfile) {
          // Desassociar Phygital Prints associados ao perfil do franqueado
          await tx.phygitalPrint.updateMany({
            where: { franchiseProfileId: user.franchiseProfile.id },
            data: { franchiseProfileId: null }
          });
          
          // Desassociar Eventos vinculados a esta franquia
          await tx.event.updateMany({
            where: { franchiseeId: user.franchiseProfile.id },
            data: { franchiseeId: null }
          });

          // Deletar ordens de suprimento do franqueado
          await tx.supplyOrder.deleteMany({
            where: { franchiseeId: user.id }
          });
          
          await tx.creditTransaction.deleteMany({ where: { profileId: user.franchiseProfile.id } });
          await tx.franchiseProfile.delete({ where: { id: user.franchiseProfile.id } });
        }

        // 3. Finalmente, deletar o próprio usuário físico
        await tx.user.delete({ where: { id: user.id } });
        console.log(`Successfully deleted ${email} from database.`);
      });
    } catch (err) {
      console.error(`FAILED TO DELETE ${email}:`, err);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
