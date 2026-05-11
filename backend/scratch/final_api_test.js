
const axios = require('axios');
const API_URL = 'https://fs-backend-r23lkvfxa-fotosegundo.vercel.app/api';

async function testApiOnboarding() {
  const role = 'CLIENTE';
  const email = 'test_final_' + Date.now() + '@teste.com.br';
  try {
    console.log('[API TEST] Registrando ' + role + ': ' + email);
    const res = await axios.post(API_URL + '/auth/register', {
      nome: 'ROBO FINAL TEST',
      email: email,
      senha: 'Senha123!',
      whatsapp: '11999999999',
      role: role,
      acceptedTerms: true,
      acceptedPrivacy: true
    });
    console.log('[API TEST] ✅ SUCESSO! Token recebido.');
    process.exit(0);
  } catch (err) {
    console.error('[API TEST] ❌ FALHA:', err.response?.data || err.message);
    process.exit(1);
  }
}
testApiOnboarding();
