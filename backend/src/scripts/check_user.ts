import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const prisma = new PrismaClient()
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  const email = 'info@tlmmakers.com'
  
  console.log(`--- Auditando usuário: ${email} ---`)
  
  // 1. Prisma
  const userPrisma = await prisma.user.findUnique({ where: { email } })
  console.log('Prisma User:', userPrisma ? '✅ EXISTE' : '❌ NÃO EXISTE')
  if (userPrisma) console.log(userPrisma)

  // 2. Supabase Auth
  const { data: { users }, error } = await supabase.auth.admin.listUsers()
  const userSupabase = users.find(u => u.email === email)
  console.log('Supabase Auth User:', userSupabase ? '✅ EXISTE' : '❌ NÃO EXISTE')
  if (userSupabase) {
    console.log({
      id: userSupabase.id,
      email: userSupabase.email,
      last_sign_in_at: userSupabase.last_sign_in_at,
      created_at: userSupabase.created_at
    })
  }

  console.log('-----------------------------------')
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
