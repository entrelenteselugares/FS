"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const globalForPrisma = global;
/**
 * Cria uma instância padrão do Prisma Client.
 * O Prisma 6+ já lida muito bem com serverless se a URL estiver correta.
 */
function createPrismaClient() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error("[CRITICAL] DATABASE_URL não encontrada!");
        return null;
    }
    try {
        console.log("[DB] Inicializando Prisma Client Nativo...");
        return new client_1.PrismaClient({
            log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
        });
    }
    catch (err) {
        console.error("[DB BOOTSTRAP ERROR]:", err);
        return null;
    }
}
exports.prisma = new Proxy({}, {
    get: (target, prop) => {
        if (!globalForPrisma.prisma) {
            globalForPrisma.prisma = createPrismaClient();
        }
        if (!globalForPrisma.prisma) {
            throw new Error("DATABASE_URL_NOT_CONFIGURED: Verifique as variáveis no Vercel.");
        }
        return globalForPrisma.prisma[prop];
    }
});
exports.default = exports.prisma;
