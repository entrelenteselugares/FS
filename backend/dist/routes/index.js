"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const event_controller_1 = require("../controllers/event.controller");
const payment_controller_1 = require("../controllers/payment.controller");
const auth_controller_1 = require("../controllers/auth.controller");
const admin_controller_1 = require("../controllers/admin.controller");
const mercadopago_controller_1 = require("../controllers/mercadopago.controller");
const auth_1 = require("../lib/auth");
const multer_config_1 = require("../lib/multer.config");
const router = (0, express_1.Router)();
// ── Autenticação ────────────────────────────────────────────────
router.post("/auth/login", auth_controller_1.AuthController.login);
router.post("/auth/register", auth_controller_1.AuthController.register);
router.get("/auth/me", auth_1.requireAuth, auth_controller_1.AuthController.me);
// ── Mercado Pago OAuth ───────────────────────────────────────────
router.get("/mercadopago/connect", auth_1.requireAuth, mercadopago_controller_1.MercadoPagoController.connect);
router.get("/mercadopago/callback", mercadopago_controller_1.MercadoPagoController.callback);
// ── Eventos públicos (Paywall) ───────────────────────────────────
router.get("/events/:id", event_controller_1.EventController.getById);
// ── Pagamento ────────────────────────────────────────────────────
router.post("/checkout", payment_controller_1.PaymentController.checkout);
router.post("/webhooks/mercadopago", payment_controller_1.PaymentController.webhook);
// ── Admin: Gestão de Eventos ─────────────────────────────────────
router.get("/admin/users", auth_1.requireAuth, (0, auth_1.requireRole)("ADMIN"), admin_controller_1.AdminEventController.listUsers);
router.post("/admin/events", auth_1.requireAuth, (0, auth_1.requireRole)("ADMIN", "PROFISSIONAL"), multer_config_1.uploadCover, admin_controller_1.AdminEventController.create);
router.get("/admin/events", auth_1.requireAuth, (0, auth_1.requireRole)("ADMIN", "PROFISSIONAL"), admin_controller_1.AdminEventController.list);
router.patch("/admin/events/:id", auth_1.requireAuth, (0, auth_1.requireRole)("ADMIN", "PROFISSIONAL"), multer_config_1.uploadCover, admin_controller_1.AdminEventController.update);
// ── Admin: Financeiro ─────────────────────────────────────────────
router.get("/admin/stats", auth_1.requireAuth, (0, auth_1.requireRole)("ADMIN"), admin_controller_1.AdminEventController.stats);
// ── Cartório: Agenda e Comissões ──────────────────────────────────
router.get("/cartorio/stats", auth_1.requireAuth, (0, auth_1.requireRole)("ADMIN", "CARTORIO"), admin_controller_1.AdminEventController.cartorioStats);
exports.default = router;
