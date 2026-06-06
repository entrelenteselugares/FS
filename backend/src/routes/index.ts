import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { diagnostics } from "../controllers/diag.controller";
import { getMeusPedidos, getMeuPedidoDetalhe, personalizePedido, uploadClientCover } from "../controllers/cliente.controller";
import { CartorioController } from "../controllers/cartorio.controller";
import { SEOController } from "../controllers/seo.controller";
import { chooseAccessType, getAccessStatus, toggleVisibility } from "../controllers/access.controller";
import { requireAuth, requireRole, optionalAuth } from "../lib/auth";
import { likePhoto, getEventLikes, getMyPoints, redeemPrint } from "../controllers/gamification.controller";
import { updatePartnerProfile } from "../controllers/partner.controller";
import { getTeam, saveTeam } from "../controllers/team.controller";
import { runExpirationJob } from "../jobs/expiration.job";
import { runVaultCycleJob } from "../jobs/vault-cycle.job";
import { processAbandonedCarts } from "../jobs/abandonedCart.job";
import { MarketplaceController } from "../controllers/marketplace.controller";
import { AuthRequest } from "../lib/auth";
import { runLoyaltyBot, runEscrowRelease } from "../controllers/cron.controller";
import { ReferralController } from "../controllers/referral.controller";
import { IoTController } from "../controllers/iot.controller";
import { AffiliateController } from "../controllers/affiliate.controller";
import { getMeusRepasses, getMeuSaldoSummary } from "../controllers/payout.controller";
import calendarRoutes from "./calendar.routes";
import { VaultCycleService } from "../services/vaultCycle.service";
import { VaultBlockingService } from "../services/vaultBlocking.service";
import { syncAllCalendars } from "../services/calendar-sync.service";
import flashRoutes from "./flash.routes";
import driveAuthRoutes from "./driveAuth.routes";
import * as PushController from "../controllers/push.controller";
import portfolioRoutes from "./portfolioRoutes";
import * as NotificationController from "../controllers/notification.controller";
import analyticsRoutes from "./analytics.routes";
import { checkDbStatus } from "../controllers/admin.controller";

import adminRoutes from "./admin.routes";
import authRoutes from "./auth.routes";
import checkoutRoutes from "./checkout.routes";
import webhookRoutes from "./webhook.routes";
import vaultRoutes from "./vault.routes";
import publicRoutes from "./public.routes";
import franchiseRoutes from "./franchise.routes";
import { professionalRoutes, requireProOrFranchise } from "./professional.routes";
import { PhygitalController } from "../controllers/phygital.controller";
import worldcupRoutes from "./worldcup.routes";
import editorContractRoutes from "./editorContract.routes";

const router = Router();

// ── ROTAS MODULARIZADAS ──────────────────────────────────────────────────────
router.use("/admin", adminRoutes);
router.use("/editor-contracts", editorContractRoutes);
router.use("/auth", authRoutes);
router.use("/auth-drive", driveAuthRoutes); // Aliased the original /auth to /auth-drive since it was in index.ts as router.use("/auth", driveAuthRoutes) -> WAIT, driveAuthRoutes handles google oauth, let's keep it as /auth-drive. Actually, the original index.ts did `router.use("/auth", driveAuthRoutes);` and also defined `/auth/login` manually. So I'll mount driveAuthRoutes to /auth.
router.use("/checkout", checkoutRoutes);
router.use("/webhooks", webhookRoutes);
router.use("/vaults", vaultRoutes);
router.use("/public", publicRoutes);
router.use("/franchise", franchiseRoutes);
router.use("/profissional", professionalRoutes);

router.use("/auth", driveAuthRoutes); // Re-mounted to /auth to match original behavior where auth routes and drive routes merged.
router.use("/portfolio", portfolioRoutes);
router.use("/worldcup", worldcupRoutes);

// ── Public: Referências Técnicas de Eventos (leitura pública)
import { EventReferenceController } from "../controllers/EventReferenceController";
router.get("/events/:eventId/references", EventReferenceController.list);

// ── PUSH NOTIFICATIONS ───────────────────────────────────────────────────────
router.post("/push/subscribe",   requireAuth, PushController.subscribe);
router.post("/push/unsubscribe", requireAuth, PushController.unsubscribe);
router.post("/push/test",        requireAuth, PushController.sendTestPush);

// --- REDIRECTS DE EMBAIXADOR ---
router.get("/embaixador/:slug", ReferralController.handleReferral);

// ── MARKETPLACE (Fotos Individuais & Venda Expressa) ──────────────────────────
import { GrowthController } from "../controllers/growth.controller";
router.get("/marketplace/coupons/:code/validate", GrowthController.validateCoupon);
router.post("/marketplace/express-sale",      requireAuth, requireProOrFranchise, MarketplaceController.expressSale);
router.post("/marketplace/events/:id/media",  requireAuth, requireProOrFranchise, MarketplaceController.addMedia);
router.post("/marketplace/events/:id/sync-drive", requireAuth, requireProOrFranchise, MarketplaceController.syncEventMedia);
router.patch("/marketplace/media/:mediaId/metadata", requireAuth, requireRole("ADMIN"), MarketplaceController.patchMediaMetadata);
router.delete("/marketplace/media/:mediaId", requireAuth, requireProOrFranchise, MarketplaceController.deleteMedia);
router.get("/marketplace/events/:id/media",   optionalAuth, MarketplaceController.listMedia);
router.get("/marketplace/profissionais",                    MarketplaceController.listProfissionais);
router.get("/marketplace/profissionais/:id",                MarketplaceController.getProfissionalProfile);
router.post("/marketplace/profissionais/book",  requireAuth, MarketplaceController.bookProfissional);


// Cron — protegido por CRON_SECRET (chamado pela Vercel diariamente às 06:00)
router.get("/cron/expiration", async (req, res) => {
  const token = req.headers["authorization"];
  if (process.env.CRON_SECRET && token !== `Bearer ${process.env.CRON_SECRET}`) {
    console.warn("[Cron] Tentativa de acesso não autorizada.");
    return res.status(401).json({ error: "Não autorizado." });
  }
  try {
    const result = await runExpirationJob(req as AuthRequest);
    // Se fases foram puladas por deadline, retorna 206 (Partial Content) para alertar o monitor
    const statusCode = result.skipped.length > 0 ? 206 : 200;
    return res.status(statusCode).json({
      ok: true,
      ran: new Date().toISOString(),
      elapsed: result.elapsed,
      phases: result.phases,
      skipped: result.skipped,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[Cron] Erro:", errorMsg);
    return res.status(500).json({ error: errorMsg });
  }
});

router.get("/cron/loyalty-bot", async (req, res) => {
  const token = req.headers["authorization"];
  if (process.env.CRON_SECRET && token !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Não autorizado." });
  }
  return runLoyaltyBot(req, res);
});

router.get("/cron/escrow-release", async (req, res) => {
  const token = req.headers["authorization"];
  if (process.env.CRON_SECRET && token !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Não autorizado." });
  }
  return runEscrowRelease(req, res);
});

router.use("/calendar", calendarRoutes);

router.get("/cron/calendar-sync", async (req, res) => {
  const token = req.headers["authorization"];
  if (process.env.CRON_SECRET && token !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Não autorizado." });
  }
  try {
    await syncAllCalendars();
    res.json({ ok: true, ran: new Date().toISOString() });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Cron/CalendarSync] Erro:", msg);
    res.status(500).json({ error: msg });
  }
});

router.get("/cron/vault-cycle", async (req, res) => {
  const token = req.headers["authorization"];
  if (process.env.CRON_SECRET && token !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Não autorizado." });
  }
  try {
    await VaultCycleService.processAllDueSubscriptions();
    res.json({ ok: true, ran: new Date().toISOString() });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Cron/VaultCycle] Erro:", msg);
    res.status(500).json({ error: msg });
  }
});

router.get("/cron/vault-expiry", async (req, res) => {
  const token = req.headers["authorization"];
  if (process.env.CRON_SECRET && token !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Não autorizado." });
  }
  try {
    await VaultBlockingService.processExpiringVaults();
    res.json({ ok: true, ran: new Date().toISOString() });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Cron/VaultExpiry] Erro:", msg);
    res.status(500).json({ error: msg });
  }
});

router.get("/cron/abandoned-carts", async (req, res) => {
  const token = req.headers["authorization"];
  if (process.env.CRON_SECRET && token !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Não autorizado." });
  }
  try {
    const result = await processAbandonedCarts();
    // 206 se hit deadline e processamento parcial
    const statusCode = result.skipped ? 206 : 200;
    return res.status(statusCode).json({
      ok: true,
      ran: new Date().toISOString(),
      processed: result.processed,
      partialRun: result.skipped,
      elapsed: result.elapsed,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Cron/AbandonedCarts] Erro:", msg);
    return res.status(500).json({ error: msg });
  }
});

router.get("/diag", diagnostics);

router.get("/share/e/:id", SEOController.getEventPreview);

router.post("/orders/:id/access-type",  requireAuth, chooseAccessType);
router.get("/orders/:id/access-status", requireAuth, getAccessStatus);
router.post("/orders/:id/visibility",    requireAuth, toggleVisibility);

router.get("/cliente/pedidos",     requireAuth, getMeusPedidos);
router.get("/cliente/pedidos/:id", requireAuth, getMeuPedidoDetalhe);
router.patch("/cliente/pedidos/:id/personalize", requireAuth, personalizePedido);
router.patch("/cliente/pedidos/:id/cover",       requireAuth, uploadClientCover);
router.get("/affiliate/dashboard", requireAuth, AffiliateController.getDashboard);

router.post("/events/:slug/photos/like", requireAuth, likePhoto);
router.get("/me/points",                 requireAuth, getMyPoints);
router.post("/me/redeem-print",          requireAuth, redeemPrint);

router.get("/unidade-fixa/stats",    requireAuth, requireRole("ADMIN", "CARTORIO"), CartorioController.getStats);
router.get("/unidade-fixa/events",   requireAuth, requireRole("ADMIN", "CARTORIO"), CartorioController.getEvents);
router.get("/unidade-fixa/orders",   requireAuth, requireRole("ADMIN", "CARTORIO"), CartorioController.getOrders);
router.patch("/unidade-fixa/profile",requireAuth, requireRole("ADMIN", "CARTORIO"), updatePartnerProfile);
router.get("/unidade-fixa/team",     requireAuth, requireRole("ADMIN", "CARTORIO", "PROFISSIONAL", "FRANCHISEE"), getTeam);
router.put("/unidade-fixa/team",     requireAuth, requireRole("ADMIN", "CARTORIO", "PROFISSIONAL", "FRANCHISEE"), saveTeam);

router.get("/me/repasses", requireAuth, getMeusRepasses);
router.get("/me/payout-summary", requireAuth, getMeuSaldoSummary);

// --- AMBASSADOR (Phase 24) ---
router.get("/ambassador/stats",                  requireAuth, ReferralController.getStats);
router.get("/ambassador/network",                requireAuth, ReferralController.getNetworkSummary);
router.get("/ambassador/conversions",            requireAuth, ReferralController.getConversionHistory);
router.post("/ambassador/generate-code",         requireAuth, ReferralController.generateDefaultCode);
router.patch("/ambassador/campaigns/:campaignId/toggle", requireAuth, ReferralController.toggleCampaign);

router.use("/flash", flashRoutes);

// ── PHYGITAL PRINT MONITOR ────────────────────────────────────────────────────
router.get("/phygital/events/:eventId/prints", requireAuth, PhygitalController.listAllByEvent);
router.patch("/phygital/prints/:id/status", requireAuth, PhygitalController.confirmPrint);

// ── IN-APP NOTIFICATIONS ──────────────────────────────────────────────────────
router.get("/notifications", requireAuth, NotificationController.listNotifications);
router.get("/notifications/unread-count", requireAuth, NotificationController.getUnreadCount);
router.patch("/notifications/read-all", requireAuth, NotificationController.markAllAsRead);
router.patch("/notifications/:id/read", requireAuth, NotificationController.markAsRead);

// 🔍 DIAGNÓSTICOS
router.get("/diag/db", checkDbStatus);
router.get("/health", (req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

// 📡 IoT & TELEMETRIA
router.post("/iot/heartbeat", IoTController.heartbeat);

router.use("/analytics", analyticsRoutes);

export default router;
