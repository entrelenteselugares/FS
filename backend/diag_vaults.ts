import { prisma } from "./src/lib/prisma";

async function main() {
  try {
    console.log("Simulating listMyVaults...");
    // Mock a userId from the database
    const user = await prisma.user.findFirst();
    if (!user) {
      console.log("No users found to simulate list.");
    } else {
      const memberships = await prisma.albumMember.findMany({
        where: { userId: user.id },
        include: {
          album: {
            include: {
              _count: {
                select: { media: true, members: true }
              }
            }
          }
        }
      });
      console.log(`Simulation complete. Found ${memberships.length} memberships.`);
    }
    
    console.log("Diagnostics complete. No DB errors.");
  } catch (err: any) {
    console.error("DATABASE ERROR:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
