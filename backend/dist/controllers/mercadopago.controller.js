"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MercadoPagoController = void 0;
const mercadopago_service_1 = require("../services/mercadopago.service");
const prisma_1 = __importDefault(require("../lib/prisma"));
exports.MercadoPagoController = {
    /**
     * Gera a URL para o usuário conectar sua conta Mercado Pago
     */
    async connect(req, res) {
        try {
            const user = req.user;
            const userId = user?.userId;
            if (!userId) {
                return res.status(401).json({ error: "Não autorizado" });
            }
            const url = mercadopago_service_1.MercadoPagoService.getAuthorizationUrl(userId);
            res.json({ url });
        }
        catch (error) {
            const msg = error instanceof Error ? error.message : "Erro desconhecido";
            console.error("[MP Connect Error]:", msg);
            res.status(500).json({ error: "Erro ao gerar URL de conexão" });
        }
    },
    /**
     * Endpoint de callback (Redirect URI) do Mercado Pago OAuth
     */
    async callback(req, res) {
        const { code, state: userId } = req.query;
        if (!code || !userId) {
            return res.status(400).send("Código de autorização ou ID do usuário ausente.");
        }
        try {
            console.log(`[MP Callback] Processando autorização para usuário: ${userId}`);
            const authData = await mercadopago_service_1.MercadoPagoService.exchangeCode(code);
            // Salva as credenciais no banco de dados
            await prisma_1.default.user.update({
                where: { id: userId },
                data: {
                    mpAccessToken: authData.access_token,
                    mpPublicKey: authData.public_key,
                    mpRefreshToken: authData.refresh_token,
                    mpUserId: authData.user_id?.toString(),
                }
            });
            // Busca o usuário para saber para qual dashboard redirecionar
            const user = await prisma_1.default.user.findUnique({ where: { id: userId } });
            console.log(`[MP Callback] Sucesso! Conta conectada para o usuário ${user?.nome} (${user?.role})`);
            // Redireciona para o dashboard correto baseado no papel do usuário
            const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
            const targetDashboard = user?.role === "CARTORIO" ? "/cartorio" : "/profissional";
            res.redirect(`${frontendUrl}${targetDashboard}?mp_connected=true`);
        }
        catch (error) {
            const msg = error instanceof Error ? error.message : "Erro desconhecido";
            console.error("[MP Callback Error]:", msg);
            res.status(500).send("Erro ao processar a conexão com o Mercado Pago.");
        }
    }
};
