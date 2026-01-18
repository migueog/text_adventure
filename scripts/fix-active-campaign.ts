/**
 * Fix an active campaign by populating players and hexes
 *
 * Run with: bun run scripts/fix-active-campaign.ts
 */

import { db } from '../lib/db/client'
import { campaigns, campaignPlayers } from '../lib/db/schema'
import { eq } from 'drizzle-orm'
import { MAP_CONFIGS, PLAYER_COLORS } from '../lib/data/campaignData'

async function main() {
  const campaignId = 1 // Test campaign

  console.log(`🔧 Fixing campaign ID ${campaignId}...\n`)

  // Get campaign
  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.id, campaignId))
    .limit(1)

  if (!campaign) {
    console.error('Campaign not found')
    process.exit(1)
  }

  console.log(`Campaign: ${campaign.name}`)
  console.log(`Status: ${campaign.status}\n`)

  // Get players
  const dbPlayers = await db
    .select()
    .from(campaignPlayers)
    .where(eq(campaignPlayers.campaignId, campaignId))

  console.log(`Found ${dbPlayers.length} players:`)
  dbPlayers.forEach(p => console.log(`  - ${p.playerName}`))
  console.log()

  // Convert to game format
  const gamePlayers = dbPlayers.map((dbPlayer, index) => ({
    id: index,
    name: dbPlayer.playerName,
    killTeamName: dbPlayer.playerName,
    color: PLAYER_COLORS[index] || '#ffffff',
    supplyPoints: dbPlayer.playerState.sp || 5,
    campaignPoints: dbPlayer.playerState.cp || 0,
    position: null,
    bases: [],
    camps: [],
    exploredHexes: 0,
    gamesPlayed: 0,
    gamesWon: 0,
    gamesLost: 0,
    operativesKilled: 0,
    history: [],
    battleResult: null,
    searchedHexes: [],
    battleHistory: [],
    backstory: '',
    faction: ''
  }))

  // Initialize hex grid
  const mapConfig = MAP_CONFIGS[campaign.settings.playerCount as keyof typeof MAP_CONFIGS]
  const hexes: any = {}

  console.log(`Initializing ${mapConfig.rows}x${mapConfig.cols} hex grid...`)

  for (let row = 0; row < mapConfig.rows; row++) {
    for (let col = 0; col < mapConfig.cols; col++) {
      const id = `${row},${col}`
      const isSurface = row < mapConfig.surfaceRows
      hexes[id] = {
        id,
        row,
        col,
        type: isSurface ? 'surface' : 'tomb',
        explored: false,
        location: 0,
        condition: 0,
        exploredBy: []
      }
    }
  }

  // Update gameState
  const updatedGameState = {
    ...campaign.gameState,
    players: gamePlayers,
    hexes,
    eventLog: campaign.gameState.eventLog || [
      {
        id: 1,
        round: 1,
        message: 'Campaign started! All operatives ready for deployment.',
        type: 'system' as const,
        timestamp: new Date().toISOString()
      }
    ]
  }

  await db
    .update(campaigns)
    .set({
      gameState: updatedGameState,
      updatedAt: new Date()
    })
    .where(eq(campaigns.id, campaignId))

  console.log(`\n✅ Campaign fixed!`)
  console.log(`   - Added ${gamePlayers.length} players to gameState`)
  console.log(`   - Initialized ${Object.keys(hexes).length} hexes`)
  console.log(`\nRefresh your browser to see the changes!`)

  process.exit(0)
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
