import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config();

// IMPORTANTE: Usando DIRECT_URL para operações de escrita crítica
const connectionString = process.env.DIRECT_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("--- Iniciando Ajuste de Papéis e Perfis ---");

  // 1. Matheus -> PROFISSIONAL
  const matheusEmail = "matheuskurio@gmail.com";
  console.log(`[+] Ajustando ${matheusEmail} para PROFISSIONAL...`);
  
  const matheus = await prisma.user.update({
    where: { email: matheusEmail },
    data: { role: "PROFISSIONAL" }
  });

  // Garantir Perfil Profissional para o Matheus
  const profMatheus = await prisma.profissional.findUnique({ where: { userId: matheus.id } });
  if (!profMatheus) {
    console.log(`[+] Criando perfil Profissional para ${matheusEmail}...`);
    await prisma.profissional.create({
      data: {
        userId: matheus.id,
        services: ["FOTO", "VÍDEO"],
        equipment: "Câmera Principal"
      }
    });
  }

  // 2. Entrelentes -> ADMIN
  const adminEmail = "entrelenteselugares@gmail.com";
  console.log(`[+] Ajustando ${adminEmail} para ADMIN...`);
  await prisma.user.update({
    where: { email: adminEmail },
    data: { role: "ADMIN" }
  });

  console.log("--- Ajustes Concluídos ---");
  await prisma.$disconnect();
  await pool.end();
}

main();
