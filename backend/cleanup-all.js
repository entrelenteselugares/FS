const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 

async function main() { 
  const latestEvent = await prisma.event.findFirst({ 
    orderBy: { createdAt: 'desc' }
  }); 

  if (!latestEvent) return console.log('No events found'); 
  
  const m = await prisma.eventMedia.deleteMany({ where: { eventId: latestEvent.id } });
  const p = await prisma.phygitalPrint.deleteMany({ where: { eventId: latestEvent.id } });
  
  console.log(`Deleted ${m.count} EventMedia and ${p.count} PhygitalPrints from event: ${latestEvent.title}`);
  
  await prisma.$disconnect(); 
} 

main().catch(console.error);
