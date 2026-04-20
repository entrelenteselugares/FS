
require('dotenv').config();
const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL.replace('?pgbouncer=true', ''),
  });
  await client.connect();
  const res = await client.query('SELECT "coverPhotoUrl" FROM events WHERE "coverPhotoUrl" LIKE \'%supabase%\'');
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}

main().catch(console.error);
