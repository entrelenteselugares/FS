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

// Use memory storage — Vercel serverless has no reliable disk write access.
// The 4.5MB Vercel body limit is handled by client-side compression in the frontend.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 4 * 1024 * 1024 } });
const router = Router();

// ── Eventos Públicos (Vitrine & Paywall)
router.get("/events", EventController.listPublic);
router.get("/events/cities", EventController.getPublicCities);
router.get("/events/:slug", optionalAuth, EventController.getById);
router.get("/events/:slug/access", EventController.getAccess);
router.get("/events/:eventId/media/:mediaId/download", optionalAuth, EventController.downloadSingle);
router.get("/events/:eventId/download-all", optionalAuth, EventController.downloadAll);
router.get("/partners", EventController.listPartners);
router.get("/unidades-fixas", EventController.listPartners);
router.post("/quotes", EventController.createQuote);

// ── Landings de Unidade Fixa (pública)
router.get("/unidade-fixa/:slug", getPartnerLandingData);

// ── Configurações Públicas
router.get("/configs/theme", getPublicThemeConfigs);
router.get("/configs/services", getPublicServices);
router.get("/configs/pricing", getPublicPricingConfigs);
router.get("/service-catalog", ServiceCatalogController.adminListServiceCatalog); // Reutilizando a listagem para público
router.get("/services/vault", ServiceCatalogController.listVaultServices);

// ── Gamificação Pública
router.get("/contests/active", getActiveContest);
router.get("/contests/hall-of-fame", getHallOfFame);

// ── CRM & LEADS
router.post("/crm/leads", CRMController.captureLead);

// ── Pedido e Catálogo Público
router.get("/orders/:id", PaymentController.getOrderPublic);
router.get("/orders/:id/check-payment", PaymentController.checkPaymentStatus);
router.post("/orders/:id/manual-payment", PaymentController.manualPayment);
router.get("/print-catalog", AdminPrintCatalog.getPublicPrintCatalog);
router.get("/events/:eventId/print-products", AdminPrintCatalog.getEventPrintProducts);

import { AuthController } from "../controllers/auth.controller";

// ── PHYGITAL
router.post("/phygital/upload", optionalAuth, upload.single("photo"), PhygitalController.upload);

// ── AUTH CHECK PÚBLICO (Usado no Phygital Capture)
router.get("/auth/check", AuthController.checkEmail);

export default router;
