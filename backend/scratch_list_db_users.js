
require('dotenv').config();
const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL.replace('?pgbouncer=true', ''),
  });
  await client.connect();
  console.log('Connected to DB');
  
  const res = await client.query('SELECT id, email, role FROM public."User"');
  console.log('Users in Database (Prisma Table):');
  res.rows.forEach(r => console.log(`- ${r.email} (${r.role}) ID: ${r.id}`));
  
  await client.end();
}

main().catch(console.error);
