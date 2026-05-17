import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const TARGET_EMAILS = [
  "contatofotosegundo@gmail.com",
  "info@filmmakers.com",
  "info@tlmmakers.com", // Will migrate to info@filmmakers.com
  "matheuskurio@gmail.com",
  "moraesrenata.br@gmail.com"
];

async function main() {
  console.log("🚀 INICIANDO LIMPEZA CIRÚRGICA DO BANCO DE DADOS (COM TRATAMENTO DE FK)...");

  // 1. Remover tabelas dinâmicas totalmente (Truncar/Deletar Tudo)
  console.log("\n--- Limpando dados transacionais e dinâmicos ---");
  
  // A. Deletar dependências de álbuns compartilhados e votos
  const mediaVotes = await prisma.mediaVote.deleteMany();
  console.log(`- MediaVotes removidos: ${mediaVotes.count}`);

  const sharedAlbumMedia = await prisma.sharedAlbumMedia.deleteMany();
  console.log(`- SharedAlbumMedia removidos: ${sharedAlbumMedia.count}`);

  const albumMembers = await prisma.albumMember.deleteMany();
  console.log(`- AlbumMembers removidos: ${albumMembers.count}`);

  const sharedAlbums = await prisma.sharedAlbum.deleteMany();
  console.log(`- SharedAlbums removidos: ${sharedAlbums.count}`);

  // B. Deletar dependências financeiras e de pedidos
  const payoutItems = await prisma.payoutItem.deleteMany();
  console.log(`- PayoutItems removidos: ${payoutItems.count}`);

  const weeklyPayouts = await prisma.weeklyPayout.deleteMany();
  console.log(`- WeeklyPayouts removidos: ${weeklyPayouts.count}`);

  const orderItems = await prisma.orderItem.deleteMany();
  console.log(`- OrderItems removidos: ${orderItems.count}`);

  const orders = await prisma.order.deleteMany();
  console.log(`- Orders removidos: ${orders.count}`);

  const printRedemptions = await prisma.printRedemption.deleteMany();
  console.log(`- PrintRedemptions removidos: ${printRedemptions.count}`);

  const phygitalPrints = await prisma.phygitalPrint.deleteMany();
  console.log(`- PhygitalPrints removidos: ${phygitalPrints.count}`);

  const photoLikes = await prisma.photoLike.deleteMany();
  console.log(`- PhotoLikes removidos: ${photoLikes.count}`);

  const eventMedia = await prisma.eventMedia.deleteMany();
  console.log(`- EventMedia removidos: ${eventMedia.count}`);

  const eventPrintProducts = await prisma.eventPrintProduct.deleteMany();
  console.log(`- EventPrintProducts removidos: ${eventPrintProducts.count}`);

  const coupons = await prisma.coupon.deleteMany();
  console.log(`- Coupons removidos: ${coupons.count}`);

  const events = await prisma.event.deleteMany();
  console.log(`- Events removidos: ${events.count}`);

  const quotes = await prisma.quote.deleteMany();
  console.log(`- Quotes removidos: ${quotes.count}`);

  const notifications = await prisma.notification.deleteMany();
  console.log(`- Notifications removidas: ${notifications.count}`);

  const gamificationLedgers = await prisma.gamificationLedger.deleteMany();
  console.log(`- GamificationLedgers removidos: ${gamificationLedgers.count}`);

  const calendarSlots = await prisma.calendarSlot.deleteMany();
  console.log(`- CalendarSlots removidos: ${calendarSlots.count}`);

  const creditTransactions = await prisma.creditTransaction.deleteMany();
  console.log(`- CreditTransactions removidos: ${creditTransactions.count}`);

  const referralConversions = await prisma.referralConversion.deleteMany();
  console.log(`- ReferralConversions removidos: ${referralConversions.count}`);

  const referralVisits = await prisma.referralVisit.deleteMany();
  console.log(`- ReferralVisits removidos: ${referralVisits.count}`);

  const referralCampaigns = await prisma.referralCampaign.deleteMany();
  console.log(`- ReferralCampaigns removidos: ${referralCampaigns.count}`);

  const pushSubs = await prisma.pushSubscription.deleteMany();
  console.log(`- PushSubscriptions removidos: ${pushSubs.count}`);

  const auditLogs = await prisma.auditLog.deleteMany();
  console.log(`- AuditLogs removidos: ${auditLogs.count}`);

  const flashCards = await prisma.flashCard.deleteMany();
  console.log(`- FlashCards removidos: ${flashCards.count}`);

  const subscriptions = await prisma.subscription.deleteMany();
  console.log(`- Subscriptions removidas: ${subscriptions.count}`);

  // 2. Remover outros usuários (que não fazem parte dos 4 emails limpos)
  console.log("\n--- Removendo usuários excedentes e perfis associados ---");

  // Deletar perfis e conexões dos usuários indesejados primeiro
  const otherUsers = await prisma.user.findMany({
    where: {
      NOT: {
        email: { in: TARGET_EMAILS }
      }
    },
    select: { id: true, email: true }
  });

  const otherUserIds = otherUsers.map(u => u.id);
  console.log(`Identificados ${otherUserIds.length} usuários para exclusão:`, otherUsers.map(u => u.email));

  if (otherUserIds.length > 0) {
    // Limpar conexões de cartórios e profissionais
    const cartPros = await prisma.cartorioProfissional.deleteMany({
      where: {
        OR: [
          { cartorio: { userId: { in: otherUserIds } } },
          { profissional: { userId: { in: otherUserIds } } }
        ]
      }
    });
    console.log(`- Conexões Cartório-Profissional removidas: ${cartPros.count}`);

    // Limpar serviços e agendamentos
    const serviceBookings = await prisma.serviceBooking.deleteMany({
      where: {
        profissional: { userId: { in: otherUserIds } }
      }
    });
    console.log(`- Agendamentos de serviços removidos: ${serviceBookings.count}`);

    const proServices = await prisma.professionalService.deleteMany({
      where: {
        profissional: { userId: { in: otherUserIds } }
      }
    });
    console.log(`- Serviços profissionais removidos: ${proServices.count}`);

    const portfolioAlbums = await prisma.portfolioAlbum.deleteMany({
      where: {
        profissional: { userId: { in: otherUserIds } }
      }
    });
    console.log(`- Álbuns de portfólio removidos: ${portfolioAlbums.count}`);

    const profs = await prisma.profissional.deleteMany({ where: { userId: { in: otherUserIds } } });
    console.log(`- Perfis Profissionais removidos: ${profs.count}`);

    const carts = await prisma.cartorio.deleteMany({ where: { userId: { in: otherUserIds } } });
    console.log(`- Perfis Cartórios removidos: ${carts.count}`);

    const franchiseProfiles = await prisma.franchiseProfile.deleteMany({ where: { userId: { in: otherUserIds } } });
    console.log(`- Perfis Franquia removidos: ${franchiseProfiles.count}`);

    const deletedUsers = await prisma.user.deleteMany({
      where: { id: { in: otherUserIds } }
    });
    console.log(`- Registro de Usuários removidos: ${deletedUsers.count}`);
  }

  // 3. Atualizar e sincronizar perfis dos 4 usuários oficiais com UIDs reais do Supabase
  console.log("\n--- Sincronizando perfis oficiais ---");

  // A. Sincronizar info@tlmmakers.com -> info@filmmakers.com com o UID 7813e791-3857-4cbd-81a4-270c0ffd5c38
  const oldCartorioUser = await prisma.user.findFirst({
    where: { email: { in: ["info@tlmmakers.com", "info@filmmakers.com"] } }
  });

  if (oldCartorioUser) {
    console.log(`Migrando usuário Cartório de ${oldCartorioUser.email} para info@filmmakers.com`);
    
    // Atualizar email
    await prisma.user.update({
      where: { id: oldCartorioUser.id },
      data: { email: "info@filmmakers.com" }
    });

    // Atualizar ID para 7813e791-3857-4cbd-81a4-270c0ffd5c38 usando SQL bruto executado individualmente
    const targetUid = "7813e791-3857-4cbd-81a4-270c0ffd5c38";
    if (oldCartorioUser.id !== targetUid) {
      console.log(`Corrigindo ID do Cartório de ${oldCartorioUser.id} para ${targetUid}`);
      
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE cartorios DROP CONSTRAINT IF EXISTS cartorios_userId_fkey`);
        await prisma.$executeRawUnsafe(`UPDATE users SET id = '${targetUid}' WHERE id = '${oldCartorioUser.id}'`);
        await prisma.$executeRawUnsafe(`UPDATE cartorios SET "userId" = '${targetUid}' WHERE "userId" = '${oldCartorioUser.id}'`);
        await prisma.$executeRawUnsafe(`ALTER TABLE cartorios ADD CONSTRAINT cartorios_userId_fkey FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE`);
        console.log("ID do Cartório atualizado com sucesso!");
      } catch (err) {
        console.error("Falha ao atualizar ID do Cartório:", err);
      }
    }
  }

  // B. Sincronizar matheuskurio@gmail.com com o UID c1560111-7bc0-4e99-b254-885a2e96d80f
  const oldProUser = await prisma.user.findUnique({
    where: { email: "matheuskurio@gmail.com" }
  });

  if (oldProUser) {
    const targetUid = "c1560111-7bc0-4e99-b254-885a2e96d80f";
    if (oldProUser.id !== targetUid) {
      console.log(`Corrigindo ID do Profissional de ${oldProUser.id} para ${targetUid}`);
      
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE profissionais DROP CONSTRAINT IF EXISTS profissionais_userId_fkey`);
        await prisma.$executeRawUnsafe(`UPDATE users SET id = '${targetUid}' WHERE id = '${oldProUser.id}'`);
        await prisma.$executeRawUnsafe(`UPDATE profissionais SET "userId" = '${targetUid}' WHERE "userId" = '${oldProUser.id}'`);
        await prisma.$executeRawUnsafe(`ALTER TABLE profissionais ADD CONSTRAINT profissionais_userId_fkey FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE`);
        console.log("ID do Profissional atualizado com sucesso!");
      } catch (err) {
        console.error("Falha ao atualizar ID do Profissional:", err);
      }
    }
  }

  console.log("\n=== AUDIT PÓS-LIMPEZA ===");
  const finalUsers = await prisma.user.findMany({
    select: { id: true, email: true, role: true }
  });
  console.log(`Total de usuários restantes: ${finalUsers.length}`);
  finalUsers.forEach(u => {
    console.log(`- [${u.role}] ${u.email} (ID: ${u.id})`);
  });

  console.log("\n✨ BANCO DE DADOS HIGIENIZADO COM SUCESSO! PRONTO PARA TESTES REAIS ✨");
}

main()
  .catch(err => {
    console.error("❌ ERRO DURANTE A OPERAÇÃO:", err);
  })
  .finally(() => prisma.$disconnect());
