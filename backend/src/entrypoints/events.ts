import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import publicRoutes from "../routes/public.routes";
import { professionalRoutes } from "../routes/professional.routes";
import vaultRoutes from "../routes/vault.routes";
import flashRoutes from "../routes/flash.routes";

const app = express();
app.set("trust proxy", 1);
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(express.json({ limit: "6mb" }));

app.use("/api/public", publicRoutes);
app.use("/api/profissional", professionalRoutes);
app.use("/api/vaults", vaultRoutes);
app.use("/api/flash", flashRoutes);

module.exports = app;
