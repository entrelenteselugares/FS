
require('dotenv').config();
const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL.replace('?pgbouncer=true', ''),
  });
  await client.connect();
  const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
  console.log('Tables in public schema:');
  res.rows.forEach(r => console.log(`- ${r.table_name}`));
  await client.end();
}

main().catch(console.error);
