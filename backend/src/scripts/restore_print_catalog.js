const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const CK_CATALOG_SEED = [
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
  { supplier: "CK", category: "ALBUM_30X40", name: "Álbum 30x40 — Capa Fotográfica — 10 lâminas", sku: "ALB_30x40_10L_FOTO", supplierCost: 459.71, unit: "un" },
  { supplier: "CK", category: "ALBUM_30X40", name: "Álbum 30x40 — Capa Fotográfica — 20 lâminas", sku: "ALB_30x40_20L_FOTO", supplierCost: 816.99, unit: "un" },
  { supplier: "CK", category: "ALBUM_30X40", name: "Álbum 30x40 — Capa Fotográfica — 40 lâminas", sku: "ALB_30x40_40L_FOTO", supplierCost: 1512.94, unit: "un" },
  { supplier: "CK", category: "ALBUM_30X40", name: "Álbum 30x40 — Capa Foto Sobreposta / Magnético — 10 lâminas", sku: "ALB_30x40_10L_MAG", supplierCost: 597.62, unit: "un" },
  { supplier: "CK", category: "ALBUM_30X40", name: "Álbum 30x40 — Capa Foto Sobreposta / Magnético — 20 lâminas", sku: "ALB_30x40_20L_MAG", supplierCost: 926.00, unit: "un" },
  { supplier: "CK", category: "ALBUM_30X40", name: "Álbum 30x40 — Capa Foto Sobreposta / Magnético — 40 lâminas", sku: "ALB_30x40_40L_MAG", supplierCost: 1603.77, unit: "un" },
  { supplier: "CK", category: "ALBUM_30X40", name: "Álbum 30x40 — lâmina adicional", sku: "ALB_30x40_ADD", supplierCost: 38.27, unit: "lâmina" },
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
  { supplier: "CK", category: "REVELACAO", name: "Revelação 10x15 — até 10 cópias", sku: "REV_10x15_ATE10", supplierCost: 1.15, unit: "cópia", minQty: 1, maxQty: 10 },
  { supplier: "CK", category: "REVELACAO", name: "Revelação 10x15 — 11+ cópias", sku: "REV_10x15_ACIMA11", supplierCost: 0.99, unit: "cópia", minQty: 11 },
  { supplier: "CK", category: "REVELACAO", name: "Revelação 15x21 — até 10 cópias", sku: "REV_15x21_ATE10", supplierCost: 2.20, unit: "cópia", minQty: 1, maxQty: 10 },
  { supplier: "CK", category: "REVELACAO", name: "Revelação 15x21 — 11+ cópias", sku: "REV_15x21_ACIMA11", supplierCost: 1.90, unit: "cópia", minQty: 11 },
  { supplier: "CK", category: "REVELACAO", name: "Revelação 20x25", sku: "REV_20x25", supplierCost: 5.30, unit: "cópia" },
  { supplier: "CK", category: "REVELACAO", name: "Revelação 20x30", sku: "REV_20x30", supplierCost: 5.70, unit: "cópia" },
  { supplier: "CK", category: "REVELACAO", name: "Revelação 30x40", sku: "REV_30x40", supplierCost: 13.00, unit: "cópia" },
  { supplier: "CK", category: "REVELACAO", name: "Revelação Grande Formato (60x101 a 60x150)", sku: "REV_GRANDE", supplierCost: 125.00, unit: "cópia" },
];

async function seed() {
  let created = 0;
  let updated = 0;
  for (const p of CK_CATALOG_SEED) {
    const existing = await prisma.printProduct.findUnique({ where: { sku: p.sku } });
    if (!existing) {
      await prisma.printProduct.create({ data: { ...p, active: true } });
      created++;
    } else {
      await prisma.printProduct.update({ 
        where: { id: existing.id }, 
        data: { active: true, supplierCost: p.supplierCost, name: p.name } 
      });
      updated++;
    }
  }
  console.log(`Seeding done. Created: ${created}, Updated: ${updated}`);
  process.exit(0);
}

seed();
