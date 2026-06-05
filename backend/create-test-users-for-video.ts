import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function createAndApproveUser(email: string, role: string, nome: string) {
  // 1. Auth Create
  const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: 'Password123!',
    email_confirm: true
  });
  if (authErr) {
    if (authErr.message.includes('already registered')) {
       console.log(`User ${email} already exists.`);
       // Get the user to update
       const { data: users } = await supabaseAdmin.auth.admin.listUsers();
       const u = users.users.find((u: any) => u.email === email);
       if (u) {
         await supabaseAdmin.from('profiles').update({ status: 'APPROVED' }).eq('id', u.id);
       }
       return;
    }
    console.error('Auth Error:', authErr);
    return;
  }
  const userId = authData.user.id;

  // 2. Wait a sec for trigger
  await new Promise(r => setTimeout(r, 2000));

  // 3. Update profile to APPROVED and correct role
  const { error: profErr } = await supabaseAdmin.from('profiles')
    .update({ 
      nome, 
      role, 
      status: 'APPROVED',
      habilidades: role === 'PROFISSIONAL' ? ['FOTO', 'VÍDEO'] : [],
      workflowType: role === 'PROFISSIONAL' ? ['TRADICIONAL'] : []
    })
    .eq('id', userId);

  if (profErr) {
    console.error('Profile Update Error:', profErr);
  } else {
    console.log(`Created and approved ${role}: ${email}`);
  }
}

async function run() {
  await createAndApproveUser('video_cliente@test.com', 'CLIENTE', 'Cliente Video Demo');
  await createAndApproveUser('video_pro@test.com', 'PROFISSIONAL', 'Pro Video Demo');
  await createAndApproveUser('video_unidade@test.com', 'CARTORIO', 'Unidade Video Demo');
}

run();
