import { PrismaClient } from '@prisma/client';
import { PaymentController } from './src/controllers/payment.controller';

const prisma = new PrismaClient();

async function runTest() {
  console.log("--- INICIANDO TESTE DE BYPASS PRO (LOW RISK) ---");
  
  const eventId = "cmoq0mykb000fvzo4po0fv8et";
  const captacaoId = "cbdc701f-296a-4369-9c42-42edadbc5143";

  // Garantir que o fotógrafo seja VERIFICADO
  await prisma.user.update({
    where: { id: captacaoId },
    data: { isVerified: true }
  });

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { captacao: true }
  });

  if (!event) {
      console.error("Evento não encontrado.");
      return;
  }

  console.log(`Evento Alvo: ${event.nomeNoivos} (ID: ${event.id})`);
  console.log(`Fotógrafo: ${event.captacao?.nome} (Verificado: ${event.captacao?.isVerified})`);

  // 2. Criar um Pedido de Teste (Valor baixo < 5000)
  const order = await prisma.order.create({
    data: {
      eventId: event.id,
      valor: 150.00,
      status: 'APROVADO',
      buyerEmail: 'teste@pro.com',
      payoutStatus: 'PENDING', 
      splitMatriz: 60.00,
      splitCaptacao: 90.00,
      paymentMethod: 'PIX'
    }
  });

  console.log(`Pedido Criado: ${order.id} | Valor: ${order.valor}`);

  // 3. Simular a Finalização
  const mockReq = { ip: '127.0.0.1', headers: { 'user-agent': 'TestScript' } } as any;
  await PaymentController.finalizeApprovedOrder(order, event, mockReq);

  // 4. Verificar Resultados
  const updatedOrder = await prisma.order.findUnique({ where: { id: order.id } });

  console.log("\n--- RESULTADOS DA AUDITORIA ---");
  console.log(`Status de Repasse: ${updatedOrder?.payoutStatus} (Esperado: AVAILABLE)`);
  console.log(`Pronto para Payout em: ${updatedOrder?.payoutReadyAt}`);
  
  const now = new Date();
  
  if (updatedOrder?.payoutStatus === 'AVAILABLE' && 
      updatedOrder.payoutReadyAt && 
      updatedOrder.payoutReadyAt.getTime() <= now.getTime()) {
    console.log("\n✅ TESTE APROVADO: Bypass PRO aplicado. Repasse liberado imediatamente.");
  } else {
    console.error("\n❌ TESTE FALHOU: Lógica de Bypass incorreta.");
  }

  process.exit(0);
}

runTest().catch(err => {
  console.error(err);
  process.exit(1);
});
