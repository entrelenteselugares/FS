import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function syncUsers() {
  console.log('🔄 INICIANDO SINCRONIZAÇÃO DE USUÁRIOS (PRISMA -> SUPABASE AUTH)\n');

  const users = await prisma.user.findMany();
  console.log(`Encontrados ${users.length} usuários no Prisma.`);

  for (const user of users) {
    console.log(`\nVerificando: ${user.email}...`);
    
    // 1. Verificar se já existe no Supabase via e-mail
    const { data: { users: sbUsers }, error: listError } = await supabase.auth.admin.listUsers({
      filter: `email.eq.${user.email.toLowerCase().trim()}`
    } as any);

    if (listError) {
      console.error(`Erro ao listar ${user.email}:`, listError.message);
      continue;
    }

    if (sbUsers && sbUsers.length > 0) {
      const sbUser = sbUsers[0];
      console.log(`- Já existe no Supabase (ID: ${sbUser.id}). Sincronizando IDs...`);
      
      if (sbUser.id !== user.id) {
        // Correção de ID no Prisma para bater com o Supabase Auth
        await prisma.$executeRawUnsafe(
          'UPDATE users SET id = $1 WHERE email = $2',
          sbUser.id, user.email
        );
        console.log(`  ✅ ID corrigido no Prisma: ${sbUser.id}`);
      }
      
      // Forçar senha para 123456 para testes
      await supabase.auth.admin.updateUserById(sbUser.id, { password: '123456' });
      console.log(`  ✅ Senha resetada para 123456.`);
    } else {
      console.log(`- Criando novo usuário no Supabase Auth...`);
      const { data: newData, error: createError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: '123456',
        email_confirm: true,
        user_metadata: { nome: user.nome, role: user.role }
      });

      if (createError) {
        console.error(`  ❌ Erro ao criar ${user.email}:`, createError.message);
      } else if (newData.user) {
        console.log(`  ✅ Criado com sucesso (ID: ${newData.user.id})`);
        // Atualiza o ID no Prisma para bater com o recém-criado no Supabase
        await prisma.$executeRawUnsafe(
          'UPDATE users SET id = $1 WHERE email = $2',
          newData.user.id, user.email
        );
        console.log(`  ✅ ID sincronizado no Prisma.`);
      }
    }
  }

  console.log('\n✨ SINCRONIZAÇÃO CONCLUÍDA.');
}

syncUsers().finally(() => prisma.$disconnect());
