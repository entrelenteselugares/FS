const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Variáveis de ambiente SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontradas.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const GOLD_LIST = [
  "contatofotosegundo@gmail.com",
  "cliente@fotosegundo.com.br",
  "membro4@fotosegundo.com.br"
];

async function main() {
  console.log("🧹 [JS] INICIANDO LIMPEZA DO SUPABASE AUTH...");
  
  const { data: { users }, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000
  });

  if (error) {
    console.error("❌ Erro ao listar usuários:", error.message);
    return;
  }

  console.log(`📊 Encontrados ${users.length} usuários.`);

  let deletedCount = 0;
  for (const user of users) {
    if (GOLD_LIST.includes(user.email)) {
      console.log(`✅ Mantendo usuário essencial: ${user.email}`);
      continue;
    }

    console.log(`🗑️ Deletando usuário: ${user.email}...`);
    const { error: delError } = await supabase.auth.admin.deleteUser(user.id);
    
    if (delError) {
      console.error(`  ❌ Erro ao deletar ${user.email}:`, delError.message);
    } else {
      deletedCount++;
    }
  }

  console.log(`\n✨ LIMPEZA CONCLUÍDA!`);
  console.log(`♻️  Usuários deletados: ${deletedCount}`);
}

main();
