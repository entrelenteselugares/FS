
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAdmin() {
  const email = "entrelenteselugares@gmail.com";
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (user) {
    console.log(`[CHECK] User found: ${user.email} | Role: ${user.role}`);
    if (user.role !== 'ADMIN') {
      console.log(`[FIX] Promoting ${email} to ADMIN...`);
      await prisma.user.update({
        where: { email },
        data: { role: 'ADMIN' }
      });
      console.log(`[FIX] Done.`);
    }
  } else {
    console.log(`[CHECK] User ${email} NOT FOUND in database!`);
  }
}

checkAdmin()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
