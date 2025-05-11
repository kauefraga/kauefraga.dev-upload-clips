import { drizzle } from 'drizzle-orm/node-postgres';

export const db = process.env.NODE_ENV === 'production'
  ? drizzle(process.env.PRODUCTION_DATABASE_URL!)
  : drizzle(process.env.DATABASE_URL!);
