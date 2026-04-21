const { Client } = require('pg');
require('dotenv').config({ path: 'backend/.env' });

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Conectado ao Postgres.");
    
    console.log("--- LISTANDO TODAS AS UNIDADES FIXAS (role=CARTORIO) ---");
    const res = await client.query('SELECT u.id, u.nome, u.email, c."razaoSocial" FROM users u LEFT JOIN cartorios c ON u.id = c."userId" WHERE u.role = \'CARTORIO\'');
    console.table(res.rows);

  } catch (err) {
    console.error("Erro:", err);
  } finally {
    await client.end();
  }
}

main();
