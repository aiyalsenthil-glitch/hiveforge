import * as dotenv from 'dotenv';
import * as path from 'path';
import { z } from 'zod';

// Load .env file from workspace root if it exists
dotenv.config({ path: path.join(__dirname, '../../../../.env') });

const configSchema = z.object({
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().default('postgresql://postgres:postgrespassword@localhost:5555/hiveforge?schema=public'),
  REDIS_URL: z.string().default('redis://localhost:7000'),
  FIREWORKS_API_KEY: z.string().optional(),
  MOCK_AI: z.coerce.boolean().default(true),
  JWT_SECRET: z.string().default('super-secret-key-for-mvp'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development')
});

type Config = z.infer<typeof configSchema>;

let validatedConfig: Config;

try {
  validatedConfig = configSchema.parse({
    PORT: process.env['API_PORT'] || process.env['PORT'],
    DATABASE_URL: process.env['DATABASE_URL'],
    REDIS_URL: process.env['REDIS_URL'],
    FIREWORKS_API_KEY: process.env['FIREWORKS_API_KEY'],
    MOCK_AI: process.env['MOCK_AI'] ?? (process.env['FIREWORKS_API_KEY'] ? 'false' : 'true'),
    JWT_SECRET: process.env['JWT_SECRET'],
    NODE_ENV: process.env['NODE_ENV']
  });
} catch (error) {
  if (error instanceof z.ZodError) {
    const issues = error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
    console.error('❌ Invalid environment variables configuration:', issues);
    throw new Error(`Invalid environment variables: ${issues}`);
  }
  throw error;
}

export const config = validatedConfig;
export type { Config };
