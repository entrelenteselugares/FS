import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  await pool.query(`UPDATE users SET "discoverySource" = 'TEST' WHERE email IN ('fotografo@brasil.com.br', 'unidade-sp@brasil.com.br', 'cliente-vip@brasil.com.br', 'franqueado-ouro@brasil.com.br')`);
  console.log('Users updated');
  await pool.end();
}
main();
