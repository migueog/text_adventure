import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'
import { config } from 'dotenv'

// Load environment variables from .env file
config()

/**
 * Database Migration Runner
 * 
 * This script applies pending migrations to the database.
 * It reads SQL files from the migrations directory and executes them in order.
 * 
 * Usage:
 * ```bash
 * # Run migrations against DATABASE_URL
 * npm run db:migrate
 * 
 * # Run migrations against a specific database
 * MIGRATION_DATABASE_URL=postgresql://... npm run db:migrate
 * ```
 * 
 * Migration workflow:
 * 1. Make schema changes in lib/db/schema.ts
 * 2. Generate migration: npm run db:generate
 * 3. Review the generated SQL in lib/db/migrations/
 * 4. Apply migration: npm run db:migrate
 * 
 * @see DATABASE_SETUP.md for detailed migration guide
 */

/**
 * Main migration function
 * Connects to database and applies all pending migrations
 */
async function runMigrations() {
  console.log('🔄 Starting database migration...')
  
  // Use MIGRATION_DATABASE_URL if set, otherwise fall back to DATABASE_URL
  const connectionString = process.env.MIGRATION_DATABASE_URL || process.env.DATABASE_URL
  
  if (!connectionString) {
    console.error('❌ Error: DATABASE_URL environment variable is not set')
    console.error('   Please set DATABASE_URL in your .env file or environment')
    console.error('   Example: DATABASE_URL=postgresql://user:pass@host:5432/dbname')
    process.exit(1)
  }
  
  console.log('📡 Connecting to database...')
  console.log(`   Host: ${maskConnectionString(connectionString)}`)
  
  // Create a connection pool for migrations
  const pool = new Pool({
    connectionString,
    // Use higher timeout for migrations as they may take longer
    connectionTimeoutMillis: 10000,
    // Single connection for migrations to avoid race conditions
    max: 1
  })
  
  const db = drizzle(pool)
  
  try {
    console.log('📦 Applying migrations from ./lib/db/migrations...')
    
    // Run migrations
    await migrate(db, { migrationsFolder: './lib/db/migrations' })
    
    console.log('✅ Migrations completed successfully!')
    console.log('   Your database schema is now up to date.')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    console.error('\nTroubleshooting:')
    console.error('1. Verify your DATABASE_URL is correct')
    console.error('2. Ensure the database exists and is accessible')
    console.error('3. Check that migrations directory contains valid SQL files')
    console.error('4. Review the error message above for specific issues')
    process.exit(1)
  } finally {
    // Always close the connection pool
    await pool.end()
    console.log('🔌 Database connection closed')
  }
}

/**
 * Mask sensitive information in connection string for logging
 * Shows host and database name but hides credentials
 * 
 * @param connectionString - Full database connection string
 * @returns Masked connection string safe for logging
 */
function maskConnectionString(connectionString: string): string {
  try {
    const url = new URL(connectionString)
    return `${url.protocol}//${url.username}:****@${url.host}${url.pathname}`
  } catch {
    return 'Invalid connection string'
  }
}

// Run migrations when script is executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`
if (isMainModule) {
  runMigrations()
    .then(() => {
      process.exit(0)
    })
    .catch((error) => {
      console.error('Unexpected error:', error)
      process.exit(1)
    })
}

export { runMigrations }
