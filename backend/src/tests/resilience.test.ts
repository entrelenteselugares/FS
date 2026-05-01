import { PrismaClient } from '@prisma/client';

describe('Backend Resilience Tests', () => {
  let prisma: PrismaClient;

  beforeAll(() => {
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('Database connection is healthy', async () => {
    // Attempt a simple query to ensure the connection works
    const result = await prisma.$queryRaw`SELECT 1 as result`;
    expect(result).toBeDefined();
  });

  test('Critical tables exist and are accessible', async () => {
    // Check if the users table is accessible
    const userCount = await prisma.user.count();
    expect(typeof userCount).toBe('number');
  });

  test('Environment variables are correctly loaded', () => {
    expect(process.env.DATABASE_URL).toBeDefined();
    expect(process.env.CRON_SECRET).toBeDefined();
  });
});
