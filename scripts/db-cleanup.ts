import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Iniciando Limpeza Geral do Banco de Dados...');

  const emailsToKeep = ['contatofotosegundo@gmail.com'];

  console.log(`🔒 Mantendo apenas as contas de e-mail: ${emailsToKeep.join(', ')}`);

  try {
    // 2. Transações e Itens de Pedidos
    await prisma.orderItem.deleteMany();
    await prisma.affiliateCommission.deleteMany();
    await prisma.payoutItem.deleteMany();
    await prisma.weeklyPayout.deleteMany();
    await prisma.order.deleteMany();
    
    // 3. Cupons e Redemptions
    await prisma.coupon.deleteMany();
    await prisma.printRedemption.deleteMany();
    
    // 4. Mídias e Interações de Eventos
    await prisma.flashCard.deleteMany();
    await prisma.photoLike.deleteMany();
    await prisma.mediaVote.deleteMany();
    await prisma.sharedAlbumMedia.deleteMany();
    await prisma.albumMember.deleteMany();
    await prisma.sharedAlbum.deleteMany();
    await prisma.phygitalPrint.deleteMany();
    await prisma.eventMedia.deleteMany();
    await prisma.eventPrintProduct.deleteMany();
    await prisma.lead.deleteMany();
    
    // 5. Eventos e Cotações
    await prisma.quote.deleteMany();
    await prisma.event.deleteMany();

    // 6. Gamificação, Notificações e Logs
    await prisma.gamificationLedger.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.userPoints.deleteMany();
    await prisma.pushSubscription.deleteMany();
    await prisma.calendarSlot.deleteMany();
    await prisma.userCalendarCredential.deleteMany();
    
    // 7. Redes Profissionais e Agendamentos
    await prisma.professionalNetwork.deleteMany();
    await prisma.cartorioProfissional.deleteMany();
    await prisma.serviceBooking.deleteMany();
    await prisma.portfolioAlbum.deleteMany();
    await prisma.professionalService.deleteMany();

    // 8. Campanhas de Embaixadores e Assinaturas
    await prisma.referralCampaign.deleteMany();
    await prisma.subscription.deleteMany();

    // 9. Entidades Vinculadas ao Usuário
    await prisma.profissional.deleteMany();
    await prisma.cartorio.deleteMany();
    await prisma.franchiseProfile.deleteMany();
    
    // 10. Apagar Usuários
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        email: {
          notIn: emailsToKeep
        }
      }
    });

    console.log(`✅ Sucesso! Banco higienizado com sucesso.`);
    console.log(`✅ Removidos ${deletedUsers.count} usuários (mantido o Admin).`);
    console.log(`🚀 ServiceCatalog, PlatformConfig e PrintProducts permanecem inalterados.`);

  } catch (err) {
    console.error("❌ Erro ao limpar o banco de dados:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
