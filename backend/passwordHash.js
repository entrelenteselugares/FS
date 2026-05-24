require('dotenv').config();
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect().then(async () => {
  try {
    const passwordHash = await bcrypt.hash('123456', 10);
    const res = await client.query(`UPDATE "users" SET "passwordHash" = $1 WHERE email = 'mobile-hibrido@brasil.com.br'`, [passwordHash]);
    console.log('Rows updated:', res.rowCount);
  } catch(e) {
    console.error(e);
  } finally {
    client.end();
  }
});
