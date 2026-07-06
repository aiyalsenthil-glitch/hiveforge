import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'packages/database/prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgrespassword@localhost:5555/hiveforge?schema=public'
  }
});
