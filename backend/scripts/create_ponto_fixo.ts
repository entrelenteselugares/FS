import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
dotenv.config();

const pool = new Pool({ connectionString: process.env.DIRECT_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const userId = "add546f9-73e7-4e23-9bbc-bb7321fd4d42";

  // Verifica se já existe perfil
  const existing = await prisma.cartorio.findUnique({ where: { userId } });
  if (existing) {
    console.log("✅ Perfil de parceiro já existe:", existing);
    return;
  }

  // Pega dados do user
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    console.error("❌ Usuário não encontrado:", userId);
    return;
  }

  console.log("👤 Usuário encontrado:", user.email, "| Role:", user.role);

  // Cria perfil de Ponto Fixo
  const parceiro = await prisma.cartorio.create({
    data: {
      userId,
      razaoSocial: user.nome || "Castelon Foto Segundo",
      address: null,
    }
  });

  console.log("✅ Perfil de Ponto Fixo criado com sucesso:", parceiro);
}

main().catch(console.error).finally(() => process.exit(0));
