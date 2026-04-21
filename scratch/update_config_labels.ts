
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../backend/node_modules/@prisma/client';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const configs = await (prisma as any).platformConfig.findMany();
  console.log('Current Configs:', JSON.stringify(configs, null, 2));

  // Update labels to Unidade Fixa
  const updates = [
    { key: 'split_cartorio', label: 'Repasse Unidade Fixa' }
  ];

  for (const up of updates) {
    const exists = configs.find((c: any) => c.key === up.key);
    if (exists) {
      await (prisma as any).platformConfig.update({
        where: { key: up.key },
        data: { label: up.label }
      });
      console.log(`Updated label for ${up.key} to ${up.label}`);
    }
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
