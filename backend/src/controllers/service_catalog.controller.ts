import { Request, Response } from "express";
import { AuthRequest } from "../lib/auth";
import prisma from "../lib/prisma";
import { Prisma } from "@prisma/client";

const serializeService = (s: any) => ({
  ...s,
  basePrice: Number(s.basePrice),
  priceProfessional: Number(s.priceProfessional || 0),
  priceMobile: Number(s.priceMobile || 0),
  allowProfessional: Boolean(s.allowProfessional),
  allowMobile: Boolean(s.allowMobile),
});

export async function listServiceCatalog(req: Request, res: Response): Promise<void> {
  try {
    const services = await prisma.serviceCatalog.findMany({
      where: { active: true },
      orderBy: { name: 'asc' }
    });
    res.json(services.map(serializeService));
  } catch (err) {
    console.error("listServiceCatalog:", err);
    res.status(500).json({ error: "Erro ao listar catálogo de serviços." });
  }
}

export async function adminListServiceCatalog(req: AuthRequest, res: Response): Promise<void> {
  try {
    const services = await prisma.serviceCatalog.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(services.map(serializeService));
  } catch (err) {
    console.error("adminListServiceCatalog:", err);
    res.status(500).json({ error: "Erro ao listar catálogo de serviços." });
  }
}

export async function adminCreateService(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { name, description, category, basePrice, priceProfessional, priceMobile, allowProfessional, allowMobile, estimatedMinutes } = req.body;
    if (!name || basePrice === undefined) {
      res.status(400).json({ error: "Nome e Preço Base são obrigatórios." });
      return;
    }
    const service = await prisma.serviceCatalog.create({
      data: {
        name,
        description,
        category: category || "FOTOGRAFIA",
        basePrice: Number(basePrice),
        priceProfessional: Number(priceProfessional || 0),
        priceMobile: Number(priceMobile || 0),
        allowProfessional: allowProfessional !== undefined ? Boolean(allowProfessional) : true,
        allowMobile: allowMobile !== undefined ? Boolean(allowMobile) : false,
        estimatedMinutes: Number(estimatedMinutes || 60),
      }
    });
    res.status(201).json(serializeService(service));
  } catch (err) {
    console.error("adminCreateService:", err);
    res.status(500).json({ error: "Erro ao criar serviço." });
  }
}

export async function adminUpdateService(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { name, description, category, basePrice, priceProfessional, priceMobile, allowProfessional, allowMobile, estimatedMinutes, active } = req.body;
    const service = await prisma.serviceCatalog.update({
      where: { id: String(id) },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(category !== undefined && { category }),
        ...(basePrice !== undefined && { basePrice: Number(basePrice) }),
        ...(priceProfessional !== undefined && { priceProfessional: Number(priceProfessional) }),
        ...(priceMobile !== undefined && { priceMobile: Number(priceMobile) }),
        ...(allowProfessional !== undefined && { allowProfessional: Boolean(allowProfessional) }),
        ...(allowMobile !== undefined && { allowMobile: Boolean(allowMobile) }),
        ...(estimatedMinutes !== undefined && { estimatedMinutes: Number(estimatedMinutes) }),
        ...(active !== undefined && { active }),
      }
    });
    res.json(serializeService(service));
  } catch (err) {
    console.error("adminUpdateService:", err);
    res.status(500).json({ error: "Erro ao atualizar serviço." });
  }
}

export async function adminDeleteService(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    await prisma.serviceCatalog.delete({
      where: { id: String(id) }
    });
    res.json({ ok: true });
  } catch (err) {
    console.error("adminDeleteService:", err);
    res.status(500).json({ error: "Erro ao deletar serviço." });
  }
}

export async function listPendingServices(req: AuthRequest, res: Response): Promise<void> {
  try {
    const pending = await prisma.professionalService.findMany({
      where: { reviewStatus: "PENDING_REVIEW" },
      include: {
        profissional: { include: { user: { select: { nome: true, email: true } } } },
      },
      orderBy: { submittedAt: 'asc' }
    });
    res.json(pending);
  } catch (err) {
    console.error("listPendingServices:", err);
    res.status(500).json({ error: "Erro ao listar serviços pendentes." });
  }
}

export async function reviewPendingService(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const action = req.body.action || req.body.outcome;
    const reviewNote = req.body.reviewNote || req.body.reason;
    const { updatedName, updatedPrice, updatedEstimatedMinutes } = req.body;

    if (!["NETWORK", "EXCLUSIVE", "REJECTED", "NEEDS_ADJUSTMENT"].includes(action)) {
      res.status(400).json({ error: "Ação inválida." });
      return;
    }

    const service = await prisma.professionalService.findUnique({
      where: { id: String(id) },
      include: { profissional: { include: { user: { select: { nome: true, email: true } } } } }
    });

    if (!service) {
      res.status(404).json({ error: "Serviço não encontrado." });
      return;
    }

    let catalogId = service.catalogId;
    let finalStatus = action;
    let active = action === "REJECTED" ? false : true;

    if (action === "NETWORK") {
      const catalogService = await prisma.serviceCatalog.create({
        data: {
          name: updatedName || service.name,
          description: service.description,
          category: service.category || "FOTOGRAFIA",
          basePrice: updatedPrice !== undefined ? Number(updatedPrice) : service.price,
          estimatedMinutes: updatedEstimatedMinutes !== undefined ? Number(updatedEstimatedMinutes) : (service.estimatedMinutes || 60),
          allowProfessional: true,
          allowMobile: false,
          active: true,
        }
      });
      catalogId = catalogService.id;
    }

    const updatedService = await prisma.professionalService.update({
      where: { id: String(id) },
      data: {
        reviewStatus: finalStatus,
        reviewNote: reviewNote || null,
        catalogId,
        active,
        ...(updatedName && { name: updatedName }),
        ...(updatedPrice !== undefined && { price: Number(updatedPrice) }),
        ...(updatedEstimatedMinutes !== undefined && { estimatedMinutes: Number(updatedEstimatedMinutes) })
      }
    });

    const { NotificationService } = require("../services/notification.service");
    NotificationService.notifyServiceReviewOutcome({
      creatorEmail: (service as any).profissional?.user?.email,
      creatorName: (service as any).profissional?.user?.nome || "Profissional",
      serviceName: service.name,
      outcome: action,
      reason: reviewNote
    }).catch((e: any) => console.error("Erro notificação review outcome:", e));

    res.json(updatedService);
  } catch (err) {
    console.error("reviewPendingService:", err);
    res.status(500).json({ error: "Erro ao revisar serviço." });
  }
}
