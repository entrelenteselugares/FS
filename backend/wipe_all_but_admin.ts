import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const adminEmail = "contatofotosegundo@gmail.com";
  
  const users = await prisma.user.findMany({
    where: { email: { not: adminEmail } },
    select: { id: true }
  });
  
  const userIds = users.map(u => u.id);
  console.log(`Found ${userIds.length} users to delete.`);
  
  if (userIds.length > 0) {
    await prisma.photoLike.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.printRedemption.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.userPoints.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.professionalNetwork.deleteMany({ where: { OR: [{ userId: { in: userIds } }, { partnerId: { in: userIds } }] } });
    
    const clientOrders = await prisma.order.findMany({ where: { clienteId: { in: userIds } }, select: { id: true } });
    const clientOrderIds = clientOrders.map(o => o.id);
    if (clientOrderIds.length > 0) {
      await prisma.orderItem.deleteMany({ where: { orderId: { in: clientOrderIds } } });
      await prisma.order.deleteMany({ where: { id: { in: clientOrderIds } } });
    }
    
    await prisma.order.updateMany({ where: { editorId: { in: userIds } }, data: { editorId: null } });
    await prisma.event.updateMany({ where: { captacaoId: { in: userIds } }, data: { captacaoId: null, captacaoStatus: "PENDING" } });
    await prisma.event.updateMany({ where: { edicaoId: { in: userIds } }, data: { edicaoId: null, edicaoStatus: "PENDING" } });
    
    const ownedEvents = await prisma.event.findMany({ where: { cartorioUserId: { in: userIds } }, select: { id: true } });
    const ownedEventIds = ownedEvents.map(e => e.id);
    if (ownedEventIds.length > 0) {
      await prisma.photoLike.deleteMany({ where: { eventId: { in: ownedEventIds } } });
      await prisma.eventMedia.deleteMany({ where: { eventId: { in: ownedEventIds } } });
      const orderItems = await prisma.order.findMany({ where: { eventId: { in: ownedEventIds } }, select: { id: true } });
      await prisma.orderItem.deleteMany({ where: { orderId: { in: orderItems.map(o => o.id) } } });
      await prisma.order.deleteMany({ where: { eventId: { in: ownedEventIds } } });
      await prisma.event.deleteMany({ where: { id: { in: ownedEventIds } } });
    }
    
    const profs = await prisma.profissional.findMany({ where: { userId: { in: userIds } }, select: { id: true } });
    const profIds = profs.map(p => p.id);
    if (profIds.length > 0) {
      await prisma.cartorioProfissional.deleteMany({ where: { profissionalId: { in: profIds } } });
      await prisma.professionalService.deleteMany({ where: { profissionalId: { in: profIds } } });
      await prisma.profissional.deleteMany({ where: { id: { in: profIds } } });
    }
    
    const cartorios = await prisma.cartorio.findMany({ where: { userId: { in: userIds } }, select: { id: true } });
    const cartorioIds = cartorios.map(c => c.id);
    if (cartorioIds.length > 0) {
      await prisma.cartorioProfissional.deleteMany({ where: { cartorioId: { in: cartorioIds } } });
      await prisma.cartorio.deleteMany({ where: { id: { in: cartorioIds } } });
    }
    
    await prisma.franchiseProfile.deleteMany({ where: { userId: { in: userIds } } });
    
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    console.log("All old users deleted.");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
