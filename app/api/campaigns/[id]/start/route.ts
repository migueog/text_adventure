import { NextRequest, NextResponse } from 'next/server'
import { requireCampaignOwner } from '@/lib/permissions/middleware'
import { db } from '@/lib/db/client'
import { campaigns, campaignPlayers } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { MAP_CONFIGS, PLAYER_COLORS } from '@/lib/data/campaignData'
import {
  calculateStartPositions,
  markStartingHexes,
  assignPlayerStartPosition
} from '@/lib/utils/playerPlacement'

/**
 * POST /api/campaigns/[id]/start
 * Start a campaign (change status from 'setup' to 'active')
 *
 * WHY: Only campaign owner can start the campaign
 * Validates campaign is in 'setup' status before starting
 * Updates gameState to mark game as started
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const campaignId = parseInt(id, 10)

  if (isNaN(campaignId)) {
    return NextResponse.json(
      { error: 'Invalid campaign ID' },
      { status: 400 }
    )
  }

  // WHY: Only campaign owner can start the campaign
  const access = await requireCampaignOwner(request, campaignId)
  if (access instanceof NextResponse) return access

  try {
    const campaign = access.campaign

    // WHY: Can only start campaigns in 'setup' status
    if (campaign.status !== 'setup') {
      return NextResponse.json(
        { error: `Campaign is already ${campaign.status}` },
        { status: 400 }
      )
    }

    // WHY: Fetch all players from campaign_players table
    const dbPlayers = await db
      .select()
      .from(campaignPlayers)
      .where(eq(campaignPlayers.campaignId, campaignId))

    // WHY: Initialize hex grid based on player count
    const mapConfig = MAP_CONFIGS[campaign.settings.playerCount as keyof typeof MAP_CONFIGS]

    if (!mapConfig) {
      return NextResponse.json(
        { error: 'Invalid player count' },
        { status: 400 }
      )
    }

    // WHY: Calculate starting positions for all players before creating player objects
    const startPositions = calculateStartPositions(
      campaign.settings.playerCount as number,
      mapConfig
    )

    // WHY: Convert database players to game format with colors and positions
    const gamePlayers = dbPlayers.map((dbPlayer, index) => {
      const basePlayer: Partial<Player> = {
        id: index,
        name: dbPlayer.playerName,
        killTeamName: dbPlayer.playerName,
        color: PLAYER_COLORS[index] || '#ffffff',
        supplyPoints: (dbPlayer.playerState as any)?.sp || 5,
        campaignPoints: (dbPlayer.playerState as any)?.cp || 0,
        position: undefined,
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
      }

      // WHY: Assign calculated starting position to player
      return assignPlayerStartPosition(basePlayer, startPositions[index])
    })
    const hexes: any = {}

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

    // WHY: Mark starting hexes as explored bases
    markStartingHexes(hexes, startPositions)

    // WHY: Update gameState with players, hexes, and initial values
    const updatedGameState = {
      ...campaign.gameState,
      gameStarted: true,
      currentRound: 1,
      currentPhase: 'movement' as const,
      currentPlayerIndex: 0,
      players: gamePlayers,
      hexes,
      eventLog: [
        {
          id: 1,
          round: 1,
          message: 'Campaign started! All operatives ready for deployment.',
          type: 'system' as const,
          timestamp: new Date().toISOString()
        }
      ]
    }

    // WHY: Update campaign status to 'active' and gameState
    const [updated] = await db
      .update(campaigns)
      .set({
        status: 'active',
        gameState: updatedGameState,
        updatedAt: new Date()
      })
      .where(eq(campaigns.id, campaignId))
      .returning()

    return NextResponse.json({
      success: true,
      campaign: {
        id: updated.id,
        status: updated.status,
        updatedAt: updated.updatedAt
      }
    })
  } catch (error: any) {
    console.error('Start campaign error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
