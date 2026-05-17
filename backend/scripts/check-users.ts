import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("=== DB AUDIT INICIAL ===");
  const users = await prisma.user.findMany({
    select: { id: true, email: true, nome: true, role: true }
  });
  console.log(`\nTotal de usuários no banco Prisma: ${users.length}`);
  users.forEach(u => {
    console.log(`- [${u.role}] ${u.nome} (${u.email}) [ID: ${u.id}]`);
  });

  const eventCount = await prisma.event.count();
  const orderCount = await prisma.order.count();
  const printCount = await prisma.phygitalPrint.count();
  const quoteCount = await prisma.quote.count();
  const profCount = await prisma.profissional.count();
  const cartorioCount = await prisma.cartorio.count();

  console.log(`\nResumo de tabelas dinâmicas:`);
  console.log(`- Eventos: ${eventCount}`);
  console.log(`- Pedidos (Vendas): ${orderCount}`);
  console.log(`- Impressões Phygital: ${printCount}`);
  console.log(`- Cotações: ${quoteCount}`);
  console.log(`- Profissionais Cadastrados: ${profCount}`);
  console.log(`- Cartórios Cadastrados: ${cartorioCount}`);
}

main().finally(() => prisma.$disconnect());
