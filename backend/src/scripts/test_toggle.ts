import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const userId = '88dc85df-96c4-4864-89b4-3da151c1eb3d'; // Matheus
  const partnerId = '7f768190-fe88-464b-9c59-b39403cd495b'; // Renata

  try {
    console.log(`TESTING TOGGLE: userId=${userId}, partnerId=${partnerId}`);
    
    // 1. Check existing
    const existing = await prisma.professionalNetwork.findUnique({
      where: { userId_partnerId: { userId, partnerId } }
    });
    console.log("Existing:", existing);

    if (existing) {
      await prisma.professionalNetwork.delete({ where: { id: existing.id } });
      console.log("Deleted.");
    } else {
      const created = await prisma.professionalNetwork.create({
        data: { userId, partnerId }
      });
      console.log("Created:", created);
    }
  } catch (err) {
    console.error("FATAL ERROR IN SCRIPT:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
