/**
 * Seed script for populating test data
 *
 * WHY: Creates test users and campaigns for development/testing
 *
 * Run with: bun run scripts/seed-test-data.ts
 */

import { db } from '../lib/db/client'
import { users, campaigns, campaignPlayers } from '../lib/db/schema'
import { hashPassword } from '../lib/auth/utils'
import { MAP_CONFIGS } from '../lib/data/campaignData'

/**
 * Test users to create
 * Password for all: "password123"
 */
const TEST_USERS = [
  { email: 'alice@example.com', username: 'Alice', name: 'Alice Commander' },
  { email: 'bob@example.com', username: 'Bob', name: 'Bob Tactician' },
  { email: 'charlie@example.com', username: 'Charlie', name: 'Charlie Scout' },
  { email: 'diana@example.com', username: 'Diana', name: 'Diana Veteran' },
  { email: 'ethan@example.com', username: 'Ethan', name: 'Ethan Ranger' },
  { email: 'fiona@example.com', username: 'Fiona', name: 'Fiona Operative' }
]

/**
 * Test campaigns with various configurations
 */
const TEST_CAMPAIGNS = [
  {
    name: 'Desert Expedition',
    ownerEmail: 'alice@example.com',
    status: 'setup' as const,
    playerCount: 4,
    targetThreatLevel: 8,
    soloMode: false,
    players: ['alice@example.com', 'bob@example.com']
  },
  {
    name: 'Solo Recon Mission',
    ownerEmail: 'charlie@example.com',
    status: 'setup' as const,
    playerCount: 1,
    targetThreatLevel: 10,
    soloMode: true,
    players: ['charlie@example.com']
  },
  {
    name: 'Team Alpha Campaign',
    ownerEmail: 'diana@example.com',
    status: 'active' as const,
    playerCount: 6,
    targetThreatLevel: 7,
    soloMode: false,
    players: ['diana@example.com', 'ethan@example.com', 'fiona@example.com', 'alice@example.com']
  },
  {
    name: 'Urban Combat Zone',
    ownerEmail: 'bob@example.com',
    status: 'setup' as const,
    playerCount: 3,
    targetThreatLevel: 6,
    soloMode: false,
    players: ['bob@example.com']
  },
  {
    name: 'Completed Victory',
    ownerEmail: 'fiona@example.com',
    status: 'completed' as const,
    playerCount: 4,
    targetThreatLevel: 8,
    soloMode: false,
    players: ['fiona@example.com', 'charlie@example.com', 'diana@example.com']
  },
  {
    name: 'Co-op Adventure',
    ownerEmail: 'ethan@example.com',
    status: 'setup' as const,
    playerCount: 2,
    targetThreatLevel: 9,
    soloMode: true,
    players: ['ethan@example.com', 'alice@example.com']
  }
]

/**
 * Create initial game state for campaign
 */
function createInitialGameState(playerCount: number, targetThreatLevel: number, soloMode: boolean, status: string) {
  const baseState = {
    gameStarted: status !== 'setup',
    gameEnded: status === 'completed',
    soloMode,
    currentRound: status === 'completed' ? 8 : status === 'active' ? 3 : 0,
    currentPhase: status === 'setup' ? 'setup' : status === 'active' ? 'movement' : 'completed',
    currentPlayerIndex: 0,
    threatLevel: status === 'completed' ? targetThreatLevel : status === 'active' ? 5 : 1,
    targetThreatLevel,
    players: [],
    hexes: {},
    mapConfig: MAP_CONFIGS[playerCount as keyof typeof MAP_CONFIGS],
    eventLog: []
  }

  return baseState
}

/**
 * Create player state for campaign player
 */
function createPlayerState(status: string, isOwner: boolean) {
  const baseSP = status === 'active' ? 3 : 5
  const baseCP = status === 'active' ? 2 : status === 'completed' ? 8 : 0

  return {
    sp: baseSP,
    cp: baseCP + (isOwner ? 1 : 0),
    currentHex: status === 'active' ? `${Math.floor(Math.random() * 5)},${Math.floor(Math.random() * 5)}` : null,
    baseHex: status === 'active' ? '2,2' : null,
    camps: [],
    lastBattleResult: null,
    victoryCategories: {
      warlord: status === 'completed' ? Math.floor(Math.random() * 3) : 0,
      pioneer: status === 'completed' ? Math.floor(Math.random() * 3) : 0,
      explorer: status === 'completed' ? Math.floor(Math.random() * 3) : 0,
      trooper: status === 'completed' ? Math.floor(Math.random() * 3) : 0,
      warrior: status === 'completed' ? Math.floor(Math.random() * 3) : 0,
      headhunter: status === 'completed' ? Math.floor(Math.random() * 3) : 0
    }
  }
}

async function main() {
  console.log('🌱 Starting database seed...\n')

  // WHY: Use common password for all test accounts
  const commonPassword = await hashPassword('password123')

  // Step 1: Create test users
  console.log('Creating test users...')
  const createdUsers: { [email: string]: number } = {}

  for (const userData of TEST_USERS) {
    try {
      const [user] = await db
        .insert(users)
        .values({
          email: userData.email,
          username: userData.username,
          passwordHash: commonPassword
        })
        .returning()

      createdUsers[userData.email] = user.id
      console.log(`  ✓ Created user: ${userData.username} (${userData.email})`)
    } catch (error: any) {
      if (error.code === '23505') {
        // User already exists, fetch their ID
        const [existingUser] = await db
          .select()
          .from(users)
          .where((users, { eq }) => eq(users.email, userData.email))
          .limit(1)

        if (existingUser) {
          createdUsers[userData.email] = existingUser.id
          console.log(`  ℹ User already exists: ${userData.username} (${userData.email})`)
        }
      } else {
        console.error(`  ✗ Error creating user ${userData.username}:`, error.message)
      }
    }
  }

  console.log(`\n✓ Created/verified ${Object.keys(createdUsers).length} users\n`)

  // Step 2: Create test campaigns
  console.log('Creating test campaigns...')
  let campaignCount = 0

  for (const campaignData of TEST_CAMPAIGNS) {
    const ownerId = createdUsers[campaignData.ownerEmail]

    if (!ownerId) {
      console.log(`  ✗ Skipping campaign "${campaignData.name}" - owner not found`)
      continue
    }

    try {
      // Create campaign
      const [campaign] = await db
        .insert(campaigns)
        .values({
          name: campaignData.name,
          ownerId,
          settings: {
            playerCount: campaignData.playerCount,
            targetThreatLevel: campaignData.targetThreatLevel,
            soloMode: campaignData.soloMode
          },
          gameState: createInitialGameState(
            campaignData.playerCount,
            campaignData.targetThreatLevel,
            campaignData.soloMode,
            campaignData.status
          ),
          status: campaignData.status
        })
        .returning()

      console.log(`  ✓ Created campaign: ${campaign.name} (${campaign.status})`)

      // Add players to campaign
      for (const playerEmail of campaignData.players) {
        const playerId = createdUsers[playerEmail]

        if (!playerId) {
          console.log(`    ✗ Skipping player ${playerEmail} - user not found`)
          continue
        }

        const playerName = TEST_USERS.find(u => u.email === playerEmail)?.name || 'Unknown'
        const isOwner = playerEmail === campaignData.ownerEmail

        await db.insert(campaignPlayers).values({
          campaignId: campaign.id,
          userId: playerId,
          playerName,
          playerState: createPlayerState(campaignData.status, isOwner)
        })

        console.log(`    ✓ Added player: ${playerName}`)
      }

      campaignCount++
    } catch (error: any) {
      console.error(`  ✗ Error creating campaign "${campaignData.name}":`, error.message)
    }
  }

  console.log(`\n✓ Created ${campaignCount} campaigns\n`)

  console.log('🎉 Database seeding complete!\n')
  console.log('Test credentials:')
  console.log('  Email: alice@example.com (or any test user)')
  console.log('  Password: password123\n')

  process.exit(0)
}

main().catch((error) => {
  console.error('Fatal error during seeding:', error)
  process.exit(1)
})
