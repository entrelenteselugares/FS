"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("../lib/prisma"));
async function main() {
    const email = 'entrelenteselugares@gmail.com';
    console.log(`Tentando promover o usuário: ${email}`);
    try {
        const updatedUser = await prisma_1.default.user.update({
            where: { email },
            data: { role: 'ADMIN' },
        });
        console.log(`✅ SUCESSO! Usuário ${updatedUser.email} agora é ${updatedUser.role}.`);
    }
    catch (error) {
        if (error.code === 'P2025') {
            console.error(`❌ ERRO: Usuário com e-mail ${email} não encontrado.`);
        }
        else {
            console.error('❌ ERRO inesperado:', error.message);
        }
    }
    finally {
        await prisma_1.default.$disconnect();
    }
}
main();
