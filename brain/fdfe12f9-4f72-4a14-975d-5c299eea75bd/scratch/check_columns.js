const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const columns = await prisma.$queryRaw`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'cartorios'`;
    console.log('Columns in cartorios table:', JSON.stringify(columns, null, 2));
  } catch (err) {
    console.error('Error querying DB:', err);
  }
}

main()
  .finally(async () => await prisma.$disconnect());
