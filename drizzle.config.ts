import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

const DATABASE_URL = process.env.NODE_ENV === 'production'
  ? process.env.PRODUCTION_DATABASE_URL!
  : process.env.DATABASE_URL!;

export default defineConfig({
  out: './drizzle',
  schema: './src/infra/database/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: DATABASE_URL,
  },
});
