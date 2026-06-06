import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { MercadoPagoService } from "../services/mercadopago.service";
import { NotificationService } from "../services/notification.service";
import { Decimal } from "@prisma/client/runtime/library";

export const EditorContractController = {
  /**
   * CREATE: Contratar um editor (por MercadoPago ou Créditos)
   */
  async create(req: any, res: Response) {
    try {
      const ownerId = req.user?.userId;
      if (!ownerId) return res.status(401).json({ error: "Unauthorized" });

      const { eventId, editorId, serviceId, paymentMethod } = req.body;
      if (!eventId || !editorId || !serviceId || !paymentMethod) {
        return res.status(400).json({ error: "Faltam campos obrigatórios." });
      }

      const service = await prisma.professionalService.findUnique({
        where: { id: serviceId }
      });
      if (!service) return res.status(404).json({ error: "Serviço não encontrado." });

      const event = await prisma.event.findUnique({ where: { id: eventId } });
      if (!event) return res.status(404).json({ error: "Evento não encontrado." });

      const editor = await prisma.user.findUnique({ where: { id: editorId } });
      if (!editor) return res.status(404).json({ error: "Editor não encontrado." });

      const grossAmount = Number(service.price);
      // Taxa da plataforma: 15% provisório
      const platformFee = grossAmount * 0.15;
      const netAmount = grossAmount - platformFee;

      let mpOrderId = null;
      let preferenceUrl = null;

      // 1. Pagamento via Créditos (Wallet)
      if (paymentMethod === "CREDITS") {
        const owner = await prisma.user.findUnique({ where: { id: ownerId } });
        if (!owner || Number(owner.rewardCredits) < grossAmount) {
          return res.status(400).json({ error: "Saldo de créditos insuficiente." });
        }

        // Deduz créditos do dono
        await prisma.user.update({
          where: { id: ownerId },
          data: { rewardCredits: { decrement: grossAmount } }
        });

        await prisma.gamificationLedger.create({
          data: {
            userId: ownerId,
            type: "EDITOR_PAYMENT",
            amount: -grossAmount,
            description: `Pagamento de serviço de edição (${service.name})`,
            orderId: `EVT-${eventId}-EDT`
          }
        });
      }
      // 2. Pagamento via MercadoPago
      else if (paymentMethod === "MP") {
        mpOrderId = `EDT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        
        // Aqui teríamos que criar o payment link via MercadoPagoService e retornar pro frontend pagar.
        // Simulando a criação:
        const preference = await MercadoPagoService.createPreference({
          transaction_amount: grossAmount,
          description: `Contratação Editor: ${service.name} - ${event.title}`,
          payer_email: req.user?.email || "contato@fotosegundo.com",
          notification_url: `${process.env.BACKEND_URL}/api/webhooks/mercadopago/contracts`,
          orderId: mpOrderId
        });
        preferenceUrl = preference.init_point;
      } else {
        return res.status(400).json({ error: "Método de pagamento inválido." });
      }

      // Cria o contrato
      const contract = await prisma.editorContract.create({
        data: {
          eventId,
          editorId,
          ownerId,
          serviceId,
          grossAmount,
          platformFee,
          netAmount,
          paymentMethod,
          mpOrderId,
          status: paymentMethod === "MP" ? "PENDING_ACCEPTANCE" : "PENDING_ACCEPTANCE", // O MP webhook validará o pagamento depois
        }
      });

      // Notifica o Editor (in-app + webhook/email)
      await NotificationService.createInApp({
        userId: editorId,
        type: "CONTRACT_PROPOSED",
        title: "Nova Proposta de Edição",
        body: `Você foi selecionado para editar o evento "${event.title}". Aceite em até 48h.`,
        refId: contract.id,
        refType: "contract"
      });

      if (editor.whatsapp) {
        // Notificação opcional via WhatsApp adaptando a função interna
        console.log(`[WhatsApp Fake] Editor ${editor.nome}, proposta de contrato criada.`);
      }

      return res.json({ contract, preferenceUrl });
    } catch (error) {
      console.error("[EditorContractController create] Erro:", error);
      return res.status(500).json({ error: "Erro interno ao processar contratação." });
    }
  },

  /**
   * GET /api/editor-contracts/editor
   * Contratos onde sou editor
   */
  async getMyContractsAsEditor(req: any, res: Response) {
    try {
      const editorId = req.user?.userId;
      if (!editorId) return res.status(401).json({ error: "Unauthorized" });

      const contracts = await prisma.editorContract.findMany({
        where: { editorId },
        include: {
          event: { select: { id: true, title: true, dataEvento: true } },
          owner: { select: { id: true, nome: true, email: true } },
          service: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: "desc" }
      });
      return res.json(contracts);
    } catch (e) {
      return res.status(500).json({ error: "Erro ao buscar contratos." });
    }
  },

  /**
   * PATCH /api/editor-contracts/:id/accept
   */
  async acceptContract(req: any, res: Response) {
    try {
      const { id } = req.params;
      const editorId = req.user?.userId;

      const contract = await prisma.editorContract.findFirst({
        where: { id: String(id), editorId, status: "PENDING_ACCEPTANCE" },
        include: { event: true, owner: true }
      });
      if (!contract) return res.status(404).json({ error: "Contrato inválido ou já processado." });

      const updated = await prisma.editorContract.update({
        where: { id: String(id) },
        data: { status: "IN_PROGRESS", acceptedAt: new Date() }
      });

      await NotificationService.createInApp({
        userId: contract.ownerId,
        type: "CONTRACT_ACCEPTED",
        title: "Contrato Aceito",
        body: `O editor aceitou o contrato para "${contract.event.title}". O serviço já está em andamento.`,
        refId: contract.id,
        refType: "contract"
      });

      return res.json(updated);
    } catch (e) {
      return res.status(500).json({ error: "Erro ao aceitar contrato." });
    }
  },

  /**
   * PATCH /api/editor-contracts/:id/reject
   */
  async rejectContract(req: any, res: Response) {
    try {
      const { id } = req.params;
      const editorId = req.user?.userId;

      const contract = await prisma.editorContract.findFirst({
        where: { id: String(id), editorId, status: "PENDING_ACCEPTANCE" },
        include: { event: true }
      });
      if (!contract) return res.status(404).json({ error: "Contrato inválido." });

      const updated = await prisma.editorContract.update({
        where: { id: String(id) },
        data: { status: "CANCELLED" }
      });

      // Estorna os créditos do dono se pagou por créditos
      if (contract.paymentMethod === "CREDITS") {
        await prisma.user.update({
          where: { id: contract.ownerId },
          data: { rewardCredits: { increment: contract.grossAmount } }
        });
        await prisma.gamificationLedger.create({
          data: {
            userId: contract.ownerId,
            type: "EDITOR_PAYMENT_REFUND",
            amount: contract.grossAmount,
            description: `Estorno de contrato de edição rejeitado`,
          }
        });
      }

      await NotificationService.createInApp({
        userId: contract.ownerId,
        type: "CONTRACT_REJECTED",
        title: "Proposta Recusada",
        body: `O editor recusou a proposta para o evento "${contract.event.title}". Seus créditos foram estornados.`,
        refId: contract.id,
        refType: "contract"
      });

      return res.json(updated);
    } catch (e) {
      return res.status(500).json({ error: "Erro ao recusar contrato." });
    }
  },

  /**
   * PATCH /api/editor-contracts/:id/deliver
   */
  async deliverContract(req: any, res: Response) {
    try {
      const { id } = req.params;
      const editorId = req.user?.userId;

      const contract = await prisma.editorContract.findFirst({
        where: { id: String(id), editorId, status: "IN_PROGRESS" },
        include: { event: true }
      });
      if (!contract) return res.status(404).json({ error: "Contrato inválido." });

      const updated = await prisma.editorContract.update({
        where: { id: String(id) },
        data: { status: "DELIVERED", deliveredAt: new Date() }
      });

      await NotificationService.createInApp({
        userId: contract.ownerId,
        type: "CONTRACT_DELIVERED",
        title: "Edição Entregue!",
        body: `O editor marcou o serviço como entregue no evento "${contract.event.title}". Você tem 7 dias para revisar.`,
        refId: contract.id,
        refType: "contract"
      });

      return res.json(updated);
    } catch (e) {
      return res.status(500).json({ error: "Erro ao marcar entrega." });
    }
  },

  /**
   * PATCH /api/editor-contracts/:id/revision
   */
  async requestRevision(req: any, res: Response) {
    try {
      const { id } = req.params;
      const ownerId = req.user?.userId;
      const { note } = req.body;

      const contract = await prisma.editorContract.findFirst({
        where: { id: String(id), ownerId, status: "DELIVERED" },
        include: { event: true }
      });
      if (!contract) return res.status(404).json({ error: "Contrato inválido ou fora do período de revisão." });

      if (contract.revisionAt) return res.status(400).json({ error: "Limite de 1 revisão já utilizado." });

      const updated = await prisma.editorContract.update({
        where: { id: String(id) },
        data: { status: "REVISION", revisionAt: new Date(), revisionNote: note }
      });

      await NotificationService.createInApp({
        userId: contract.editorId,
        type: "CONTRACT_REVISION",
        title: "Revisão Solicitada",
        body: `O contratante solicitou revisão para o evento "${contract.event.title}".`,
        refId: contract.id,
        refType: "contract"
      });

      return res.json(updated);
    } catch (e) {
      return res.status(500).json({ error: "Erro ao pedir revisão." });
    }
  }
};
