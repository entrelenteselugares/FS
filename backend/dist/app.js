"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const index_1 = __importDefault(require("./routes/index"));
const app = (0, express_1.default)();
const allowedOrigins = [
    process.env.FRONTEND_URL ?? "http://localhost:5173",
    "https://foto-segundo.vercel.app",
    "https://fotosegundo.vercel.app",
];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Permite requisições sem origin (como apps mobile ou curl) ou de origins autorizados
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error("CORS bloqueado por política de segurança"));
        }
    },
    credentials: true,
}));
// Webhook do Mercado Pago (se houver) pode precisar de body raw futuramente
// app.use("/api/webhooks", express.raw({ type: "application/json" }));
app.use(express_1.default.json({ limit: "10mb" })); // Aumentado para suportar Base64 de imagens
// Uploads estáticos (Apenas para legado local, em produção usamos Supabase)
app.use("/uploads", express_1.default.static(path_1.default.join(process.cwd(), "uploads")));
app.get("/health", (_req, res) => res.json({ status: "ok", ts: new Date().toISOString() }));
app.use("/api", index_1.default);
// Tratamento de erros global
app.use((err, _req, res, _next) => {
    console.error("❌ BACKEND ERROR:", err);
    res.status(500).json({ error: "Erro interno no servidor", details: err.message });
});
exports.default = app;
