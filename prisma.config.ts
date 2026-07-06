import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'packages/database/prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgrespassword@localhost:5432/hiveforge?schema=public'
  }
});
