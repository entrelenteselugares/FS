import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { EventController } from "../controllers/event.controller";
import { PaymentController } from "../controllers/payment.controller";
import { AuthController } from "../controllers/auth.controller";
import { diagnostics } from "../controllers/diag.controller";
import {
  getDashboardStats,
  adminListEvents,
  adminCreateEvent,
  adminUpdateEvent,
  adminDeleteEvent,
  adminListUsers,
  adminCreateUser,
  adminUpdateUser,
  adminDeleteUser,
  adminListOrders,
  adminMarkPayoutPaid,
  adminDeleteOrder,
  adminUpdateOrderLogistics,
  adminListQuotes,
  adminApproveQuote,
  adminRejectQuote,
  AdminEventController,
  adminUploadCover,
  adminUploadPreview,
  adminGetLogs,
  adminCreateManualSale,
  checkDbStatus,
} from "../controllers/admin.controller";
import { MercadoPagoController } from "../controllers/mercadopago.controller";
import {
  getMeusEventos,
  updateEventLinks,
  uploadEventCover,
  getProfile,
  updateProfile,
  respondToEvent,
  registerManualSale,
  getConvitesUnidade,
  respondConviteUnidade,
  addProService,
  updateProService,
  deleteProService,
  listProServices,
  getNetwork,
  searchProfessionals,
  toggleFavorite,
} from "../controllers/profissional.controller";
import { getMeusPedidos, getMeuPedidoDetalhe } from "../controllers/cliente.controller";
import { CartorioController } from "../controllers/cartorio.controller";
import { SEOController } from "../controllers/seo.controller";
import { getConfigs, updateConfigs, getPublicThemeConfigs, getPublicServices } from "../controllers/config.controller";
import { generateWeeklyPayout, listPayouts, markItemPaid, exportPayoutCSV, getMeusRepasses } from "../controllers/payout.controller";
import {
  chooseAccessType,
  getAccessStatus,
  deleteMediaAdmin,
  toggleVisibility,
} from "../controllers/access.controller";
import { requireAuth, requireRole, optionalAuth } from "../lib/auth";
import {
  likePhoto,
  getEventLikes,
  getMyPoints,
  redeemPrint,
} from "../controllers/gamification.controller";
import * as AdminPrintCatalog from "../controllers/print_catalog.controller";
import * as ServiceCatalogController from "../controllers/service_catalog.controller";
import {
  listSuppliers,
  createSupplier,
  getBreakeven,
  updateRedemptionStatus,
  listRedemptions,
} from "../controllers/supplier.controller";
import {
  adminCreateContest,
  adminListContests,
  adminUpdateContest,
  getActiveContest,
  getHallOfFame,
} from "../controllers/contest.controller";
import {
  getPartnerLandingData,
  updatePartnerProfile,
} from "../controllers/partner.controller";
import { getTeam, saveTeam } from "../controllers/team.controller";
import { adminGetEventById } from "../controllers/admin_event_detail.controller";
import { runExpirationJob } from "../jobs/expiration.job";
import { runVaultCycleJob } from "../jobs/vault-cycle.job";
import {
  bulkUpdateMargin,
  seedCkCatalog,
} from "../controllers/print_catalog.controller";
import { MarketplaceController } from "../controllers/marketplace.controller";
import { requireMercadoPagoSignature } from "../middleware/webhook-auth";
import { getTaxReport } from "../controllers/finance.controller";
import { AuthRequest } from "../lib/auth";
import { runLoyaltyBot } from "../controllers/cron.controller";
import { PhygitalController } from "../controllers/phygital.controller";
import { FranchiseController } from "../controllers/franchise.controller";
import { VaultController } from "../controllers/vault.controller";
import { IoTController } from "../controllers/iot.controller";
import calendarRoutes from "./calendar.routes";
import { VaultCycleService } from "../services/vaultCycle.service";
import { syncAllCalendars } from "../services/calendar-sync.service";
import multer from "multer";
import express from "express";
import flashRoutes from "./flash.routes";

const upload = multer({ storage: multer.memoryStorage() });

import driveAuthRoutes from "./driveAuth.routes";

const router = Router();

// ... existing routes ...
router.use("/auth", driveAuthRoutes);

/**
 * Middleware especial que permite acesso se o usuário for ADMIN, PROFISSIONAL 
 * OU se possuir um FranchiseProfile ativo (mesmo sendo CLIENTE).
 */
const requireProOrFranchise = async (req: any, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: "Não autenticado." });
  if (user.role === "ADMIN" || user.role === "PROFISSIONAL") return next();

  try {
    const profile = await prisma.franchiseProfile.findUnique({ 
      where: { userId: user.userId } 
    });
    if (profile && profile.active) return next();
  } catch (err) {
    console.error("[requireProOrFranchise] Erro ao verificar perfil de franquia:", err);
  }
  
  return res.status(403).json({ error: "Acesso negado. Requer perfil profissional ou franquia ativa." });
};

// ── PROFISSIONAIS (Rede Técnica) ────────────────────────────────────────────
// Rota removida (duplicada abaixo)
router.patch("/profissional/events/:id/links",   requireAuth, requireProOrFranchise, updateEventLinks);
router.patch("/profissional/events/:id/cover",   requireAuth, requireProOrFranchise, uploadEventCover);
router.patch("/profissional/events/:id/respond", requireAuth, requireProOrFranchise, respondToEvent);
router.get("/profissional/me",                   requireAuth, requireProOrFranchise, getProfile);
router.patch("/profissional/me",                 requireAuth, requireProOrFranchise, updateProfile);
router.post("/profissional/events/:id/manual-sale", requireAuth, requireProOrFranchise, registerManualSale);
router.get("/profissional/unidades/convites", requireAuth, requireProOrFranchise, getConvitesUnidade);
router.patch("/profissional/unidades/convites/:id/respond", requireAuth, requireProOrFranchise, respondConviteUnidade);
router.get("/profissional/network", requireAuth, requireProOrFranchise, getNetwork);
router.get("/profissional/network/search", requireAuth, requireProOrFranchise, searchProfessionals);
router.post("/profissional/network/favorite/:partnerId", requireAuth, requireProOrFranchise, toggleFavorite);
router.get("/profissional/finance/tax-report", requireAuth, requireProOrFranchise, getTaxReport);

// ── MARKETPLACE (Fotos Individuais & Venda Expressa) ──────────────────────────
router.post("/marketplace/express-sale",      requireAuth, requireProOrFranchise, MarketplaceController.expressSale);
router.post("/marketplace/events/:id/media",  requireAuth, requireProOrFranchise, MarketplaceController.addMedia);
router.get("/marketplace/events/:id/media",   optionalAuth, MarketplaceController.listMedia);


// Cron — protegido por CRON_SECRET (chamado pela Vercel diariamente às 06:00)
router.get("/cron/expiration", async (req, res) => {
  const token = req.headers["authorization"];
  if (process.env.CRON_SECRET && token !== `Bearer ${process.env.CRON_SECRET}`) {
    console.warn("[Cron] Tentativa de acesso não autorizada.");
    return res.status(401).json({ error: "Não autorizado." });
  }
  try {
    await runExpirationJob(req as AuthRequest);
    await runVaultCycleJob();
    console.log("[Cron] Job de expiração e Cofres executados com sucesso.");
    res.json({ ok: true, ran: new Date().toISOString() });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[Cron] Erro:", errorMsg);
    res.status(500).json({ error: errorMsg });
  }
});

router.get("/cron/loyalty-bot", async (req, res) => {
  const token = req.headers["authorization"];
  if (process.env.CRON_SECRET && token !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Não autorizado." });
  }
  return runLoyaltyBot(req, res);
});

// ── Google Calendar (OAuth2 + Disponibilidade) ──────────────────────────────
router.use("/calendar", calendarRoutes);

// ── Cron: Sync de Calendários (Google → PostgreSQL) ─────────────────────────
// Chamado pela Vercel a cada 15 minutos. Protegido por CRON_SECRET.
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

// ── Cron: Vault Cycle (Processamento de Assinaturas Vencidas) ────────────────
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

// ── Autenticação ─────────────────────────────────────────────────────────────
router.post("/auth/login",           AuthController.login);
router.post("/auth/register",        AuthController.register);
router.post("/auth/forgot-password", AuthController.forgotPassword);
router.post("/auth/reset-password",  AuthController.updatePassword);
router.get("/auth/me",               requireAuth, AuthController.me);
router.patch("/auth/me",             requireAuth, AuthController.updateMe);
router.post("/auth/refresh",          AuthController.refresh);
router.get("/public/auth/check",     AuthController.checkEmail);

// ── Mercado Pago OAuth ────────────────────────────────────────────────────────
router.get("/mercadopago/connect",  requireAuth, MercadoPagoController.connect);
router.get("/diag", diagnostics);

// ── Eventos Públicos (Vitrine & Paywall) ──────────────────────────────────────
router.get("/public/events",               EventController.listPublic);
router.get("/public/events/:slug",         optionalAuth, EventController.getById);       // busca por slug ou id
router.get("/public/events/:slug/access",  EventController.getAccess);     // ?orderId=xxx
router.get("/profissional/events",      requireAuth, requireProOrFranchise, EventController.listByProfessional);
router.get("/profissional/events/:slug", requireAuth, requireProOrFranchise, EventController.getById);
router.post("/profissional/flash-event", requireAuth, requireProOrFranchise, EventController.createFlashEvent);
router.post("/profissional/foto-point", requireAuth, requireProOrFranchise, EventController.createFotoPoint);
router.patch("/profissional/events/:id/foto-point", requireAuth, requireProOrFranchise, EventController.updateFotoPoint);
router.get("/public/partners",             EventController.listPartners);   // alias legado
router.get("/public/unidades-fixas",       EventController.listPartners);   // alias compatível
router.post("/public/quotes",              EventController.createQuote);

// ── Landings de Unidade Fixa (pública) ───────────────────────────────────────
router.get("/public/unidade-fixa/:slug",   getPartnerLandingData);

// ── Configurações Públicas ─────────────────────────────────────────────────────
router.get("/public/configs/theme",        getPublicThemeConfigs);
router.get("/public/configs/services",     getPublicServices);
router.get("/public/service-catalog",      ServiceCatalogController.adminListServiceCatalog); // Reutilizando a listagem para público

// ── Gamificação Pública ───────────────────────────────────────────────────────
router.get("/public/contests/active",      getActiveContest);
router.get("/public/contests/hall-of-fame",getHallOfFame);
router.get("/events/:slug/likes",          getEventLikes);

// ── SEO / Share ────────────────────────────────────────────────────────────────
router.get("/share/e/:id", SEOController.getEventPreview);

// ── Checkout & Webhook ─────────────────────────────────────────────────────────
router.post("/checkout/pending",     PaymentController.createPendingOrder);
router.post("/checkout/payment",     optionalAuth, PaymentController.processPayment);
router.get("/checkout/shipping-quote", optionalAuth, PaymentController.calculateShipping);
router.post(
  "/webhooks/mercadopago",
  // Raw body antes do JSON parser — garante integridade do HMAC
  express.raw({ type: "application/json" }),
  (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    if (Buffer.isBuffer(req.body)) {
      try { req.body = JSON.parse(req.body.toString("utf8")); } catch { req.body = {}; }
    }
    next();
  },
  requireMercadoPagoSignature,
  PaymentController.webhook
);

// ── Pedido e Catálogo Público ────────────────────────────────────────────────
router.get("/public/orders/:id",               PaymentController.getOrderPublic);
router.get("/public/orders/:id/check-payment", PaymentController.checkPaymentStatus);
router.post("/public/orders/:id/manual-payment", requireAuth, PaymentController.manualPayment);
router.get("/public/print-catalog",            AdminPrintCatalog.getPublicPrintCatalog);
router.get("/public/events/:eventId/print-products", AdminPrintCatalog.getEventPrintProducts);
router.post("/orders/print",                   PaymentController.createPrintOrder);


// ── LGPD / Acesso (pós-pagamento) ─────────────────────────────────────────────
router.post("/orders/:id/access-type",  requireAuth, chooseAccessType);
router.get("/orders/:id/access-status", requireAuth, getAccessStatus);
router.post("/orders/:id/visibility",    requireAuth, toggleVisibility);

// ── Cliente: Meus Pedidos ──────────────────────────────────────────────────────
router.get("/cliente/pedidos",     requireAuth, getMeusPedidos);
router.get("/cliente/pedidos/:id", requireAuth, getMeuPedidoDetalhe);

// ── Gestão de Serviços (Vitrine do Profissional) ──────────────────────────────
router.get("/profissional/services", requireAuth, requireRole("ADMIN", "PROFISSIONAL"), listProServices);
router.post("/profissional/services", requireAuth, requireRole("ADMIN", "PROFISSIONAL"), addProService);
router.patch("/profissional/services/:id", requireAuth, requireRole("ADMIN", "PROFISSIONAL"), updateProService);
router.delete("/profissional/services/:id", requireAuth, requireRole("ADMIN", "PROFISSIONAL"), deleteProService);

// ── Gamificação: Curtidas & Resgates ──────────────────────────────────────────
router.post("/events/:slug/photos/like", requireAuth, likePhoto);
router.get("/me/points",                 requireAuth, getMyPoints);
router.post("/me/redeem-print",          requireAuth, redeemPrint);

// ── Unidade Fixa ──────────────────────────────────────────────────────────────
router.get("/unidade-fixa/stats",    requireAuth, requireRole("ADMIN", "CARTORIO"), CartorioController.getStats);
router.get("/unidade-fixa/events",   requireAuth, requireRole("ADMIN", "CARTORIO"), CartorioController.getEvents);
router.get("/unidade-fixa/orders",   requireAuth, requireRole("ADMIN", "CARTORIO"), CartorioController.getOrders);
router.patch("/unidade-fixa/profile",requireAuth, requireRole("ADMIN", "CARTORIO"), updatePartnerProfile);
router.get("/unidade-fixa/team",     requireAuth, requireRole("ADMIN", "CARTORIO"), getTeam);
router.put("/unidade-fixa/team",     requireAuth, requireRole("ADMIN", "CARTORIO"), saveTeam);

// ── Admin: Stats & Logs ────────────────────────────────────────────────────────
router.get("/admin/stats", requireAuth, requireRole("ADMIN"), getDashboardStats);
router.get("/admin/logs", requireAuth, requireRole("ADMIN"), adminGetLogs);
router.post("/admin/orders/manual", requireAuth, requireRole("ADMIN"), adminCreateManualSale);

// ── Admin: Gestão de Eventos ───────────────────────────────────────────────────
router.get("/admin/events",             requireAuth, requireRole("ADMIN"), adminListEvents);
router.get("/admin/events/:id",         requireAuth, requireRole("ADMIN"), adminGetEventById);
router.post("/admin/events",            requireAuth, requireRole("ADMIN"), adminCreateEvent);
router.patch("/admin/events/:id",       requireAuth, requireRole("ADMIN"), adminUpdateEvent);
router.patch("/admin/events/:id/cover", requireAuth, requireRole("ADMIN"), adminUploadCover);
router.patch("/admin/events/:id/preview", requireAuth, requireRole("ADMIN"), adminUploadPreview);
router.delete("/admin/events/:id",      requireAuth, requireRole("ADMIN"), adminDeleteEvent);

// ── Admin: Gestão de Usuários ──────────────────────────────────────────────────
router.get("/admin/users",       requireAuth, requireRole("ADMIN"), adminListUsers);
router.post("/admin/users",      requireAuth, requireRole("ADMIN"), adminCreateUser);
router.patch("/admin/users/:id", requireAuth, requireRole("ADMIN"), adminUpdateUser);
router.delete("/admin/users/:id", requireAuth, requireRole("ADMIN"), adminDeleteUser);

// ── Admin: Gestão de Pedidos ───────────────────────────────────────────────────
router.get("/admin/orders",                   requireAuth, requireRole("ADMIN"), adminListOrders);
router.patch("/admin/orders/:id/payout",      requireAuth, requireRole("ADMIN"), adminMarkPayoutPaid);
router.patch("/admin/orders/:id/logistics",     requireAuth, requireRole("ADMIN"), adminUpdateOrderLogistics);
router.delete("/admin/orders/:id",                requireAuth, requireRole("ADMIN"), adminDeleteOrder);
router.post("/admin/orders/:id/delete-media", requireAuth, requireRole("ADMIN"), deleteMediaAdmin);

// ── Admin: Orçamentos (Leads) ──────────────────────────────────────────────────
router.get("/admin/quotes",               requireAuth, requireRole("ADMIN"), adminListQuotes);
router.patch("/admin/quotes/:id/approve", requireAuth, requireRole("ADMIN"), adminApproveQuote);
router.patch("/admin/quotes/:id/reject",  requireAuth, requireRole("ADMIN"), adminRejectQuote);

// ── Admin: Repasses ────────────────────────────────────────────────────────────
router.post("/admin/payouts/generate",                requireAuth, requireRole("ADMIN"), generateWeeklyPayout);
router.get("/admin/payouts",                          requireAuth, requireRole("ADMIN"), listPayouts);
router.get("/admin/payouts/export",                requireAuth, requireRole("ADMIN"), exportPayoutCSV);
router.patch("/admin/payouts/:id/items/:itemId/paid", requireAuth, requireRole("ADMIN"), markItemPaid);
router.get("/payouts/me", requireAuth, getMeusRepasses);

// ── Admin: Configurações ───────────────────────────────────────────────────────
router.get("/admin/configs",   requireAuth, requireRole("ADMIN"), getConfigs);
router.patch("/admin/configs", requireAuth, requireRole("ADMIN"), updateConfigs);

// ── Admin: Fornecedores & Breakeven ────────────────────────────────────────────
router.get("/admin/suppliers",               requireAuth, requireRole("ADMIN"), listSuppliers);
router.post("/admin/suppliers",              requireAuth, requireRole("ADMIN"), createSupplier);
router.get("/admin/suppliers/:id/breakeven", requireAuth, requireRole("ADMIN"), getBreakeven);
router.get("/admin/redemptions",             requireAuth, requireRole("ADMIN"), listRedemptions);
router.patch("/admin/redemptions/:id/status",requireAuth, requireRole("ADMIN"), updateRedemptionStatus);

// ── Admin: Concursos ───────────────────────────────────────────────────────────
router.get("/admin/contests",       requireAuth, requireRole("ADMIN"), adminListContests);
router.post("/admin/contests",      requireAuth, requireRole("ADMIN"), adminCreateContest);
router.patch("/admin/contests/:id", requireAuth, requireRole("ADMIN"), adminUpdateContest);

// ── Admin: Catálogo de Impressão (CK) ──────────────────────────────────────────
router.get("/admin/print-catalog", requireAuth, requireRole("ADMIN"), AdminPrintCatalog.listPrintProducts);
router.post("/admin/print-catalog", requireAuth, requireRole("ADMIN"), AdminPrintCatalog.createPrintProduct);
router.post("/admin/print-catalog/import", requireAuth, requireRole("ADMIN"), AdminPrintCatalog.importPrintProducts);
router.patch("/admin/print-catalog/bulk-margin", requireAuth, requireRole("ADMIN"), AdminPrintCatalog.bulkUpdateMargin);
router.patch("/admin/print-catalog/:id", requireAuth, requireRole("ADMIN"), AdminPrintCatalog.updatePrintProduct);
router.post("/admin/print-catalog/seed", requireAuth, requireRole("ADMIN"), AdminPrintCatalog.seedCkCatalog);

// ── Admin: Catálogo Global de Serviços ─────────────────────────────────────────
router.get("/admin/service-catalog", requireAuth, requireRole("ADMIN"), ServiceCatalogController.adminListServiceCatalog);
router.post("/admin/service-catalog", requireAuth, requireRole("ADMIN"), ServiceCatalogController.adminCreateService);
router.patch("/admin/service-catalog/:id", requireAuth, requireRole("ADMIN"), ServiceCatalogController.adminUpdateService);
router.delete("/admin/service-catalog/:id", requireAuth, requireRole("ADMIN"), ServiceCatalogController.adminDeleteService);

// ── FRANCHISES (Gestão de Micro-Franquias) ──────────────────────────────────
router.get("/admin/franchises",                              requireAuth, requireRole("ADMIN"), FranchiseController.listAll);
router.post("/admin/franchises/promote",                    requireAuth, requireRole("ADMIN"), FranchiseController.promote);
router.post("/admin/franchises/credits",                    requireAuth, requireRole("ADMIN"), FranchiseController.addCredits);
router.patch("/admin/franchises/:profileId/toggle",         requireAuth, requireRole("ADMIN"), FranchiseController.toggleActive);
router.delete("/admin/franchises/:profileId",               requireAuth, requireRole("ADMIN"), FranchiseController.remove);
router.get("/admin/franchises/:profileId/statement",        requireAuth, requireRole("ADMIN"), FranchiseController.getStatement);

// B2B Hub (Franchisee Dashboard)
router.get("/franchise/inventory", requireAuth, requireRole("FRANCHISEE"), FranchiseController.getInventory);
router.get("/franchise/referral", requireAuth, requireRole("FRANCHISEE"), FranchiseController.getReferralCode);
router.get("/franchise/network", requireAuth, requireRole("FRANCHISEE"), FranchiseController.getNetwork);
router.get("/franchise/finance", requireAuth, requireRole("FRANCHISEE"), FranchiseController.getFinanceStats);
router.post("/franchise/reorder", requireAuth, requireRole("FRANCHISEE"), FranchiseController.postReorder);

// ── VAULTS (Cofres de Memórias - Fase 11) ──────────────────────────────────
router.get("/vaults", requireAuth, VaultController.listAlbums);
router.post("/vaults", requireAuth, VaultController.createAlbum);
router.get("/vaults/:albumId", requireAuth, VaultController.getAlbumDetails);
router.get("/vaults/:albumId/media", requireAuth, VaultController.listMedia);
router.post("/vaults/:albumId/upload", requireAuth, upload.single("file"), VaultController.uploadMedia);
router.post("/vaults/:albumId/vote", requireAuth, (req: any, res: any, next: any) => VaultController.voteMedia(req, res, next));
router.post("/vaults/:albumId/subscribe", requireAuth, VaultController.subscribe);

// ── Flash Event (Venda Direta com PIN) ───────────────────────────────────────
router.use("/flash", flashRoutes);

router.get("/vaults/media/proxy/:fileId", VaultController.proxyMedia);

// ── PHYGITAL (Fluxo QR Code & Impressão) ──────────────────────────────────────
router.post("/public/phygital/upload", upload.single("photo"), PhygitalController.upload);
router.get("/phygital/events/:eventId/queue", requireAuth, PhygitalController.listPending);
router.get("/phygital/events/:eventId/prints", requireAuth, PhygitalController.listAllByEvent);
router.patch("/phygital/prints/:id/status", requireAuth, PhygitalController.confirmPrint);
router.post("/admin/phygital/simulate", optionalAuth, PhygitalController.simulate);

// 🔍 DIAGNÓSTICOS
router.get("/diag/db", checkDbStatus);
router.get("/health", (req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

// 📡 IoT & TELEMETRIA
router.post("/iot/heartbeat", IoTController.heartbeat);
router.get("/admin/iot/devices", requireAuth, requireRole("ADMIN"), IoTController.listDevices);

export default router;
