
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Connecting to:', supabaseUrl);
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error('Error fetching users:', error);
    return;
  }
  const users = data.users;
  console.log('Total users in Supabase:', users.length);
  const editor = users.find(u => u.email.toLowerCase().includes('editor'));
  if (editor) {
    console.log('Found user:', editor.email, 'ID:', editor.id);
    console.log('Metadata:', JSON.stringify(editor.user_metadata, null, 2));
  } else {
    console.log('User editor@teste.com not found in Supabase Auth.');
  }
}

main();
