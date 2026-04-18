"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const prisma_1 = __importDefault(require("./lib/prisma"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
async function main() {
    console.log("🌱 Iniciando Seed do Foto Segundo...");
    const hash = await bcryptjs_1.default.hash("foto2025", 12);
    const admin = await prisma_1.default.user.upsert({
        where: { email: "entrelenteselugares@gmail.com" },
        update: {},
        create: {
            email: "entrelenteselugares@gmail.com",
            senha: hash,
            nome: "Admin Foto Segundo",
            role: "ADMIN",
            whatsapp: "11999999999",
        },
    });
    console.log("✅ Usuário Admin criado:", admin.email);
    // Criar um evento de exemplo para o painel não vir vazio
    const sampleEvent = await prisma_1.default.event.create({
        data: {
            nomeNoivos: "Exemplo: Julia & Ricardo",
            dataEvento: new Date("2026-12-31"),
            cartorio: "1º Cartório de Registro Civil",
            lightroomUrl: "https://lightroom.adobe.com/sample",
            driveUrl: "https://drive.google.com/sample",
            coverPhotoUrl: "https://images.unsplash.com/photo-1519741497674-611481863552",
        }
    });
    console.log("✅ Evento de Exemplo criado:", sampleEvent.nomeNoivos);
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma_1.default.$disconnect();
});
