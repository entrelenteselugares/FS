const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Connecting to database...');
    await prisma.$connect();
    console.log('✅ Connection successful!');
    const userCount = await prisma.user.count();
    console.log('User count:', userCount);
  } catch (e) {
    console.error('❌ Connection failed:');
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
