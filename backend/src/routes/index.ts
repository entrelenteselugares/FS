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
  adminPriceQuote,
  adminRejectQuote,
  adminArchiveQuote,
  adminCreateQuote,
  AdminEventController,
  adminUploadCover,
  adminUploadPreview,
  adminGetLogs,
  adminCreateManualSale,
  checkDbStatus,
  adminListInventory,
  adminAdjustStock,
  adminGetApplications,
  adminApproveApplication,
  adminRejectApplication
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
import { getMeusPedidos, getMeuPedidoDetalhe, personalizePedido, uploadClientCover } from "../controllers/cliente.controller";
import { CartorioController } from "../controllers/cartorio.controller";
import { SEOController } from "../controllers/seo.controller";
import { getConfigs, updateConfigs, getPublicThemeConfigs, getPublicServices, getPublicPricingConfigs } from "../controllers/config.controller";

import { generateWeeklyPayout, listPayouts, markItemPaid, exportPayoutCSV, getMeusRepasses, getMeuSaldoSummary } from "../controllers/payout.controller";
import {
  chooseAccessType,
  getAccessStatus,
  deleteMediaAdmin,
  toggleVisibility,
} from "../controllers/access.controller";
import { requireAuth, requireRole, optionalAuth } from "../lib/auth";
import { SubscriptionService } from "../services/subscription.service";
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
  adminDeleteContest,
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
import { processAbandonedCarts } from "../jobs/abandonedCart.job";
import {
  bulkUpdateMargin,
  seedCkCatalog,
} from "../controllers/print_catalog.controller";
import { MarketplaceController } from "../controllers/marketplace.controller";
import { requireMercadoPagoSignature } from "../middleware/webhook-auth";
// import { getTaxReport } from "../controllers/finance.controller"; // Removido em favor do ReportController
import { AuthRequest } from "../lib/auth";
import { runLoyaltyBot, runEscrowRelease } from "../controllers/cron.controller";
import { ReferralController } from "../controllers/referral.controller";
import { PhygitalController } from "../controllers/phygital.controller";
import { FranchiseController } from "../controllers/franchise.controller";
import { VaultController } from "../controllers/vault.controller";
import { IoTController } from "../controllers/iot.controller";
import { AffiliateController } from "../controllers/affiliate.controller";
import calendarRoutes from "./calendar.routes";
import { VaultCycleService } from "../services/vaultCycle.service";
import { VaultBlockingService } from "../services/vaultBlocking.service";
import { syncAllCalendars } from "../services/calendar-sync.service";
import multer from "multer";
import express from "express";
import flashRoutes from "./flash.routes";
import { CRMController } from "../controllers/crm.controller";
import { GrowthController } from "../controllers/growth.controller";
import * as FinanceHub from "../controllers/finance_hub.controller";
import * as ReportController from "../controllers/report.controller";

const upload = multer({ storage: multer.memoryStorage() });

import driveAuthRoutes from "./driveAuth.routes";
import * as PushController from "../controllers/push.controller";
import portfolioRoutes from "./portfolioRoutes";

const router = Router();

// ── PORTFOLIO ───────────────────────────────────────────────────────────────
router.use("/portfolio", portfolioRoutes);

// ── PUSH NOTIFICATIONS ───────────────────────────────────────────────────────
router.post("/push/subscribe",   requireAuth, PushController.subscribe);
router.post("/push/unsubscribe", requireAuth, PushController.unsubscribe);
router.post("/push/test",        requireAuth, PushController.sendTestPush);

// --- REDIRECTS DE EMBAIXADOR ---
router.get("/embaixador/:slug", ReferralController.handleReferral);

// ... existing routes ...
router.use("/auth", driveAuthRoutes);

/**
 * Middleware especial que permite acesso se o usuário for ADMIN, PROFISSIONAL 
 * OU se possuir um FranchiseProfile ativo (mesmo sendo CLIENTE).
 */
const requireProOrFranchise = async (req: any, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: "Não autenticado." });
  if (
    user.role === "ADMIN" ||
    user.role === "PROFISSIONAL" ||
    user.role === "CARTORIO" ||
    user.role === "FRANCHISEE"
  ) return next();

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

// ─── Relatórios & Inteligência Financeira ────────────────────────────────────
router.get("/profissional/finance/tax-report", requireAuth, requireProOrFranchise, ReportController.getTaxReport);
router.get("/profissional/finance/receipt/:id", requireAuth, requireProOrFranchise, ReportController.getPayoutReceipt);
router.get("/profissional/finance/cashflow", requireAuth, requireProOrFranchise, ReportController.getCashflowProjection);

// ── MARKETPLACE (Fotos Individuais & Venda Expressa) ──────────────────────────
router.post("/marketplace/express-sale",      requireAuth, requireProOrFranchise, MarketplaceController.expressSale);
router.post("/marketplace/events/:id/media",  requireAuth, requireProOrFranchise, MarketplaceController.addMedia);
router.post("/marketplace/events/:id/sync-drive", requireAuth, requireProOrFranchise, MarketplaceController.syncEventMedia);
router.patch("/marketplace/media/:mediaId/metadata", requireAuth, requireRole("ADMIN"), MarketplaceController.patchMediaMetadata);
router.get("/marketplace/events/:id/media",   optionalAuth, MarketplaceController.listMedia);

// ── PROFESSIONAL SHOWCASE (Diretório Público) ──────────────────────────────
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

router.get("/cron/escrow-release", async (req, res) => {
  const token = req.headers["authorization"];
  if (process.env.CRON_SECRET && token !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Não autorizado." });
  }
  return runEscrowRelease(req, res);
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

// ── Cron: Vault Expiry (Processamento de Testes Gratuitos) ────────────────
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

// ── Cron: Growth Engine (Carrinhos Abandonados) ──────────────────────────────
router.get("/cron/abandoned-carts", async (req, res) => {
  const token = req.headers["authorization"];
  if (process.env.CRON_SECRET && token !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Não autorizado." });
  }
  try {
    await processAbandonedCarts();
    res.json({ ok: true, ran: new Date().toISOString() });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Cron/AbandonedCarts] Erro:", msg);
    res.status(500).json({ error: msg });
  }
});

// ── Autenticação ─────────────────────────────────────────────────────────────
router.post("/auth/login",           AuthController.login);
router.post("/auth/register",        AuthController.register);
router.post("/auth/register-express", AuthController.registerExpress);
router.post("/auth/apply-role", requireAuth, AuthController.applyRole);
router.post("/auth/profile-photo", requireAuth, AuthController.uploadProfilePhoto);
router.post("/auth/forgot-password", AuthController.forgotPassword);
router.post("/auth/reset-password",  AuthController.updatePassword);
router.get("/auth/me",               requireAuth, AuthController.me);
router.patch("/auth/me",             requireAuth, AuthController.updateMe);
router.post("/auth/refresh",          AuthController.refresh);
router.get("/public/auth/check",     AuthController.checkEmail);
router.get("/public/auth/check-phone", AuthController.checkPhone);

// ── Mercado Pago OAuth ────────────────────────────────────────────────────────
router.get("/mercadopago/connect",  requireAuth, MercadoPagoController.connect);
router.get("/diag", diagnostics);

// ── Eventos Públicos (Vitrine & Paywall) ──────────────────────────────────────
router.get("/public/events",               EventController.listPublic);
router.get("/public/events/cities",        EventController.getPublicCities);
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
router.get("/public/configs/pricing",      getPublicPricingConfigs);
router.get("/public/service-catalog",      ServiceCatalogController.adminListServiceCatalog); // Reutilizando a listagem para público
router.get("/public/services/vault",      ServiceCatalogController.listVaultServices);

// ── Gamificação Pública ───────────────────────────────────────────────────────
router.get("/public/contests/active",      getActiveContest);
router.get("/public/contests/hall-of-fame",getHallOfFame);
router.get("/events/:slug/likes",          getEventLikes);

// ── SEO / Share ────────────────────────────────────────────────────────────────
router.get("/share/e/:id", SEOController.getEventPreview);

// ── CRM & LEADS (Phase 27) ──────────────────────────────────────────────────
router.post("/public/crm/leads",               CRMController.captureLead);
router.get("/admin/crm/leads",                 requireAuth, requireRole("ADMIN"), CRMController.getLeads);
router.get("/admin/crm/stats",                 requireAuth, requireRole("ADMIN"), CRMController.getStats);
router.get("/admin/crm/abandoned-carts",       requireAuth, requireRole("ADMIN"), CRMController.getAbandonedCarts);
router.get("/cron/crm-recovery",              CRMController.runRecoveryCron);

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

router.post(
  "/webhooks/mp-subscription",
  async (req: express.Request, res: express.Response) => {
    try {
      const { type, data } = req.body;
      if (type === "subscription_preapproval" && data?.id) {
        await SubscriptionService.handlePreapprovalWebhook(data.id);
      }
      return res.sendStatus(200);
    } catch (error) {
      console.error("[Webhook MP Subscription] Erro:", error);
      return res.sendStatus(500);
    }
  }
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

// ── Cliente: Meus Pedidos & Afiliados ──────────────────────────────────────────────
router.get("/cliente/pedidos",     requireAuth, getMeusPedidos);
router.get("/cliente/pedidos/:id", requireAuth, getMeuPedidoDetalhe);
router.patch("/cliente/pedidos/:id/personalize", requireAuth, personalizePedido);
router.patch("/cliente/pedidos/:id/cover",       requireAuth, uploadClientCover);
router.get("/affiliate/dashboard", requireAuth, AffiliateController.getDashboard);

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
router.get("/unidade-fixa/team",     requireAuth, requireRole("ADMIN", "CARTORIO", "PROFISSIONAL", "FRANCHISEE"), getTeam);
router.put("/unidade-fixa/team",     requireAuth, requireRole("ADMIN", "CARTORIO", "PROFISSIONAL", "FRANCHISEE"), saveTeam);

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
router.patch("/admin/users/:id/tier", requireAuth, requireRole("ADMIN"), AffiliateController.updateTier);

// ─── ADMIN APPROVAL HUB (Phase 45) ──────────────────────────────────────────
router.get("/admin/applications",                            requireAuth, requireRole("ADMIN"), adminGetApplications);
router.patch("/admin/applications/:id/approve",              requireAuth, requireRole("ADMIN"), adminApproveApplication);
router.patch("/admin/applications/:id/reject",               requireAuth, requireRole("ADMIN"), adminRejectApplication);

// ── Admin: Gestão de Pedidos ───────────────────────────────────────────────────
router.get("/admin/orders",                   requireAuth, requireRole("ADMIN"), adminListOrders);
router.patch("/admin/orders/:id/payout",      requireAuth, requireRole("ADMIN"), adminMarkPayoutPaid);
router.patch("/admin/orders/:id/logistics",     requireAuth, requireRole("ADMIN"), adminUpdateOrderLogistics);
router.delete("/admin/orders/:id",                requireAuth, requireRole("ADMIN"), adminDeleteOrder);
router.post("/admin/orders/:id/delete-media", requireAuth, requireRole("ADMIN"), deleteMediaAdmin);

// ── Admin: Orçamentos (Leads) ──────────────────────────────────────────────────
router.get("/admin/quotes",               requireAuth, requireRole("ADMIN"), adminListQuotes);
router.post("/admin/quotes",              requireAuth, requireRole("ADMIN"), adminCreateQuote);
router.patch("/admin/quotes/:id/approve", requireAuth, requireRole("ADMIN"), adminApproveQuote);
router.patch("/admin/quotes/:id/price",   requireAuth, requireRole("ADMIN"), adminPriceQuote);
router.patch("/admin/quotes/:id/reject",  requireAuth, requireRole("ADMIN"), adminRejectQuote);
router.patch("/admin/quotes/:id/archive", requireAuth, requireRole("ADMIN"), adminArchiveQuote);

// ── Admin: Repasses ────────────────────────────────────────────────────────────
router.post("/admin/payouts/generate",                requireAuth, requireRole("ADMIN"), generateWeeklyPayout);
router.get("/admin/payouts",                          requireAuth, requireRole("ADMIN"), listPayouts);
router.get("/admin/payouts/export",                requireAuth, requireRole("ADMIN"), exportPayoutCSV);
router.patch("/admin/payouts/:id/items/:itemId/paid", requireAuth, requireRole("ADMIN"), markItemPaid);

// ── Admin: Finance Hub ─────────────────────────────────────────────────────────
router.get("/admin/finance/balances", requireAuth, requireRole("ADMIN"), FinanceHub.getProfessionalBalances);
router.post("/admin/finance/settle", requireAuth, requireRole("ADMIN"), FinanceHub.settleProfessional);
router.get("/admin/finance/subscriptions-mrr", requireAuth, requireRole("ADMIN"), FinanceHub.getSubscriptionStats);

router.get("/me/repasses", requireAuth, getMeusRepasses);
router.get("/me/payout-summary", requireAuth, getMeuSaldoSummary);

// --- AMBASSADOR (Phase 24) ---
router.get("/ambassador/stats",                  requireAuth, ReferralController.getStats);
router.get("/ambassador/network",                requireAuth, ReferralController.getNetworkSummary);
router.get("/ambassador/conversions",            requireAuth, ReferralController.getConversionHistory);
router.post("/ambassador/generate-code",         requireAuth, ReferralController.generateDefaultCode);
router.patch("/ambassador/campaigns/:campaignId/toggle", requireAuth, ReferralController.toggleCampaign);

// ── Admin: Configurações ───────────────────────────────────────────────────────
router.get("/admin/configs",   requireAuth, requireRole("ADMIN"), getConfigs);
router.patch("/admin/configs", requireAuth, requireRole("ADMIN"), updateConfigs);

// ── Admin: Fornecedores & Breakeven ────────────────────────────────────────────
router.get("/admin/suppliers",               requireAuth, requireRole("ADMIN"), listSuppliers);
router.post("/admin/suppliers",              requireAuth, requireRole("ADMIN"), createSupplier);
router.get("/admin/suppliers/:id/breakeven", requireAuth, requireRole("ADMIN"), getBreakeven);
router.get("/admin/redemptions",             requireAuth, requireRole("ADMIN"), listRedemptions);
router.patch("/admin/redemptions/:id/status",requireAuth, requireRole("ADMIN"), updateRedemptionStatus);

router.get("/admin/ambassador/stats", requireAuth, requireRole("ADMIN"), ReferralController.listAllCampaigns);
router.post("/admin/ambassador/campaigns", requireAuth, requireRole("ADMIN"), ReferralController.createCampaign);
router.patch("/admin/ambassador/campaigns/:campaignId/toggle", requireAuth, requireRole("ADMIN"), ReferralController.adminToggleCampaign);
router.delete("/admin/ambassador/campaigns/:campaignId", requireAuth, requireRole("ADMIN"), ReferralController.adminDeleteCampaign);

router.get("/admin/coupons", requireAuth, requireRole("ADMIN"), GrowthController.listCoupons);
router.post("/admin/coupons", requireAuth, requireRole("ADMIN"), GrowthController.createCoupon);
router.patch("/admin/coupons/:id", requireAuth, requireRole("ADMIN"), GrowthController.toggleCoupon);
router.delete("/admin/coupons/:id", requireAuth, requireRole("ADMIN"), GrowthController.deleteCoupon);
router.get("/admin/ambassadors", requireAuth, requireRole("ADMIN"), GrowthController.listAmbassadors);
router.get("/admin/phygital/all", requireAuth, requireRole("ADMIN"), PhygitalController.listAllByEvent);

// ── Admin: Contests ──────────────────────────────────────────────────────────
router.get("/admin/contests",       requireAuth, requireRole("ADMIN"), adminListContests);
router.post("/admin/contests",      requireAuth, requireRole("ADMIN"), adminCreateContest);
router.patch("/admin/contests/:id", requireAuth, requireRole("ADMIN"), adminUpdateContest);
router.delete("/admin/contests/:id", requireAuth, requireRole("ADMIN"), adminDeleteContest);

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
router.get("/admin/services/pending", requireAuth, requireRole("ADMIN"), ServiceCatalogController.listPendingServices);
router.patch("/admin/services/:id/review", requireAuth, requireRole("ADMIN"), ServiceCatalogController.reviewPendingService);
router.get("/admin/inventory",                               requireAuth, requireRole("ADMIN"), adminListInventory);
router.post("/admin/inventory/adjust",                       requireAuth, requireRole("ADMIN"), adminAdjustStock);

// ── FRANCHISES (Gestão de Micro-Franquias) ──────────────────────────────────
router.get("/admin/franchises",                              requireAuth, requireRole("ADMIN"), FranchiseController.listAll);
router.post("/admin/franchises/promote",                    requireAuth, requireRole("ADMIN"), FranchiseController.promote);
router.post("/admin/franchises/credits",                    requireAuth, requireRole("ADMIN"), FranchiseController.addCredits);
router.patch("/admin/franchises/:profileId/toggle",         requireAuth, requireRole("ADMIN"), FranchiseController.toggleActive);
router.delete("/admin/franchises/:profileId",               requireAuth, requireRole("ADMIN"), FranchiseController.remove);
router.get("/admin/franchises/:profileId/statement",        requireAuth, requireRole("ADMIN"), FranchiseController.getStatement);
router.get("/admin/franchises/orders",                      requireAuth, requireRole("ADMIN"), FranchiseController.adminListSupplyOrders);
router.patch("/admin/franchises/orders/:id/status",         requireAuth, requireRole("ADMIN"), FranchiseController.adminUpdateSupplyOrderStatus);

// B2B Hub (Franchisee Dashboard)
router.get("/franchise/inventory", requireAuth, requireRole("FRANCHISEE"), FranchiseController.getInventory);
router.get("/franchise/referral", requireAuth, requireRole("FRANCHISEE"), FranchiseController.getReferralCode);
router.get("/franchise/network", requireAuth, requireRole("FRANCHISEE"), FranchiseController.getNetwork);
router.get("/franchise/finance", requireAuth, requireRole("FRANCHISEE"), FranchiseController.getFinanceStats);
router.get("/franchise/finance/export", requireAuth, requireRole("FRANCHISEE"), FranchiseController.exportFinance);
router.post("/franchise/reorder", requireAuth, requireRole("FRANCHISEE"), FranchiseController.postReorder);
router.put("/franchise/profile", requireAuth, requireRole("FRANCHISEE"), FranchiseController.updateProfile);
router.patch("/franchise/branding", requireAuth, requireRole("FRANCHISEE"), FranchiseController.updateBranding);

// B2B Shop (Supply Orders)
router.get("/franchise/orders", requireAuth, requireProOrFranchise, FranchiseController.listSupplyOrders);
router.post("/franchise/orders", requireAuth, requireProOrFranchise, FranchiseController.createSupplyOrder);
router.post("/franchise/webhook", FranchiseController.handleWebhook); // Public webhook

// ── VAULTS (Cofres de Memórias - Fase 11) ──────────────────────────────────
router.get("/vaults/media/proxy/:fileId", VaultController.proxyMedia);
router.get("/vaults", requireAuth, VaultController.listAlbums);
router.post("/vaults", requireAuth, VaultController.createAlbum);
router.patch("/vaults/:albumId", requireAuth, VaultController.renameAlbum);
router.get("/vaults/:albumId", requireAuth, VaultController.getAlbumDetails);
router.get("/vaults/:albumId/download-all", requireAuth, VaultController.downloadAllMedia);
router.get("/vaults/:albumId/media", requireAuth, VaultController.listMedia);
router.post("/vaults/:albumId/upload", requireAuth, upload.single("file"), VaultController.uploadMedia);
router.post("/vaults/media/:mediaId/vote", requireAuth, (req: any, res: any, next: any) => VaultController.voteMedia(req, res, next));
router.post("/vaults/:albumId/checkout", requireAuth, VaultController.checkoutVault);
router.post("/vaults/:albumId/services/buy", requireAuth, VaultController.buyService);
router.post("/vaults/:albumId/subscribe", requireAuth, VaultController.subscribe);
router.post("/vaults/:albumId/invite",    requireAuth, VaultController.generateInvite);
router.get("/vaults/invitation/:code",     VaultController.getInvitationDetails);
router.get("/vaults/share/:code",          VaultController.sharePreview);
router.post("/vaults/invitation/:code/accept", requireAuth, VaultController.acceptInvite);
router.delete("/vaults/:albumId/members/:userId", requireAuth, VaultController.removeMember);
router.delete("/vaults/:albumId/media/:mediaId",  requireAuth, VaultController.deleteMedia);
router.patch("/vaults/:albumId/media/:mediaId/rotate", requireAuth, VaultController.rotateMedia);
router.patch("/vaults/:albumId/media/:mediaId/status", requireAuth, VaultController.updateMediaStatus);


// ── Flash Event (Venda Direta com PIN) ───────────────────────────────────────
router.use("/flash", flashRoutes);

// ── PHYGITAL (Fluxo QR Code & Impressão) ──────────────────────────────────────
router.post("/public/phygital/upload", optionalAuth, upload.single("photo"), PhygitalController.upload);
router.get("/phygital/events/:eventId/queue", requireAuth, PhygitalController.listPending);
router.get("/phygital/events/:eventId/prints", requireAuth, PhygitalController.listAllByEvent);
router.patch("/phygital/prints/:id/status", requireAuth, PhygitalController.confirmPrint);
router.post("/admin/phygital/simulate", optionalAuth, PhygitalController.simulate);

// ── GROWTH ENGINE (Coupons, Affiliates, WhatsApp) ─────────────────────────
router.get("/marketplace/coupons/:code/validate", GrowthController.validateCoupon);
router.get("/marketplace/affiliates/:id/validate", GrowthController.validateAffiliate);
router.get("/admin/whatsapp/status", requireAuth, requireRole("ADMIN"), GrowthController.getWhatsappStatus);
router.get("/admin/whatsapp/qr", requireAuth, requireRole("ADMIN"), GrowthController.getWhatsappQr);

import * as NotificationController from "../controllers/notification.controller";

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
router.get("/admin/iot/devices", requireAuth, requireRole("ADMIN"), IoTController.listDevices);

export default router;
