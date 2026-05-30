import { Router } from "express";
import express from "express";
import { PaymentController } from "../controllers/payment.controller";
import { requireMercadoPagoSignature } from "../middleware/webhook-auth";
import { SubscriptionService } from "../services/subscription.service";

const router = Router();

router.post(
  "/mercadopago",
  // Raw body antes do JSON parser — garante integridade do HMAC
  express.raw({ type: "application/json" }),
  (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    if (Buffer.isBuffer(req.body)) {
      try { req.body = JSON.parse(req.body.toString("utf8")); } catch { req.body = {}; }
    }
    next();
  },
  requireMercadoPagoSignature,
  PaymentController.webhook
);

router.post(
  "/mp-subscription",
  async (req: express.Request, res: express.Response) => {
    try {
      const { type, data } = req.body;
      if (type === "subscription_preapproval" && data?.id) {
        await SubscriptionService.handlePreapprovalWebhook(data.id);
      }
      return res.sendStatus(200);
    } catch (error) {
      console.error("[Webhook MP Subscription] Erro:", error);
      return res.sendStatus(500);
    }
  }
);

export default router;
