const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixUser(email, pass) {
  const { data: listUsers, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) { console.error("Error listing users:", listError.message); return; }

  const user = listUsers.users.find(u => u.email === email);
  if (user) {
    console.log(`User ${email} found with ID: ${user.id}. Resetting password to: ${pass}`);
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      password: pass
    });
    if (updateError) console.error("Error updating password:", updateError.message);
    else console.log(`Password for ${email} reset successfully.`);
  } else {
    console.log(`User ${email} NOT found in Supabase Auth. Creating...`);
    const { data: createData, error: createError } = await supabase.auth.admin.createUser({
      email: email,
      password: pass,
      email_confirm: true,
      user_metadata: { nome: "Usuário Teste", role: "PROFISSIONAL" }
    });
    if (createError) console.error("Error creating user:", createError.message);
    else console.log(`User ${email} created successfully.`);
  }
}

fixUser('foto@teste.com', '123456');
