import { NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { sql } from 'drizzle-orm'
import { getPoolStats } from '@/lib/db/client'

/**
 * GET /api/health
 * Health check endpoint for monitoring database connection
 *
 * Returns:
 * - status: "healthy" or "unhealthy"
 * - database: connection status
 * - pool: connection pool statistics
 * - timestamp: current server time
 */
export async function GET() {
  try {
    // Test database connection
    const start = Date.now()
    const result = await db.execute(sql`SELECT NOW() as current_time, version() as pg_version`)
    const latency = Date.now() - start

    const row = result.rows[0] as { current_time: string; pg_version: string }
    const poolStats = getPoolStats()

    return NextResponse.json({
      status: 'healthy',
      database: {
        connected: true,
        latency: `${latency}ms`,
        timestamp: row.current_time,
        version: row.pg_version.split(' ')[0]
      },
      pool: {
        total: poolStats.total,
        idle: poolStats.idle,
        waiting: poolStats.waiting
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        database: {
          connected: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
