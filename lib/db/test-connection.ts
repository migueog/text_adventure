import { db, closeDb, getPoolStats } from './client'
import { sql } from 'drizzle-orm'
import { config } from 'dotenv'

// Load environment variables from .env file
config()

/**
 * Database Connection Test Utility
 * 
 * Tests the database connection and verifies that:
 * - DATABASE_URL is properly configured
 * - Connection can be established
 * - Basic queries can be executed
 * - Connection pooling is working
 * 
 * Usage:
 * ```bash
 * # Test connection
 * npm run db:test
 * 
 * # Test with verbose output
 * VERBOSE=true npm run db:test
 * 
 * # Test specific database
 * DATABASE_URL=postgresql://... npm run db:test
 * ```
 */

interface ConnectionTestResult {
  success: boolean
  timestamp: Date
  latency: number
  version?: string
  error?: string
}

/**
 * Test database connection by executing a simple query
 * 
 * @returns Test result with connection details
 */
async function testConnection(): Promise<ConnectionTestResult> {
  const startTime = Date.now()
  
  try {
    // Execute a simple query to test connection
    const result = await db.execute(sql`SELECT NOW() as current_time, version() as pg_version`)
    const row = result.rows[0] as { current_time: Date; pg_version: string }
    
    const latency = Date.now() - startTime
    
    return {
      success: true,
      timestamp: row.current_time,
      latency,
      version: row.pg_version
    }
  } catch (error) {
    return {
      success: false,
      timestamp: new Date(),
      latency: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

/**
 * Main test function with detailed output
 */
async function runConnectionTest() {
  console.log('🔍 Testing database connection...\n')
  
  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set\n')
    console.error('Please set DATABASE_URL in your .env file:')
    console.error('Example: DATABASE_URL=postgresql://user:pass@host:5432/dbname\n')
    console.error('See .env.example for configuration options')
    process.exit(1)
  }
  
  // Mask and display connection string
  const maskedUrl = maskConnectionString(process.env.DATABASE_URL)
  console.log(`📡 Database URL: ${maskedUrl}\n`)
  
  // Test connection
  const result = await testConnection()
  
  if (result.success) {
    console.log('✅ Connection successful!\n')
    console.log('Database Information:')
    console.log(`  Timestamp: ${result.timestamp.toISOString()}`)
    console.log(`  Latency: ${result.latency}ms`)
    console.log(`  PostgreSQL Version: ${result.version?.split(' ')[0]}\n`)
    
    // Get pool statistics if verbose mode
    if (process.env.VERBOSE === 'true') {
      const poolStats = getPoolStats()
      console.log('Connection Pool Statistics:')
      console.log(`  Total connections: ${poolStats.total}`)
      console.log(`  Idle connections: ${poolStats.idle}`)
      console.log(`  Waiting requests: ${poolStats.waiting}\n`)
    }
    
    console.log('💡 Your database is ready to use!')
    console.log('   Next steps:')
    console.log('   1. Run migrations: npm run db:migrate')
    console.log('   2. Start development: npm run dev')
    console.log('   3. Open Drizzle Studio: npm run db:studio\n')
    
    await closeDb()
    process.exit(0)
  } else {
    console.error('❌ Connection failed!\n')
    console.error(`Error: ${result.error}\n`)
    console.error('Troubleshooting:')
    console.error('1. Verify DATABASE_URL format:')
    console.error('   postgresql://username:password@host:port/database')
    console.error('2. Check that the database exists')
    console.error('3. Verify network connectivity to database host')
    console.error('4. For hosted databases (Neon, Supabase), ensure:')
    console.error('   - SSL is configured (add ?sslmode=require)')
    console.error('   - IP whitelist includes your location')
    console.error('   - Credentials are correct\n')
    
    await closeDb()
    process.exit(1)
  }
}

/**
 * Mask sensitive information in connection string for logging
 * 
 * @param connectionString - Full database connection string
 * @returns Masked connection string safe for logging
 */
function maskConnectionString(connectionString: string): string {
  try {
    const url = new URL(connectionString)
    const passwordMasked = url.password ? '****' : ''
    return `${url.protocol}//${url.username}:${passwordMasked}@${url.host}${url.pathname}`
  } catch {
    return 'Invalid connection string format'
  }
}

/**
 * Quick connection check for use in application code
 * 
 * @returns True if connection is healthy, false otherwise
 */
export async function isConnectionHealthy(): Promise<boolean> {
  const result = await testConnection()
  return result.success && result.latency < 5000 // 5 second timeout
}

// Run test when script is executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`
if (isMainModule) {
  runConnectionTest().catch((error) => {
    console.error('Unexpected error:', error)
    process.exit(1)
  })
}

export { testConnection, runConnectionTest }
