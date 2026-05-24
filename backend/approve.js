require('dotenv').config();
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect().then(async () => {
  try {
    const passwordHash = await bcrypt.hash('123456', 10);
    const resUser = await client.query(`UPDATE "users" SET "senha" = $1 WHERE email = 'test@fotosegundo.com'`, [passwordHash]);
    const resPro = await client.query(`UPDATE "profissionais" SET status = 'ACCEPTED' WHERE "userId" = (SELECT id FROM "users" WHERE email = 'test@fotosegundo.com')`);
    console.log('User updated:', resUser.rowCount, 'Pro updated:', resPro.rowCount);
  } catch(e) {
    console.error(e);
  } finally {
    client.end();
  }
});
