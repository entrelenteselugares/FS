import { Request, Response } from "express";
import { AuthRequest } from "../lib/auth";
import prisma from "../lib/prisma";
import { Prisma } from "@prisma/client";
import { audit } from "../lib/audit";

// ── Catálogo de referência CK (seed) ──────────────────────────────────────────
const CK_CATALOG_SEED: Omit<
  Prisma.PrintProductCreateInput,
  "createdAt" | "updatedAt"
>[] = [
  // ── ÁLBUNS ENCADERNADOS — Capa Fotográfica / Material Laser ──────────────
  { supplier: "CK", category: "ALBUM", name: "Álbum 10x15 — Capa Fotográfica — 10 lâminas", sku: "ALB_10x15_10L_FOTO", supplierCost: 107.09, unit: "un", description: "Capa laminada fosco" },
  { supplier: "CK", category: "ALBUM", name: "Álbum 10x15 — Capa Fotográfica — 20 lâminas", sku: "ALB_10x15_20L_FOTO", supplierCost: 183.68, unit: "un" },
  { supplier: "CK", category: "ALBUM", name: "Álbum 10x15 — Capa Fotográfica — 40 lâminas", sku: "ALB_10x15_40L_FOTO", supplierCost: 306.13, unit: "un" },
  { supplier: "CK", category: "ALBUM", name: "Álbum 10x15 — Capa Fotográfica — lâmina adicional", sku: "ALB_10x15_ADD_FOTO", supplierCost: 6.12, unit: "lâmina" },

  { supplier: "CK", category: "ALBUM", name: "Álbum 15x21 — Capa Fotográfica — 10 lâminas", sku: "ALB_15x21_10L_FOTO", supplierCost: 176.02, unit: "un" },
  { supplier: "CK", category: "ALBUM", name: "Álbum 15x21 — Capa Fotográfica — 20 lâminas", sku: "ALB_15x21_20L_FOTO", supplierCost: 270.92, unit: "un" },
  { supplier: "CK", category: "ALBUM", name: "Álbum 15x21 — Capa Fotográfica — 40 lâminas", sku: "ALB_15x21_40L_FOTO", supplierCost: 459.20, unit: "un" },
  { supplier: "CK", category: "ALBUM", name: "Álbum 15x21 — Capa Fotográfica — lâmina adicional", sku: "ALB_15x21_ADD_FOTO", supplierCost: 12.25, unit: "lâmina" },

  { supplier: "CK", category: "ALBUM", name: "Álbum 20x20 — Capa Fotográfica — 10 lâminas", sku: "ALB_20x20_10L_FOTO", supplierCost: 206.63, unit: "un" },
  { supplier: "CK", category: "ALBUM", name: "Álbum 20x20 — Capa Fotográfica — 20 lâminas", sku: "ALB_20x20_20L_FOTO", supplierCost: 315.31, unit: "un" },
  { supplier: "CK", category: "ALBUM", name: "Álbum 20x20 — Capa Fotográfica — 40 lâminas", sku: "ALB_20x20_40L_FOTO", supplierCost: 538.79, unit: "un" },
  { supplier: "CK", category: "ALBUM", name: "Álbum 20x20 — Capa Fotográfica — lâmina adicional", sku: "ALB_20x20_ADD_FOTO", supplierCost: 14.07, unit: "lâmina" },

  { supplier: "CK", category: "ALBUM", name: "Álbum 20x30 — Capa Fotográfica — 10 lâminas", sku: "ALB_20x30_10L_FOTO", supplierCost: 329.08, unit: "un" },
  { supplier: "CK", category: "ALBUM", name: "Álbum 20x30 — Capa Fotográfica — 20 lâminas", sku: "ALB_20x30_20L_FOTO", supplierCost: 390.31, unit: "un" },
  { supplier: "CK", category: "ALBUM", name: "Álbum 20x30 — Capa Fotográfica — 40 lâminas", sku: "ALB_20x30_40L_FOTO", supplierCost: 671.95, unit: "un" },
  { supplier: "CK", category: "ALBUM", name: "Álbum 20x30 — Capa Fotográfica — lâmina adicional", sku: "ALB_20x30_ADD_FOTO", supplierCost: 15.31, unit: "lâmina" },

  { supplier: "CK", category: "ALBUM", name: "Álbum 30x30 — Capa Fotográfica — 10 lâminas", sku: "ALB_30x30_10L_FOTO", supplierCost: 390.31, unit: "un" },
  { supplier: "CK", category: "ALBUM", name: "Álbum 30x30 — Capa Fotográfica — 20 lâminas", sku: "ALB_30x30_20L_FOTO", supplierCost: 520.42, unit: "un" },
  { supplier: "CK", category: "ALBUM", name: "Álbum 30x30 — Capa Fotográfica — 40 lâminas", sku: "ALB_30x30_40L_FOTO", supplierCost: 1023.14, unit: "un" },
  { supplier: "CK", category: "ALBUM", name: "Álbum 30x30 — Capa Fotográfica — lâmina adicional", sku: "ALB_30x30_ADD_FOTO", supplierCost: 21.43, unit: "lâmina" },

  // ── ÁLBUNS — Capa com Foto Sobreposta / Fecho Magnético / 2 Tecidos ────
  { supplier: "CK", category: "ALBUM", name: "Álbum 10x15 — Capa Foto Sobreposta / Magnético — 10 lâminas", sku: "ALB_10x15_10L_MAG", supplierCost: 123.15, unit: "un" },
  { supplier: "CK", category: "ALBUM", name: "Álbum 10x15 — Capa Foto Sobreposta / Magnético — 20 lâminas", sku: "ALB_10x15_20L_MAG", supplierCost: 211.23, unit: "un" },
  { supplier: "CK", category: "ALBUM", name: "Álbum 10x15 — Capa Foto Sobreposta / Magnético — 40 lâminas", sku: "ALB_10x15_40L_MAG", supplierCost: 352.05, unit: "un" },
  { supplier: "CK", category: "ALBUM", name: "Álbum 15x21 — Capa Foto Sobreposta / Magnético — 10 lâminas", sku: "ALB_15x21_10L_MAG", supplierCost: 202.42, unit: "un" },
  { supplier: "CK", category: "ALBUM", name: "Álbum 15x21 — Capa Foto Sobreposta / Magnético — 20 lâminas", sku: "ALB_15x21_20L_MAG", supplierCost: 311.56, unit: "un" },
  { supplier: "CK", category: "ALBUM", name: "Álbum 15x21 — Capa Foto Sobreposta / Magnético — 40 lâminas", sku: "ALB_15x21_40L_MAG", supplierCost: 528.07, unit: "un" },
  { supplier: "CK", category: "ALBUM", name: "Álbum 20x20 — Capa Foto Sobreposta / Magnético — 10 lâminas", sku: "ALB_20x20_10L_MAG", supplierCost: 237.63, unit: "un" },
  { supplier: "CK", category: "ALBUM", name: "Álbum 20x20 — Capa Foto Sobreposta / Magnético — 20 lâminas", sku: "ALB_20x20_20L_MAG", supplierCost: 362.61, unit: "un" },
  { supplier: "CK", category: "ALBUM", name: "Álbum 20x20 — Capa Foto Sobreposta / Magnético — 40 lâminas", sku: "ALB_20x20_40L_MAG", supplierCost: 619.61, unit: "un" },
  { supplier: "CK", category: "ALBUM", name: "Álbum 20x30 — Capa Foto Sobreposta / Magnético — 10 lâminas", sku: "ALB_20x30_10L_MAG", supplierCost: 378.45, unit: "un" },
  { supplier: "CK", category: "ALBUM", name: "Álbum 20x30 — Capa Foto Sobreposta / Magnético — 20 lâminas", sku: "ALB_20x30_20L_MAG", supplierCost: 448.86, unit: "un" },
  { supplier: "CK", category: "ALBUM", name: "Álbum 20x30 — Capa Foto Sobreposta / Magnético — 40 lâminas", sku: "ALB_20x30_40L_MAG", supplierCost: 846.67, unit: "un" },
  { supplier: "CK", category: "ALBUM", name: "Álbum 30x30 — Capa Foto Sobreposta / Magnético — 10 lâminas", sku: "ALB_30x30_10L_MAG", supplierCost: 448.86, unit: "un" },
  { supplier: "CK", category: "ALBUM", name: "Álbum 30x30 — Capa Foto Sobreposta / Magnético — 20 lâminas", sku: "ALB_30x30_20L_MAG", supplierCost: 598.48, unit: "un" },
  { supplier: "CK", category: "ALBUM", name: "Álbum 30x30 — Capa Foto Sobreposta / Magnético — 40 lâminas", sku: "ALB_30x30_40L_MAG", supplierCost: 1176.61, unit: "un" },

  // ── ÁLBUM 30x40 ──────────────────────────────────────────────────────────
  { supplier: "CK", category: "ALBUM_30X40", name: "Álbum 30x40 — Capa Fotográfica — 10 lâminas", sku: "ALB_30x40_10L_FOTO", supplierCost: 459.71, unit: "un" },
  { supplier: "CK", category: "ALBUM_30X40", name: "Álbum 30x40 — Capa Fotográfica — 20 lâminas", sku: "ALB_30x40_20L_FOTO", supplierCost: 816.99, unit: "un" },
  { supplier: "CK", category: "ALBUM_30X40", name: "Álbum 30x40 — Capa Fotográfica — 40 lâminas", sku: "ALB_30x40_40L_FOTO", supplierCost: 1512.94, unit: "un" },
  { supplier: "CK", category: "ALBUM_30X40", name: "Álbum 30x40 — Capa Foto Sobreposta / Magnético — 10 lâminas", sku: "ALB_30x40_10L_MAG", supplierCost: 597.62, unit: "un" },
  { supplier: "CK", category: "ALBUM_30X40", name: "Álbum 30x40 — Capa Foto Sobreposta / Magnético — 20 lâminas", sku: "ALB_30x40_20L_MAG", supplierCost: 926.00, unit: "un" },
  { supplier: "CK", category: "ALBUM_30X40", name: "Álbum 30x40 — Capa Foto Sobreposta / Magnético — 40 lâminas", sku: "ALB_30x40_40L_MAG", supplierCost: 1603.77, unit: "un" },
  { supplier: "CK", category: "ALBUM_30X40", name: "Álbum 30x40 — lâmina adicional", sku: "ALB_30x40_ADD", supplierCost: 38.27, unit: "lâmina" },

  // ── ACABAMENTOS E ACESSÓRIOS ─────────────────────────────────────────────
  { supplier: "CK", category: "ACESSORIOS", name: "Corte Lateral com Fita Colorida (Dourado / Prata / Preto / Azul / Rosa)", sku: "ACAB_CORTE_LATERAL", supplierCost: 30.00, unit: "un" },
  { supplier: "CK", category: "ACESSORIOS", name: "Álbum Sanfona 10x10 — Sem Gravação", sku: "SANFONA_10x10_SEM", supplierCost: 27.50, unit: "un" },
  { supplier: "CK", category: "ACESSORIOS", name: "Álbum Sanfona 10x10 — Com Gravação", sku: "SANFONA_10x10_COM", supplierCost: 30.00, unit: "un" },
  { supplier: "CK", category: "ACESSORIOS", name: "Álbum Sanfona 10x10 — Com Fita de Cetim + Gravação", sku: "SANFONA_10x10_CETIM", supplierCost: 42.50, unit: "un" },
  { supplier: "CK", category: "ACESSORIOS", name: "Álbum Sanfona 15x15 — Sem Gravação", sku: "SANFONA_15x15_SEM", supplierCost: 52.00, unit: "un" },
  { supplier: "CK", category: "ACESSORIOS", name: "Álbum Sanfona 15x15 — Com Gravação", sku: "SANFONA_15x15_COM", supplierCost: 53.90, unit: "un" },
  { supplier: "CK", category: "ACESSORIOS", name: "Álbum Sanfona 15x15 — Com Fita de Cetim + Gravação", sku: "SANFONA_15x15_CETIM", supplierCost: 60.50, unit: "un" },
  { supplier: "CK", category: "ACESSORIOS", name: "Caixa Box para Pen Drive", sku: "CAIXA_BOX_PENDRIVE", supplierCost: 30.50, unit: "un" },
  { supplier: "CK", category: "ACESSORIOS", name: "Pen Drive 4GB Personalizado", sku: "PENDRIVE_4GB", supplierCost: 34.00, unit: "un" },
  { supplier: "CK", category: "ACESSORIOS", name: "Pen Drive 8GB Personalizado", sku: "PENDRIVE_8GB", supplierCost: 35.00, unit: "un" },
  { supplier: "CK", category: "ACESSORIOS", name: "Pen Drive 16GB Personalizado", sku: "PENDRIVE_16GB", supplierCost: 38.00, unit: "un" },

  // ── QUADROS E CADERNOS ───────────────────────────────────────────────────
  { supplier: "CK", category: "QUADROS", name: "Caderno Capa Fotográfica c/ Folhas Impressas — 15x21", sku: "CAD_FOTO_15x21", supplierCost: 35.00, unit: "un" },
  { supplier: "CK", category: "QUADROS", name: "Caderno Capa Fotográfica c/ Folhas Impressas — 20x30", sku: "CAD_FOTO_20x30", supplierCost: 45.00, unit: "un" },
  { supplier: "CK", category: "QUADROS", name: "Caderno Capa Madeira c/ Folhas Pretas — 15x21", sku: "CAD_MAD_15x21", supplierCost: 65.00, unit: "un" },
  { supplier: "CK", category: "QUADROS", name: "Caderno Capa Madeira c/ Folhas Pretas — 20x30", sku: "CAD_MAD_20x30", supplierCost: 75.00, unit: "un" },
  { supplier: "CK", category: "QUADROS", name: "Quadro Esticado Lona — 40x50", sku: "QDR_LONA_40x50", supplierCost: 81.15, unit: "un" },
  { supplier: "CK", category: "QUADROS", name: "Quadro Esticado Lona — 50x70", sku: "QDR_LONA_50x70", supplierCost: 127.76, unit: "un" },
  { supplier: "CK", category: "QUADROS", name: "Quadro Esticado Linho — 40x50", sku: "QDR_LINHO_40x50", supplierCost: 88.05, unit: "un" },
  { supplier: "CK", category: "QUADROS", name: "Quadro Esticado Linho — 50x70", sku: "QDR_LINHO_50x70", supplierCost: 139.86, unit: "un" },
  { supplier: "CK", category: "QUADROS", name: "Quadro Esticado Canva — 40x50", sku: "QDR_CANVA_40x50", supplierCost: 124.32, unit: "un" },
  { supplier: "CK", category: "QUADROS", name: "Quadro Esticado Canva — 50x70", sku: "QDR_CANVA_50x70", supplierCost: 196.87, unit: "un" },

  // ── REVELAÇÃO DE FOTOS ───────────────────────────────────────────────────
  { supplier: "CK", category: "REVELACAO", name: "Revelação 10x15 — até 10 cópias", sku: "REV_10x15_ATE10", supplierCost: 1.15, unit: "cópia", minQty: 1, maxQty: 10 },
  { supplier: "CK", category: "REVELACAO", name: "Revelação 10x15 — 11+ cópias", sku: "REV_10x15_ACIMA11", supplierCost: 0.99, unit: "cópia", minQty: 11 },
  { supplier: "CK", category: "REVELACAO", name: "Revelação 15x21 — até 10 cópias", sku: "REV_15x21_ATE10", supplierCost: 2.20, unit: "cópia", minQty: 1, maxQty: 10 },
  { supplier: "CK", category: "REVELACAO", name: "Revelação 15x21 — 11+ cópias", sku: "REV_15x21_ACIMA11", supplierCost: 1.90, unit: "cópia", minQty: 11 },
  { supplier: "CK", category: "REVELACAO", name: "Revelação 20x25", sku: "REV_20x25", supplierCost: 5.30, unit: "cópia" },
  { supplier: "CK", category: "REVELACAO", name: "Revelação 20x30", sku: "REV_20x30", supplierCost: 5.70, unit: "cópia" },
  { supplier: "CK", category: "REVELACAO", name: "Revelação 30x40", sku: "REV_30x40", supplierCost: 13.00, unit: "cópia" },
  { supplier: "CK", category: "REVELACAO", name: "Revelação Grande Formato (60x101 a 60x150)", sku: "REV_GRANDE", supplierCost: 125.00, unit: "cópia" },
];

// ── GET /admin/print-catalog ──────────────────────────────────────────────────
export async function listPrintProducts(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { category, activeOnly } = req.query;
    const where: Prisma.PrintProductWhereInput = {};
    if (category) where.category = String(category);
    if (activeOnly === "true") where.active = true;

    const products = await prisma.printProduct.findMany({
      where,
      orderBy: [{ category: "asc" }, { supplierCost: "asc" }],
    });

    // Calcula preço de venda calculado (quando sellingPrice é null)
    const result = products.map((p: Prisma.PrintProductGetPayload<{}>) => ({
      ...p,
      supplierCost: Number(p.supplierCost),
      sellingPrice: p.sellingPrice !== null ? Number(p.sellingPrice) : null,
      calculatedPrice: Number(p.supplierCost) * (1 + p.marginPct / 100),
      finalPrice: p.sellingPrice !== null
        ? Number(p.sellingPrice)
        : Number(p.supplierCost) * (1 + p.marginPct / 100),
    }));

    res.json({ products: result, total: result.length });
  } catch (err) {
    console.error("listPrintProducts:", err);
    res.status(500).json({ error: "Erro ao listar catálogo de impressão." });
  }
}

// ── PATCH /admin/print-catalog/:id ───────────────────────────────────────────
export async function updatePrintProduct(req: AuthRequest, res: Response): Promise<void> {
  const id = req.params.id as string;
  const { active, marginPct, sellingPrice, description } = req.body;

  try {
    const product = await prisma.printProduct.findUnique({ where: { id } });
    if (!product) {
      res.status(404).json({ error: "Produto não encontrado." });
      return;
    }

    const updated = await prisma.printProduct.update({
      where: { id },
      data: {
        ...(active !== undefined && { active }),
        ...(marginPct !== undefined && { marginPct: Number(marginPct) }),
        ...(sellingPrice !== undefined && {
          sellingPrice: sellingPrice === null || sellingPrice === "" ? null : Number(sellingPrice),
        }),
        ...(description !== undefined && { description }),
      },
    });

    await audit(req, "PRINT_PRODUCT_UPDATED", "PrintProduct", id, undefined, { active, marginPct, sellingPrice });

    res.json({
      ...updated,
      supplierCost: Number(updated.supplierCost),
      sellingPrice: updated.sellingPrice !== null ? Number(updated.sellingPrice) : null,
      calculatedPrice: Number(updated.supplierCost) * (1 + updated.marginPct / 100),
      finalPrice: updated.sellingPrice !== null
        ? Number(updated.sellingPrice)
        : Number(updated.supplierCost) * (1 + updated.marginPct / 100),
    });
  } catch (err) {
    console.error("updatePrintProduct:", err);
    res.status(500).json({ error: "Erro ao atualizar produto." });
  }
}

// ── POST /admin/print-catalog ───────────────────────────────────────────────
export async function createPrintProduct(req: AuthRequest, res: Response): Promise<void> {
  const { 
    supplier, category, name, sku, supplierCost, 
    unit, marginPct, sellingPrice, description,
    minQty, maxQty 
  } = req.body;

  if (!supplier || !category || !name || !sku || supplierCost === undefined) {
    res.status(400).json({ error: "Campos obrigatórios: supplier, category, name, sku, supplierCost." });
    return;
  }

  try {
    const existing = await prisma.printProduct.findUnique({ where: { sku } });
    if (existing) {
      res.status(400).json({ error: "SKU já cadastrado." });
      return;
    }

    const product = await prisma.printProduct.create({
      data: {
        supplier,
        category,
        name,
        sku,
        supplierCost: Number(supplierCost),
        unit: unit || "un",
        marginPct: marginPct !== undefined ? Number(marginPct) : 30,
        sellingPrice: sellingPrice ? Number(sellingPrice) : null,
        description,
        minQty: minQty ? Number(minQty) : null,
        maxQty: maxQty ? Number(maxQty) : null,
      }
    });

    await audit(req, "PRINT_PRODUCT_CREATED", "PrintProduct", product.id, undefined, product);

    res.status(201).json({
      ...product,
      supplierCost: Number(product.supplierCost),
      sellingPrice: product.sellingPrice !== null ? Number(product.sellingPrice) : null,
      calculatedPrice: Number(product.supplierCost) * (1 + product.marginPct / 100),
      finalPrice: product.sellingPrice !== null
        ? Number(product.sellingPrice)
        : Number(product.supplierCost) * (1 + product.marginPct / 100),
    });
  } catch (err) {
    console.error("createPrintProduct:", err);
    res.status(500).json({ error: "Erro ao criar produto." });
  }
}

// ── PATCH /admin/print-catalog/bulk-margin ─────────────────────────────────── 
// Atualiza a margem de TODA uma categoria de uma vez
export async function bulkUpdateMargin(req: AuthRequest, res: Response): Promise<void> {
  const { category, marginPct } = req.body;

  if (!category || marginPct === undefined) {
    res.status(400).json({ error: "Categoria e margem são obrigatórios." });
    return;
  }

  try {
    const result = await prisma.printProduct.updateMany({
      where: { category: String(category) },
      data: { marginPct: Number(marginPct) },
    });

    await audit(req, "PRINT_BULK_MARGIN_UPDATE", "PrintProduct", undefined, undefined, { category, marginPct, updated: result.count });

    res.json({ ok: true, updated: result.count });
  } catch (err) {
    console.error("bulkUpdateMargin:", err);
    res.status(500).json({ error: "Erro ao atualizar margens em lote." });
  }
}

// ── POST /admin/print-catalog/import ───────────────────────────────────────
// Importa uma lista de produtos (em lote)
export async function importPrintProducts(req: AuthRequest, res: Response): Promise<void> {
  const { products } = req.body;

  if (!products || !Array.isArray(products)) {
    res.status(400).json({ error: "O corpo da requisição deve conter um array 'products'." });
    return;
  }

  let created = 0;
  let updated = 0;
  let errors = 0;

  try {
    for (const p of products) {
      if (!p.sku || !p.name || !p.category || !p.supplier || p.supplierCost === undefined) {
        errors++;
        continue;
      }

      const existing = await prisma.printProduct.findUnique({ where: { sku: p.sku } });

      if (existing) {
        await prisma.printProduct.update({
          where: { sku: p.sku },
          data: {
            name: p.name,
            category: p.category,
            supplier: p.supplier,
            supplierCost: Number(p.supplierCost),
            unit: p.unit || existing.unit,
            description: p.description || existing.description,
            minQty: p.minQty !== undefined ? Number(p.minQty) : existing.minQty,
            maxQty: p.maxQty !== undefined ? Number(p.maxQty) : existing.maxQty,
          }
        });
        updated++;
      } else {
        await prisma.printProduct.create({
          data: {
            supplier: p.supplier,
            category: p.category,
            name: p.name,
            sku: p.sku,
            supplierCost: Number(p.supplierCost),
            unit: p.unit || "un",
            marginPct: p.marginPct !== undefined ? Number(p.marginPct) : 30,
            description: p.description,
            minQty: p.minQty !== undefined ? Number(p.minQty) : null,
            maxQty: p.maxQty !== undefined ? Number(p.maxQty) : null,
          }
        });
        created++;
      }
    }

    await audit(req, "PRINT_CATALOG_IMPORT", "PrintProduct", "BATCH", undefined, { created, updated, errors });

    res.json({ message: "Importação concluída.", created, updated, errors });
  } catch (err) {
    console.error("importPrintProducts:", err);
    res.status(500).json({ error: "Erro crítico durante a importação." });
  }
}

// ── POST /admin/print-catalog/seed ────────────────────────────────────────── 
// Popula o catálogo com os produtos CK (idempotente via upsert)
export async function seedCkCatalog(req: AuthRequest, res: Response): Promise<void> {
  try {
    let created = 0;
    let skipped = 0;

    for (const product of CK_CATALOG_SEED) {
      const existing = await prisma.printProduct.findUnique({ where: { sku: product.sku } });
      if (!existing) {
        await prisma.printProduct.create({ data: product });
        created++;
      } else {
        // Atualiza custo do fornecedor e fornecedor se mudou
        if (Number(existing.supplierCost) !== product.supplierCost || existing.supplier !== product.supplier) {
          await prisma.printProduct.update({
            where: { sku: product.sku },
            data: { 
              supplierCost: product.supplierCost, 
              name: product.name,
              supplier: product.supplier 
            },
          });
        }
        skipped++;
      }
    }

    await audit(req, "PRINT_CATALOG_SEED", "PrintProduct", undefined, undefined, { created, skipped });

    res.json({ ok: true, created, skipped, total: CK_CATALOG_SEED.length });
  } catch (err) {
    console.error("seedCkCatalog:", err);
    res.status(500).json({ error: "Erro ao popular catálogo CK." });
  }
}

// ── GET /public/print-catalog ──────────────────────────────────────────────
export async function getPublicPrintCatalog(req: Request, res: Response): Promise<void> {
  try {
    const products = await prisma.printProduct.findMany({
      where: { active: true },
      orderBy: [{ category: "asc" }, { name: "asc" }]
    });

    const result = products.map((p: Prisma.PrintProductGetPayload<{}>) => ({
      id: p.id,
      category: p.category,
      name: p.name,
      description: p.description,
      finalPrice: p.sellingPrice !== null
        ? Number(p.sellingPrice)
        : Number(p.supplierCost) * (1 + p.marginPct / 100),
      unit: p.unit,
      minQty: p.minQty,
      maxQty: p.maxQty
    }));

    res.json(result);
  } catch (err) {
    console.error("getPublicPrintCatalog:", err);
    res.status(500).json({ error: "Erro ao carregar catálogo." });
  }
}
