"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const index_1 = __importDefault(require("./routes/index"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
if (!process.env.BACKEND_URL) {
    process.env.BACKEND_URL = `http://localhost:${PORT}`;
}
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Serve arquivos de uploads como estáticos
app.use("/uploads", express_1.default.static(path_1.default.join(process.cwd(), "uploads")));
// Registro das Rotas
app.use("/api", index_1.default);
// ── Dev Helpers ───────────────────────────────────────────────────
app.locals.MOCK_PAID = false;
app.get("/api/dev/pay", (req, res) => {
    req.app.locals.MOCK_PAID = true;
    res.json({ success: true, message: "Pagamento Simulado com Sucesso!" });
});
app.get("/api/dev/status", (req, res) => {
    res.json({ paid: req.app.locals.MOCK_PAID });
});
app.get("/health", (_req, res) => {
    res.json({ status: "ok", message: "Foto Segundo Backend v2.0 — Auth + RBAC + Split" });
});
// Exportar para Vercel
exports.default = app;
// Só rodar o listen se não estivermos no ambiente Serverless da Vercel
if (process.env.NODE_ENV !== "production") {
    app.listen(PORT, () => {
        console.log(`🚀 Senior Backend running on http://localhost:${PORT}`);
    });
}
