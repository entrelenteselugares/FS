import { PrismaClient } from '@prisma/client';
import { PaymentController } from './src/controllers/payment.controller';

const prisma = new PrismaClient();

async function runTest() {
  console.log("--- INICIANDO TESTE DE ESCROW (STANDARD) ---");
  
  // 1. Encontrar um evento com fotógrafo NÃO verificado
  const event = await prisma.event.findFirst({
    where: { captacao: { isVerified: false } },
    include: { captacao: true }
  });

  if (!event) {
    console.error("Nenhum evento com fotógrafo não verificado encontrado.");
    return;
  }

  console.log(`Evento Alvo: ${event.nomeNoivos} (ID: ${event.id})`);
  console.log(`Fotógrafo: ${event.captacao?.nome} (Verificado: ${event.captacao?.isVerified})`);

  // 2. Criar um Pedido de Teste
  const order = await prisma.order.create({
    data: {
      eventId: event.id,
      valor: 150.00,
      status: 'APROVADO',
      buyerEmail: 'teste@escrow.com',
      payoutStatus: 'PENDING',
      splitMatriz: 60.00,
      splitCaptacao: 90.00,
      paymentMethod: 'PIX'
    }
  });

  console.log(`Pedido Criado: ${order.id} | Valor: ${order.valor}`);

  // 3. Simular a Finalização Unificada (A que refatoramos com Transaction)
  // Mock do objeto Request para o auditoria
  const mockReq = {
    ip: '127.0.0.1',
    headers: { 'user-agent': 'TestScript' }
  } as any;

  console.log("Executando finalizeApprovedOrder...");
  await PaymentController.finalizeApprovedOrder(order, event, mockReq);

  // 4. Verificar Resultados
  const updatedOrder = await prisma.order.findUnique({
    where: { id: order.id }
  });

  console.log("\n--- RESULTADOS DA AUDITORIA ---");
  console.log(`Status de Repasse: ${updatedOrder?.payoutStatus} (Esperado: PENDING)`);
  console.log(`Pronto para Payout em: ${updatedOrder?.payoutReadyAt}`);
  
  const expectedDate = new Date(event.dataEvento);
  expectedDate.setDate(expectedDate.getDate() + 7);
  
  console.log(`Data Esperada: ${expectedDate}`);

  if (updatedOrder?.payoutStatus === 'PENDING' && 
      updatedOrder.payoutReadyAt?.toDateString() === expectedDate.toDateString()) {
    console.log("\n✅ TESTE APROVADO: Retenção de 7 dias aplicada corretamente.");
  } else {
    console.error("\n❌ TESTE FALHOU: Lógica de Escrow incorreta.");
  }

  process.exit(0);
}

runTest().catch(err => {
  console.error(err);
  process.exit(1);
});
