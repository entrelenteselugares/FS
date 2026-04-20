
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const pg = new Client({ connectionString: process.env.DATABASE_URL.replace('?pgbouncer=true','') });

async function main() {
  await pg.connect();
  
  const email = 'editor@teste.com';
  const pass = '123456';
  const role = 'PROFISSIONAL';
  const userId = 'cmo3mcs4t0000vzpss7rxctmx';
  
  console.log(`Syncing user: ${email} to Supabase...`);
  
  // 1. Create in Supabase with specific ID
  const { data, error } = await supabase.auth.admin.createUser({
    id: userId,
    email: email,
    password: pass,
    email_confirm: true,
    user_metadata: { nome: 'Editor Teste', role: role }
  });
  
  if (error) {
    console.error('Error creating user in Supabase:', error.message);
    if (error.message.includes('already exists')) {
        console.log('User already exists in Supabase, just resetting password...');
        await supabase.auth.admin.updateUserById(userId, { password: pass });
    }
  } else {
    console.log('User created in Supabase successfully!');
  }
  
  // 2. Ensure password in DB reflects that it's a Supabase-external account
  // (In our auth controller, we actually ignore the local password when logging in via Supabase)
  await pg.query("UPDATE users SET senha = 'AUTH_EXTERNAL_SUPABASE' WHERE id = $1", [userId]);
  console.log('Local DB updated.');
  
  await pg.end();
}

main().catch(console.error);
