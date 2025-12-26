import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool, PoolConfig } from 'pg'
import * as schema from './schema'

/**
 * Serverless-optimized connection pool configuration
 * Tuned for platforms like Vercel, Netlify, and other serverless environments
 * 
 * Key considerations:
 * - Lower max connections to prevent overwhelming the database
 * - Shorter timeouts for faster failure detection
 * - SSL required for remote databases (Neon, Supabase, Railway)
 */
const poolConfig: PoolConfig = {
  connectionString: process.env.DATABASE_URL,
  
  // Connection pool settings optimized for serverless
  max: parseInt(process.env.DB_POOL_MAX || '10', 10), // Max 10 connections
  idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000', 10), // 30 seconds
  connectionTimeoutMillis: parseInt(process.env.DB_POOL_CONNECTION_TIMEOUT || '2000', 10), // 2 seconds
  
  // SSL configuration - required for most hosted databases
  // Automatically enabled if DATABASE_URL includes sslmode=require
  ssl: process.env.DATABASE_URL?.includes('sslmode=require')
    ? { rejectUnauthorized: false }
    : undefined
}

/**
 * PostgreSQL connection pool
 * 
 * This pool is configured for serverless environments where:
 * - Function instances are short-lived
 * - Connection reuse across invocations is important
 * - Fast connection timeout prevents hanging requests
 * 
 * For local development with PostgreSQL:
 * DATABASE_URL=postgresql://user:password@localhost:5432/database
 * 
 * For Neon (recommended for Vercel):
 * DATABASE_URL=postgresql://user:pass@ep-xyz.region.aws.neon.tech/dbname?sslmode=require
 * 
 * For Supabase (use pooler for serverless):
 * DATABASE_URL=postgresql://postgres.xyz:pass@aws-0-region.pooler.supabase.com:6543/postgres
 */
const pool = new Pool(poolConfig)

/**
 * Handle pool errors to prevent unhandled promise rejections
 */
pool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err)
  process.exit(-1)
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
