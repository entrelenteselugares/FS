"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMeusEventos = getMeusEventos;
exports.updateEventLinks = updateEventLinks;
exports.uploadEventCover = uploadEventCover;
const prisma_1 = __importDefault(require("../lib/prisma"));
const supabase_js_1 = require("@supabase/supabase-js");
// Inicializa o cliente Supabase para Storage (Stateless)
const supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
// GET /api/profissional/events — eventos atribuídos ao profissional logado
async function getMeusEventos(req, res) {
    const userId = req.user?.userId;
    if (!userId) {
        res.status(401).json({ error: "Não autenticado." });
        return;
    }
    try {
        const events = await prisma_1.default.event.findMany({
            where: {
                OR: [
                    { captacaoId: userId },
                    { edicaoId: userId },
                ],
            },
            select: {
                id: true,
                nomeNoivos: true,
                dataEvento: true,
                cartorio: true,
                coverPhotoUrl: true,
                lightroomUrl: true,
                driveUrl: true,
                _count: { select: { pedidos: true } },
            },
            orderBy: { dataEvento: "desc" },
        });
        res.json(events);
    }
    catch (err) {
        console.error("getMeusEventos:", err);
        res.status(500).json({ error: "Erro ao buscar eventos." });
    }
}
// PATCH /api/profissional/events/:id/links — atualiza lightroomUrl e driveUrl
async function updateEventLinks(req, res) {
    const { id } = req.params;
    const { lightroomUrl, driveUrl } = req.body;
    const userId = req.user?.userId;
    if (!userId) {
        res.status(401).json({ error: "Não autenticado." });
        return;
    }
    try {
        // Garante que o evento pertence a este profissional
        const event = await prisma_1.default.event.findFirst({
            where: {
                id: String(id),
                OR: [{ captacaoId: userId }, { edicaoId: userId }],
            },
        });
        if (!event) {
            res.status(403).json({ error: "Acesso negado a este evento." });
            return;
        }
        // Valida URLs
        const urlPattern = /^https?:\/\/.+/;
        if (lightroomUrl && !urlPattern.test(String(lightroomUrl))) {
            res.status(400).json({ error: "URL inválida para o campo Lightroom/Portfolio." });
            return;
        }
        if (driveUrl && !urlPattern.test(String(driveUrl))) {
            res.status(400).json({ error: "URL inválida para o Google Drive." });
            return;
        }
        const updated = await prisma_1.default.event.update({
            where: { id: String(id) },
            data: {
                ...(lightroomUrl !== undefined && { lightroomUrl: String(lightroomUrl) || null }),
                ...(driveUrl !== undefined && { driveUrl: String(driveUrl) || null }),
            },
        });
        res.json(updated);
    }
    catch (err) {
        console.error("updateEventLinks:", err);
        res.status(500).json({ error: "Erro ao atualizar links." });
    }
}
// PATCH /api/profissional/events/:id/cover — upload da foto de capa (BASE64)
async function uploadEventCover(req, res) {
    const { id } = req.params;
    const userId = req.user?.userId;
    if (!userId) {
        res.status(401).json({ error: "Não autenticado." });
        return;
    }
    // Recebe base64 do frontend em vez de multipart
    const { imageBase64, mimeType } = req.body;
    if (!imageBase64 || !mimeType) {
        res.status(400).json({ error: "Imagem e MimeType são obrigatórios." });
        return;
    }
    try {
        const event = await prisma_1.default.event.findFirst({
            where: {
                id: String(id),
                OR: [{ captacaoId: userId }, { edicaoId: userId }],
            },
        });
        if (!event) {
            res.status(403).json({ error: "Acesso negado ao arquivo." });
            return;
        }
        // Converte base64 para buffer
        const base64Data = String(imageBase64).replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");
        const ext = String(mimeType).split("/")[1] || "jpg";
        const fileName = `covers/${id}-${Date.now()}.${ext}`;
        // Upload para o Supabase Storage (Bucket: eventos)
        const { error: uploadError } = await supabase.storage
            .from("eventos")
            .upload(fileName, buffer, {
            contentType: String(mimeType),
            upsert: true,
        });
        if (uploadError)
            throw uploadError;
        // Obtém a URL pública final
        const { data: { publicUrl } } = supabase.storage
            .from("eventos")
            .getPublicUrl(fileName);
        const updated = await prisma_1.default.event.update({
            where: { id: String(id) },
            data: { coverPhotoUrl: publicUrl },
            select: { id: true, coverPhotoUrl: true },
        });
        res.json(updated);
    }
    catch (err) {
        console.error("uploadEventCover:", err);
        res.status(500).json({ error: "Erro ao sincronizar capa no Cloud Storage." });
    }
}
