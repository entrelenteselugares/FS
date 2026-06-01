const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const e = await prisma.event.findUnique({ where: { id: 'cmpswtjfo0001l204s7bzwizw' } });
    console.log(e ? 'EVENT FOUND: ' + e.title : 'EVENT NOT FOUND');
    
    // Test Supabase Admin
    const sbUrl = process.env.SUPABASE_URL;
    console.log('SUPABASE_URL:', sbUrl ? 'SET' : 'NOT SET');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}
main();
