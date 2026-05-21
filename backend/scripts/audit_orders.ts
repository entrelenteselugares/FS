import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("=== INSPECTING ALL EVENTS IN DATABASE ===");
  const events = await prisma.event.findMany({});
  for (const event of events) {
    if (event.lightroomUrl !== null || event.driveUrl !== null) {
      console.log(`Event: ${event.nomeNoivos} (ID: ${event.id})`);
      console.log(`  lightroomUrl: ${JSON.stringify(event.lightroomUrl)} (type: ${typeof event.lightroomUrl})`);
      console.log(`  driveUrl: ${JSON.stringify(event.driveUrl)} (type: ${typeof event.driveUrl})`);
    }
  }
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
