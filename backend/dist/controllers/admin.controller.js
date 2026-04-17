"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminEventController = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
class AdminEventController {
    /** POST /api/admin/events — Cria novo evento com foto de capa */
    static async create(req, res) {
        const { nomeNoivos, dataEvento, cartorio, lightroomUrl, driveUrl, fotografoId, editorId, cartorioUserId } = req.body;
        try {
            // Se um arquivo foi enviado, constrói a URL local para servir
            let coverPhotoUrl;
            if (req.file) {
                // Serve o arquivo via rota estática /uploads/
                coverPhotoUrl = `${process.env.BACKEND_URL || "http://localhost:3001"}/uploads/covers/${req.file.filename}`;
            }
            if (!nomeNoivos || !dataEvento) {
                return res.status(400).json({ error: "Nome dos noivos e data são obrigatórios" });
            }
            const event = await prisma_1.default.event.create({
                data: {
                    nomeNoivos,
                    dataEvento: new Date(dataEvento),
                    cartorio,
                    lightroomUrl: lightroomUrl || null,
                    driveUrl: driveUrl || null,
                    coverPhotoUrl: coverPhotoUrl || null,
                    fotografoId: fotografoId || null,
                    editorId: editorId || null,
                    cartorioUserId: cartorioUserId || null,
                },
            });
            return res.status(201).json(event);
        }
        catch (error) {
            console.error("Erro ao criar evento:", error);
            return res.status(500).json({ error: "Erro ao criar evento" });
        }
    }
    /** GET /api/admin/users — Lista usuários por role para o formulário de evento */
    static async listUsers(req, res) {
        try {
            const { role } = req.query;
            const roleStr = role;
            const users = await prisma_1.default.user.findMany({
                where: roleStr ? { role: roleStr } : {},
                select: {
                    id: true,
                    nome: true,
                    email: true,
                    role: true,
                    mpUserId: true, // Útil para saber quem já conectou o Mercado Pago
                },
                orderBy: { nome: "asc" },
            });
            return res.json(users);
        }
        catch (error) {
            console.error("Erro ao listar usuários:", error);
            return res.status(500).json({ error: "Erro ao listar usuários" });
        }
    }
    /** GET /api/admin/events — Lista todos os eventos */
    static async list(req, res) {
        try {
            const events = await prisma_1.default.event.findMany({
                include: { pedidos: true, fotografo: true, editor: true, cartorioUser: true },
                orderBy: { dataEvento: "desc" },
            });
            return res.json(events);
        }
        catch (error) {
            console.error("Erro ao listar eventos:", error);
            return res.status(500).json({ error: "Erro ao listar eventos" });
        }
    }
    /** GET /api/admin/stats — Estatísticas financeiras para o Admin */
    static async stats(req, res) {
        try {
            const { startDate, endDate, cartorio, status } = req.query;
            const where = {};
            if (status)
                where.status = status;
            if (cartorio)
                where.event = { cartorio };
            if (startDate || endDate) {
                const dateFilter = {};
                if (startDate)
                    dateFilter.gte = new Date(startDate);
                if (endDate)
                    dateFilter.lte = new Date(endDate);
                where.createdAt = dateFilter;
            }
            const orders = await prisma_1.default.order.findMany({
                where,
                include: { event: true },
                orderBy: { createdAt: "desc" },
            });
            const totalReceita = orders
                .filter((o) => o.status === "APROVADO")
                .reduce((sum, o) => sum + Number(o.valor), 0);
            const taxaMatriz = Number(process.env.TAXA_MATRIZ || 0.4);
            const taxaCartorio = Number(process.env.TAXA_CARTORIO || 0.1);
            const taxaFotografo = Number(process.env.TAXA_FOTOGRAFO || 0.3);
            const taxaEditor = Number(process.env.TAXA_EDITOR || 0.2);
            return res.json({
                totalReceita,
                split: {
                    matriz: totalReceita * taxaMatriz,
                    cartorio: totalReceita * taxaCartorio,
                    fotografo: totalReceita * taxaFotografo,
                    editor: totalReceita * taxaEditor,
                },
                totalPedidos: orders.length,
                aprovados: orders.filter((o) => o.status === "APROVADO").length,
                pendentes: orders.filter((o) => o.status === "PENDENTE").length,
                orders: orders.slice(0, 50),
            });
        }
        catch (error) {
            console.error("Erro ao calcular estatísticas:", error);
            return res.status(500).json({ error: "Erro ao calcular estatísticas" });
        }
    }
    /** GET /api/cartorio/stats — Agenda e comissões para o Cartório */
    static async cartorioStats(req, res) {
        try {
            const { cartorioName, startDate, endDate } = req.query;
            const where = {};
            if (cartorioName)
                where.cartorio = cartorioName;
            if (startDate || endDate) {
                const dateFilter = {};
                if (startDate)
                    dateFilter.gte = new Date(startDate);
                if (endDate)
                    dateFilter.lte = new Date(endDate);
                where.dataEvento = dateFilter;
            }
            const events = await prisma_1.default.event.findMany({
                where,
                include: { pedidos: true },
                orderBy: { dataEvento: "asc" },
            });
            const taxaCartorio = Number(process.env.TAXA_CARTORIO || 0.1);
            const receitaTotal = events
                .flatMap((e) => e.pedidos || [])
                .filter((o) => o.status === "APROVADO")
                .reduce((sum, o) => sum + Number(o.valor), 0);
            return res.json({
                eventos: events,
                estimativaRepasse: receitaTotal * taxaCartorio,
                eventosHoje: events.filter((e) => new Date(e.dataEvento).toDateString() === new Date().toDateString()),
            });
        }
        catch (error) {
            console.error("Erro ao calcular dados do cartório:", error);
            return res.status(500).json({ error: "Erro ao calcular dados do cartório" });
        }
    }
    /** PATCH /api/admin/events/:id — Atualiza links e foto de capa de um evento */
    static async update(req, res) {
        const { id } = req.params;
        const { lightroomUrl, driveUrl } = req.body;
        try {
            let coverPhotoUrl;
            if (req.file) {
                coverPhotoUrl = `${process.env.BACKEND_URL || "http://localhost:3001"}/uploads/covers/${req.file.filename}`;
            }
            const event = await prisma_1.default.event.update({
                where: { id },
                data: {
                    ...(lightroomUrl !== undefined && { lightroomUrl: lightroomUrl || null }),
                    ...(driveUrl !== undefined && { driveUrl: driveUrl || null }),
                    ...(coverPhotoUrl && { coverPhotoUrl }),
                },
            });
            return res.json(event);
        }
        catch (error) {
            console.error("Erro ao atualizar evento:", error);
            return res.status(500).json({ error: "Erro ao atualizar evento" });
        }
    }
}
exports.AdminEventController = AdminEventController;
