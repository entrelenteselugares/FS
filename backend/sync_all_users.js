
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const pg = new Client({ connectionString: process.env.DATABASE_URL.replace('?pgbouncer=true','') });

async function main() {
  await pg.connect();
  
  // 1. List all Supabase users
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  if (error) throw error;
  
  console.log(`Found ${users.length} users in Supabase.`);

  for (const sUser of users) {
    const email = sUser.email.toLowerCase().trim();
    const newId = sUser.id;
    
    // Check if this email exists in Prisma
    const oldRes = await pg.query('SELECT id FROM users WHERE email = $1', [email]);
    if (oldRes.rows.length === 0) {
      console.log(`[SYNC] ${email} - Not found in local DB. Skipping.`);
      continue;
    }
    
    const oldId = oldRes.rows[0].id;
    if (oldId === newId) {
      console.log(`[SYNC] ${email} - Already synced.`);
      continue;
    }
    
    console.log(`[SYNC] ${email} - Migrating ${oldId} -> ${newId}`);
    
    try {
      await pg.query('BEGIN');
      
      // Dependents
      await pg.query('UPDATE profissionais SET "userId" = $1 WHERE "userId" = $2', [newId, oldId]);
      await pg.query('UPDATE cartorios SET "userId" = $1 WHERE "userId" = $2', [newId, oldId]);
      await pg.query('UPDATE photo_likes SET "userId" = $1 WHERE "userId" = $2', [newId, oldId]);
      await pg.query('UPDATE user_points SET "userId" = $1 WHERE "userId" = $2', [newId, oldId]);
      await pg.query('UPDATE print_redemptions SET "userId" = $1 WHERE "userId" = $2', [newId, oldId]);
      
      // Event association (sometimes used in cartorio logic)
      // Check schema if any table uses cartorioId or similar that might map to userId (usually not directly if it points to cartorios table)
      
      await pg.query('UPDATE users SET id = $1, senha = \'AUTH_EXTERNAL_SUPABASE\' WHERE id = $2', [newId, oldId]);
      
      await pg.query('COMMIT');
      console.log(`[SYNC] ${email} - Success.`);
    } catch (e) {
      await pg.query('ROLLBACK');
      console.error(`[SYNC] ${email} - Failed:`, e.message);
    }
  }
  
  await pg.end();
}

main().catch(console.error);
