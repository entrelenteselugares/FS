const { PrismaClient } = require('./backend/node_modules/@prisma/client'); const prisma = new PrismaClient(); prisma.subscription.findMany().then(console.log).finally(() => prisma.$disconnect());
