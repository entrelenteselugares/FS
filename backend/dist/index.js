"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const index_1 = __importDefault(require("./routes/index"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// 1. Blindagem contra falhas não capturadas
process.on("unhandledRejection", (reason) => console.error("Unhandled Rejection:", reason));
process.on("uncaughtException", (error) => console.error("Uncaught Exception:", error));
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// 2. Health Check (Independente do Banco)
app.get("/health", (_req, res) => res.json({ status: "alive" }));
// 3. Serve arquivos de uploads (Melhorado)
const uploadsPath = path_1.default.join(process.cwd(), "uploads");
app.use("/uploads", express_1.default.static(uploadsPath));
// 4. Roteamento Unificado (Resolve conflitos de prefixo da Vercel)
app.use("/api", index_1.default);
app.use("/", index_1.default);
// Handler de Erros Global (Senior Diagnostic)
app.use((err, _req, res, _next) => {
    console.error("❌ ERRO GLOBAL CAPTURADO:", err);
    res.status(500).json({
        error: "Erro Interno do Servidor",
        message: err.message || "Falha desconhecida",
        code: err.code || "INTERNAL_ERROR",
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
        db_connected: !!process.env.DATABASE_URL
    });
});
exports.default = app;
if (process.env.NODE_ENV !== "production") {
    app.listen(PORT, () => console.log(`🚀 Senior Backend running on http://localhost:${PORT}`));
}
