// Type definitions for the campaign manager

// WHY: Import extended battle types for enhanced battle history
import type { ExtendedBattleRecord } from './battle'

// WHY: Define search rule type system for location-based search rewards
export type SearchRule =
  | { type: 'sp', amount: 'd3' | 'd3+1' | number }
  | { type: 'cp', amount: number }
  | { type: 'both', sp: 'd3' | 'd3+1' | number, cp: number }
  | null  // WHY: null means no search available at this location

// WHY: Define threat phase rule types for location-based effects during Threat Phase
// These effects resolve BEFORE the standard +1 threat increase each round
export type ThreatPhaseRuleType = 'sp_gain' | 'sp_penalty' | 'cp_gain' | 'threat_increase'

// WHY: Some effects target only the player in the hex, others affect all players in that hex
export type ThreatPhaseRuleTarget = 'player_in_hex' | 'all_in_hex'

// WHY: Structured rule definition for location-based Threat Phase effects
export interface ThreatPhaseRule {
  type: ThreatPhaseRuleType
  amount: number
  target: ThreatPhaseRuleTarget
  description: string  // Human-readable effect for UI display
}

// WHY: Track active rules with player/hex context for sequential resolution
// Used during Threat Phase to show and resolve location rules in priority order
export interface ActiveThreatPhaseRule {
  player: Player
  hexId: string
  location: Location
  rule: ThreatPhaseRule
  priority: number
}

// WHY: Result of resolving a threat phase rule for event logging and UI feedback
export interface ThreatPhaseRuleResolution {
  playerId: number
  playerName: string
  locationName: string
  hexId: string
  effect: string
  spChange?: number
  cpChange?: number
  threatChange?: number
}

// WHY: Rich result object for UI display and logging
export interface SearchResult {
  success: boolean
  spGained: number
  cpGained: number
  description: string
  roll?: number  // WHY: For d3/d3+1 rolls, show the dice result
}

export interface Location {
  name: string
  description: string
  effect: string
  value?: number | string
  modifier?: number
  searchRule: SearchRule  // WHY: One-time search reward for this location
  threatPhaseRule?: ThreatPhaseRule | null  // WHY: Optional rule that triggers during Threat Phase
}

export interface Condition {
  name: string
  description: string
  effect: string
  value?: number | string
  modifier?: number
}

export interface MapConfig {
  name: string
  rows: number
  cols: number
  surfaceRows: number
  tombRows: number
}

export interface HexPosition {
  row: number
  col: number
}

/**
 * WHY: Options for Encamp action with camp removal support
 */
export interface EncampOptions {
  cost: number
  campToRemove?: HexPosition  // Optional: camp to remove when at 2-camp limit
}

/**
 * Options for Demolish action (Issue #47)
 *
 * WHY: Requires target player ID to identify which camp owner to demolish.
 * Player must have won battle against target OR challenged-refused/no-show this round.
 *
 * @property {number} targetPlayerId - ID of player whose camp to demolish
 */
export interface DemolishOptions {
  targetPlayerId: number
}

export interface Hex {
  id: string
  row: number
  col: number
  type: 'surface' | 'tomb' | 'blocked'
  location: number
  condition: number
  explored: boolean
  exploredBy: number[]
}

export interface HistoryEntry {
  round: number
  phase: string
  timestamp: string
  action: string
  spBefore: number
  spAfter: number
  cpBefore: number
  cpAfter: number
}

// WHY: Track current round's battle result for Action Phase turn ordering
export type BattleResult = 'WIN' | 'DRAW' | 'LOSS' | 'BYE'

/**
 * Battle history record for tracking Demolish action prerequisites (Issue #47)
 *
 * WHY: Each battle record stores complete information to validate demolish attempts.
 * Prerequisites: WIN result OR challenged-refused/no-show status in current round.
 *
 * @property {number} round - Round number when battle occurred
 * @property {number | null} opponent - Opponent player ID (null for BYE)
 * @property {BattleResult} result - Battle outcome (WIN, LOSS, DRAW, BYE)
 * @property {'completed' | 'challenged-refused' | 'challenged-no-show'} status - Battle status
 * @property {number} operativesKilled - Number of operatives killed in battle
 */
export interface BattleRecord {
  round: number
  opponent: number | null
  result: BattleResult
  status: 'completed' | 'challenged-refused' | 'challenged-no-show'
  operativesKilled: number
}

export interface Player {
  id: number
  name: string
  killTeamName: string
  color: string
  supplyPoints: number
  campaignPoints: number
  position: HexPosition
  bases: HexPosition[]
  camps: HexPosition[]
  exploredHexes: number
  gamesPlayed: number
  gamesWon: number
  gamesLost: number
  operativesKilled: number
  history: HistoryEntry[]
  priority?: number
  battleResult: BattleResult | null  // WHY: Current round's battle result (null = no battle this round)
  searchedHexes: string[]  // WHY: Track which hexes this player has searched (one-time use)
  battleHistory: ExtendedBattleRecord[]  // WHY: Extended battle history with details for Issue #34
}

// WHY: Track warning level for approaching campaign end (1-2 levels from target)
export type ThreatWarningLevel = 'none' | 'moderate' | 'critical'

export interface Event {
  type: 'system' | 'movement' | 'exploration' | 'reward' | 'action' | 'battle' | 'warning' | 'error'
  icon: string
  message: string
  round: number
  phase: string
  timestamp: string
}

export interface CampaignState {
  gameStarted: boolean
  gameEnded: boolean
  soloMode: boolean
  currentRound: number
  currentPhase: 'Movement' | 'Battle' | 'Action' | 'Threat'
  currentPlayerIndex: number
  threatLevel: number
  targetThreatLevel: number
  selectedHex: string | null
  players: Player[]
  hexes: Record<string, Hex>
  mapConfig: MapConfig | null
  eventLog: Event[]
}

export type ActionType = 'scout' | 'resupply' | 'search' | 'encamp' | 'demolish'
