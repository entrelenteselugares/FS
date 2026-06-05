import { Router } from "express";
import { requireAuth, requireRole } from "../lib/auth";
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
  adminUploadCover,
  adminUploadPreview,
  adminGetLogs,
  adminCreateManualSale,
  adminListInventory,
  adminAdjustStock,
  adminGetApplications,
  adminApproveApplication,
  adminRejectApplication,
  adminListExperienceValidations,
  adminReviewExperience
} from "../controllers/admin.controller";
import { adminGetEventById } from "../controllers/admin_event_detail.controller";
import { generateWeeklyPayout, listPayouts, markItemPaid, exportPayoutCSV } from "../controllers/payout.controller";
import * as FinanceHub from "../controllers/finance_hub.controller";
import { getConfigs, updateConfigs } from "../controllers/config.controller";
import { listSuppliers, createSupplier, getBreakeven, updateRedemptionStatus, listRedemptions } from "../controllers/supplier.controller";
import { ReferralController } from "../controllers/referral.controller";
import { GrowthController } from "../controllers/growth.controller";
import { PhygitalController } from "../controllers/phygital.controller";
import { adminCreateContest, adminListContests, adminUpdateContest, adminDeleteContest } from "../controllers/contest.controller";
import * as AdminPrintCatalog from "../controllers/print_catalog.controller";
import * as ServiceCatalogController from "../controllers/service_catalog.controller";
import { FranchiseController } from "../controllers/franchise.controller";
import { deleteMediaAdmin } from "../controllers/access.controller";
import { AffiliateController } from "../controllers/affiliate.controller";
import { IoTController } from "../controllers/iot.controller";
import { validate } from "../middleware/validate.middleware";
import { updateConfigsSchema, serviceCatalogSchema } from "../schemas/admin.schemas";
import { CRMController } from "../controllers/crm.controller";
import { BannerController } from "../controllers/banner.controller";
import { EventReferenceController } from "../controllers/EventReferenceController";
import multer from "multer";

const router = Router();

// ── Admin: Stats & Logs
router.get("/stats", requireAuth, requireRole("ADMIN"), getDashboardStats);
router.get("/logs", requireAuth, requireRole("ADMIN"), adminGetLogs);
router.post("/orders/manual", requireAuth, requireRole("ADMIN"), adminCreateManualSale);

// ── Admin: Gestão de Eventos
const refUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 4 * 1024 * 1024 } });
router.get("/events", requireAuth, requireRole("ADMIN"), adminListEvents);
router.get("/events/:id", requireAuth, requireRole("ADMIN"), adminGetEventById);
router.post("/events", requireAuth, requireRole("ADMIN"), adminCreateEvent);
router.patch("/events/:id", requireAuth, requireRole("ADMIN"), adminUpdateEvent);
router.patch("/events/:id/cover", requireAuth, requireRole("ADMIN"), adminUploadCover);
router.patch("/events/:id/preview", requireAuth, requireRole("ADMIN"), adminUploadPreview);
router.delete("/events/:id", requireAuth, requireRole("ADMIN"), adminDeleteEvent);

// ── Admin: Referências Técnicas de Eventos
router.get("/events/:eventId/references", requireAuth, requireRole("ADMIN"), EventReferenceController.list);
router.post("/events/:eventId/references/upload", requireAuth, requireRole("ADMIN"), refUpload.single("file"), EventReferenceController.uploadImage);
router.post("/events/:eventId/references/youtube", requireAuth, requireRole("ADMIN"), EventReferenceController.addYoutube);
router.delete("/events/:eventId/references/:refId", requireAuth, requireRole("ADMIN"), EventReferenceController.remove);

// ── Admin: Gestão de Usuários
router.get("/users", requireAuth, requireRole("ADMIN"), adminListUsers);
router.post("/users", requireAuth, requireRole("ADMIN"), adminCreateUser);
router.patch("/users/:id", requireAuth, requireRole("ADMIN"), adminUpdateUser);
router.delete("/users/:id", requireAuth, requireRole("ADMIN"), adminDeleteUser);
router.patch("/users/:id/tier", requireAuth, requireRole("ADMIN"), AffiliateController.updateTier);

// ── ADMIN APPROVAL HUB (Phase 45)
router.get("/applications", requireAuth, requireRole("ADMIN"), adminGetApplications);
router.patch("/applications/:id/approve", requireAuth, requireRole("ADMIN"), adminApproveApplication);
router.patch("/applications/:id/reject", requireAuth, requireRole("ADMIN"), adminRejectApplication);

// ── VALIDAÇÃO DE EXPERIÊNCIA
router.get("/experience-validations", requireAuth, requireRole("ADMIN"), adminListExperienceValidations);
router.patch("/experience-validations/:id/review", requireAuth, requireRole("ADMIN"), adminReviewExperience);

// ── Admin: Gestão de Pedidos
router.get("/orders", requireAuth, requireRole("ADMIN"), adminListOrders);
router.patch("/orders/:id/payout", requireAuth, requireRole("ADMIN"), adminMarkPayoutPaid);
router.patch("/orders/:id/logistics", requireAuth, requireRole("ADMIN"), adminUpdateOrderLogistics);
router.delete("/orders/:id", requireAuth, requireRole("ADMIN"), adminDeleteOrder);
router.post("/orders/:id/delete-media", requireAuth, requireRole("ADMIN"), deleteMediaAdmin);

// ── Admin: Orçamentos (Leads)
router.get("/quotes", requireAuth, requireRole("ADMIN"), adminListQuotes);
router.post("/quotes", requireAuth, requireRole("ADMIN"), adminCreateQuote);
router.patch("/quotes/:id/approve", requireAuth, requireRole("ADMIN"), adminApproveQuote);
router.patch("/quotes/:id/price", requireAuth, requireRole("ADMIN"), adminPriceQuote);
router.patch("/quotes/:id/reject", requireAuth, requireRole("ADMIN"), adminRejectQuote);
router.patch("/quotes/:id/archive", requireAuth, requireRole("ADMIN"), adminArchiveQuote);

// ── Admin: Repasses
router.post("/payouts/generate", requireAuth, requireRole("ADMIN"), generateWeeklyPayout);
router.get("/payouts", requireAuth, requireRole("ADMIN"), listPayouts);
router.get("/payouts/export", requireAuth, requireRole("ADMIN"), exportPayoutCSV);
router.patch("/payouts/:id/items/:itemId/paid", requireAuth, requireRole("ADMIN"), markItemPaid);

// ── Admin: Finance Hub
router.get("/finance/balances", requireAuth, requireRole("ADMIN"), FinanceHub.getProfessionalBalances);
router.post("/finance/settle", requireAuth, requireRole("ADMIN"), FinanceHub.settleProfessional);
router.get("/finance/subscriptions-mrr", requireAuth, requireRole("ADMIN"), FinanceHub.getSubscriptionStats);

// ── Admin: Configurações
router.get("/configs", requireAuth, requireRole("ADMIN"), getConfigs);
router.patch("/configs", requireAuth, requireRole("ADMIN"), validate(updateConfigsSchema), updateConfigs);

// ── Admin: Fornecedores & Breakeven
router.get("/suppliers", requireAuth, requireRole("ADMIN"), listSuppliers);
router.post("/suppliers", requireAuth, requireRole("ADMIN"), createSupplier);
router.get("/suppliers/:id/breakeven", requireAuth, requireRole("ADMIN"), getBreakeven);
router.get("/redemptions", requireAuth, requireRole("ADMIN"), listRedemptions);
router.patch("/redemptions/:id/status", requireAuth, requireRole("ADMIN"), updateRedemptionStatus);

// ── Admin: Ambassador / Coupons / Growth
router.get("/ambassador/stats", requireAuth, requireRole("ADMIN"), ReferralController.listAllCampaigns);
router.post("/ambassador/campaigns", requireAuth, requireRole("ADMIN"), ReferralController.createCampaign);
router.patch("/ambassador/campaigns/:campaignId/toggle", requireAuth, requireRole("ADMIN"), ReferralController.adminToggleCampaign);
router.delete("/ambassador/campaigns/:campaignId", requireAuth, requireRole("ADMIN"), ReferralController.adminDeleteCampaign);

router.get("/coupons", requireAuth, requireRole("ADMIN"), GrowthController.listCoupons);
router.post("/coupons", requireAuth, requireRole("ADMIN"), GrowthController.createCoupon);
router.patch("/coupons/:id", requireAuth, requireRole("ADMIN"), GrowthController.toggleCoupon);
router.delete("/coupons/:id", requireAuth, requireRole("ADMIN"), GrowthController.deleteCoupon);
router.get("/ambassadors", requireAuth, requireRole("ADMIN"), GrowthController.listAmbassadors);

// ── Admin: Banners
router.get("/banners", requireAuth, requireRole("ADMIN"), BannerController.list);
router.post("/banners", requireAuth, requireRole("ADMIN"), BannerController.create);
router.put("/banners/:id", requireAuth, requireRole("ADMIN"), BannerController.update);
router.delete("/banners/:id", requireAuth, requireRole("ADMIN"), BannerController.delete);

// ── Admin: Phygital
router.get("/phygital/all", requireAuth, requireRole("ADMIN"), PhygitalController.listAllByEvent);
router.post("/phygital/simulate", requireAuth, requireRole("ADMIN"), PhygitalController.simulate);

// ── Admin: Contests
router.get("/contests", requireAuth, requireRole("ADMIN"), adminListContests);
router.post("/contests", requireAuth, requireRole("ADMIN"), adminCreateContest);
router.patch("/contests/:id", requireAuth, requireRole("ADMIN"), adminUpdateContest);
router.delete("/contests/:id", requireAuth, requireRole("ADMIN"), adminDeleteContest);

// ── Admin: Catálogo de Impressão (CK)
router.get("/print-catalog", requireAuth, requireRole("ADMIN"), AdminPrintCatalog.listPrintProducts);
router.post("/print-catalog", requireAuth, requireRole("ADMIN"), AdminPrintCatalog.createPrintProduct);
router.post("/print-catalog/import", requireAuth, requireRole("ADMIN"), AdminPrintCatalog.importPrintProducts);
router.patch("/print-catalog/bulk-margin", requireAuth, requireRole("ADMIN"), AdminPrintCatalog.bulkUpdateMargin);
router.patch("/print-catalog/:id", requireAuth, requireRole("ADMIN"), AdminPrintCatalog.updatePrintProduct);
router.post("/print-catalog/seed", requireAuth, requireRole("ADMIN"), AdminPrintCatalog.seedCkCatalog);

// ── Admin: Catálogo Global de Serviços
router.get("/service-catalog", requireAuth, requireRole("ADMIN"), ServiceCatalogController.adminListServiceCatalog);
router.post("/service-catalog", requireAuth, requireRole("ADMIN"), validate(serviceCatalogSchema), ServiceCatalogController.adminCreateService);
router.patch("/service-catalog/:id", requireAuth, requireRole("ADMIN"), validate(serviceCatalogSchema), ServiceCatalogController.adminUpdateService);
router.delete("/service-catalog/:id", requireAuth, requireRole("ADMIN"), ServiceCatalogController.adminDeleteService);
router.get("/services/pending", requireAuth, requireRole("ADMIN"), ServiceCatalogController.listPendingServices);
router.patch("/services/:id/review", requireAuth, requireRole("ADMIN"), ServiceCatalogController.reviewPendingService);

// ── Admin: Estoque
router.get("/inventory", requireAuth, requireRole("ADMIN"), adminListInventory);
router.post("/inventory/adjust", requireAuth, requireRole("ADMIN"), adminAdjustStock);

// ── Admin: Franquias
router.get("/franchises", requireAuth, requireRole("ADMIN"), FranchiseController.listAll);
router.post("/franchises/promote", requireAuth, requireRole("ADMIN"), FranchiseController.promote);
router.post("/franchises/credits", requireAuth, requireRole("ADMIN"), FranchiseController.addCredits);
router.patch("/franchises/:profileId/toggle", requireAuth, requireRole("ADMIN"), FranchiseController.toggleActive);
router.delete("/franchises/:profileId", requireAuth, requireRole("ADMIN"), FranchiseController.remove);
router.get("/franchises/:profileId/statement", requireAuth, requireRole("ADMIN"), FranchiseController.getStatement);
router.get("/franchises/orders", requireAuth, requireRole("ADMIN"), FranchiseController.adminListSupplyOrders);
router.patch("/franchises/orders/:id/status", requireAuth, requireRole("ADMIN"), FranchiseController.adminUpdateSupplyOrderStatus);

// ── Admin: CRM
router.get("/crm/leads", requireAuth, requireRole("ADMIN"), CRMController.getLeads);
router.get("/crm/stats", requireAuth, requireRole("ADMIN"), CRMController.getStats);
router.get("/crm/abandoned-carts", requireAuth, requireRole("ADMIN"), CRMController.getAbandonedCarts);

// ── Admin: WhatsApp
router.get("/whatsapp/status", requireAuth, requireRole("ADMIN"), GrowthController.getWhatsappStatus);
router.get("/whatsapp/qr", requireAuth, requireRole("ADMIN"), GrowthController.getWhatsappQr);

// ── Admin: IoT
router.get("/iot/devices", requireAuth, requireRole("ADMIN"), IoTController.listDevices);

export default router;
