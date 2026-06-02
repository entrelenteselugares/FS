const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.cartorio.findFirst().then(c => console.log(c.userId)).catch(console.error).finally(() => prisma.$disconnect());
