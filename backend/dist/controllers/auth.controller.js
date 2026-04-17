"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const auth_1 = require("../lib/auth");
class AuthController {
    /** POST /api/auth/login */
    static async login(req, res) {
        const { email, senha } = req.body;
        if (!email || !senha) {
            return res.status(400).json({ error: "Email e senha são obrigatórios" });
        }
        try {
            const user = await prisma_1.default.user.findUnique({ where: { email } });
            if (!user)
                return res.status(401).json({ error: "Credenciais inválidas" });
            const valid = await bcryptjs_1.default.compare(senha, user.senha);
            if (!valid)
                return res.status(401).json({ error: "Credenciais inválidas" });
            const token = (0, auth_1.generateToken)({ userId: user.id, role: user.role, nome: user.nome });
            return res.json({ token, user: { id: user.id, nome: user.nome, email: user.email, role: user.role } });
        }
        catch (error) {
            console.error("Erro no login:", error);
            return res.status(500).json({ error: "Erro interno" });
        }
    }
    /** POST /api/auth/register (Apenas para seed/admin) */
    static async register(req, res) {
        const { email, senha, nome, role, whatsapp } = req.body;
        try {
            const hash = await bcryptjs_1.default.hash(senha, 12);
            const user = await prisma_1.default.user.create({
                data: { email, senha: hash, nome, role: role || "CLIENTE", whatsapp }
            });
            const token = (0, auth_1.generateToken)({ userId: user.id, role: user.role, nome: user.nome });
            return res.status(201).json({ token, user: { id: user.id, nome: user.nome, email: user.email, role: user.role } });
        }
        catch (error) {
            if (error.code === "P2002")
                return res.status(409).json({ error: "Email já cadastrado" });
            return res.status(500).json({ error: "Erro ao criar usuário" });
        }
    }
    /** GET /api/auth/me */
    static async me(req, res) {
        try {
            const payload = req.user;
            const user = await prisma_1.default.user.findUnique({
                where: { id: payload.userId },
                select: {
                    id: true,
                    nome: true,
                    email: true,
                    role: true,
                    whatsapp: true,
                    mpUserId: true,
                    mpPublicKey: true,
                }
            });
            return res.json(user);
        }
        catch (error) {
            return res.status(500).json({ error: "Erro ao buscar dados do usuário" });
        }
    }
}
exports.AuthController = AuthController;
