const fetch = require('node-fetch');

(async () => {
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'unidade-sp@brasil.com.br', senha: '123456' })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;

  const patchRes = await fetch('http://localhost:3000/api/unidade-fixa/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ pixKey: 'test@pix' })
  });
  console.log(await patchRes.text());
})();
