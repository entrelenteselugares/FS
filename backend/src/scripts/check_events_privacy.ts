import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const events = await prisma.event.findMany({
    where: {
      nomeNoivos: {
        contains: 'RECOMENDONACIDADE'
      }
    },
    select: {
      id: true,
      nomeNoivos: true,
      active: true,
      isPrivate: true,
      isQuote: true,
      type: true
    }
  })

  console.log(JSON.stringify(events, null, 2))
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
