import { Router } from "express";
import { optionalAuth } from "../lib/auth";
import { EventController } from "../controllers/event.controller";
import { getPartnerLandingData } from "../controllers/partner.controller";
import { getPublicThemeConfigs, getPublicServices, getPublicPricingConfigs } from "../controllers/config.controller";
import * as ServiceCatalogController from "../controllers/service_catalog.controller";
import { getActiveContest, getHallOfFame } from "../controllers/contest.controller";
import { CRMController } from "../controllers/crm.controller";
import { PhygitalController } from "../controllers/phygital.controller";
import { PaymentController } from "../controllers/payment.controller";
import * as AdminPrintCatalog from "../controllers/print_catalog.controller";
import multer from "multer";
import { apiCache } from "../middleware/cache.middleware";

// Use memory storage — Vercel serverless has no reliable disk write access.
// The 4.5MB Vercel body limit is handled by client-side compression in the frontend.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });
const router = Router();

// ── Eventos Públicos (Vitrine & Paywall)
router.get("/events", apiCache(30), EventController.listPublic);
router.get("/events/cities", apiCache(60), EventController.getPublicCities);
router.get("/events/:slug", optionalAuth, apiCache(30), EventController.getById);
router.get("/events/:slug/access", EventController.getAccess); // Não cachear para não atrasar o feedback de compra
router.get("/events/:eventId/media/:mediaId/download", optionalAuth, EventController.downloadSingle);
router.get("/events/:eventId/download-all", optionalAuth, EventController.downloadAll);
router.get("/partners", apiCache(120), EventController.listPartners);
router.get("/unidades-fixas", apiCache(120), EventController.listPartners);
router.post("/quotes", EventController.createQuote);

// ── Landings de Unidade Fixa (pública)
router.get("/unidade-fixa/:slug", getPartnerLandingData);

// ── Configurações Públicas
router.get("/configs/theme", apiCache(120), getPublicThemeConfigs);
router.get("/configs/services", apiCache(120), getPublicServices);
router.get("/configs/pricing", apiCache(120), getPublicPricingConfigs);
router.get("/service-catalog", apiCache(60), ServiceCatalogController.adminListServiceCatalog); // Reutilizando a listagem para público
router.get("/services/vault", apiCache(60), ServiceCatalogController.listVaultServices);

// ── Gamificação Pública
router.get("/contests/active", apiCache(30), getActiveContest);
router.get("/contests/hall-of-fame", apiCache(30), getHallOfFame);

// ── CRM & LEADS
router.post("/crm/leads", CRMController.captureLead);

// ── Pedido e Catálogo Público
router.get("/orders/:id", PaymentController.getOrderPublic);
router.get("/orders/:id/check-payment", PaymentController.checkPaymentStatus);
router.post("/orders/:id/manual-payment", PaymentController.manualPayment);
router.get("/print-catalog", apiCache(60), AdminPrintCatalog.getPublicPrintCatalog);
router.get("/events/:eventId/print-products", apiCache(30), AdminPrintCatalog.getEventPrintProducts);

import { AuthController } from "../controllers/auth.controller";

// ── PHYGITAL
router.post("/phygital/upload", optionalAuth, upload.single("photo"), PhygitalController.upload);

// ── AUTH CHECK PÚBLICO (Usado no Phygital Capture)
router.get("/auth/check", AuthController.checkEmail);

export default router;
