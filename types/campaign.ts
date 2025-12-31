// Type definitions for the campaign manager

// WHY: Define search rule type system for location-based search rewards
export type SearchRule =
  | { type: 'sp', amount: 'd3' | 'd3+1' | number }
  | { type: 'cp', amount: number }
  | { type: 'both', sp: 'd3' | 'd3+1' | number, cp: number }
  | null  // WHY: null means no search available at this location

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
 * WHY: Options for Demolish action (Issue #47, Phase 5)
 * Requires target player ID to identify which camp owner to demolish
 */
export interface DemolishOptions {
  targetPlayerId: number  // Which player's camp to demolish
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
 * WHY: Track battle history for Demolish action prerequisites (Issue #47)
 * Records complete battle information including opponent, result, and challenge status
 */
export interface BattleRecord {
  round: number
  opponent: number | null  // WHY: null for BYE, player ID otherwise
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
  battleHistory: BattleRecord[]  // WHY: Full battle history for Demolish action prerequisites
}

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
