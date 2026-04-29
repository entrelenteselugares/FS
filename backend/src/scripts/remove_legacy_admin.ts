/**
 * Script de limpeza: remove o usuário legado entrelenteselugares@gmail.com do banco local.
 * O email novo oficial é contatofotosegundo@gmail.com.
 * 
 * Executar com: npx ts-node -r tsconfig-paths/register src/scripts/remove_legacy_admin.ts
 */
import prisma from "../lib/prisma";

async function main() {
  const LEGACY_EMAIL = "entrelenteselugares@gmail.com";
  const NEW_EMAIL    = "contatofotosegundo@gmail.com";

  console.log(`\n[CLEANUP] Verificando usuário legado: ${LEGACY_EMAIL}`);

  const legacy = await prisma.user.findUnique({ where: { email: LEGACY_EMAIL } });

  if (!legacy) {
    console.log(`[CLEANUP] ✅ Usuário legado NÃO encontrado no banco. Nada a fazer.`);
  } else {
    console.log(`[CLEANUP] ⚠️  Usuário legado ENCONTRADO: ID=${legacy.id} | Role=${legacy.role}`);
    await prisma.user.delete({ where: { email: LEGACY_EMAIL } });
    console.log(`[CLEANUP] ✅ Usuário ${LEGACY_EMAIL} removido com sucesso.`);
  }

  const admin = await prisma.user.findUnique({ where: { email: NEW_EMAIL } });
  if (admin) {
    console.log(`[CLEANUP] ✅ Admin principal (${NEW_EMAIL}) confirmado: ID=${admin.id} | Role=${admin.role}`);
  } else {
    console.log(`[CLEANUP] ❌ Admin principal ${NEW_EMAIL} NÃO encontrado. Execute o seed-admin.ts.`);
  }

  await prisma.$disconnect();
}

main().catch(e => {
  console.error("[CLEANUP ERROR]:", e);
  process.exit(1);
});
