import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

async function promote() {
    const email = 'entrelenteselugares@gmail.com';
    try {
        const user = await prisma.user.update({
            where: { email },
            data: { role: 'ADMIN' }
        });
        console.log(`✅ Sucesso: O usuário ${user.email} agora é ADMIN.`);
    } catch (error) {
        console.error(`❌ Erro: Não foi possível encontrar o usuário ${email}.`);
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

promote();
