const https = require('https');

const routes = [
  '/',
  '/login',
  '/registro',
  '/register',
  '/cotacao',
  '/negocios',
  '/clube',
  '/ajuda',
  '/phygital-capture',
  '/admin/configs',
  '/admin/growth',
  '/admin/ambassadors'
];

async function checkRoute(route) {
  return new Promise((resolve) => {
    https.get(`https://foto-segundo.vercel.app${route}`, (res) => {
      resolve({ route, status: res.statusCode });
    }).on('error', (e) => {
      resolve({ route, status: 'ERROR', error: e.message });
    });
  });
}

async function run() {
  console.log("Iniciando auditoria de rotas da vitrine e painel...");
  for (const route of routes) {
    const result = await checkRoute(route);
    console.log(`[${result.status}] https://foto-segundo.vercel.app${route}`);
  }
}

run();
