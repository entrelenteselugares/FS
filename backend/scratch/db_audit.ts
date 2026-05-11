
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function auditDatabase() {
  try {
    const tables: any[] = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    console.log('--- TABLES ---');
    for (const t of tables) {
      console.log(`- ${t.table_name}`);
      const columns: any[] = await prisma.$queryRawUnsafe(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = '${t.table_name}'
      `);
      for (const c of columns) {
        console.log(`  |-- ${c.column_name} (${c.data_type}, nullable: ${c.is_nullable})`);
      }
    }
  } catch (err) {
    console.error('Audit failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

auditDatabase();
