import { Request, Response } from "express";
import prisma from "../lib/prisma";

// GET /api/admin/configs
export async function getConfigs(req: Request, res: Response): Promise<void> {
  try {
    const configs = await prisma.platformConfig.findMany({
      orderBy: { key: "asc" },
    });

    // Valida que os splits somam 100%
    const splits = ["split_matriz", "split_captacao", "split_edicao", "split_cartorio"];
    const total = splits.reduce((acc, key) => {
      const c = configs.find((c) => c.key === key);
      return acc + Number(c?.value ?? 0);
    }, 0);

    res.json({ configs, splitsTotal: total, splitsValid: total === 100 });
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar configurações." });
  }
}

// PATCH /api/admin/configs
export async function updateConfigs(req: Request, res: Response): Promise<void> {
  const { configs } = req.body as { configs: Array<{ key: string; value: string }> };
  const userId = (req as any).user!.userId;

  if (!Array.isArray(configs)) {
    res.status(400).json({ error: "configs deve ser um array." });
    return;
  }

  // Valida que splits somam 100
  const splitKeys = ["split_matriz", "split_captacao", "split_edicao", "split_cartorio"];
  const newSplits = configs.filter((c) => splitKeys.includes(c.key));
  if (newSplits.length > 0) {
    const total = newSplits.reduce((acc, c) => acc + Number(c.value), 0);
    // Soma com os existentes não alterados
    const existingConfigs = await prisma.platformConfig.findMany({
      where: { key: { in: splitKeys } },
    });
    const allSplits = splitKeys.map((key) => {
      const updated = newSplits.find((c) => c.key === key);
      const existing = existingConfigs.find((c) => c.key === key);
      return Number(updated?.value ?? existing?.value ?? 0);
    });
    const totalFinal = allSplits.reduce((a, b) => a + b, 0);
    if (totalFinal !== 100) {
      res.status(400).json({
        error: `Os percentuais de split devem somar 100%. Soma atual: ${totalFinal}%`,
      });
      return;
    }
  }

  try {
    await Promise.all(
      configs.map((c) =>
        prisma.platformConfig.update({
          where: { key: c.key },
          data: { value: c.value, updatedBy: userId },
        })
      )
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Erro ao salvar configurações." });
  }
}

// GET /api/public/configs/theme (Tema e Identidade)
export async function getPublicThemeConfigs(req: Request, res: Response): Promise<void> {
  try {
    const keys = ["brand_primary", "brand_tactical"];
    const configs = await prisma.platformConfig.findMany({
      where: { key: { in: keys } },
    });
    
    const theme: Record<string, string> = {};
    configs.forEach(c => {
      theme[c.key] = c.value;
    });

    res.json(theme);
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar tema." });
  }
}
