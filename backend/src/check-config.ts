import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const configs = await prisma.platformConfig.findMany();
  console.log("PLATFORM CONFIGS:");
  configs.forEach(c => {
    console.log(`${c.key}: ${c.value}`);
  });
  
  const users = await prisma.user.findMany({
    select: { email: true, role: true, id: true }
  });
  console.log("\nUSERS:");
  users.forEach(u => {
    console.log(`[${u.role}] ${u.email} (${u.id})`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
