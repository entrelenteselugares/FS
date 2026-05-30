import { Router } from "express";
import { optionalAuth } from "../lib/auth";
import { PaymentController } from "../controllers/payment.controller";

const router = Router();

// ── Checkout
router.post("/pending", PaymentController.createPendingOrder);
router.post("/payment", optionalAuth, PaymentController.processPayment);
router.get("/shipping-quote", optionalAuth, PaymentController.calculateShipping);

export default router;
