import { Request, Response } from "express";
import { PhygitalService } from "../services/phygital.service";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class PhygitalController {
  /**
   * Endpoint público para upload via QR Code
   */
  static async upload(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Nenhuma foto enviada." });
      }

      const { eventId, customerName, customerPhone, customerCep } = req.body;

      if (!eventId || !customerName) {
        return res.status(400).json({ error: "Dados obrigatórios ausentes (eventId, customerName)." });
      }

      const result = await PhygitalService.processUpload(req.file.buffer, {
        eventId,
        customerName,
        customerPhone: customerPhone || "",
        customerCep: customerCep || ""
      });

      res.status(201).json(result);
    } catch (error: any) {
      console.error("Erro no PhygitalController.upload:", error);
      res.status(500).json({ error: "Falha ao processar foto.", details: error.message });
    }
  }

  /**
   * Endpoint para o Agente IoT buscar fila de impressão
   */
  static async listPending(req: Request, res: Response) {
    try {
      const eventId = req.query.eventId as string;
      if (!eventId) return res.status(400).json({ error: "eventId é obrigatório." });

      const prints = await PhygitalService.getPendingPrints(eventId);
      res.json({ success: true, pendingPrints: prints });
    } catch (error: any) {
      res.status(500).json({ error: "Falha ao listar fila." });
    }
  }

  /**
   * Endpoint para o Admin ver o histórico completo de um evento
   */
  static async listAllByEvent(req: Request, res: Response) {
    try {
      const eventId = req.params.eventId as string;
      if (!eventId) return res.status(400).json({ error: "eventId é obrigatório." });

      const prints = await prisma.phygitalPrint.findMany({
        where: { eventId: String(eventId) },
        orderBy: { createdAt: 'desc' }
      });
      res.json(prints); // Retorna array puro como esperado pelo frontend
    } catch (error: any) {
      res.status(500).json({ error: "Falha ao listar histórico." });
    }
  }

  /**
   * Endpoint para o Agente IoT confirmar a impressão
   */
  static async confirmPrint(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const { status } = req.body;
      if (!id || !status) return res.status(400).json({ error: "id e status são obrigatórios." });

      const updated = await PhygitalService.updateStatus(String(id), status);
      res.json({ success: true, updated });
    } catch (error: any) {
      res.status(500).json({ error: "Falha ao confirmar impressão." });
    }
  }

  /**
   * Endpoint de Simulação para Stress Test
   */
  static async simulate(req: Request, res: Response) {
    try {
      const { eventId, referenceCode, imageUrl, customerName } = req.body;
      
      if (!eventId || !referenceCode) {
        return res.status(400).json({ error: "eventId e referenceCode são obrigatórios." });
      }

      const print = await prisma.phygitalPrint.create({
        data: {
          eventId,
          referenceCode,
          imageUrl: imageUrl || 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=2069&auto=format&fit=crop',
          customerName: customerName || 'Simulado',
          status: 'PENDING_PRINT'
        }
      });

      res.status(201).json({ success: true, print });
    } catch (error: any) {
      res.status(500).json({ error: "Falha na simulação.", details: error.message });
    }
  }
}
