import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.coupon.findUnique({ where: { code: 'TEST100' } });
  
  if (!existing) {
    await prisma.coupon.create({
      data: {
        code: 'TEST100',
        discountPct: 100,
        active: true,
        isFreeShipping: true
      }
    });
    console.log('✅ Coupon TEST100 (100% OFF + Free Shipping) created successfully.');
  } else {
    console.log('ℹ️ Coupon TEST100 already exists.');
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
