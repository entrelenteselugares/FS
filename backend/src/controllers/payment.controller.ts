import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { MercadoPagoService } from "../services/mercadopago.service";

export class PaymentController {
  /**
   * POST /api/checkout
   * Inicia o fluxo de pagamento com precificação dinâmica.
   */
  static async checkout(req: Request, res: Response) {
    const { eventId, userId, email, method, token, installments, issuer_id } = req.body;

    try {
      // 1. Buscar evento com os parceiros vinculados
      const event = await prisma.event.findUnique({ 
        where: { id: eventId },
        include: {
          fotografo: true,
          editor: true,
          cartorioUser: true
        }
      });

      if (!event) return res.status(404).json({ error: "Evento não encontrado" });

      // 2. Lógica de Precificação Dinâmica
      const now = new Date();
      const eventDate = new Date(event.dataEvento);
      eventDate.setHours(0, 0, 0, 0);
      
      const preco = now.getTime() < eventDate.getTime() ? 190 : 200;

      // 3. Preparar Split de Pagamentos (Marketplace)
      // Regra: percentuais de parceiros SEM conta MP conectada vão para a Matriz.
      // Isso garante que applicationFee + disbursements sempre = transaction_amount.
      const taxaFotografo = Number(process.env.TAXA_FOTOGRAFO || 0.30);
      const taxaEditor    = Number(process.env.TAXA_EDITOR    || 0.20);
      const taxaCartorio  = Number(process.env.TAXA_CARTORIO  || 0.10);
      let   taxaMatriz    = Number(process.env.TAXA_MATRIZ    || 0.40);

      const partnersList = [];

      if (event.fotografo?.mpUserId) {
        partnersList.push({
          mpUserId: event.fotografo.mpUserId,
          amount: preco * taxaFotografo,
          role: "FOTOGRAFO"
        });
      } else {
        // Fotógrafo não conectou conta MP → percentual vai para a Matriz
        taxaMatriz += taxaFotografo;
        console.log(`[Checkout] Fotógrafo sem conta MP — ${(taxaFotografo * 100).toFixed(0)}% absorvido pela Matriz.`);
      }

      if (event.editor?.mpUserId) {
        partnersList.push({
          mpUserId: event.editor.mpUserId,
          amount: preco * taxaEditor,
          role: "EDITOR"
        });
      } else {
        taxaMatriz += taxaEditor;
        console.log(`[Checkout] Editor sem conta MP — ${(taxaEditor * 100).toFixed(0)}% absorvido pela Matriz.`);
      }

      if (event.cartorioUser?.mpUserId) {
        partnersList.push({
          mpUserId: event.cartorioUser.mpUserId,
          amount: preco * taxaCartorio,
          role: "CARTORIO"
        });
      } else {
        taxaMatriz += taxaCartorio;
        console.log(`[Checkout] Cartório sem conta MP — ${(taxaCartorio * 100).toFixed(0)}% absorvido pela Matriz.`);
      }

      console.log(`[Checkout] Split: Matriz=${(taxaMatriz * 100).toFixed(0)}% | ${partnersList.length} parceiro(s) conectado(s).`);


      // 4. Criar Pedido Pendente no Banco
      const order = await prisma.order.create({
        data: {
          eventId,
          clienteId: userId,
          valor: preco,
          status: "PENDENTE"
        }
      });

      // 5. Criar Pagamento no Mercado Pago
      const mpResponse = await MercadoPagoService.createPayment({
        transaction_amount: preco,
        description: `Fotos Evento: ${event.nomeNoivos}`,
        payment_method_id: method,
        payer_email: email,
        notification_url: `${process.env.BACKEND_URL || "http://localhost:3001"}/api/webhooks/mercadopago`,
        token: token,
        installments: installments,
        issuer_id: issuer_id,
        partners: partnersList,
        matrizRate: taxaMatriz, // Taxa dinâmica após absorção de parceiros desconectados
      });

      // 6. Vincular ID do Pagamento do MP ao Pedido
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentId: String(mpResponse.id) }
      });

      return res.json({
        orderId: order.id,
        payment: mpResponse
      });

    } catch (error: any) {
      console.error("Erro no checkout:", error);
      return res.status(500).json({ error: error.message || "Erro no processamento do pagamento" });
    }
  }

  /**
   * POST /api/webhooks/mercadopago
   * Recebe notificações automáticas de atualização de status.
   */
  static async webhook(req: Request, res: Response) {
    const { type, data } = req.body;

    // O MP envia o ID da transação em data.id quando o type é 'payment'
    if (type === "payment" && data?.id) {
      try {
        const paymentData = await MercadoPagoService.getPaymentStatus(data.id);
        
        if (paymentData.status === "approved") {
          // Atualiza o pedido vinculado
          await prisma.order.updateMany({
            where: { paymentId: String(data.id) },
            data: { status: "APROVADO" }
          });
          console.log(`✅ Pagamento ${data.id} aprovado e pedido liberado.`);
        }
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Erro desconhecido";
        console.error("Erro ao processar webhook:", msg);
      }
    }

    // Responder sempre 200 ou 201 para o MP parar de tentar enviar
    return res.status(200).send("OK");
  }
}
