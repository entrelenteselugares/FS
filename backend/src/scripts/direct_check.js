const { Client } = require('pg');
require('dotenv').config({ path: '../../.env' });

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Conectado ao Postgres com sucesso.");
    
    const res = await client.query("SELECT id, nome, email, role, active FROM users WHERE role = 'CARTORIO' OR role = 'UNIDADE'");
    
    if (res.rows.length === 0) {
      console.log("Nenhuma Unidade Fixa encontrada no banco.");
    } else {
      console.table(res.rows);
    }
  } catch (err) {
    console.error("Erro na conexão direta:", err);
  } finally {
    await client.end();
  }
}

main();
