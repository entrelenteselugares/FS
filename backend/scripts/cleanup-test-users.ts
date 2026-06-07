import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ALLOWED_EMAILS = [
  "contatofotosegundo@gmail.com",
  "info@tlmmakers.com",
  "matheuskurio@gmail.com",
  "meuantigravity.0001@gmail.com",
  "moraesrenata.br@gmail.com",
  "recomendomedia@gmail.com",
  "recomendonacidade@gmail.com",
  "luizcarlos.eduardo2006@gmail.com",
  "wesley.oliveira0980@gmail.com",
  "hackerbospro@gmail.com"
];

async function main() {
  console.log("Starting DB cleanup script...");
  
  // 1. Identify users to delete
  const usersToDelete = await prisma.user.findMany({
    where: {
      email: {
        notIn: ALLOWED_EMAILS
      }
    },
    select: { id: true, email: true }
  });

  const idsToDelete = usersToDelete.map(u => u.id);
  console.log(`Found ${idsToDelete.length} users to delete.`);

  if (idsToDelete.length > 0) {
    console.log("Deleting associated records to prevent foreign key constraint errors...");
    
    // Delete Gamification / World Cup
    await prisma.worldCupBet.deleteMany({ where: { userId: { in: idsToDelete } } });
    await prisma.worldCupBadge.deleteMany({ where: { userId: { in: idsToDelete } } });
    await prisma.worldCupFolha.deleteMany({ where: { userId: { in: idsToDelete } } });
    await prisma.worldCupSlotValidation.deleteMany({ where: { userId: { in: idsToDelete } } });
    await prisma.gamificationLedger.deleteMany({ where: { userId: { in: idsToDelete } } });
    
    // Core records
    await prisma.photoLike.deleteMany({ where: { userId: { in: idsToDelete } } });
    await prisma.userPoints.deleteMany({ where: { userId: { in: idsToDelete } } });
    await prisma.printRedemption.deleteMany({ where: { userId: { in: idsToDelete } } });
    
    // Orders
    // Wait: order items delete many via relation isn't always supported, let's get the orders first
    const ordersToDelete = await prisma.order.findMany({
      where: { clienteId: { in: idsToDelete } },
      select: { id: true }
    });
    const orderIds = ordersToDelete.map(o => o.id);
    if (orderIds.length > 0) {
      await prisma.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
      await prisma.order.deleteMany({ where: { id: { in: orderIds } } });
    }

    // Events
    const eventsToDelete = await prisma.event.findMany({
      where: { ownerId: { in: idsToDelete } },
      select: { id: true }
    });
    const eventIds = eventsToDelete.map(e => e.id);
    if (eventIds.length > 0) {
      await prisma.eventMedia.deleteMany({ where: { eventId: { in: eventIds } } });
      await prisma.event.deleteMany({ where: { id: { in: eventIds } } });
    }

    // Profiles
    const profissionais = await prisma.profissional.findMany({
      where: { userId: { in: idsToDelete } },
      select: { id: true }
    });
    const profIds = profissionais.map(p => p.id);
    if (profIds.length > 0) {
      await prisma.serviceBooking.deleteMany({ where: { profissionalId: { in: profIds } } });
      await prisma.professionalService.deleteMany({ where: { profissionalId: { in: profIds } } });
      await prisma.cartorioProfissional.deleteMany({ where: { profissionalId: { in: profIds } } });
      await prisma.portfolioAlbum.deleteMany({ where: { profissionalId: { in: profIds } } });
      await prisma.profissional.deleteMany({ where: { id: { in: profIds } } });
    }

    const cartorios = await prisma.cartorio.findMany({
      where: { userId: { in: idsToDelete } },
      select: { id: true }
    });
    const cartorioIds = cartorios.map(c => c.id);
    if (cartorioIds.length > 0) {
      await prisma.cartorioProfissional.deleteMany({ where: { cartorioId: { in: cartorioIds } } });
      await prisma.cartorio.deleteMany({ where: { id: { in: cartorioIds } } });
    }

    // Other user-related records
    const fps = await prisma.franchiseProfile.findMany({ where: { userId: { in: idsToDelete } }, select: { id: true } });
    const fpIds = fps.map(f => f.id);
    if (fpIds.length > 0) {
      await prisma.creditTransaction.deleteMany({ where: { profileId: { in: fpIds } } });
      await prisma.phygitalPrint.deleteMany({ where: { franchiseProfileId: { in: fpIds } } });
      await prisma.event.updateMany({ where: { franchiseeId: { in: fpIds } }, data: { franchiseeId: null } });
      await prisma.franchiseProfile.deleteMany({ where: { id: { in: fpIds } } });
    }

    await prisma.affiliateCommission.deleteMany({ where: { userId: { in: idsToDelete } } });
    await prisma.pushSubscription.deleteMany({ where: { userId: { in: idsToDelete } } });
    await prisma.userCalendarCredential.deleteMany({ where: { userId: { in: idsToDelete } } });
    await prisma.auditLog.deleteMany({ where: { userId: { in: idsToDelete } } });

    const albums = await prisma.sharedAlbum.findMany({ where: { ownerId: { in: idsToDelete } }, select: { id: true } });
    const albumIds = albums.map(a => a.id);
    if (albumIds.length > 0) {
      await prisma.sharedAlbumMedia.deleteMany({ where: { albumId: { in: albumIds } } });
      await prisma.albumMember.deleteMany({ where: { albumId: { in: albumIds } } });
      await prisma.accessLink.deleteMany({ where: { albumId: { in: albumIds } } });
      await prisma.subscription.deleteMany({ where: { albumId: { in: albumIds } } });
      await prisma.sharedAlbum.deleteMany({ where: { id: { in: albumIds } } });
    }
    await prisma.sharedAlbumMedia.deleteMany({ where: { uploadedById: { in: idsToDelete } } });
    await prisma.albumMember.deleteMany({ where: { userId: { in: idsToDelete } } });
    await prisma.mediaVote.deleteMany({ where: { userId: { in: idsToDelete } } });
    await prisma.subscription.deleteMany({ where: { userId: { in: idsToDelete } } });

    const campaigns = await prisma.referralCampaign.findMany({ where: { ownerId: { in: idsToDelete } }, select: { id: true } });
    const campIds = campaigns.map(c => c.id);
    if (campIds.length > 0) {
      await prisma.referralVisit.deleteMany({ where: { campaignId: { in: campIds } } });
      await prisma.referralConversion.deleteMany({ where: { campaignId: { in: campIds } } });
      await prisma.referralCampaign.deleteMany({ where: { id: { in: campIds } } });
    }
    
    await prisma.notification.deleteMany({ where: { userId: { in: idsToDelete } } });
    
    // EditorContracts
    await prisma.editorContract.deleteMany({ where: { editorId: { in: idsToDelete } } });
    await prisma.editorContract.deleteMany({ where: { ownerId: { in: idsToDelete } } });

    await prisma.user.updateMany({ where: { referredById: { in: idsToDelete } }, data: { referredById: null } });

    // Finally delete the users
    console.log("Deleting users...");
    await prisma.user.deleteMany({ where: { id: { in: idsToDelete } } });
    console.log(`Successfully deleted ${idsToDelete.length} users and their linked records.`);
  }

  // 2. Zero Financial Data for Allowed Users
  console.log("Setting up VIP100 coupon for financial reset...");
  let coupon = await prisma.coupon.findUnique({ where: { code: 'VIP100' } });
  if (!coupon) {
    coupon = await prisma.coupon.create({
      data: {
        code: 'VIP100',
        discountType: 'PERCENTAGE',
        discountValue: 100,
        isActive: true,
        maxUses: 9999
      }
    });
  }

  const allowedUsers = await prisma.user.findMany({
    where: { email: { in: ALLOWED_EMAILS } },
    select: { id: true }
  });
  const allowedIds = allowedUsers.map(u => u.id);

  console.log(`Resetting financial order data for ${allowedIds.length} allowed users...`);
  
  const updateResult = await prisma.order.updateMany({
    where: { 
      clienteId: { in: allowedIds },
    },
    data: {
      valor: 0,
      splitCaptacao: 0,
      splitCartorio: 0,
      splitEdicao: 0,
      splitMatriz: 0,
      splitAffiliateL1: 0,
      splitAffiliateL2: 0,
      splitFranchisee: 0,
      couponId: coupon.id,
      paymentMethod: "CREDIT_CARD", // To simulate a fully discounted zero-payment
    }
  });

  console.log(`Successfully zeroed finances for ${updateResult.count} orders via VIP100 coupon.`);
  
  console.log("Cleanup script completed!");
}

main()
  .catch(e => {
    console.error("Error running cleanup script:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
