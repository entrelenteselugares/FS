import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import authRoutes from "../routes/auth.routes";
import driveAuthRoutes from "../routes/driveAuth.routes";

const app = express();
app.set("trust proxy", 1);
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/auth", driveAuthRoutes);

export default app;
module.exports = app;
