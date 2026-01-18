/**
 * WHY: Migration script to fix existing campaigns with null player positions
 * Applies the new player placement logic to campaigns created before the fix
 *
 * Run with: bun run scripts/fix-player-positions.ts
 */

import { db } from '@/lib/db/client'
import { campaigns } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { calculateStartPositions, markStartingHexes, assignPlayerStartPosition } from '@/lib/utils/playerPlacement'
import { MAP_CONFIGS } from '@/lib/data/campaignData'

async function fixPlayerPositions() {
  console.log('🔧 Starting player position migration...\n')

  try {
    // WHY: Get all campaigns from database
    const allCampaigns = await db.select().from(campaigns)

    console.log(`Found ${allCampaigns.length} campaigns in database\n`)

    let updatedCount = 0
    let skippedCount = 0

    for (const campaign of allCampaigns) {
      console.log(`\n📋 Processing Campaign ID: ${campaign.id}`)
      console.log(`   Name: ${campaign.name}`)
      console.log(`   Status: ${campaign.status}`)

      // WHY: Skip if campaign has no gameState or players
      if (!campaign.gameState || typeof campaign.gameState !== 'object') {
        console.log('   ⏭️  Skipped: No gameState')
        skippedCount++
        continue
      }

      const gameState = campaign.gameState as any

      if (!gameState.players || !Array.isArray(gameState.players)) {
        console.log('   ⏭️  Skipped: No players array')
        skippedCount++
        continue
      }

      // WHY: Check if players already have positions assigned
      const playersWithoutPosition = gameState.players.filter((p: any) => !p.position)

      if (playersWithoutPosition.length === 0) {
        console.log('   ✅ Skipped: All players already have positions')
        skippedCount++
        continue
      }

      console.log(`   🔍 Found ${playersWithoutPosition.length}/${gameState.players.length} players without positions`)

      // WHY: Get player count from settings or players array
      const playerCount = (campaign.settings as any)?.playerCount || gameState.players.length
      const mapConfig = MAP_CONFIGS[playerCount as keyof typeof MAP_CONFIGS]

      if (!mapConfig) {
        console.log(`   ❌ Error: Invalid player count (${playerCount})`)
        skippedCount++
        continue
      }

      console.log(`   📐 Map Config: ${mapConfig.rows}x${mapConfig.cols}`)

      // WHY: Calculate starting positions for all players
      const startPositions = calculateStartPositions(playerCount, mapConfig)
      console.log(`   🎯 Calculated ${startPositions.length} starting positions:`)
      startPositions.forEach((pos, i) => {
        console.log(`      Player ${i}: row ${pos.row}, col ${pos.col}`)
      })

      // WHY: Update players with positions and bases
      const updatedPlayers = gameState.players.map((player: any, index: number) => {
        if (player.position) {
          // Already has position, don't modify
          return player
        }

        // WHY: Assign position and base using shared utility
        return assignPlayerStartPosition(player, startPositions[index])
      })

      // WHY: Mark starting hexes as explored bases
      if (gameState.hexes && typeof gameState.hexes === 'object') {
        markStartingHexes(gameState.hexes, startPositions)
        console.log(`   🏠 Marked ${startPositions.length} starting hexes as bases`)
      }

      // WHY: Update campaign in database
      const updatedGameState = {
        ...gameState,
        players: updatedPlayers
      }

      await db
        .update(campaigns)
        .set({
          gameState: updatedGameState,
          updatedAt: new Date()
        })
        .where(eq(campaigns.id, campaign.id))

      console.log(`   ✅ Updated campaign successfully`)
      updatedCount++
    }

    console.log('\n' + '='.repeat(50))
    console.log('📊 Migration Summary:')
    console.log(`   ✅ Updated: ${updatedCount} campaigns`)
    console.log(`   ⏭️  Skipped: ${skippedCount} campaigns`)
    console.log(`   📈 Total: ${allCampaigns.length} campaigns`)
    console.log('='.repeat(50))
    console.log('\n✨ Migration completed successfully!\n')

  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  }
}

// WHY: Run migration when script is executed directly
fixPlayerPositions()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
