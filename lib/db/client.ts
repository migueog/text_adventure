import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

/**
 * PostgreSQL connection pool
 * Uses DATABASE_URL environment variable for connection string
 * Format: postgresql://user:password@host:port/database
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

/**
 * Drizzle database client
 * Provides type-safe database operations with full schema support
 * 
 * Usage:
 * ```typescript
 * import { db } from './lib/db/client'
 * import { users } from './lib/db/schema'
 * 
 * // Query users
 * const allUsers = await db.select().from(users)
 * 
 * // Insert user
 * const newUser = await db.insert(users).values({
 *   email: 'user@example.com',
 *   passwordHash: 'hashed_password',
 *   username: 'username'
 * }).returning()
 * ```
 */
export const db = drizzle(pool, { schema })

/**
 * Close database connection pool
 * Call this when shutting down the application
 */
export const closeDb = async (): Promise<void> => {
  await pool.end()
}
