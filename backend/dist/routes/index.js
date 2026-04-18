"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const event_controller_1 = require("../controllers/event.controller");
const payment_controller_1 = require("../controllers/payment.controller");
const auth_controller_1 = require("../controllers/auth.controller");
const admin_controller_1 = require("../controllers/admin.controller");
const mercadopago_controller_1 = require("../controllers/mercadopago.controller");
const profissional_controller_1 = require("../controllers/profissional.controller");
const auth_1 = require("../lib/auth");
const router = (0, express_1.Router)();
// ── Autenticação ────────────────────────────────────────────────
router.post("/auth/login", auth_controller_1.AuthController.login);
router.post("/auth/register", auth_controller_1.AuthController.register);
router.get("/auth/me", auth_1.requireAuth, auth_controller_1.AuthController.me);
// ── Mercado Pago OAuth ───────────────────────────────────────────
router.get("/mercadopago/connect", auth_1.requireAuth, mercadopago_controller_1.MercadoPagoController.connect);
router.get("/mercadopago/callback", mercadopago_controller_1.MercadoPagoController.callback);
// ── Eventos públicos (Paywall & Vitrine) ─────────────────────────
router.get("/public/events", event_controller_1.EventController.listPublic);
router.get("/public/events/:id", event_controller_1.EventController.getById);
router.get("/public/events/:id/access", event_controller_1.EventController.getAccess);
router.get("/events/:id", event_controller_1.EventController.getById);
// ── Pagamento ────────────────────────────────────────────────────
router.post("/checkout", payment_controller_1.PaymentController.checkout);
router.post("/checkout/payment", payment_controller_1.PaymentController.processPayment);
router.post("/webhooks/mercadopago", payment_controller_1.PaymentController.webhook);
// ── Admin: Dashboard & Stats ─────────────────────────────────────
router.get("/admin/stats", auth_1.requireAuth, (0, auth_1.requireRole)("ADMIN"), admin_controller_1.getDashboardStats);
// ── Admin: Gestão de Eventos ─────────────────────────────────────
router.get("/admin/events", auth_1.requireAuth, (0, auth_1.requireRole)("ADMIN", "PROFISSIONAL"), admin_controller_1.adminListEvents);
router.post("/admin/events", auth_1.requireAuth, (0, auth_1.requireRole)("ADMIN", "PROFISSIONAL"), admin_controller_1.adminCreateEvent);
router.patch("/admin/events/:id", auth_1.requireAuth, (0, auth_1.requireRole)("ADMIN", "PROFISSIONAL"), admin_controller_1.adminUpdateEvent);
router.patch("/admin/events/:id/cover", auth_1.requireAuth, (0, auth_1.requireRole)("ADMIN"), admin_controller_1.adminUploadCover);
router.delete("/admin/events/:id", auth_1.requireAuth, (0, auth_1.requireRole)("ADMIN"), admin_controller_1.adminDeleteEvent);
// ── Admin: Gestão de Usuários ────────────────────────────────────
router.get("/admin/users", auth_1.requireAuth, (0, auth_1.requireRole)("ADMIN"), admin_controller_1.adminListUsers);
router.post("/admin/users", auth_1.requireAuth, (0, auth_1.requireRole)("ADMIN"), admin_controller_1.adminCreateUser);
router.patch("/admin/users/:id", auth_1.requireAuth, (0, auth_1.requireRole)("ADMIN"), admin_controller_1.adminUpdateUser);
// ── Admin: Gestão de Pedidos ─────────────────────────────────────
router.get("/admin/orders", auth_1.requireAuth, (0, auth_1.requireRole)("ADMIN"), admin_controller_1.adminListOrders);
// ── Profissional: Gestão de Entregas ─────────────────────────────
router.get("/profissional/events", auth_1.requireAuth, (0, auth_1.requireRole)("ADMIN", "PROFISSIONAL"), profissional_controller_1.getMeusEventos);
router.patch("/profissional/events/:id/links", auth_1.requireAuth, (0, auth_1.requireRole)("ADMIN", "PROFISSIONAL"), profissional_controller_1.updateEventLinks);
router.patch("/profissional/events/:id/cover", auth_1.requireAuth, (0, auth_1.requireRole)("ADMIN", "PROFISSIONAL"), profissional_controller_1.uploadEventCover);
// ── Legado / Compatibilidade ─────────────────────────────────────
router.get("/cartorio/stats", auth_1.requireAuth, (0, auth_1.requireRole)("ADMIN", "CARTORIO"), admin_controller_1.AdminEventController.cartorioStats);
exports.default = router;
