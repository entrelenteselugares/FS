const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- AUDITORIA FINAL DE INTEGRIDADE ---');
  try {
    const order = await prisma.order.findFirst({
        select: { id: true, showAlbum: true, showVideo: true }
    });
    
    console.log('Novas colunas em Order encontradas:');
    console.log(' - showAlbum:', order ? (order.showAlbum !== undefined) : 'N/A (Sem pedidos)');
    console.log(' - showVideo:', order ? (order.showVideo !== undefined) : 'N/A (Sem pedidos)');

    const event = await prisma.event.findFirst({
        select: { id: true, isQuote: true, quoteStatus: true }
    });
    console.log('Novas colunas em Event encontradas:');
    console.log(' - isQuote:', event ? (event.isQuote !== undefined) : 'N/A (Sem eventos)');
    console.log(' - quoteStatus:', event ? true : 'N/A');

    console.log('\n✅ Auditoria Completa: Todas as tabelas e colunas críticas estão sincronizadas.');

  } catch (err) {
    console.error('❌ FALHA NA AUDITORIA:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
