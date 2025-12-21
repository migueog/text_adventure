import type { Config } from 'drizzle-kit'

/**
 * Drizzle Kit configuration
 * Used for generating and running database migrations
 * 
 * Commands:
 * - Generate migration: npm run db:generate
 * - Push to database: npm run db:push
 * - Open Drizzle Studio: npm run db:studio
 * - Drop migration: npm run db:drop
 */
export default {
  schema: './lib/db/schema.ts',
  out: './lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!
  }
} satisfies Config
