import axios from 'axios';

const BASE_URL = 'http://localhost:3001/api';
const TOKEN = 'SEU_TOKEN_AQUI'; // Eu precisaria de um token real de teste

async function testProfilePhoto() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/profile-photo`, {
      imageBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
      mimeType: 'image/png'
    }, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    console.log('Profile Photo Upload Success:', response.data);
  } catch (err: any) {
    console.error('Profile Photo Upload Failed:', err.response?.data || err.message);
  }
}

async function testApplyRole() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/apply-role`, {
      role: 'PROFISSIONAL',
      equipment: 'Canon R5 + 24-70mm'
    }, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    console.log('Apply Role Success:', response.data);
  } catch (err: any) {
    console.error('Apply Role Failed:', err.response?.data || err.message);
  }
}

// Para rodar este teste, eu precisaria logar primeiro.
// Como não tenho a senha do admin master (só o hash), vou pular o teste real via axios por enquanto 
// ou usar o admin restored script para gerar um usuário de teste.
