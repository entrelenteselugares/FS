import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const subs = await prisma.pushSubscription.findMany({
    where: { userId: '20db6d27-d373-4083-8637-692be8afb0e7' }
  })
  console.log('Subscriptions:', JSON.stringify(subs, null, 2))
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
