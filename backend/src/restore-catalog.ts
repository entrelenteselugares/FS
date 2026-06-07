
import prisma from "./lib/prisma";

const CK_CATALOG_SEED = [
  { supplier: "CK", category: "ALBUM", name: "Álbum 10x15 — Capa Fotográfica — 10 lâminas", sku: "ALB_10x15_10L_FOTO", supplierCost: 107.09, unit: "un", description: "Capa laminada fosco" },
  { supplier: "CK", category: "ALBUM", name: "Álbum 10x15 — Capa Fotográfica — 20 lâminas", sku: "ALB_10x15_20L_FOTO", supplierCost: 183.68, unit: "un" },
  { supplier: "CK", category: "ALBUM", name: "Álbum 10x15 — Capa Fotográfica — 40 lâminas", sku: "ALB_10x15_40L_FOTO", supplierCost: 306.13, unit: "un" },
  { supplier: "CK", category: "ALBUM", name: "Álbum 15x21 — Capa Fotográfica — 10 lâminas", sku: "ALB_15x21_10L_FOTO", supplierCost: 176.02, unit: "un" },
  { supplier: "CK", category: "ALBUM", name: "Álbum 15x21 — Capa Fotográfica — 20 lâminas", sku: "ALB_15x21_20L_FOTO", supplierCost: 270.92, unit: "un" },
  { supplier: "CK", category: "ALBUM", name: "Álbum 15x21 — Capa Fotográfica — 40 lâminas", sku: "ALB_15x21_40L_FOTO", supplierCost: 459.20, unit: "un" },
  { supplier: "CK", category: "ALBUM", name: "Álbum 20x20 — Capa Fotográfica — 10 lâminas", sku: "ALB_20x20_10L_FOTO", supplierCost: 206.63, unit: "un" },
  { supplier: "CK", category: "ALBUM", name: "Álbum 20x20 — Capa Fotográfica — 20 lâminas", sku: "ALB_20x20_20L_FOTO", supplierCost: 315.31, unit: "un" },
  { supplier: "CK", category: "ALBUM", name: "Álbum 30x30 — Capa Fotográfica — 10 lâminas", sku: "ALB_30x30_10L_FOTO", supplierCost: 390.31, unit: "un" },
  { supplier: "CK", category: "ALBUM", name: "Álbum 30x30 — Capa Fotográfica — 20 lâminas", sku: "ALB_30x30_20L_FOTO", supplierCost: 520.42, unit: "un" },
  { supplier: "CK", category: "ALBUM_30X40", name: "Álbum 30x40 — Capa Fotográfica — 10 lâminas", sku: "ALB_30x40_10L_FOTO", supplierCost: 459.71, unit: "un" },
  { supplier: "CK", category: "ALBUM_30X40", name: "Álbum 30x40 — Capa Fotográfica — 20 lâminas", sku: "ALB_30x40_20L_FOTO", supplierCost: 816.99, unit: "un" },
  { supplier: "CK", category: "ACESSORIOS", name: "Corte Lateral com Fita Colorida", sku: "ACAB_CORTE_LATERAL", supplierCost: 30.00, unit: "un" },
  { supplier: "CK", category: "ACESSORIOS", name: "Álbum Sanfona 10x10 — Sem Gravação", sku: "SANFONA_10x10_SEM", supplierCost: 27.50, unit: "un" },
  { supplier: "CK", category: "ACESSORIOS", name: "Pen Drive 16GB Personalizado", sku: "PENDRIVE_16GB", supplierCost: 38.00, unit: "un" },
  { supplier: "CK", category: "QUADROS", name: "Quadro Esticado Lona — 40x50", sku: "QDR_LONA_40x50", supplierCost: 81.15, unit: "un" },
  { supplier: "CK", category: "QUADROS", name: "Quadro Esticado Canva — 50x70", sku: "QDR_CANVA_50x70", supplierCost: 196.87, unit: "un" },
  { supplier: "CK", category: "REVELACAO", name: "Revelação 10x15 — 11+ cópias", sku: "REV_10x15_ACIMA11", supplierCost: 0.99, unit: "cópia" },
  { supplier: "CK", category: "REVELACAO", name: "Revelação 15x21 — 11+ cópias", sku: "REV_15x21_ACIMA11", supplierCost: 1.90, unit: "cópia" },
  { supplier: "CK", category: "REVELACAO", name: "Revelação 20x30", sku: "REV_20x30", supplierCost: 5.70, unit: "cópia" },
  { supplier: "CK", category: "REVELACAO", name: "Revelação 30x40", sku: "REV_30x40", supplierCost: 13.00, unit: "cópia" }
];

async function restore() {
  console.log("Restaurando produtos diretamente no backend...");
  for (const p of CK_CATALOG_SEED) {
    await prisma.printProduct.upsert({
      where: { sku: p.sku },
      update: {
        ...p,
        active: true,
        sellingPrice: null
      },
      create: {
        ...p,
        marginPct: 50,
        active: true
      }
    });
  }
  console.log("Catálogo restaurado com sucesso.");
}

restore()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
