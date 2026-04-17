"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventController = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
class EventController {
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
                where: { id }
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
}
exports.EventController = EventController;
