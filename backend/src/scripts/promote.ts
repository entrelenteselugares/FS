import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

async function ensureAdmin() {
    const email = 'contatofotosegundo@gmail.com';
    const nome = 'Admin Foto Segundo';
    
    try {
        console.log(`🔍 Verificando usuário: ${email}...`);
        
        const existing = await prisma.user.findUnique({ where: { email } });
        
        if (existing) {
            console.log(`⚡ Usuário encontrado. Promovendo a ADMIN...`);
            await prisma.user.update({
                where: { email },
                data: { role: 'ADMIN', active: true }
            });
        } else {
            console.log(`➕ Usuário não encontrado no banco de dados local. Criando registro ADMIN...`);
            // Criamos com senha vazia para forçar o login via Supabase Auth
            await prisma.user.create({
                data: {
                    email,
                    nome,
                    senha: "", 
                    role: 'ADMIN',
                    active: true
                }
            });
        }
        
        console.log(`✅ Sucesso! O usuário ${email} agora tem acesso total como ADMIN.`);
    } catch (error) {
        console.error(`❌ Erro ao processar o admin:`, error);
    } finally {
        await prisma.$disconnect();
    }
}

ensureAdmin();
