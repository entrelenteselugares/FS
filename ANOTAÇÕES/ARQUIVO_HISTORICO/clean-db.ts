import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const prisma = new PrismaClient();
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

const ADMIN_EMAIL = "entrelenteselugares@gmail.com";

async function clean() {
  console.log("🧹 Iniciando limpeza de dados...");

  try {
    // 1. Limpar Tabelas de Relacionamento e Logs
    console.log("- Limpando logs, pedidos e mídias...");
    await prisma.auditLog.deleteMany({});
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.photoLike.deleteMany({});
    await prisma.eventMedia.deleteMany({});
    await prisma.event.deleteMany({});
    await prisma.professionalService.deleteMany({});
    await prisma.profissional.deleteMany({});
    await prisma.cartorio.deleteMany({});
    await prisma.userPoints.deleteMany({});
    await prisma.printRedemption.deleteMany({});

    // 2. Buscar usuários para limpar no Supabase
    console.log("- Buscando usuários no banco local...");
    const users = await prisma.user.findMany({
      where: { email: { not: ADMIN_EMAIL } }
    });

    console.log(`- Removendo ${users.length} usuários locais...`);
    await prisma.user.deleteMany({
      where: { email: { not: ADMIN_EMAIL } }
    });

    // 3. Limpar Supabase Auth
    console.log("- Sincronizando limpeza com Supabase Auth...");
    const { data: { users: sbUsers }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) throw listError;

    for (const u of sbUsers) {
      if (u.email !== ADMIN_EMAIL) {
        console.log(`  [Supabase] Removendo: ${u.email}`);
        await supabase.auth.admin.deleteUser(u.id);
      }
    }

    console.log("✅ Limpeza concluída com sucesso! (Admin preservado)");
  } catch (err) {
    console.error("❌ Erro durante a limpeza:", err);
  } finally {
    await prisma.$disconnect();
  }
}

clean();
