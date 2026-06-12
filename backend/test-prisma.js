const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.findFirst();
    console.log("DB connection OK. User:", user?.email);
  } catch (e) {
    console.error("Prisma Error:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}
main();
