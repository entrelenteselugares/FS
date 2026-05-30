import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import routes from "../routes/index";

const app = express();
app.set("trust proxy", 1);
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(express.json());

// For core, we simply load all routes because this acts as the generic fallback
// Some routes are already handled by the specialized entrypoints but this guarantees no 404s
app.use("/api", routes);

module.exports = app;
