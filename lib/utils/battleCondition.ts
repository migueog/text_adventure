// Battle condition determination utilities for Issue #40
// WHY: Determine which hex's condition applies during Battle Phase based on player positions

import type { Player, Hex, Condition } from '@/types/campaign'
import type {
  ActiveBattleCondition,
  ConditionSelectionReason,
  KillzoneRecommendation,
  ConditionExportData,
  ConditionSourceHex
} from '@/types/battleCondition'
import { SURFACE_CONDITIONS, TOMB_CONDITIONS } from '@/lib/data/campaignData'
import { hexId } from './hexUtils'

/**
 * Killzone recommendations based on hex type
 * WHY: Tomb hexes suit close quarters, surface hexes work with any killzone
 */
export const KILLZONE_RECOMMENDATIONS: Record<'surface' | 'tomb', KillzoneRecommendation> = {
  tomb: {
    category: 'close-quarters',
    name: 'Close Quarters Killzone',
    examples: [
      'Killzone: Tomb World',
      'Gallowdark',
      'Into the Dark',
      'Shadowvaults'
    ],
    reason: 'Tomb conditions suit close combat environments with narrow corridors'
  },
  surface: {
    category: 'any',
    name: 'Any Killzone',
    examples: [
      'Killzone: Volkus',
      'Killzone: Bheta-Decima',
      'Chalnath',
      'Octarius'
    ],
    reason: 'Surface conditions work with open battlefields and varied terrain'
  }
}

/**
 * Get condition object from hex data
 * WHY: Conditions are stored as D36 index (11-36), need to look up in appropriate table
 */
function getConditionFromHex(hex: Hex): Condition | null {
  // Unexplored or invalid condition index
  if (!hex.explored || hex.condition === 0) {
    return null
  }

  const conditionTable = hex.type === 'tomb' ? TOMB_CONDITIONS : SURFACE_CONDITIONS
  return conditionTable[hex.condition] ?? null
}

/**
 * Create source hex info from hex object
 * WHY: Provides structured info about where the condition comes from
 */
function createSourceHex(hex: Hex): ConditionSourceHex {
  return {
    id: hex.id,
    row: hex.row,
    col: hex.col,
    type: hex.type as 'surface' | 'tomb'
  }
}

/**
 * Determine which condition applies to the battle
 *
 * Business Logic (from Issue #40):
 * - If both players in same hex -> use that hex's condition
 * - If different hexes -> use condition from player WITHOUT initiative
 * - Initiative: Player with priority HAS initiative (lower priority number)
 * - Condition source: Player with HIGHER priority number (without initiative)
 *
 * @param player1 - The current player recording the battle
 * @param player2 - The opponent player (null for BYE or external opponent)
 * @param hexes - The hex grid data
 * @returns ActiveBattleCondition with condition info and reason
 */
export function determineActiveCondition(
  player1: Player,
  player2: Player | null,
  hexes: Record<string, Hex>
): ActiveBattleCondition {
  // Handle BYE or external opponent
  if (!player2) {
    return {
      condition: null,
      sourceHex: null,
      reason: 'no-opponent',
      conditionProviderPlayerId: null,
      conditionProviderName: null
    }
  }

  const p1HexId = hexId(player1.position.row, player1.position.col)
  const p2HexId = hexId(player2.position.row, player2.position.col)
  const p1Hex = hexes[p1HexId]

  // Same hex case - use that hex's condition
  if (p1HexId === p2HexId && p1Hex) {
    const condition = getConditionFromHex(p1Hex)
    return {
      condition,
      sourceHex: createSourceHex(p1Hex),
      reason: 'same-hex',
      conditionProviderPlayerId: null,
      conditionProviderName: null
    }
  }

  // Different hexes - find player without initiative
  // Player WITH initiative has LOWER priority number
  // Player WITHOUT initiative has HIGHER priority number
  const p1Priority = player1.priority ?? Infinity
  const p2Priority = player2.priority ?? Infinity

  // Use condition from player with HIGHER priority number (without initiative)
  // If tied, use player2's hex (the opponent)
  const playerWithoutInitiative = p1Priority > p2Priority ? player1 : player2
  const relevantHexId = hexId(
    playerWithoutInitiative.position.row,
    playerWithoutInitiative.position.col
  )
  const relevantHex = hexes[relevantHexId]

  // Handle missing hex data
  if (!relevantHex) {
    return {
      condition: null,
      sourceHex: null,
      reason: 'no-initiative',
      conditionProviderPlayerId: playerWithoutInitiative.id,
      conditionProviderName: playerWithoutInitiative.name
    }
  }

  const condition = getConditionFromHex(relevantHex)

  return {
    condition,
    sourceHex: createSourceHex(relevantHex),
    reason: 'no-initiative',
    conditionProviderPlayerId: playerWithoutInitiative.id,
    conditionProviderName: playerWithoutInitiative.name
  }
}

/**
 * Get killzone recommendation based on hex type
 * WHY: Tomb hexes recommend close quarters killzones, surface hexes work with any
 */
export function getKillzoneRecommendation(
  hexType: 'surface' | 'tomb'
): KillzoneRecommendation {
  return KILLZONE_RECOMMENDATIONS[hexType]
}

/**
 * Format reason string for display
 * WHY: Provides human-readable explanation of why this condition was selected
 */
function formatReasonString(
  reason: ConditionSelectionReason,
  providerName: string | null
): string {
  switch (reason) {
    case 'same-hex':
      return 'Both players in same hex'
    case 'no-initiative':
      return providerName
        ? `${providerName}'s hex (without initiative)`
        : 'Opponent\'s hex (without initiative)'
    case 'no-opponent':
      return 'No opponent - condition rules do not apply'
    case 'disabled':
      return 'Condition rules disabled for this battle'
    default:
      return 'Unknown reason'
  }
}

/**
 * Format condition for export/print
 * WHY: Creates structured data for generating printable condition reference
 */
export function formatConditionExport(
  activeCondition: ActiveBattleCondition,
  killzone: KillzoneRecommendation | null,
  round: number
): ConditionExportData {
  const now = new Date()
  const generatedAt = now.toISOString().replace('T', ' ').substring(0, 16)

  // Handle null condition case
  if (!activeCondition.condition || !activeCondition.sourceHex) {
    return {
      battleInfo: `Round ${round}`,
      conditionName: 'No Condition',
      conditionDescription: 'No condition applies to this battle.',
      conditionEffect: 'none',
      hexType: 'surface',
      hexId: 'N/A',
      sourceReason: formatReasonString(
        activeCondition.reason,
        activeCondition.conditionProviderName
      ),
      killzoneRecommendation: killzone?.name ?? 'Any Killzone',
      killzoneExamples: killzone?.examples ?? [],
      generatedAt,
      round
    }
  }

  return {
    battleInfo: `Round ${round}`,
    conditionName: activeCondition.condition.name,
    conditionDescription: activeCondition.condition.description,
    conditionEffect: activeCondition.condition.effect,
    hexType: activeCondition.sourceHex.type,
    hexId: activeCondition.sourceHex.id,
    sourceReason: formatReasonString(
      activeCondition.reason,
      activeCondition.conditionProviderName
    ),
    killzoneRecommendation: killzone?.name ?? 'Any Killzone',
    killzoneExamples: killzone?.examples ?? [],
    generatedAt,
    round
  }
}

/**
 * Generate printable text from export data
 * WHY: Creates formatted text suitable for copying/printing for tabletop reference
 */
export function generatePrintableCondition(
  exportData: ConditionExportData
): string {
  const hexTypeDisplay = exportData.hexType.charAt(0).toUpperCase() +
    exportData.hexType.slice(1)
  const examplesStr = exportData.killzoneExamples.join(', ')

  const lines = [
    '=====================================',
    'KILL TEAM BATTLE CONDITIONS',
    `${exportData.battleInfo} - Generated ${exportData.generatedAt}`,
    '=====================================',
    '',
    `CONDITION: ${exportData.conditionName}`,
    `TYPE: ${hexTypeDisplay} Hex (${exportData.hexId})`,
    `SOURCE: ${exportData.sourceReason}`,
    '',
    'DESCRIPTION:',
    exportData.conditionDescription,
    '',
    'KILLZONE RECOMMENDATION:',
    `${exportData.killzoneRecommendation}`,
    examplesStr ? `Examples: ${examplesStr}` : '',
    '',
    '=====================================',
    'Ctesiphus Expedition Campaign Manager',
    '====================================='
  ]

  return lines.filter(line => line !== '').join('\n')
}

/**
 * Copy condition text to clipboard
 * WHY: Provides easy way to copy condition rules for tabletop reference
 */
export async function copyConditionToClipboard(text: string): Promise<void> {
  if (!navigator?.clipboard) {
    throw new Error('Clipboard API not available')
  }

  await navigator.clipboard.writeText(text)
}
