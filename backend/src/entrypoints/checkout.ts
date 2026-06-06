import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import checkoutRoutes from "../routes/checkout.routes";
import webhookRoutes from "../routes/webhook.routes";
import paymentRoutes from "../routes/checkout.routes";
import { initSentry } from "../lib/sentry";

initSentry();

const app = express();
app.set("trust proxy", 1);
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

// Webhook requires raw body for stripe/mercadopago depending on implementation, but in this app it's JSON
app.use(express.json({ limit: "6mb" }));

app.use("/api/checkout", checkoutRoutes);
app.use("/api/webhooks", webhookRoutes);

module.exports = app;
