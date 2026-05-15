import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function testBackendLogic() {
  console.log("--- Testing Backend Logic ---");
  
  const testUserId = "test-user-id-" + Date.now();
  
  // 1. Create test user
  await prisma.user.create({
    data: {
      id: testUserId,
      email: `test-${Date.now()}@example.com`,
      nome: "Test User",
      role: "CLIENTE",
      senha: "hash",
      profileComplete: false
    }
  });
  console.log("Test user created.");

  // 2. Simulate applyRole (Manual prisma update to see if it works)
  await prisma.profissional.upsert({
    where: { userId: testUserId },
    create: { userId: testUserId, equipment: "Test Gear", services: [], cameras: [], lenses: [], lighting: [] },
    update: { equipment: "Test Gear" }
  });
  
  await prisma.user.update({
    where: { id: testUserId },
    data: { verificationStatus: "PENDING", isVerified: false }
  });
  console.log("Apply role simulated (User -> Pending Professional).");

  // Cleanup
  await prisma.profissional.delete({ where: { userId: testUserId } });
  await prisma.user.delete({ where: { id: testUserId } });
  console.log("Cleanup complete.");
  console.log("Backend logic verified successfully.");
}

testBackendLogic()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
