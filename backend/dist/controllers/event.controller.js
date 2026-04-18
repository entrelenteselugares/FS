"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventController = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
class EventController {
    /**
     * GET /api/public/events/:id/access
     * Libera links sensíveis se o pagamento estiver aprovado.
     */
    static async getAccess(req, res) {
        try {
            const { id } = req.params;
            const { orderId } = req.query;
            if (!orderId) {
                return res.status(400).json({ error: "ID do pedido é obrigatório" });
            }
            const order = await prisma_1.default.order.findUnique({
                where: { id: orderId },
                include: { event: true }
            });
            if (!order || order.eventId !== id || order.status !== "APROVADO") {
                return res.status(403).json({ error: "Acesso ainda não liberado. Aguardando processamento." });
            }
            return res.json({
                lightroomUrl: order.event.lightroomUrl,
                driveUrl: order.event.driveUrl,
                eventTitle: order.event.nomeNoivos
            });
        }
        catch (error) {
            console.error("Erro ao verificar acesso:", error);
            return res.status(500).json({ error: "Erro interno ao processar acesso." });
        }
    }
    /**
     * GET /api/events/:id
     * Lógica de Pivot: Retorna URLs de entrega baseando-se no acesso.
     */
    static async getById(req, res) {
        const { id } = req.params;
        const { userId } = req.query;
        // EVENTO MOCK PARA TESTES DO PIVOT (Independente do Prisma)
        const mockEvent = {
            id: "test-premium-event",
            nomeNoivos: "Ana & João - Pivot",
            dataEvento: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
            cartorio: "Cartório Central",
            coverPhotoUrl: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1200",
            lightroomUrl: "https://lightroom.adobe.com/gallery/test-album",
            driveUrl: "https://drive.google.com/drive/folders/test-videos",
            temFoto: true,
            paywall: { active: true, message: "Acesso Protegido" }
        };
        try {
            // Tentar buscar no banco
            const event = await prisma_1.default.event.findUnique({
                where: { id: id }
            }).catch(() => null);
            const targetEvent = id === "test-premium-event" ? mockEvent : event;
            if (!targetEvent) {
                return res.status(404).json({ error: "Evento não encontrado" });
            }
            const isPaid = req.app.locals.MOCK_PAID || false;
            const order = await prisma_1.default.order.findFirst({
                where: { eventId: id, clienteId: userId, status: "APROVADO" }
            }).catch(() => null);
            const hasAccess = isPaid || !!order;
            // No Pivot, não retornamos mídias individuais, mas sim os links de entrega
            return res.json({
                id: targetEvent.id,
                nomeNoivos: targetEvent.nomeNoivos,
                dataEvento: targetEvent.dataEvento,
                cartorio: targetEvent.cartorio,
                coverPhotoUrl: targetEvent.coverPhotoUrl,
                priceBase: targetEvent.priceBase,
                priceEarly: targetEvent.priceEarly,
                // Links sensíveis só aparecem se aprovado
                lightroomUrl: hasAccess ? targetEvent.lightroomUrl : null,
                driveUrl: hasAccess ? targetEvent.driveUrl : null,
                paywall: {
                    active: !hasAccess,
                    message: hasAccess ? "Entrega liberada via links externos." : "Galeria protegida."
                }
            });
        }
        catch (error) {
            console.error("Erro ao buscar evento:", error);
            return res.status(500).json({ error: "Erro interno do servidor" });
        }
    }
    /**
     * GET /api/public/events
     * Lista eventos para a vitrine pública com suporte a busca robusta e paginação real.
     */
    static async listPublic(req, res) {
        try {
            const { q, page = "1" } = req.query;
            const query = q;
            const take = 20;
            const skip = (Number(page) - 1) * take;
            const term = query ? `%${query.toLowerCase()}%` : "%";
            // 1. Busca os eventos com SQL Nativo para máxima estabilidade (contornando Case-Sensitivity)
            const events = await prisma_1.default.$queryRaw `
        SELECT 
          id, 
          "nomeNoivos", 
          "dataEvento", 
          cartorio, 
          "coverPhotoUrl",
          "priceBase",
          "priceEarly",
          true as "temFoto" -- Ativando badges por padrão para estética
        FROM events
        WHERE (LOWER("nomeNoivos") LIKE ${term} OR LOWER(cartorio) LIKE ${term})
        ORDER BY "dataEvento" DESC
        LIMIT ${take} OFFSET ${skip}
      `;
            // 2. Busca o total para cálculo de páginas
            const countResult = await prisma_1.default.$queryRaw `
        SELECT COUNT(*)::int as count FROM events
        WHERE (LOWER("nomeNoivos") LIKE ${term} OR LOWER(cartorio) LIKE ${term})
      `;
            const total = countResult[0].count;
            const pages = Math.ceil(total / take);
            return res.json({
                events,
                total,
                page: Number(page),
                pages
            });
        }
        catch (error) {
            console.error("Erro ao listar eventos públicos:", error);
            return res.status(500).json({ error: "Erro ao carregar vitrine", details: error.message });
        }
    }
}
exports.EventController = EventController;
