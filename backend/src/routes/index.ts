import { Router } from "express";
import { EventController } from "../controllers/event.controller";
import { PaymentController } from "../controllers/payment.controller";
import { AuthController } from "../controllers/auth.controller";
import { AdminEventController } from "../controllers/admin.controller";
import { MercadoPagoController } from "../controllers/mercadopago.controller";
import { requireAuth, requireRole } from "../lib/auth";
import { uploadCover } from "../lib/multer.config";

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
router.get("/events/:id", EventController.getById);

// ── Pagamento ────────────────────────────────────────────────────
router.post("/checkout", PaymentController.checkout);
router.post("/webhooks/mercadopago", PaymentController.webhook);

// ── Admin: Gestão de Eventos ─────────────────────────────────────
router.get(
  "/admin/users",
  requireAuth,
  requireRole("ADMIN"),
  AdminEventController.listUsers
);
router.post(
  "/admin/events",
  requireAuth,
  requireRole("ADMIN", "PROFISSIONAL"),
  uploadCover,
  AdminEventController.create
);
router.get(
  "/admin/events",
  requireAuth,
  requireRole("ADMIN", "PROFISSIONAL"),
  AdminEventController.list
);
router.patch(
  "/admin/events/:id",
  requireAuth,
  requireRole("ADMIN", "PROFISSIONAL"),
  uploadCover,
  AdminEventController.update
);

// ── Admin: Financeiro ─────────────────────────────────────────────
router.get(
  "/admin/stats",
  requireAuth,
  requireRole("ADMIN"),
  AdminEventController.stats
);

// ── Cartório: Agenda e Comissões ──────────────────────────────────
router.get(
  "/cartorio/stats",
  requireAuth,
  requireRole("ADMIN", "CARTORIO"),
  AdminEventController.cartorioStats
);

export default router;
