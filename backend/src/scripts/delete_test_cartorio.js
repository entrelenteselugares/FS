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
    
    // Deletar da tabela dependente primeiro
    await client.query('DELETE FROM cartorios WHERE "userId" = \'c08bc652-5d96-4155-af54-d77f95df9d27\'');
    console.log("Perfil deletado.");
    
    // Deletar o usuário
    await client.query('DELETE FROM users WHERE id = \'c08bc652-5d96-4155-af54-d77f95df9d27\'');
    console.log("Usuário deletado.");

  } catch (err) {
    console.error("Erro ao deletar:", err);
  } finally {
    await client.end();
  }
}

main();
