
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
console.log("Modelos disponíveis no Prisma:", Object.keys(prisma).filter(k => !k.startsWith('_')));
prisma.$disconnect();
