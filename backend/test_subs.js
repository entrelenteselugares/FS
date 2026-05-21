const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.subscription.findMany().then(console.log).finally(() => prisma.$disconnect());
