import { PrismaClient } from "@prisma/client";
import { PaymentController } from "../src/controllers/payment.controller";
import { Request } from "express";

const prisma = new PrismaClient();

async function approveOrder(orderId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { event: true, cliente: true }
    });

    if (!order) {
      console.error(`[Manual Approve] Pedido não encontrado: ${orderId}`);
      return;
    }

    console.log(`[Manual Approve] Aprovando pedido ${orderId} (${order.buyerEmail || "Sem Email"})`);

    // 1. Atualiza status do pedido no banco
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: "APROVADO", hasPaid: true },
      include: { event: true, cliente: true }
    });

    // 2. Cria mock do Request do Express para compatibilidade com o sistema de auditoria
    const mockReq = {
      headers: {},
      ip: "127.0.0.1",
      user: {
        userId: updatedOrder.clienteId || null,
        email: updatedOrder.buyerEmail || "system-manual-approve@foto-segundo.com"
      }
    } as unknown as Request;

    // 3. Executa lógica unificada de finalização de pedido aprovado (splits, logística, cupons, cashback, etc.)
    if (updatedOrder.event) {
      console.log(`[Manual Approve] Disparando lógica unificada de finalização de pedido...`);
      await PaymentController.finalizeApprovedOrder(updatedOrder, updatedOrder.event, mockReq);
      console.log(`✅ Pedido ${orderId} finalizado e álbum desbloqueado com sucesso!`);
    } else {
      console.warn(`[Manual Approve] Aviso: Pedido ${orderId} não possui evento associado!`);
    }

  } catch (error) {
    console.error("[Manual Approve] Erro ao aprovar pedido:", error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

// Executa com o ID fornecido no argumento da linha de comando, ou o ID padrão de teste
const targetOrderId = process.argv[2] || "cmpb7izfa0003kv04x7ukmmfd";
approveOrder(targetOrderId);
