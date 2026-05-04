const { createClient } = require("@supabase/supabase-js");
const { PrismaClient } = require("@prisma/client");
require("dotenv").config();

const prisma = new PrismaClient();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  console.log("🌱 SINCRONIZANDO USUÁRIOS GOLD PARA O PRISMA (MODO SEGURO)...");

  const goldEmails = [
    "contatofotosegundo@gmail.com",
    "cliente@fotosegundo.com.br",
    "membro4@fotosegundo.com.br"
  ];

  const { data: { users }, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;

  for (const email of goldEmails) {
    const sbUser = users.find(u => u.email === email);

    if (sbUser) {
      console.log(`🔗 Sincronizando: ${email}`);
      const role = email === "contatofotosegundo@gmail.com" ? "ADMIN" : 
                   email === "membro4@fotosegundo.com.br" ? "PROFISSIONAL" : "CLIENTE";

      const user = await prisma.user.upsert({
        where: { id: sbUser.id },
        update: { email, role, active: true },
        create: {
          id: sbUser.id,
          email,
          nome: email.split("@")[0].toUpperCase(),
          senha: "AUTH_MANAGED", 
          role,
          active: true
        }
      });

      if (role === "PROFISSIONAL" && prisma.profissional) {
        await prisma.profissional.upsert({
          where: { userId: user.id },
          update: {},
          create: { userId: user.id, services: ["FOTOGRAFIA"] }
        });
      }
    }
  }
  console.log("✅ SEED CONCLUÍDO!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
