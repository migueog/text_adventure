/**
 * Check gameState for a campaign
 *
 * Run with: bun run scripts/check-gamestate.ts
 */

import { db } from '../lib/db/client'
import { campaigns } from '../lib/db/schema'
import { eq } from 'drizzle-orm'

async function main() {
  const campaignId = 1 // Test campaign

  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.id, campaignId))
    .limit(1)

  if (!campaign) {
    console.log('Campaign not found')
    process.exit(1)
  }

  console.log('Campaign:', campaign.name)
  console.log('Status:', campaign.status)
  console.log('\nGameState:')
  console.log(JSON.stringify(campaign.gameState, null, 2))

  process.exit(0)
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
