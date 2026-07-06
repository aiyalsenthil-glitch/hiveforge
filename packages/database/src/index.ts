import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

let prisma: PrismaClient;

const connectionString = process.env['DATABASE_URL'] || 'postgresql://postgres:postgrespassword@localhost:5432/hiveforge?schema=public';

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

if (process.env['NODE_ENV'] === 'production') {
  prisma = new PrismaClient({ adapter });
} else {
  const globalWithPrisma = global as typeof globalThis & {
    prisma?: PrismaClient;
  };
  if (!globalWithPrisma.prisma) {
    globalWithPrisma.prisma = new PrismaClient({ adapter });
  }
  prisma = globalWithPrisma.prisma;
}

export const db = prisma;
export * from '@prisma/client';
export { pool }; // Export the pool just in case
