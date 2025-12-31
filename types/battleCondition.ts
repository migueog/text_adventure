// Type definitions for Battle Phase condition rules and killzone integration
// WHY: Issue #40 - Determine which hex's condition applies during battle based on player positions

import type { Condition } from './campaign'

/**
 * WHY: Enum for clear UI display of why a condition was selected
 * - 'same-hex': Both players are in the same hex
 * - 'no-initiative': Condition from player without initiative (higher priority number)
 * - 'no-opponent': BYE or external opponent - no condition applies
 * - 'disabled': User disabled condition rules for non-campaign battles
 */
export type ConditionSelectionReason =
  | 'same-hex'
  | 'no-initiative'
  | 'no-opponent'
  | 'disabled'

/**
 * Source hex information for the active condition
 * WHY: Provides context about where the condition comes from
 */
export interface ConditionSourceHex {
  id: string
  row: number
  col: number
  type: 'surface' | 'tomb'
}

/**
 * Result of condition determination for battle
 * WHY: Contains all information needed to display active condition in Battle Phase
 */
export interface ActiveBattleCondition {
  /** The condition object with name, description, effect (null if no condition applies) */
  condition: Condition | null
  /** Which hex the condition comes from (null if no condition) */
  sourceHex: ConditionSourceHex | null
  /** Why this condition was selected */
  reason: ConditionSelectionReason
  /** Player ID whose hex provided the condition (null if same hex or no opponent) */
  conditionProviderPlayerId: number | null
  /** Player name for display purposes */
  conditionProviderName: string | null
}

/**
 * Killzone recommendation category
 * WHY: Tomb hexes recommend close quarters, surface hexes recommend any killzone
 */
export type KillzoneCategory = 'close-quarters' | 'any'

/**
 * Killzone recommendation based on hex type
 * WHY: Provides guidance for which Kill Team killzone to use during actual gameplay
 */
export interface KillzoneRecommendation {
  category: KillzoneCategory
  name: string
  examples: string[]
  reason: string
}

/**
 * Condition export format for print/copy functionality
 * WHY: Allows players to copy/print condition rules for use during tabletop game
 */
export interface ConditionExportData {
  battleInfo: string
  conditionName: string
  conditionDescription: string
  conditionEffect: string
  hexType: 'surface' | 'tomb'
  hexId: string
  sourceReason: string
  killzoneRecommendation: string
  killzoneExamples: string[]
  generatedAt: string
  round: number
}

/**
 * Props for BattleConditionDisplay component
 * WHY: Defines the component interface for displaying battle conditions
 */
export interface BattleConditionDisplayProps {
  /** The active condition for the battle (null before opponent selected) */
  activeCondition: ActiveBattleCondition | null
  /** Killzone recommendation based on hex type */
  killzoneRecommendation: KillzoneRecommendation | null
  /** Whether condition rules are enabled */
  conditionEnabled: boolean
  /** Callback to toggle condition rules on/off */
  onToggleCondition: (enabled: boolean) => void
  /** Current round number for export */
  round: number
}
