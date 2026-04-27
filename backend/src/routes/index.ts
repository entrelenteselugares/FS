import { Router } from "express";
import { EventController } from "../controllers/event.controller";
import { PaymentController } from "../controllers/payment.controller";
import { AuthController } from "../controllers/auth.controller";
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
  adminListQuotes,
  adminApproveQuote,
  AdminEventController,
  adminUploadCover,
  adminGetLogs,
  adminCreateManualSale,
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
import {
  listPrintProducts,
  updatePrintProduct,
  bulkUpdateMargin,
  seedCkCatalog,
} from "../controllers/print_catalog.controller";

const router = Router();

// ── Sistema & Infra ──────────────────────────────────────────────────────────
router.get("/health", (_req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

// Cron — protegido por CRON_SECRET (chamado pela Vercel diariamente às 06:00)
router.get("/cron/expiration", async (req, res) => {
  const token = req.headers["authorization"];
  if (process.env.CRON_SECRET && token !== `Bearer ${process.env.CRON_SECRET}`) {
    console.warn("[Cron] Tentativa de acesso não autorizada.");
    return res.status(401).json({ error: "Não autorizado." });
  }
  try {
    await runExpirationJob();
    console.log("[Cron] Job de expiração executado com sucesso.");
    res.json({ ok: true, ran: new Date().toISOString() });
  } catch (err: any) {
    console.error("[Cron] Erro:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Autenticação ─────────────────────────────────────────────────────────────
router.post("/auth/login",           AuthController.login);
router.post("/auth/register",        AuthController.register);
router.post("/auth/forgot-password", AuthController.forgotPassword);
router.post("/auth/update-password", AuthController.updatePassword);
router.get("/auth/me",               requireAuth, AuthController.me);
router.post("/auth/refresh",          AuthController.refresh);
router.get("/public/auth/check",     AuthController.checkEmail);

// ── Mercado Pago OAuth ────────────────────────────────────────────────────────
router.get("/mercadopago/connect",  requireAuth, MercadoPagoController.connect);
router.get("/mercadopago/callback", MercadoPagoController.callback);

// ── Eventos Públicos (Vitrine & Paywall) ──────────────────────────────────────
router.get("/public/events",               EventController.listPublic);
router.get("/public/events/:slug",         optionalAuth, EventController.getById);       // busca por slug ou id
router.get("/public/events/:slug/access",  EventController.getAccess);     // ?orderId=xxx
router.get("/public/partners",             EventController.listPartners);   // alias legado
router.get("/public/unidades-fixas",       EventController.listPartners);   // alias compatível
router.post("/public/quotes",              EventController.createQuote);

// ── Landings de Unidade Fixa (pública) ───────────────────────────────────────
router.get("/public/unidade-fixa/:slug",   getPartnerLandingData);

// ── Configurações Públicas ─────────────────────────────────────────────────────
router.get("/public/configs/theme",        getPublicThemeConfigs);
router.get("/public/configs/services",     getPublicServices);

// ── Gamificação Pública ───────────────────────────────────────────────────────
router.get("/public/contests/active",      getActiveContest);
router.get("/public/contests/hall-of-fame",getHallOfFame);
router.get("/events/:slug/likes",          getEventLikes);

// ── SEO / Share ────────────────────────────────────────────────────────────────
router.get("/share/e/:id", SEOController.getEventPreview);

// ── Checkout & Webhook ─────────────────────────────────────────────────────────
router.post("/checkout/payment",      PaymentController.processPayment);
router.post("/webhooks/mercadopago",  PaymentController.webhook);

// ── Pedido Público ─────────────────────────────────────────────────────────────
router.get("/public/orders/:id",               PaymentController.getOrderPublic);
router.get("/public/orders/:id/check-payment", PaymentController.checkPaymentStatus);

// ── LGPD / Acesso (pós-pagamento) ─────────────────────────────────────────────
router.post("/orders/:id/access-type",  requireAuth, chooseAccessType);
router.get("/orders/:id/access-status", requireAuth, getAccessStatus);
router.post("/orders/:id/visibility",    requireAuth, toggleVisibility);

// ── Cliente: Meus Pedidos ──────────────────────────────────────────────────────
router.get("/cliente/pedidos",     requireAuth, getMeusPedidos);
router.get("/cliente/pedidos/:id", requireAuth, getMeuPedidoDetalhe);

// ── PROFISSIONAIS (Rede Técnica) ────────────────────────────────────────────
router.get("/profissional/events",               requireAuth, requireRole("ADMIN", "PROFISSIONAL"), getMeusEventos);
router.patch("/profissional/events/:id/links",   requireAuth, requireRole("ADMIN", "PROFISSIONAL"), updateEventLinks);
router.patch("/profissional/events/:id/cover",   requireAuth, requireRole("ADMIN", "PROFISSIONAL"), uploadEventCover);
router.patch("/profissional/events/:id/respond", requireAuth, requireRole("ADMIN", "PROFISSIONAL"), respondToEvent);
router.get("/profissional/me",                   requireAuth, requireRole("ADMIN", "PROFISSIONAL"), getProfile);
router.patch("/profissional/me",                 requireAuth, requireRole("ADMIN", "PROFISSIONAL"), updateProfile);
router.post("/profissional/events/:id/manual-sale", requireAuth, requireRole("ADMIN", "PROFISSIONAL"), registerManualSale);
router.get("/profissional/unidades/convites", requireAuth, requireRole("ADMIN", "PROFISSIONAL"), getConvitesUnidade);
router.patch("/profissional/unidades/convites/:id/respond", requireAuth, requireRole("ADMIN", "PROFISSIONAL"), respondConviteUnidade);

// ── Gamificação: Curtidas & Resgates ──────────────────────────────────────────
router.post("/events/:slug/photos/like", requireAuth, likePhoto);
router.get("/me/points",                 requireAuth, getMyPoints);
router.post("/me/redeem-print",          requireAuth, redeemPrint);

// ── Unidade Fixa ──────────────────────────────────────────────────────────────
router.get("/unidade-fixa/stats",    requireAuth, requireRole("ADMIN", "CARTORIO", "UNIDADE"), CartorioController.getStats);
router.get("/unidade-fixa/events",   requireAuth, requireRole("ADMIN", "CARTORIO", "UNIDADE"), CartorioController.getEvents);
router.get("/unidade-fixa/orders",   requireAuth, requireRole("ADMIN", "CARTORIO", "UNIDADE"), CartorioController.getOrders);
router.patch("/unidade-fixa/profile",requireAuth, requireRole("ADMIN", "CARTORIO", "UNIDADE"), updatePartnerProfile);
router.get("/unidade-fixa/team",     requireAuth, requireRole("ADMIN", "CARTORIO", "UNIDADE"), getTeam);
router.put("/unidade-fixa/team",     requireAuth, requireRole("ADMIN", "CARTORIO", "UNIDADE"), saveTeam);

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
router.delete("/admin/events/:id",      requireAuth, requireRole("ADMIN"), adminDeleteEvent);

// ── Admin: Gestão de Usuários ──────────────────────────────────────────────────
router.get("/admin/users",       requireAuth, requireRole("ADMIN"), adminListUsers);
router.post("/admin/users",      requireAuth, requireRole("ADMIN"), adminCreateUser);
router.patch("/admin/users/:id", requireAuth, requireRole("ADMIN"), adminUpdateUser);
router.delete("/admin/users/:id", requireAuth, requireRole("ADMIN"), adminDeleteUser);

// ── Admin: Gestão de Pedidos ───────────────────────────────────────────────────
router.get("/admin/orders",                   requireAuth, requireRole("ADMIN"), adminListOrders);
router.post("/admin/orders/:id/delete-media", requireAuth, requireRole("ADMIN"), deleteMediaAdmin);

// ── Admin: Orçamentos (Leads) ──────────────────────────────────────────────────
router.get("/admin/quotes",               requireAuth, requireRole("ADMIN"), adminListQuotes);
router.patch("/admin/quotes/:id/approve", requireAuth, requireRole("ADMIN"), adminApproveQuote);

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

export default router;
