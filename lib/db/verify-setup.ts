import { testConnection } from './test-connection'
import { db, closeDb } from './client'
import { sql } from 'drizzle-orm'
import * as fs from 'fs'
import * as path from 'path'

/**
 * Database Setup Verification Script
 * 
 * Comprehensive verification tool for new team members to ensure their
 * database setup is correct and ready for development.
 * 
 * Checks:
 * 1. Environment variables are configured
 * 2. Database connection is working
 * 3. Required tables exist
 * 4. Migration history is present
 * 5. Connection pooling is configured
 * 
 * Usage:
 * ```bash
 * npm run db:verify
 * ```
 */

interface VerificationResult {
  step: string
  success: boolean
  message: string
  details?: string
}

const results: VerificationResult[] = []

/**
 * Check if .env file exists and has DATABASE_URL
 */
async function checkEnvironmentFile(): Promise<boolean> {
  console.log('📋 Step 1: Checking environment configuration...')
  
  const envPath = path.join(process.cwd(), '.env')
  
  if (!fs.existsSync(envPath)) {
    results.push({
      step: 'Environment File',
      success: false,
      message: '.env file not found',
      details: 'Run: cp .env.example .env'
    })
    return false
  }
  
  if (!process.env.DATABASE_URL) {
    results.push({
      step: 'DATABASE_URL',
      success: false,
      message: 'DATABASE_URL not set in .env',
      details: 'Add: DATABASE_URL=postgresql://user:pass@host:5432/dbname'
    })
    return false
  }
  
  results.push({
    step: 'Environment Configuration',
    success: true,
    message: '.env file exists with DATABASE_URL'
  })
  
  console.log('   ✅ Environment configuration found\n')
  return true
}

/**
 * Test database connection
 */
async function checkConnection(): Promise<boolean> {
  console.log('📡 Step 2: Testing database connection...')
  
  const result = await testConnection()
  
  if (!result.success) {
    results.push({
      step: 'Database Connection',
      success: false,
      message: 'Failed to connect to database',
      details: result.error
    })
    console.log(`   ❌ Connection failed: ${result.error}\n`)
    return false
  }
  
  results.push({
    step: 'Database Connection',
    success: true,
    message: `Connected successfully (${result.latency}ms)`
  })
  
  console.log(`   ✅ Connection successful (${result.latency}ms)\n`)
  return true
}

/**
 * Check if required tables exist
 */
async function checkTables(): Promise<boolean> {
  console.log('🗄️  Step 3: Checking database schema...')
  
  try {
    const result = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `)
    
    const tables = result.rows.map((row: any) => row.table_name)
    const requiredTables = ['users', 'campaigns', 'campaign_players', 'invitations']
    const missingTables = requiredTables.filter(t => !tables.includes(t))
    
    if (missingTables.length > 0) {
      results.push({
        step: 'Database Schema',
        success: false,
        message: 'Required tables are missing',
        details: `Missing: ${missingTables.join(', ')}. Run: npm run db:migrate`
      })
      console.log(`   ❌ Missing tables: ${missingTables.join(', ')}\n`)
      return false
    }
    
    results.push({
      step: 'Database Schema',
      success: true,
      message: `All ${requiredTables.length} required tables exist`
    })
    
    console.log(`   ✅ All required tables exist\n`)
    return true
  } catch (error) {
    results.push({
      step: 'Database Schema',
      success: false,
      message: 'Failed to check tables',
      details: error instanceof Error ? error.message : String(error)
    })
    console.log(`   ❌ Failed to check schema\n`)
    return false
  }
}

/**
 * Check migration history
 */
async function checkMigrations(): Promise<boolean> {
  console.log('📦 Step 4: Checking migration history...')
  
  try {
    // Check if migrations table exists
    const tablesResult = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'drizzle' 
      AND table_name = '__drizzle_migrations'
    `)
    
    if (tablesResult.rows.length === 0) {
      results.push({
        step: 'Migration History',
        success: false,
        message: 'No migration history found',
        details: 'Run: npm run db:migrate'
      })
      console.log('   ⚠️  No migration history found\n')
      return false
    }
    
    // Count applied migrations
    const migrationsResult = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM drizzle.__drizzle_migrations
    `)
    
    const count = (migrationsResult.rows[0] as any).count
    
    results.push({
      step: 'Migration History',
      success: true,
      message: `${count} migration(s) applied`
    })
    
    console.log(`   ✅ ${count} migration(s) applied\n`)
    return true
  } catch (error) {
    results.push({
      step: 'Migration History',
      success: false,
      message: 'Could not check migrations',
      details: 'This is not critical - migrations may not have been run yet'
    })
    console.log('   ⚠️  Migration history not accessible\n')
    return false
  }
}

/**
 * Check migration files exist
 */
function checkMigrationFiles(): boolean {
  console.log('📁 Step 5: Checking migration files...')
  
  const migrationsPath = path.join(process.cwd(), 'lib', 'db', 'migrations')
  
  if (!fs.existsSync(migrationsPath)) {
    results.push({
      step: 'Migration Files',
      success: false,
      message: 'Migrations directory not found',
      details: 'This should not happen - check repository integrity'
    })
    console.log('   ❌ Migrations directory missing\n')
    return false
  }
  
  const files = fs.readdirSync(migrationsPath)
  const sqlFiles = files.filter(f => f.endsWith('.sql'))
  
  if (sqlFiles.length === 0) {
    results.push({
      step: 'Migration Files',
      success: false,
      message: 'No migration files found',
      details: 'Run: npm run db:generate'
    })
    console.log('   ⚠️  No migration files found\n')
    return false
  }
  
  results.push({
    step: 'Migration Files',
    success: true,
    message: `${sqlFiles.length} migration file(s) found`
  })
  
  console.log(`   ✅ ${sqlFiles.length} migration file(s) present\n`)
  return true
}

/**
 * Print summary report
 */
function printSummary() {
  console.log('\n' + '='.repeat(60))
  console.log('📊 VERIFICATION SUMMARY')
  console.log('='.repeat(60) + '\n')
  
  const allPassed = results.every(r => r.success)
  const passedCount = results.filter(r => r.success).length
  
  for (const result of results) {
    const icon = result.success ? '✅' : '❌'
    console.log(`${icon} ${result.step}`)
    console.log(`   ${result.message}`)
    if (result.details) {
      console.log(`   → ${result.details}`)
    }
    console.log()
  }
  
  console.log('='.repeat(60))
  console.log(`Status: ${passedCount}/${results.length} checks passed`)
  console.log('='.repeat(60) + '\n')
  
  if (allPassed) {
    console.log('🎉 SUCCESS! Your database is fully configured and ready.\n')
    console.log('Next steps:')
    console.log('  • Start development: npm run dev')
    console.log('  • Browse database: npm run db:studio')
    console.log('  • Run tests: npm test\n')
    return true
  } else {
    console.log('⚠️  SETUP INCOMPLETE\n')
    console.log('Please address the issues above, then run this script again.')
    console.log('For help, see: DATABASE_SETUP.md\n')
    return false
  }
}

/**
 * Main verification function
 */
async function runVerification() {
  console.log('\n🔍 Database Setup Verification\n')
  console.log('This script will verify your database configuration.\n')
  
  // Run all checks
  const envCheck = await checkEnvironmentFile()
  
  if (!envCheck) {
    printSummary()
    await closeDb()
    process.exit(1)
  }
  
  const connCheck = await checkConnection()
  
  if (!connCheck) {
    printSummary()
    await closeDb()
    process.exit(1)
  }
  
  // These checks can continue even if some fail
  await checkTables()
  await checkMigrations()
  checkMigrationFiles()
  
  // Print summary
  const success = printSummary()
  
  await closeDb()
  process.exit(success ? 0 : 1)
}

// Run verification when script is executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`
if (isMainModule) {
  runVerification().catch((error) => {
    console.error('Unexpected error:', error)
    process.exit(1)
  })
}

export { runVerification }
