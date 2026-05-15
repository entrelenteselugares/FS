import axios from 'axios';
import { prisma } from '../src/lib/prisma';

const API_URL = 'http://localhost:5173/api'; // O frontend proxy redireciona /api para o backend

async function runTest() {
  console.log('🚀 Iniciando Teste de Integração - Fase 42');

  const testEmail = `test_express_${Date.now()}@example.com`;
  const testPassword = 'Password123!';

  try {
    // 1. Teste de Registro Expresso
    console.log('\nStep 1: Testando Registro Expresso...');
    const BACKEND_URL = 'http://127.0.0.1:3002/api'; 
    
    const regRes = await axios.post(`${BACKEND_URL}/auth/register-express`, {
      email: testEmail,
      senha: testPassword,
      nome: 'Test User Phase 42'
    });

    if (regRes.status === 201) {
      console.log('✅ Registro Expresso: SUCESSO');
      console.log('👤 Usuário Criado:', regRes.data.user.id);
    }

    const token = regRes.data.token;
    const authHeaders = { Authorization: `Bearer ${token}` };

    // 2. Teste de Completar Perfil e Gatilho de Recompensa
    console.log('\nStep 2: Testando Completar Perfil (Trigger Recompensa)...');
    const updateRes = await axios.patch(`${BACKEND_URL}/auth/me`, {
      whatsapp: '11999999999',
      address: 'Rua de Teste, 123, São Paulo - SP'
    }, { headers: authHeaders });

    if (updateRes.data.profileComplete === true) {
      console.log('✅ Flag profileComplete: SUCESSO (Marcada como true)');
    } else {
      console.error('❌ Flag profileComplete: FALHA (Ainda está false)');
    }

    // 3. Verificar se o Cupom foi criado no banco
    console.log('\nStep 3: Verificando Geração de Cupom...');
    const userId = regRes.data.user.id;
    const coupon = await prisma.coupon.findFirst({
      where: { code: { contains: userId.slice(0, 5).toUpperCase() } }
    });

    if (coupon) {
      console.log('✅ Cupom Gerado:', coupon.code);
      console.log('💰 Valor:', coupon.discountAbs);
    } else {
      console.error('❌ Cupom não encontrado no banco de dados.');
    }

    // Limpeza (Opcional - mas vamos manter para auditoria)
    // await prisma.user.delete({ where: { id: userId } });

  } catch (error: any) {
    console.error('❌ Erro durante o teste:', error.response?.data || error.message);
  } finally {
    await prisma.$disconnect();
  }
}

runTest();
