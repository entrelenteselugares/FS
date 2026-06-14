const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 

async function main() { 
  const latestEvent = await prisma.event.findFirst({ 
    orderBy: { createdAt: 'desc' }, 
    include: { phygitalPrints: true, media: true } 
  }); 

  if (!latestEvent) return console.log('No events found'); 
  
  console.log('Latest event:', latestEvent.title, latestEvent.id); 
  
  // Clean up phygitalPrints duplicates
  const urlMap = {}; 
  const toDelete = []; 
  
  if (latestEvent.phygitalPrints) {
    for (const p of latestEvent.phygitalPrints) { 
      if (urlMap[p.url]) { 
        toDelete.push(p.id); 
      } else { 
        urlMap[p.url] = true; 
      } 
    } 
  }
  
  console.log('Phygital Prints duplicates to delete:', toDelete.length); 
  if (toDelete.length > 0) { 
    const del = await prisma.phygitalPrint.deleteMany({ where: { id: { in: toDelete } } }); 
    console.log('Deleted PhygitalPrints:', del.count); 
  } 

  // Clean up media duplicates
  const mediaUrlMap = {}; 
  const mediaToDelete = []; 
  
  if (latestEvent.media) {
    for (const m of latestEvent.media) { 
      if (mediaUrlMap[m.url]) { 
        mediaToDelete.push(m.id); 
      } else { 
        mediaUrlMap[m.url] = true; 
      } 
    } 
  }
  
  console.log('Media duplicates to delete:', mediaToDelete.length); 
  if (mediaToDelete.length > 0) { 
    const delM = await prisma.media.deleteMany({ where: { id: { in: mediaToDelete } } }); 
    console.log('Deleted Media:', delM.count); 
  }

  await prisma.$disconnect(); 
} 

main().catch(console.error);
