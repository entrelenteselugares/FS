import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testApi() {
  const userId = '88dc85df-96c4-4864-89b4-3da151c1eb3d'; // ID from previous logs for matheuskurio
  
  const profile = await prisma.profissional.findUnique({
    where: { userId },
    include: { 
      user: { 
        select: { 
          nome: true, email: true, whatsapp: true,
          franchiseProfile: { select: { printCredits: true, active: true } }
        } 
      }
    }
  });

  console.log('API Response Structure:');
  console.log(JSON.stringify(profile, null, 2));
}

testApi().catch(console.error).finally(() => prisma.$disconnect());
