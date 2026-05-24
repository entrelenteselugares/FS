const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function auditOrders() {
  console.log("=== INICIANDO AUDITORIA DE PEDIDOS ===");
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      cliente: true,
      event: true
    }
  });

  if (orders.length === 0) {
    console.log("Nenhum pedido encontrado no banco de dados.");
  } else {
    for (const order of orders) {
      console.log(`\nPedido ID: ${order.id}`);
      console.log(`Status de Pagamento: ${order.status}`);
      console.log(`Valor: R$ ${order.totalAmount}`);
      console.log(`Cliente: ${order.cliente?.name || order.cliente?.email} (${order.cliente?.email})`);
      console.log(`Evento: ${order.event?.title || 'N/A'} (${order.eventId || 'N/A'})`);
      console.log(`Stripe Session ID: ${order.stripeSessionId || 'N/A'}`);
    }
  }

  // Verificar notificações recentes enviadas aos admins
  const adminAdmins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
  console.log(`\nAdmins cadastrados no sistema para receber notificação: ${adminAdmins.length}`);

  const recentNotifications = await prisma.notification.findMany({
    where: { 
      type: 'ORDER_CREATED',
      userId: { in: adminAdmins.map(a => a.id) }
    },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  console.log(`\nNotificações de pedido (recentes para ADMINS): ${recentNotifications.length}`);
  for (const n of recentNotifications) {
    console.log(`- [${n.createdAt}] ${n.title}: ${n.message}`);
  }
}

auditOrders().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
