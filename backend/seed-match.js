const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const activeMatch = await prisma.worldCupMatch.findFirst({
    where: { active: true }
  });

  if (!activeMatch) {
    const newMatch = await prisma.worldCupMatch.create({
      data: {
        id: "g7",
        teamA: "Brasil",
        teamB: "Marrocos",
        group: "C",
        matchDate: new Date(),
        active: true
      }
    });
    console.log("Created active match:", newMatch);
  } else {
    console.log("There is already an active match:", activeMatch);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
