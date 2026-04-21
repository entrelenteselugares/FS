import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
import * as path from "path";

// Load .env explicitly
dotenv.config({ path: path.join(__dirname, "../../../.env") });

const prisma = new PrismaClient();

async function main() {
  console.log("--- AUDIT: UNIDADES FIXAS / CARTORIOS ---");
  console.log(`DATABASE_URL: ${process.env.DATABASE_URL?.substring(0, 20)}...`);

  const users = await prisma.user.findMany({
    include: {
      cartorio: true
    }
  });

  const units = users.filter(u => ["CARTORIO", "UNIDADE"].includes(u.role as string));

  if (units.length === 0) {
    console.log("Nenhuma unidade fixa encontrada no banco. Total de usuários: " + users.length);
  } else {
    units.forEach(u => {
      console.log(`ID: ${u.id}`);
      console.log(`Nome: ${u.nome}`);
      console.log(`Email: ${u.email}`);
      console.log(`Role: ${u.role}`);
      console.log(`Ativo: ${u.active}`);
      console.log(`Perfil Cartorio: ${u.cartorio ? "✅ Existe" : "❌ Ausente"}`);
      console.log("-----------------------------------------");
    });
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
