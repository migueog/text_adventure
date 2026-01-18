/**
 * Add players to a specific campaign
 *
 * WHY: Quickly populate an existing campaign with test players
 *
 * Run with: bun run scripts/add-players-to-campaign.ts
 */

import { db } from '../lib/db/client'
import { campaigns, campaignPlayers, users } from '../lib/db/schema'
import { eq, and, sql } from 'drizzle-orm'

const CAMPAIGN_NAME = 'test campaign'

const PLAYERS_TO_ADD = [
  { email: 'alice@example.com', name: 'Alice Commander' },
  { email: 'bob@example.com', name: 'Bob Tactician' },
  { email: 'charlie@example.com', name: 'Charlie Scout' },
  { email: 'diana@example.com', name: 'Diana Veteran' }
]

/**
 * Create player state for campaign player
 */
function createPlayerState() {
  return {
    sp: 5,
    cp: 0,
    currentHex: null,
    baseHex: null,
    camps: [],
    lastBattleResult: null,
    victoryCategories: {
      warlord: 0,
      pioneer: 0,
      explorer: 0,
      trooper: 0,
      warrior: 0,
      headhunter: 0
    }
  }
}

async function main() {
  console.log(`🔍 Looking for campaign: "${CAMPAIGN_NAME}"...\n`)

  // Find the campaign
  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(sql`LOWER(${campaigns.name}) = LOWER(${CAMPAIGN_NAME})`)
    .limit(1)

  if (!campaign) {
    console.error(`❌ Campaign "${CAMPAIGN_NAME}" not found!`)
    console.log('\nAvailable campaigns:')
    const allCampaigns = await db.select().from(campaigns)
    allCampaigns.forEach(c => console.log(`  - ${c.name} (ID: ${c.id})`))
    process.exit(1)
  }

  console.log(`✓ Found campaign: ${campaign.name} (ID: ${campaign.id})`)
  console.log(`  Status: ${campaign.status}`)
  console.log(`  Max players: ${campaign.settings.playerCount}\n`)

  // Check current player count
  const currentPlayers = await db
    .select()
    .from(campaignPlayers)
    .where(eq(campaignPlayers.campaignId, campaign.id))

  console.log(`Current players (${currentPlayers.length}):`)
  currentPlayers.forEach(p => console.log(`  - ${p.playerName}`))
  console.log()

  // Add new players
  let addedCount = 0

  for (const playerData of PLAYERS_TO_ADD) {
    // Find user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, playerData.email))
      .limit(1)

    if (!user) {
      console.log(`  ⚠️  User not found: ${playerData.email}`)
      continue
    }

    // Check if already a member
    const [existing] = await db
      .select()
      .from(campaignPlayers)
      .where(
        and(
          eq(campaignPlayers.campaignId, campaign.id),
          eq(campaignPlayers.userId, user.id)
        )
      )
      .limit(1)

    if (existing) {
      console.log(`  ℹ️  Already a member: ${playerData.name}`)
      continue
    }

    // Check if campaign is full
    const maxPlayers = campaign.settings.playerCount
    if (currentPlayers.length + addedCount >= maxPlayers) {
      console.log(`  ⚠️  Campaign is full (${maxPlayers}/${maxPlayers}), skipping: ${playerData.name}`)
      continue
    }

    // Add player
    await db.insert(campaignPlayers).values({
      campaignId: campaign.id,
      userId: user.id,
      playerName: playerData.name,
      playerState: createPlayerState()
    })

    console.log(`  ✓ Added player: ${playerData.name}`)
    addedCount++
  }

  console.log(`\n✅ Added ${addedCount} new player(s) to "${campaign.name}"\n`)

  // Show final player list
  const finalPlayers = await db
    .select()
    .from(campaignPlayers)
    .where(eq(campaignPlayers.campaignId, campaign.id))

  console.log(`Final player list (${finalPlayers.length}/${campaign.settings.playerCount}):`)
  finalPlayers.forEach(p => console.log(`  - ${p.playerName}`))
  console.log()

  process.exit(0)
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
