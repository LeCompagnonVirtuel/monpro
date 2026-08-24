import { PrismaClient } from '@prisma/client';

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test123@localhost:5433/monpro_test';

export function getTestPrisma(): PrismaClient {
  return new PrismaClient({ datasources: { db: { url: TEST_DATABASE_URL } } });
}

export async function cleanDatabase(prisma: PrismaClient) {
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename != '_prisma_migrations'
  `;
  for (const { tablename } of tables) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tablename}" CASCADE`);
  }
}
