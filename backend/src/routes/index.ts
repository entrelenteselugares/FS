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
  AdminEventController,
  adminUploadCover
} from "../controllers/admin.controller";
import { MercadoPagoController } from "../controllers/mercadopago.controller";
import { getMeusEventos, updateEventLinks, uploadEventCover } from "../controllers/profissional.controller";
import { getMeusPedidos, getMeuPedidoDetalhe } from "../controllers/cliente.controller";
import { CartorioController } from "../controllers/cartorio.controller";
import { requireAuth, requireRole } from "../lib/auth";

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
router.get("/share/e/:id", SEOController.getEventPreview);

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

// ── Cliente: Meus Pedidos & Arquivos ─────────────────────────────
router.get("/cliente/pedidos", requireAuth, getMeusPedidos);
router.get("/cliente/pedidos/:id", requireAuth, getMeuPedidoDetalhe);

// ── Profissional: Gestão de Entregas ─────────────────────────────
router.get("/profissional/events", requireAuth, requireRole("ADMIN", "PROFISSIONAL"), getMeusEventos);
router.patch("/profissional/events/:id/links", requireAuth, requireRole("ADMIN", "PROFISSIONAL"), updateEventLinks);
router.patch("/profissional/events/:id/cover", requireAuth, requireRole("ADMIN", "PROFISSIONAL"), uploadEventCover);

// ── Legado / Compatibilidade ─────────────────────────────────────
// ── Cartório / Unidades: Gestão de Ativos ────────────────────────
router.get("/cartorio/stats", requireAuth, requireRole("ADMIN", "CARTORIO"), CartorioController.getStats);
router.get("/cartorio/events", requireAuth, requireRole("ADMIN", "CARTORIO"), CartorioController.getEvents);

export default router;
