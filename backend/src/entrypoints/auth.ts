import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import authRoutes from "../routes/auth.routes";
import driveAuthRoutes from "../routes/driveAuth.routes";
import { initSentry } from "../lib/sentry";

initSentry();

const app = express();
app.set("trust proxy", 1);
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(express.json({ limit: "6mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/auth", driveAuthRoutes);

export default app;
