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
  adminListOrders,
  adminMarkOrderPaid,
  AdminEventController,
  adminUploadCover
} from "../controllers/admin.controller";
import { MercadoPagoController } from "../controllers/mercadopago.controller";
import { getMeusEventos, updateEventLinks, uploadEventCover } from "../controllers/profissional.controller";
import { getMeusPedidos, getMeuPedidoDetalhe } from "../controllers/cliente.controller";
import { CartorioController } from "../controllers/cartorio.controller";
import { SEOController } from "../controllers/seo.controller";
import { getConfigs, updateConfigs, getPublicThemeConfigs } from "../controllers/config.controller";
import { generateWeeklyPayout, listPayouts, markItemPaid } from "../controllers/payout.controller";
import {
  chooseAccessType,
  getAccessStatus,
  deleteMediaAdmin,
} from "../controllers/access.controller";
import { requireAuth, requireRole } from "../lib/auth";
import {
  likePhoto,
  getEventLikes,
  getMyPoints,
  redeemPrint,
} from "../controllers/gamification.controller";
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

const router = Router();

// ── Autenticação ────────────────────────────────────────────────
router.post("/auth/login", AuthController.login);
router.post("/auth/register", AuthController.register);
router.get("/auth/me", requireAuth, AuthController.me);

// ── Mercado Pago OAuth ───────────────────────────────────────────
router.get("/mercadopago/connect", requireAuth, MercadoPagoController.connect);
router.get("/mercadopago/callback", MercadoPagoController.callback);

// ── Eventos públicos (Paywall & Vitrine) ─────────────────────────
router.get("/public/events", EventController.listPublic);
router.get("/public/events/:id", EventController.getById);
router.get("/public/events/:id/access", EventController.getAccess);
router.get("/public/partners", EventController.listPartners);
router.post("/public/quotes", EventController.createQuote);
router.get("/public/contests/active", getActiveContest);
router.get("/public/contests/hall-of-fame", getHallOfFame);
router.get("/public/partners/:slug", getPartnerLandingData);
router.get("/share/e/:id", SEOController.getEventPreview);
router.get("/public/configs/theme", getPublicThemeConfigs);

// ── Pagamento ────────────────────────────────────────────────────
router.post("/checkout", PaymentController.checkout);
router.post("/checkout/payment", PaymentController.processPayment);
router.post("/webhooks/mercadopago", PaymentController.webhook);

// ── Admin: Dashboard & Stats ─────────────────────────────────────
router.get("/admin/stats", requireAuth, requireRole("ADMIN"), getDashboardStats);

// ── Admin: Gestão de Eventos ─────────────────────────────────────
router.get("/admin/events", requireAuth, requireRole("ADMIN", "PROFISSIONAL"), adminListEvents);
router.post("/admin/events", requireAuth, requireRole("ADMIN", "PROFISSIONAL"), adminCreateEvent);
router.patch("/admin/events/:id", requireAuth, requireRole("ADMIN", "PROFISSIONAL"), adminUpdateEvent);
router.patch("/admin/events/:id/cover", requireAuth, requireRole("ADMIN"), adminUploadCover);
router.delete("/admin/events/:id", requireAuth, requireRole("ADMIN"), adminDeleteEvent);

// ── Admin: Gestão de Usuários ────────────────────────────────────
router.get("/admin/users", requireAuth, requireRole("ADMIN"), adminListUsers);
router.post("/admin/users", requireAuth, requireRole("ADMIN"), adminCreateUser);
router.patch("/admin/users/:id", requireAuth, requireRole("ADMIN"), adminUpdateUser);

// ── Admin: Gestão de Pedidos ─────────────────────────────────────
router.get("/admin/orders", requireAuth, requireRole("ADMIN"), adminListOrders);
router.patch("/admin/orders/:id/payout", requireAuth, requireRole("ADMIN"), adminMarkOrderPaid);

// ── Cliente: Meus Pedidos & Arquivos ─────────────────────────────
router.get("/cliente/pedidos", requireAuth, getMeusPedidos);
router.get("/cliente/pedidos/:id", requireAuth, getMeuPedidoDetalhe);

// ── Cliente: LGPD Acesso & Privacidade ───────────────────────────
router.post("/orders/:id/access-type", requireAuth, chooseAccessType);
router.get("/orders/:id/access-status", requireAuth, getAccessStatus);
router.post("/admin/orders/:id/delete-media", requireAuth, requireRole("ADMIN"), deleteMediaAdmin);

// ── Profissional: Gestão de Entregas ─────────────────────────────
router.get("/profissional/events", requireAuth, requireRole("ADMIN", "PROFISSIONAL"), getMeusEventos);
router.patch("/profissional/events/:id/links", requireAuth, requireRole("ADMIN", "PROFISSIONAL"), updateEventLinks);
router.patch("/profissional/events/:id/cover", requireAuth, requireRole("ADMIN", "PROFISSIONAL"), uploadEventCover);

// ── Gamificação: Curtidas & Pontos ──────────────────────────────
router.post("/events/:slug/photos/like", requireAuth, likePhoto);
router.get("/events/:slug/likes", getEventLikes); // pública

// ── Gamificação: Resgates & Perfil ──────────────────────────────
router.get("/me/points", requireAuth, getMyPoints);
router.post("/me/redeem-print", requireAuth, redeemPrint);

// ── Admin: Operação de Impressão ────────────────────────────────
router.get("/admin/suppliers", requireAuth, requireRole("ADMIN"), listSuppliers);
router.post("/admin/suppliers", requireAuth, requireRole("ADMIN"), createSupplier);
router.get("/admin/suppliers/:id/breakeven", requireAuth, requireRole("ADMIN"), getBreakeven);
router.get("/admin/redemptions", requireAuth, requireRole("ADMIN"), listRedemptions);
router.patch("/admin/redemptions/:id/status", requireAuth, requireRole("ADMIN"), updateRedemptionStatus);
router.get("/admin/contests", requireAuth, requireRole("ADMIN"), adminListContests);
router.post("/admin/contests", requireAuth, requireRole("ADMIN"), adminCreateContest);
router.patch("/admin/contests/:id", requireAuth, requireRole("ADMIN"), adminUpdateContest);

// ── Perfil do Parceiro (Self-care) ──────────────────────────────
router.patch("/partner/profile", requireAuth, requireRole("CARTORIO"), updatePartnerProfile);

// ── Legado / Compatibilidade ─────────────────────────────────────
// ── Cartório / Unidades: Gestão de Ativos ────────────────────────
router.get("/cartorio/stats", requireAuth, requireRole("ADMIN", "CARTORIO"), CartorioController.getStats);
router.get("/cartorio/events", requireAuth, requireRole("ADMIN", "CARTORIO"), CartorioController.getEvents);

// --- Configurações & Repasses ---
router.get("/admin/configs", requireAuth, requireRole("ADMIN"), getConfigs);
router.patch("/admin/configs", requireAuth, requireRole("ADMIN"), updateConfigs);

router.post("/admin/payouts/generate", requireAuth, requireRole("ADMIN"), generateWeeklyPayout);
router.get("/admin/payouts", requireAuth, requireRole("ADMIN"), listPayouts);
router.patch("/admin/payouts/:id/items/:itemId/paid", requireAuth, requireRole("ADMIN"), markItemPaid);

export default router;
