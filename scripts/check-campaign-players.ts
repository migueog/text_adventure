/**
 * Check players in a campaign
 *
 * Run with: bun run scripts/check-campaign-players.ts
 */

import { db } from '../lib/db/client'
import { campaigns, campaignPlayers, users } from '../lib/db/schema'
import { eq } from 'drizzle-orm'

async function main() {
  console.log('🔍 Checking all campaigns and their players...\n')

  const allCampaigns = await db.select().from(campaigns)

  for (const campaign of allCampaigns) {
    console.log(`📋 Campaign: ${campaign.name} (ID: ${campaign.id})`)
    console.log(`   Status: ${campaign.status}`)

    // Get players for this campaign
    const players = await db
      .select({
        id: campaignPlayers.id,
        userId: campaignPlayers.userId,
        playerName: campaignPlayers.playerName,
        joinedAt: campaignPlayers.joinedAt
      })
      .from(campaignPlayers)
      .where(eq(campaignPlayers.campaignId, campaign.id))

    console.log(`   Players (${players.length}/${campaign.settings.playerCount}):`)

    if (players.length === 0) {
      console.log('     (no players)')
    } else {
      for (const player of players) {
        // Get user email
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, player.userId))
          .limit(1)

        console.log(`     - ${player.playerName} (User ID: ${player.userId}, Email: ${user?.email || 'unknown'})`)
      }
    }
    console.log()
  }

  process.exit(0)
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
