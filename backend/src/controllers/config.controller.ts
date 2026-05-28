import { Request, Response } from "express";
import { AuthRequest } from "../lib/auth";
import prisma from "../lib/prisma";
import { audit } from "../lib/audit";

// GET /api/admin/configs
export async function getConfigs(req: AuthRequest, res: Response): Promise<void> {
  try {
    const configs = await prisma.platformConfig.findMany({
      orderBy: { key: "asc" },
    });

    // As novas taxas (Markup e Take Rate) não precisam somar 100%
    const splits = ["markup_cliente", "take_rate_profissional", "split_affiliate", "split_taxes", "split_platform_costs"];
    const total = splits.reduce((acc, key) => {
      const c = configs.find((cfg) => cfg.key === key);
      return acc + Number(c?.value ?? 0);
    }, 0);

    // Splits valid is true since we don't have the 100% limitation anymore
    res.json({ configs, splitsTotal: total, splitsValid: true });
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar configurações." });
  }
}

// PATCH /api/admin/configs
export async function updateConfigs(req: AuthRequest, res: Response): Promise<void> {
  const { configs } = req.body as { configs: Array<{ key: string; value: string }> };
  const userId = req.user?.userId;
  if (!userId) { res.status(401).json({ error: "Não autenticado." }); return; }

  if (!Array.isArray(configs)) {
    res.status(400).json({ error: "configs deve ser um array." });
    return;
  }

  // Validation to check if sum to 100% was removed (Markup + Take Rate model)
  const splitKeys = ["markup_cliente", "take_rate_profissional", "split_affiliate", "split_taxes", "split_platform_costs"];


  try {
    await Promise.all(
      configs.map((c) =>
        prisma.platformConfig.upsert({
          where: { key: c.key },
          update: { value: c.value, updatedBy: userId },
          create: { key: c.key, value: c.value, updatedBy: userId, label: c.key },
        })
      )
    );

    // Audit — Configurações da plataforma (P1)
    await audit(req, "PLATFORM_CONFIG_UPDATED", "System", "CONFIGS", null, {
      keysModified: configs.map(cfg => cfg.key),
      updatedBy: userId
    });

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Erro ao salvar configurações." });
  }
}

// GET /api/public/configs/theme (Tema e Identidade)
export async function getPublicThemeConfigs(req: AuthRequest, res: Response): Promise<void> {
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
// GET /api/public/configs/services (Alinhado com a nova modelagem de tabela)
export async function getPublicServices(_req: Request, res: Response): Promise<void> {
  try {
    const services = await prisma.serviceCatalog.findMany({
      where: { active: true },
      orderBy: { name: "asc" }
    });
    res.json({ services });
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar serviços." });
  }
}

// GET /api/public/configs/pricing — expõe configurações de precificação pública
export async function getPublicPricingConfigs(_req: Request, res: Response): Promise<void> {
  try {
    const config = await prisma.platformConfig.findUnique({ where: { key: "min_hourly_rate" } });
    res.json({
      minHourlyRate: config ? Number(config.value) : 14
    });
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar configurações de precificação." });
  }
}
