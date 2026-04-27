/**
 * fix_marketplace_privacy.ts
 * Corrige eventos PHOTO_MARKETPLACE que estão indevidamente públicos.
 * Regra: eventos sem pedido PAGO/APROVADO voltam para active:false, isPrivate:true
 */
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const marketplaceEvents = await prisma.event.findMany({
    where: { type: 'PHOTO_MARKETPLACE' },
    include: {
      pedidos: {
        where: { status: { in: ['PAGO', 'APROVADO'] } },
        take: 1
      }
    }
  })

  let fixed = 0
  for (const ev of marketplaceEvents) {
    const hasPaidOrder = ev.pedidos.length > 0
    const needsFix = ev.active === true || ev.isPrivate === false

    if (!hasPaidOrder && needsFix) {
      await prisma.event.update({
        where: { id: ev.id },
        data: { active: false, isPrivate: true }
      })
      console.log(`✅ Corrigido: ${ev.nomeNoivos} (${ev.id}) → active:false, isPrivate:true`)
      fixed++
    } else if (hasPaidOrder) {
      console.log(`ℹ️  Mantido (pago): ${ev.nomeNoivos} (${ev.id})`)
    } else {
      console.log(`✓  OK: ${ev.nomeNoivos} (${ev.id})`)
    }
  }

  console.log(`\n📊 Total verificados: ${marketplaceEvents.length} | Corrigidos: ${fixed}`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(async () => await prisma.$disconnect())
