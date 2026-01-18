#!/usr/bin/env bun
/**
 * WHY: Migrate existing campaigns to use new perimeter-based player placement
 * Updates all player positions in database to match new corner-first algorithm
 *
 * Usage: bun run scripts/migrate-player-positions.ts
 */

import { db } from '@/lib/db/client'
import { campaigns, campaignPlayers } from '@/lib/db/schema'
import { eq, and, isNotNull } from 'drizzle-orm'
import { calculateStartPositions } from '@/lib/utils/playerPlacement'
import { MAP_CONFIGS } from '@/lib/data/campaignData'

async function migratePlayerPositions() {
  console.log('🔄 Starting player position migration...\n')

  // WHY: Get all active campaigns with gameState data
  const allCampaigns = await db
    .select({
      id: campaigns.id,
      name: campaigns.name,
      gameState: campaigns.gameState,
      settings: campaigns.settings,
    })
    .from(campaigns)
    .where(
      and(
        isNotNull(campaigns.gameState),
        eq(campaigns.status, 'active')
      )
    )

  console.log(`Found ${allCampaigns.length} active campaigns\n`)

  let updatedCount = 0
  let errorCount = 0

  for (const campaign of allCampaigns) {
    try {
      console.log(`📋 Processing: ${campaign.name} (ID: ${campaign.id})`)

      // WHY: Parse gameState to get player count
      const gameState = campaign.gameState as any
      const players = gameState?.players || []
      const numPlayers = players.length

      if (numPlayers === 0) {
        console.log(`   ⏭️  Skipping (no players)\n`)
        continue
      }

      // WHY: Get map config based on player count
      const mapConfig = MAP_CONFIGS[numPlayers] || MAP_CONFIGS[4]

      // WHY: Calculate new perimeter-based positions
      const newPositions = calculateStartPositions(numPlayers, mapConfig)

      console.log(`   Players: ${numPlayers}`)
      console.log(`   Map size: ${mapConfig.rows}×${mapConfig.cols}`)

      // WHY: Update each player's position in gameState
      const updatedPlayers = players.map((player: any, index: number) => {
        const oldPos = player.position
        const newPos = newPositions[index]

        console.log(`   Player ${index + 1}: (${oldPos?.row},${oldPos?.col}) → (${newPos.row},${newPos.col})`)

        return {
          ...player,
          position: newPos,
          // WHY: Update bases array to include new starting position
          bases: player.bases?.map((base: any) => {
            // Replace old starting position with new one
            if (base.row === oldPos?.row && base.col === oldPos?.col) {
              return newPos
            }
            return base
          }) || [newPos]
        }
      })

      // WHY: Update campaign gameState in database
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

      console.log(`   ✅ Updated successfully\n`)
      updatedCount++

    } catch (error) {
      console.error(`   ❌ Error updating campaign ${campaign.id}:`, error)
      errorCount++
      console.log()
    }
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`✨ Migration complete!`)
  console.log(`   Updated: ${updatedCount} campaigns`)
  if (errorCount > 0) {
    console.log(`   Errors: ${errorCount} campaigns`)
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
}

// WHY: Run migration and exit
migratePlayerPositions()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
