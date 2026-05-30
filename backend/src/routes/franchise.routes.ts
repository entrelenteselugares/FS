import { Router } from "express";
import { requireAuth, requireRole } from "../lib/auth";
import { FranchiseController } from "../controllers/franchise.controller";
import { requireProOrFranchise } from "./professional.routes";

const router = Router();

// B2B Hub (Franchisee Dashboard)
router.get("/inventory", requireAuth, requireRole("FRANCHISEE"), FranchiseController.getInventory);
router.get("/referral", requireAuth, requireRole("FRANCHISEE"), FranchiseController.getReferralCode);
router.get("/network", requireAuth, requireRole("FRANCHISEE"), FranchiseController.getNetwork);
router.get("/finance", requireAuth, requireRole("FRANCHISEE"), FranchiseController.getFinanceStats);
router.get("/finance/export", requireAuth, requireRole("FRANCHISEE"), FranchiseController.exportFinance);
router.post("/reorder", requireAuth, requireRole("FRANCHISEE"), FranchiseController.postReorder);
router.put("/profile", requireAuth, requireRole("FRANCHISEE"), FranchiseController.updateProfile);
router.patch("/branding", requireAuth, requireRole("FRANCHISEE"), FranchiseController.updateBranding);

// B2B Shop (Supply Orders)
router.get("/orders", requireAuth, requireProOrFranchise, FranchiseController.listSupplyOrders);
router.post("/orders", requireAuth, requireProOrFranchise, FranchiseController.createSupplyOrder);
router.post("/webhook", FranchiseController.handleWebhook); // Public webhook

export default router;
