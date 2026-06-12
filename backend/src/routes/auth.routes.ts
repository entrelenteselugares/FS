import { Router } from "express";
import { requireAuth } from "../lib/auth";
import { AuthController } from "../controllers/auth.controller";
import { MercadoPagoController } from "../controllers/mercadopago.controller";

const router = Router();

// ── Autenticação
router.post("/login", AuthController.login);
router.post("/register", AuthController.register);
router.post("/register-express", AuthController.registerExpress);
router.post("/apply-role", requireAuth, AuthController.applyRole);
router.post("/profile-photo", requireAuth, AuthController.uploadProfilePhoto);
router.post("/cover-photo", requireAuth, AuthController.uploadCoverPhoto);
router.post("/forgot-password", AuthController.forgotPassword);
router.post("/reset-password", AuthController.updatePassword);
router.get("/me", requireAuth, AuthController.me);
router.patch("/me", requireAuth, AuthController.updateMe);
router.patch("/me/tenant-branding", requireAuth, AuthController.updateTenantBranding);
router.post("/refresh", AuthController.refresh);
router.post("/logout", AuthController.logout);

// ── Mercado Pago OAuth
router.get("/mercadopago/connect", requireAuth, MercadoPagoController.connect);

export default router;
