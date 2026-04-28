import { Request, Response } from "express";
import { AuthRequest } from "../lib/auth";
import prisma from "../lib/prisma";

export async function listServiceCatalog(req: Request, res: Response): Promise<void> {
  try {
    const services = await prisma.serviceCatalog.findMany({
      where: { active: true },
      orderBy: { name: 'asc' }
    });
    res.json(services);
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
    res.json(services);
  } catch (err) {
    console.error("adminListServiceCatalog:", err);
    res.status(500).json({ error: "Erro ao listar catálogo de serviços." });
  }
}

export async function adminCreateService(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { name, description, basePrice, estimatedMinutes } = req.body;
    if (!name || basePrice === undefined) {
      res.status(400).json({ error: "Nome e Preço Base são obrigatórios." });
      return;
    }
    const service = await prisma.serviceCatalog.create({
      data: {
        name,
        description,
        basePrice: Number(basePrice),
        estimatedMinutes: Number(estimatedMinutes || 60),
      }
    });
    res.status(201).json(service);
  } catch (err) {
    console.error("adminCreateService:", err);
    res.status(500).json({ error: "Erro ao criar serviço." });
  }
}

export async function adminUpdateService(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { name, description, basePrice, estimatedMinutes, active } = req.body;
    const service = await prisma.serviceCatalog.update({
      where: { id: String(id) },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(basePrice !== undefined && { basePrice: Number(basePrice) }),
        ...(estimatedMinutes !== undefined && { estimatedMinutes: Number(estimatedMinutes) }),
        ...(active !== undefined && { active }),
      }
    });
    res.json(service);
  } catch (err) {
    console.error("adminUpdateService:", err);
    res.status(500).json({ error: "Erro ao atualizar serviço." });
  }
}
