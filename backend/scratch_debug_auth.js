
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error('Error fetching users:', error);
    return;
  }
  const editor = users.find(u => u.email.toLowerCase().includes('editor'));
  console.log('User found in Supabase:', JSON.stringify(editor, null, 2));

  // Also check if it exists in Prisma
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  try {
    const pUser = await prisma.user.findFirst({
        where: { email: { contains: 'editor' } }
    });
    console.log('User found in Prisma:', JSON.stringify(pUser, null, 2));
  } catch (e) {
    console.error('Prisma Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
