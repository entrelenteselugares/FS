import prisma from "../src/lib/prisma";

async function main() {
  try {
    console.log("[TEST] Conectando ao banco...");
    const user = await prisma.user.findUnique({
      where: { email: "entrelenteselugares@gmail.com" }
    });
    if (user) {
      console.log("[TEST] Usuário encontrado:", JSON.stringify({ id: user.id, nome: user.nome, role: user.role, hasHash: !!user.senha && user.senha.length > 20 }));
    } else {
      console.log("[TEST] ⚠️  Usuário NÃO encontrado no banco.");
    }
  } catch (e: any) {
    console.error("[TEST] ❌ Erro de banco:", e.message);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

main();
