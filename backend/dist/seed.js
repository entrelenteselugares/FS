"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log("🌱 Iniciando Seed de Teste...");
    // 1. Criar Evento de Teste
    const eventDate = new Date();
    eventDate.setDate(eventDate.getDate() + 7); // Daqui a 7 dias (Pré-venda)
    const event = await prisma.event.create({
        data: {
            nomeNoivos: "Ana & João - Teste Premium",
            dataEvento: eventDate,
            cartorio: "Cartório Central de São Paulo",
            temFoto: true,
            temFotoImpressa: true,
        },
    });
    console.log(`✅ Evento criado: ${event.id}`);
    // 2. Criar Mídias (1 Capa + 3 protegidas)
    await prisma.mediaFile.createMany({
        data: [
            {
                url: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=1200",
                tipo: "FOTO",
                isCoverPhoto: true,
                eventId: event.id,
            },
            {
                url: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800",
                tipo: "FOTO",
                isCoverPhoto: false,
                eventId: event.id,
            },
            {
                url: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&q=80&w=800",
                tipo: "FOTO",
                isCoverPhoto: false,
                eventId: event.id,
            },
        ],
    });
    console.log("💎 Mídias de teste inseridas.");
    console.log(`\n🚀 URL para teste: http://localhost:5173/eventos/${event.id}`);
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
