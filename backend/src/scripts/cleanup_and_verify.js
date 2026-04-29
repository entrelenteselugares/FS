const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const usersToDelete = [
    'user3_test@foto.com',
    'fotografo_teste@foto.com',
    'vrvw@gfgt.com',
    'matheuskuio@gmail.com',
    'tlmagenciadigital@gmail.com',
    'moraesrenata.br@gmail.com'
  ];

  console.log("=== INICIANDO LIMPEZA DE USUÁRIOS DE TESTE ===");

  for (const email of usersToDelete) {
    try {
      // Deletar perfis dependentes primeiro (embora o prisma deva lidar com cascade se configurado, vamos garantir)
      const user = await prisma.user.findUnique({ where: { email }, include: { profissional: true, cartorio: true } });
      if (user) {
        if (user.profissional) await prisma.profissional.delete({ where: { id: user.profissional.id } });
        if (user.cartorio) await prisma.cartorio.delete({ where: { id: user.cartorio.id } });
        
        await prisma.user.delete({ where: { id: user.id } });
        console.log(`[OK] Usuário deletado: ${email}`);
      } else {
        console.log(`[SKIP] Usuário não encontrado: ${email}`);
      }
    } catch (err) {
      console.error(`[ERRO] Falha ao deletar ${email}:`, err.message);
    }
  }

  console.log("=== VERIFICANDO INTEGRIDADE DAS TABELAS ===");
  const tables = ["User", "Event", "Order", "Cartorio", "Profissional", "PrintProduct", "PlatformConfig"];
  for (const table of tables) {
    const count = await prisma[table.charAt(0).toLowerCase() + table.slice(1)].count();
    console.log(`Tabela ${table}: ${count} registros.`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
