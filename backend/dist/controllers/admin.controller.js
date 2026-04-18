"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminEventController = void 0;
exports.adminUploadCover = adminUploadCover;
exports.getDashboardStats = getDashboardStats;
exports.adminListEvents = adminListEvents;
exports.adminCreateEvent = adminCreateEvent;
exports.adminUpdateEvent = adminUpdateEvent;
exports.adminDeleteEvent = adminDeleteEvent;
exports.adminListUsers = adminListUsers;
exports.adminCreateUser = adminCreateUser;
exports.adminUpdateUser = adminUpdateUser;
exports.adminListOrders = adminListOrders;
const prisma_1 = __importDefault(require("../lib/prisma"));
const utils_1 = require("../lib/utils");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const supabase_js_1 = require("@supabase/supabase-js");
// Inicializa o cliente Supabase para Storage (Stateless)
const supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
// ── DASHBOARD ─────────────────────────────────────────
async function adminUploadCover(req, res) {
    const { id } = req.params;
    const { imageBase64, mimeType } = req.body;
    if (!imageBase64 || !mimeType) {
        res.status(400).json({ error: "Imagem e MimeType são obrigatórios." });
        return;
    }
    try {
        const exists = await prisma_1.default.event.findUnique({ where: { id: String(id) } });
        if (!exists) {
            res.status(404).json({ error: "Evento não encontrado." });
            return;
        }
        const base64Data = String(imageBase64).replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");
        const ext = String(mimeType).split("/")[1] || "jpg";
        const fileName = `covers/admin-${id}-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
            .from("eventos")
            .upload(fileName, buffer, { contentType: String(mimeType), upsert: true });
        if (uploadError)
            throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from("eventos").getPublicUrl(fileName);
        const updated = await prisma_1.default.event.update({
            where: { id: String(id) },
            data: { coverPhotoUrl: publicUrl },
            select: { id: true, coverPhotoUrl: true },
        });
        res.json(updated);
    }
    catch (err) {
        console.error("adminUploadCover:", err);
        res.status(500).json({ error: "Erro ao salvar capa via Admin." });
    }
}
async function getDashboardStats(req, res) {
    try {
        const [totalEvents, totalOrders, totalRevenue, recentOrders, pendingEvents,] = await Promise.all([
            prisma_1.default.event.count({ where: { active: true } }),
            prisma_1.default.order.count({ where: { status: "APROVADO" } }),
            prisma_1.default.order.aggregate({
                where: { status: "APROVADO" },
                _sum: { valor: true },
            }),
            prisma_1.default.order.findMany({
                where: { status: "APROVADO" },
                include: {
                    event: { select: { nomeNoivos: true, slug: true } },
                },
                orderBy: { createdAt: "desc" },
                take: 8,
            }),
            // Eventos sem capa ou links (usando os campos v4.0)
            prisma_1.default.event.findMany({
                where: {
                    active: true,
                    OR: [
                        { coverPhotoUrl: null },
                        { lightroomUrl: null },
                    ],
                },
                select: { id: true, nomeNoivos: true, dataEvento: true, coverPhotoUrl: true, lightroomUrl: true },
                orderBy: { dataEvento: "asc" },
                take: 5,
            }),
        ]);
        res.json({
            stats: {
                totalEvents,
                totalOrders,
                totalRevenue: Number(totalRevenue._sum.valor ?? 0),
            },
            recentOrders,
            pendingEvents,
        });
    }
    catch (err) {
        console.error("getDashboardStats:", err);
        res.status(500).json({ error: "Erro ao carregar dashboard." });
    }
}
// ── EVENTOS ───────────────────────────────────────────
async function adminListEvents(req, res) {
    const { q, page = "1", status } = req.query;
    const take = 15;
    const skip = (Number(page) - 1) * take;
    try {
        const where = {};
        if (status === "active")
            where.active = true;
        if (status === "inactive")
            where.active = false;
        const searchString = q ? String(q) : undefined;
        if (searchString) {
            where.OR = [
                { nomeNoivos: { contains: searchString, mode: "insensitive" } },
                { location: { contains: searchString, mode: "insensitive" } },
            ];
        }
        const [events, total] = await Promise.all([
            prisma_1.default.event.findMany({
                where,
                include: {
                    cartorioUser: { select: { nome: true, cartorio: { select: { razaoSocial: true } } } },
                    captacao: { select: { nome: true } },
                    edicao: { select: { nome: true } },
                    _count: { select: { pedidos: true } },
                },
                orderBy: { dataEvento: "desc" },
                take,
                skip,
            }),
            prisma_1.default.event.count({ where }),
        ]);
        res.json({
            events: events.map(e => ({
                ...e,
                title: e.nomeNoivos,
                date: e.dataEvento,
                _count: { orders: e._count?.pedidos || 0 }
            })),
            total,
            page: Number(page),
            pages: Math.ceil(total / take)
        });
    }
    catch (err) {
        console.error("adminListEvents:", err);
        res.status(500).json({ error: "Erro ao listar eventos." });
    }
}
async function adminCreateEvent(req, res) {
    const { title, date, location, city, description, lightroomUrl, driveUrl, priceBase, priceEarly, cartorioId, captacaoId, edicaoId, temFoto, temVideo, temReels, temFotoImpressa, } = req.body;
    if (!title || !date || !location) {
        res.status(400).json({ error: "Título (Noivos), data e local são obrigatórios." });
        return;
    }
    try {
        // Gera slug único
        let slug = (0, utils_1.slugify)(`${title}-${new Date(date).getFullYear()}`);
        const exists = await prisma_1.default.event.findUnique({ where: { slug } });
        if (exists)
            slug = `${slug}-${Date.now().toString(36)}`;
        const event = await prisma_1.default.event.create({
            data: {
                nomeNoivos: title,
                slug,
                dataEvento: new Date(date),
                location, city,
                description,
                lightroomUrl: lightroomUrl || null,
                driveUrl: driveUrl || null,
                priceBase: priceBase ?? 200,
                priceEarly: priceEarly ?? 190,
                cartorioUserId: cartorioId || null,
                captacaoId: captacaoId || null,
                edicaoId: edicaoId || null,
                temFoto: temFoto ?? true,
                temVideo: temVideo ?? false,
                temReels: temReels ?? false,
                temFotoImpressa: temFotoImpressa ?? false,
            },
            include: {
                captacao: { select: { nome: true } },
                edicao: { select: { nome: true } },
            },
        });
        res.status(201).json(event);
    }
    catch (err) {
        if (err.code === "P2002") {
            res.status(409).json({ error: "Slug duplicado. Tente um título diferente." });
            return;
        }
        console.error("adminCreateEvent:", err);
        res.status(500).json({ error: "Erro ao criar evento." });
    }
}
async function adminUpdateEvent(req, res) {
    const { id } = req.params;
    const data = {};
    // Mapeamento de campos do body para o schema v4.0
    if (req.body.title)
        data.nomeNoivos = req.body.title;
    if (req.body.date)
        data.dataEvento = new Date(req.body.date);
    if (req.body.location)
        data.location = req.body.location;
    if (req.body.city)
        data.city = req.body.city;
    if (req.body.description)
        data.description = req.body.description;
    if (req.body.lightroomUrl !== undefined)
        data.lightroomUrl = req.body.lightroomUrl || null;
    if (req.body.driveUrl !== undefined)
        data.driveUrl = req.body.driveUrl || null;
    if (req.body.priceBase !== undefined)
        data.priceBase = Number(req.body.priceBase);
    if (req.body.priceEarly !== undefined)
        data.priceEarly = Number(req.body.priceEarly);
    if (req.body.cartorioId !== undefined)
        data.cartorioUserId = req.body.cartorioId || null;
    if (req.body.captacaoId !== undefined)
        data.captacaoId = req.body.captacaoId || null;
    if (req.body.edicaoId !== undefined)
        data.edicaoId = req.body.edicaoId || null;
    if (req.body.active !== undefined)
        data.active = req.body.active;
    if (req.body.temFoto !== undefined)
        data.temFoto = req.body.temFoto;
    if (req.body.temVideo !== undefined)
        data.temVideo = req.body.temVideo;
    if (req.body.temReels !== undefined)
        data.temReels = req.body.temReels;
    if (req.body.temFotoImpressa !== undefined)
        data.temFotoImpressa = req.body.temFotoImpressa;
    if (req.body.coverPhotoUrl !== undefined)
        data.coverPhotoUrl = req.body.coverPhotoUrl || null;
    try {
        const event = await prisma_1.default.event.update({
            where: { id: String(id) },
            data,
            include: {
                cartorioUser: { select: { cartorio: { select: { razaoSocial: true } } } },
                captacao: { select: { nome: true } },
                edicao: { select: { nome: true } },
                _count: { select: { pedidos: true } },
            },
        });
        res.json({
            ...event,
            title: event.nomeNoivos,
            date: event.dataEvento,
            _count: { orders: event._count?.pedidos || 0 }
        });
    }
    catch (err) {
        if (err.code === "P2025") {
            res.status(404).json({ error: "Evento não encontrado." });
            return;
        }
        console.error("adminUpdateEvent:", err);
        res.status(500).json({ error: "Erro ao atualizar evento." });
    }
}
async function adminDeleteEvent(req, res) {
    try {
        await prisma_1.default.event.update({
            where: { id: String(req.params.id) },
            data: { active: false },
        });
        res.json({ ok: true });
    }
    catch {
        res.status(500).json({ error: "Erro ao desativar evento." });
    }
}
// ── USUÁRIOS / PROFISSIONAIS ──────────────────────────
async function adminListUsers(req, res) {
    const { role, q } = req.query;
    try {
        const where = {};
        if (role)
            where.role = String(role);
        if (q) {
            const searchString = String(q);
            where.OR = [
                { nome: { contains: searchString, mode: "insensitive" } },
                { email: { contains: searchString, mode: "insensitive" } },
            ];
        }
        const users = await prisma_1.default.user.findMany({
            where,
            select: {
                id: true, nome: true, email: true, role: true, active: true, createdAt: true,
                profissional: {
                    select: { id: true, services: true, cameras: true, captPct: true, editPct: true },
                },
                cartorio: { select: { id: true, razaoSocial: true } },
            },
            orderBy: { createdAt: "desc" },
        });
        res.json(users.map(u => ({
            ...u,
            name: u.nome,
            _count: { events: 0 }
        })));
    }
    catch (err) {
        console.error("adminListUsers:", err);
        res.status(500).json({ error: "Erro ao listar usuários." });
    }
}
async function adminCreateUser(req, res) {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
        res.status(400).json({ error: "Todos os campos são obrigatórios." });
        return;
    }
    try {
        const exists = await prisma_1.default.user.findUnique({ where: { email } });
        if (exists) {
            res.status(409).json({ error: "E-mail já cadastrado." });
            return;
        }
        const hash = await bcryptjs_1.default.hash(password, 12);
        const user = await prisma_1.default.user.create({
            data: { nome: name, email, senha: hash, role },
        });
        // Cria perfil de profissional automaticamente
        if (role === "PROFISSIONAL") {
            await prisma_1.default.profissional.create({
                data: { userId: user.id, services: [], cameras: [], lenses: [], lighting: [] },
            });
        }
        res.status(201).json({
            id: user.id, name: user.nome, email: user.email, role: user.role,
        });
    }
    catch (err) {
        console.error("adminCreateUser:", err);
        res.status(500).json({ error: "Erro ao criar usuário." });
    }
}
async function adminUpdateUser(req, res) {
    const { id } = req.params;
    const { name, role, active, captPct, editPct } = req.body;
    try {
        await prisma_1.default.user.update({
            where: { id: String(id) },
            data: {
                ...(name && { nome: name }),
                ...(role && { role }),
                ...(active !== undefined && { active }),
            },
        });
        // Atualiza percentuais do profissional se enviados
        if ((captPct !== undefined || editPct !== undefined)) {
            await prisma_1.default.profissional.update({
                where: { userId: String(id) },
                data: {
                    ...(captPct !== undefined && { captPct }),
                    ...(editPct !== undefined && { editPct }),
                },
            });
        }
        res.json({ ok: true });
    }
    catch {
        res.status(500).json({ error: "Erro ao atualizar usuário." });
    }
}
// ── PEDIDOS ───────────────────────────────────────────
async function adminListOrders(req, res) {
    const { status, page = "1", q } = req.query;
    const take = 20;
    const skip = (Number(page) - 1) * take;
    try {
        const where = {};
        if (status)
            where.status = String(status);
        if (q) {
            const searchString = String(q);
            where.OR = [
                { buyerEmail: { contains: searchString, mode: "insensitive" } },
                { event: { nomeNoivos: { contains: searchString, mode: "insensitive" } } },
            ];
        }
        const [orders, total] = await Promise.all([
            prisma_1.default.order.findMany({
                where,
                include: {
                    event: { select: { nomeNoivos: true, slug: true } },
                    cliente: { select: { nome: true, email: true } },
                },
                orderBy: { createdAt: "desc" },
                take,
                skip,
            }),
            prisma_1.default.order.count({ where }),
        ]);
        res.json({
            orders: orders.map(o => ({ ...o, amount: o.valor, user: o.cliente, event: { title: o.event.nomeNoivos, slug: o.event.slug } })),
            total, page: Number(page), pages: Math.ceil(total / take)
        });
    }
    catch (err) {
        console.error("adminListOrders:", err);
        res.status(500).json({ error: "Erro ao listar pedidos." });
    }
}
// ── LEGACY COMPATIBILITY ──────────────────────────────
class AdminEventController {
}
exports.AdminEventController = AdminEventController;
_a = AdminEventController;
AdminEventController.cartorioStats = async (req, res) => {
    try {
        const { cartorioName } = req.query;
        const cName = cartorioName ? String(cartorioName) : undefined;
        const events = await prisma_1.default.event.findMany({
            where: cName ? { cartorio: cName } : {},
            include: { pedidos: { where: { status: "APROVADO" } } },
            orderBy: { dataEvento: "desc" },
        });
        res.json({ eventos: events });
    }
    catch {
        res.status(500).json({ error: "Erro ao carregar dados do cartório." });
    }
};
