import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const usersToFix = [
    {
      id: "f0d74220-8b78-4c4c-823b-b4795dc6b1de",
      email: "matheuskurio@gmail.com",
      nome: "Matheus Kurio",
      role: "ADMIN"
    },
    {
      id: "add546f9-73e7-4e23-9bbc-bb7321fd4d42",
      email: "castelon@fotosegundo.com",
      nome: "Castelon",
      role: "ADMIN"
    },
    {
      id: "430d88c2-ac57-48fd-947e-baf39883976b",
      email: "entrelenteselugares@gmail.com",
      nome: "Entrelentes",
      role: "ADMIN"
    }
  ];

  console.log("--- Iniciando Sincronização de Usuários ---");

  for (const u of usersToFix) {
    try {
      const existingByEmail = await prisma.user.findUnique({ where: { email: u.email } });
      
      if (existingByEmail) {
        if (existingByEmail.id !== u.id) {
          console.log(`[!] ID mismatch for ${u.email}. Fix: ${existingByEmail.id} -> ${u.id}`);
          // Usando raw query para atualizar ID (campo primário)
          await prisma.$executeRaw`UPDATE users SET id = ${u.id}, role = 'ADMIN' WHERE email = ${u.email}`;
          console.log(`[✓] ID e Role atualizados para ${u.email}`);
        } else {
          console.log(`[.] ID já está correto para ${u.email}. Garantindo Role ADMIN.`);
          await prisma.user.update({
            where: { id: u.id },
            data: { role: 'ADMIN' }
          });
        }
      } else {
        console.log(`[+] Criando novo usuário: ${u.email}`);
        await prisma.user.create({
          data: {
            id: u.id,
            email: u.email,
            nome: u.nome,
            role: "ADMIN",
            senha: "SUPABASE_AUTH_MANAGED",
          }
        });
      }
    } catch (err) {
      console.error(`[!] Erro ao processar ${u.email}:`, err);
    }
  }

  console.log("--- Sincronização Concluída ---");
  await prisma.$disconnect();
  await pool.end();
}

main();
