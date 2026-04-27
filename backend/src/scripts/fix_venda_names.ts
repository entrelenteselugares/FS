import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const events = await prisma.event.findMany({
    where: {
      nomeNoivos: {
        startsWith: 'VENDA: '
      }
    }
  })

  console.log(`Encontrados ${events.length} eventos com prefixo VENDA:`)

  for (const event of events) {
    const newName = event.nomeNoivos.replace('VENDA: ', '')
    await prisma.event.update({
      where: { id: event.id },
      data: { nomeNoivos: newName }
    })
    console.log(`Atualizado: ${event.nomeNoivos} -> ${newName}`)
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
