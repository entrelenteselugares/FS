import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

(async () => {
  const userId = "cmowvk63i0002vz0cr0yq5g9l"; // ID do Unidade SP, vimos no log
  const pixKey = "test@pix";

  try {
    const updated = await prisma.cartorio.update({
      where: { userId },
      data: {
        user: {
          update: {
            pixKey
          }
        }
      }
    });
    console.log("Success:", updated);
  } catch (err) {
    console.error("Prisma Error:", err);
  }
})();
