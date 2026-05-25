import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const email = "contatofotosegundo@gmail.com";
  
  // Update the role of the user
  const user = await prisma.user.update({
    where: { email },
    data: { role: 'ADMIN' }
  });
  
  console.log("User updated successfully:", user.email, "role:", user.role);
}

main()
  .catch((e) => {
    console.error("Error updating user:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
