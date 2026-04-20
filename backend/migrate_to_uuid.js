
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');
const crypto = require('crypto');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const pg = new Client({ connectionString: process.env.DATABASE_URL.replace('?pgbouncer=true','') });

async function main() {
  await pg.connect();
  
  const email = 'editor@teste.com';
  const pass = '123456';
  const role = 'PROFISSIONAL';
  const newId = crypto.randomUUID();
  
  console.log(`Starting migration for ${email} to new ID: ${newId}`);

  // 1. Get old ID
  const oldRes = await pg.query('SELECT id FROM users WHERE email = $1', [email]);
  if (oldRes.rows.length === 0) {
    console.log('User not found in DB.');
    return;
  }
  const oldId = oldRes.rows[0].id;
  console.log(`Old CUID: ${oldId}`);

  // 2. Create in Supabase
  const { data, error } = await supabase.auth.admin.createUser({
    id: newId,
    email: email,
    password: pass,
    email_confirm: true,
    user_metadata: { nome: 'Editor Teste', role: role }
  });

  if (error) {
    console.error('Supabase error:', error.message);
    if (!error.message.includes('already exists')) {
        await pg.end();
        return;
    }
  } else {
    console.log('Supabase user created.');
  }

  // 3. Update DB within a transaction
  try {
    await pg.query('BEGIN');
    
    // Disable constraints just in case or just follow order
    // But since it's Postgres, we can just update the main one if we have ON UPDATE CASCADE, 
    // but Prisma doesn't always set that up by default.
    
    // We'll update the dependents first by pointing them to a temp state or just update them all
    await pg.query('UPDATE profissionais SET "userId" = $1 WHERE "userId" = $2', [newId, oldId]);
    await pg.query('UPDATE cartorios SET "userId" = $1 WHERE "userId" = $2', [newId, oldId]);
    await pg.query('UPDATE photo_likes SET "userId" = $1 WHERE "userId" = $2', [newId, oldId]);
    await pg.query('UPDATE user_points SET "userId" = $1 WHERE "userId" = $2', [newId, oldId]);
    await pg.query('UPDATE print_redemptions SET "userId" = $1 WHERE "userId" = $2', [newId, oldId]);
    
    await pg.query('UPDATE users SET id = $1, senha = \'AUTH_EXTERNAL_SUPABASE\' WHERE id = $2', [newId, oldId]);
    
    await pg.query('COMMIT');
    console.log('Database IDs migrated successfully.');
  } catch (e) {
    await pg.query('ROLLBACK');
    console.error('Transaction failed:', e.message);
  } finally {
    await pg.end();
  }
}

main().catch(console.error);
