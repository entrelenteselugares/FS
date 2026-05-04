const { createClient } = require("@supabase/supabase-js");
const { PrismaClient } = require("@prisma/client");
require("dotenv").config();

const prisma = new PrismaClient();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const usersToCreate = [
  { name: 'PRO Fotografo', email: 'pro-photo@test.com', role: 'PROFISSIONAL' },
  { name: 'PRO Editor', email: 'pro-editor@test.com', role: 'PROFISSIONAL' },
  { name: 'PRO Hibrido', email: 'pro-hybrid@test.com', role: 'PROFISSIONAL' },
  { name: 'PRO Mobile', email: 'pro-mobile@test.com', role: 'PROFISSIONAL' },
  { name: 'PRO Video', email: 'pro-video@test.com', role: 'PROFISSIONAL' },
  { name: 'UNIDADE Padrao', email: 'unit-std@test.com', role: 'CARTORIO' },
  { name: 'UNIDADE Tempo Fixo', email: 'unit-fixed@test.com', role: 'CARTORIO' },
  { name: 'UNIDADE Oculta', email: 'unit-hidden@test.com', role: 'CARTORIO' },
  { name: 'FRAN Master', email: 'fran-master@test.com', role: 'PROFISSIONAL' },
  { name: 'CLIENTE VIP', email: 'cliente-vip@test.com', role: 'CLIENTE' }
];

async function main() {
  console.log("🚀 POVOANDO SISTEMA (MODO RESILIENTE)...");

  for (const item of usersToCreate) {
    console.log(`👤 ${item.email}`);
    const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    let authId;
    const existingAuth = users.find(u => u.email === item.email);

    if (existingAuth) {
      authId = existingAuth.id;
    } else {
      const { data: newData } = await supabase.auth.admin.createUser({
        email: item.email, password: '123456', email_confirm: true
      });
      authId = newData.user.id;
    }

    const user = await prisma.user.upsert({
      where: { id: authId },
      update: { role: item.role, nome: item.name },
      create: { id: authId, email: item.email, nome: item.name, role: item.role, senha: 'AUTH_MANAGED' }
    });

    if (item.role === 'PROFISSIONAL' && prisma.profissional) {
      await prisma.profissional.upsert({ where: { userId: user.id }, update: {}, create: { userId: user.id } });
    }
    if (item.role === 'CARTORIO' && prisma.cartorio) {
      await prisma.cartorio.upsert({ where: { userId: user.id }, update: {}, create: { userId: user.id, razaoSocial: item.name } });
    }
  }
  console.log("✅ ONBOARDING CONCLUÍDO!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
