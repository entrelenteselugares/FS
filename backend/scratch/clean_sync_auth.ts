import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function cleanAndSync() {
  console.log('🧹 LIMPANDO E SINCRONIZANDO AUTENTICAÇÃO...\n');

  const prismaUsers = await prisma.user.findMany();
  
  for (const pUser of prismaUsers) {
    console.log(`\nProcessando ${pUser.email}...`);

    // 1. Tenta deletar se já existir no Supabase Auth para recriar limpo
    const { data: { users: existing }, error: lErr } = await supabase.auth.admin.listUsers({
      filter: `email.eq.${pUser.email.toLowerCase().trim()}`
    } as any);

    if (existing && existing.length > 0) {
      for (const ex of existing) {
        console.log(`- Removendo entrada antiga (ID: ${ex.id})...`);
        await supabase.auth.admin.deleteUser(ex.id);
      }
    }

    // 2. Cria do zero com o ID EXATO do Prisma
    console.log(`- Criando no Supabase Auth com ID: ${pUser.id}...`);
    const { data: nData, error: cErr } = await supabase.auth.admin.createUser({
      id: pUser.id, // Tentamos forçar o ID do Prisma
      email: pUser.email,
      password: '123456',
      email_confirm: true,
      user_metadata: { nome: pUser.nome, role: pUser.role }
    });

    if (cErr) {
      console.warn(`  ⚠️  Não foi possível forçar o ID. Criando com ID aleatório...`);
      const { data: nData2, error: cErr2 } = await supabase.auth.admin.createUser({
        email: pUser.email,
        password: '123456',
        email_confirm: true,
        user_metadata: { nome: pUser.nome, role: pUser.role }
      });
      
      if (cErr2) {
        console.error(`  ❌ Falha total ao criar ${pUser.email}:`, cErr2.message);
      } else if (nData2.user) {
        console.log(`  ✅ Criado com novo ID: ${nData2.user.id}. Sincronizando no Prisma...`);
        await prisma.$executeRawUnsafe(
          'UPDATE users SET id = $1 WHERE email = $2',
          nData2.user.id, pUser.email
        );
      }
    } else {
      console.log(`  ✅ Criado com ID sincronizado com sucesso.`);
    }
  }

  console.log('\n✨ OPERAÇÃO CONCLUÍDA.');
}

cleanAndSync().finally(() => prisma.$disconnect());
