import { Response } from "express";
import { AuthRequest } from "../lib/auth";
import { prisma } from "../lib/prisma";

// GET /api/admin/suppliers
export async function listSuppliers(req: AuthRequest, res: Response): Promise<void> {
  try {
    const suppliers = await prisma.printSupplier.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { redemptions: true } } },
    });
    res.json(suppliers);
  } catch {
    res.status(500).json({ error: "Erro ao listar fornecedores." });
  }
}

// GET /api/admin/redemptions
export async function listRedemptions(req: AuthRequest, res: Response): Promise<void> {
  try {
    const redemptions = await prisma.printRedemption.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { nome: true, email: true, whatsapp: true } },
        supplier: { select: { name: true } },
      },
    });
    res.json(redemptions);
  } catch (err) {
    console.error("listRedemptions:", err);
    res.status(500).json({ error: "Erro ao listar resgates." });
  }
}

// POST /api/admin/suppliers
export async function createSupplier(req: AuthRequest, res: Response): Promise<void> {
  const {
    name, type, printerModel, printerCost,
    costPer10x15, costPer4x6,
    boxCost, labelCost, uberCost, baseCep,
  } = req.body;

  if (!name || !type || !costPer10x15) {
    res.status(400).json({ error: "Nome, tipo e custo por foto são obrigatórios." });
    return;
  }

  try {
    const supplier = await prisma.printSupplier.create({
      data: {
        name, type, printerModel,
        printerCost: printerCost ? Number(printerCost) : null,
        costPer10x15: Number(costPer10x15),
        costPer4x6: costPer4x6 ? Number(costPer4x6) : null,
        boxCost: boxCost ? Number(boxCost) : null,
        labelCost: labelCost ? Number(labelCost) : null,
        uberCost: uberCost ? Number(uberCost) : null,
        baseCep: baseCep ?? "13050-251",
      },
    });
    res.status(201).json(supplier);
  } catch (err) {
    console.error("createSupplier:", err);
    res.status(500).json({ error: "Erro ao criar fornecedor." });
  }
}

// GET /api/admin/suppliers/:id/breakeven
// Calcula quantas fotos precisam ser impressas para pagar a impressora
export async function getBreakeven(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    const supplier = await prisma.printSupplier.findUnique({ where: { id: String(id) } });
    if (!supplier || !supplier.printerCost) {
      res.status(400).json({ error: "Fornecedor não encontrado ou sem custo de impressora." });
      return;
    }

    const printerCost = Number(supplier.printerCost);
    const costPerPhoto = Number(supplier.costPer10x15);
    const boxCostUnit = Number(supplier.boxCost ?? 0);
    const labelCostUnit = Number(supplier.labelCost ?? 0);
    const uberCostUnit = Number(supplier.uberCost ?? 40);

    // Custo total por foto impressa e enviada
    // Assumindo média de 3 fotos por envio (pacote máximo)
    const totalCostPerPhoto = costPerPhoto + (boxCostUnit / 1) + labelCostUnit + (uberCostUnit / 3);

    // Break-even: quantas fotos para pagar a impressora
    const photosToBreakeven = Math.ceil(printerCost / totalCostPerPhoto);

    // Pacotes (12/24/36 curtidas)
    const packages = [
      { curtidas: 12, photos: 1 },
      { curtidas: 24, photos: 2 },
      { curtidas: 36, photos: 3 },
    ];

    res.json({
      printerCost,
      costPerPhoto: totalCostPerPhoto.toFixed(4),
      photosToBreakeven,
      estimatedConcursos: Math.ceil(photosToBreakeven / 2),
      packages: packages.map((p) => ({
        ...p,
        totalCost: (p.photos * totalCostPerPhoto).toFixed(2),
        costBreakdown: {
          impressao: (costPerPhoto * p.photos).toFixed(2),
          embalagem: boxCostUnit.toFixed(2),
          etiqueta: labelCostUnit.toFixed(2),
          frete: (uberCostUnit / 3).toFixed(2),
        },
      })),
      // Cenários de impressora
      scenarios: [1500, 3000, 5000, 10000].map((priceImp) => ({
        printerPrice: priceImp,
        photosNeeded: Math.ceil(priceImp / totalCostPerPhoto),
        monthsAt10PerMonth: Math.ceil(priceImp / (totalCostPerPhoto * 10)),
      })),
    });

  } catch (err) {
    console.error("getBreakeven:", err);
    res.status(500).json({ error: "Erro ao calcular break-even." });
  }
}

// PATCH /api/admin/redemptions/:id/status
export async function updateRedemptionStatus(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { status, trackingCode } = req.body;

  try {
    const updated = await prisma.printRedemption.update({
      where: { id: String(id) },
      data: {
        status,
        ...(trackingCode && { trackingCode }),
      },
    });
    res.json(updated);
  } catch {
    res.status(500).json({ error: "Erro ao atualizar status." });
  }
}
