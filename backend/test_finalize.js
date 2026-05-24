const { PrismaClient } = require('@prisma/client');
const { Request } = require('express');
const prisma = new PrismaClient();
const { PaymentController } = require('./src/controllers/payment.controller.ts');

async function main() {
  const orderId = "cmpie6g5e0001l704cgcaomsi"; // 2 reais order
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { event: true, cliente: true }
  });
  
  if (!order) {
    console.log("Order not found");
    return;
  }
  
  try {
    // We will just compile it using ts-node to execute the PaymentController
    console.log("Found order:", order.id, "valor:", order.valor);
  } catch (err) {
    console.error(err);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
