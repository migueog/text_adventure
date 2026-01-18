import { drizzle } from 'drizzle-orm/neon-serverless'
import { Pool } from '@neondatabase/serverless'
import * as schema from './schema'

/**
 * WHY: Neon Serverless Driver for optimal Vercel performance
 *
 * Benefits over node-postgres:
 * - 3-5x faster cold starts (WebSocket connections)
 * - Built-in connection pooling at the edge
 * - Edge Runtime compatible
 * - Automatic SSL handling
 * - Lower latency (~10-20ms)
 *
 * The Neon driver is optimized for serverless environments like Vercel
 * where functions are short-lived and connection reuse is critical.
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

/**
 * Handle pool errors to prevent unhandled promise rejections
 */
pool.on('error', (err: Error) => {
  console.error('Unexpected error on idle database client', err)
  process.exit(-1)
})

/**
 * Drizzle database client with full schema support
 * Provides type-safe database operations
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
 *
 * Error handling:
 * ```typescript
 * try {
 *   const result = await db.select().from(users)
 * } catch (error) {
 *   console.error('Database query failed:', error)
 *   // Handle error appropriately
 * }
 * ```
 */
export const db = drizzle(pool, { schema })

/**
 * Close database connection pool
 * Call this when shutting down the application
 *
 * Note: In serverless environments, you typically don't need to call this
 * as the function instance will be terminated by the platform
 */
export const closeDb = async (): Promise<void> => {
  await pool.end()
}

/**
 * Get connection pool statistics
 * Useful for monitoring and debugging connection issues
 *
 * @returns Object with pool statistics
 */
export const getPoolStats = () => ({
  total: pool.totalCount,
  idle: pool.idleCount,
  waiting: pool.waitingCount
})
