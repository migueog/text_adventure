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

// WHY: Location type categories for D36 exploration system (Issue #58)
// REPEATABLE: Can be found multiple times (e.g., SL11-16 "Ruin")
// UNIQUE: Found only once per campaign (e.g., SL21 "Abandoned Camp")
// SPECIAL: Unique with complex mechanics (e.g., SL23 "Beast Lair")
export type LocationType = 'REPEATABLE' | 'UNIQUE' | 'SPECIAL'

// WHY: Camp rule categories for location-specific camping restrictions (Issue #58)
// ALLOWED: Normal camping permitted
// DANGEROUS: Camping possible but risky
// FORBIDDEN: Cannot camp at this location (e.g., Beast Lair)
export type CampRule = 'FORBIDDEN' | 'DANGEROUS' | 'ALLOWED'

// WHY: Hex-level state for special location mechanics (Issue #58)
// Tracks dynamic properties like depleting resources, portal links, active threats
export interface HexState {
  supplyCount?: number          // WHY: Remaining SP for depleting locations (Abandoned Camp, Resource Stockpile)
  intelGained?: boolean         // WHY: Track if intel reward already claimed (Intelligence Cache)
  intelRemaining?: number       // WHY: Remaining intel at Intel Cache (D6 on discovery, depletes on search) (Issue #59)
  portalDestination?: string    // WHY: Linked hex ID for portal locations (legacy, replaced by portalDestinations)
  portalDestinations?: {        // WHY: Portal network links for Tomb Ruin (TL11) - one tomb, one surface (Issue #59)
    tomb: string
    surface: string
  }
  beastLairActive?: boolean     // WHY: Track if Beast Lair threat is still active
  blockedByFulcrumId?: string   // WHY: Tracks which Transtechnic Fulcrum (TL25) has blocked this hex (Issue #59)
}

export interface Location {
  id?: string                   // WHY: Unique identifier (e.g., "SL11-16", "SL21") for re-roll duplicate detection (Issue #58)
  number?: number | string      // WHY: D36 roll number (11-16 range for repeatable, 21 for unique)
  type?: LocationType           // WHY: Location category for gameplay rules
  repeatable?: boolean          // WHY: If true, allows duplicate explorations (e.g., Ruin at 11-16)
  name: string
  description: string
  effect: string
  value?: number | string
  modifier?: number
  searchRule: SearchRule        // WHY: One-time search reward for this location
  threatPhaseRule?: ThreatPhaseRule | null  // WHY: Optional rule that triggers during Threat Phase
  initialState?: Record<string, number>     // WHY: Initial values for depleting resources (e.g., { supplyCount: D6 })
  specialRules?: string[]       // WHY: Tags for complex mechanics (e.g., ["BEAST_LAIR", "PORTAL"])
  campRule?: CampRule           // WHY: Camping restriction level for this location
}

// WHY: Condition type categories for D36 exploration system (Issue #58)
// REPEATABLE: Can occur multiple times (e.g., SC11-16 "Clear")
// STANDARD: Occurs once per campaign
export type ConditionType = 'REPEATABLE' | 'STANDARD'

export interface Condition {
  id?: string                   // WHY: Unique identifier (e.g., "SC11-16", "SC21") for re-roll duplicate detection (Issue #58)
  number?: number | string      // WHY: D36 roll number (11-16 range for repeatable, 21 for unique)
  type?: ConditionType          // WHY: Condition category for gameplay rules
  repeatable?: boolean          // WHY: If true, allows duplicate occurrences (e.g., Clear at 11-16)
  name: string
  description: string
  effect: string
  value?: number | string
  modifier?: number
  battleEffect?: string         // WHY: Structured battle effect description for Kill Team battles
  specialRules?: string[]       // WHY: Tags for complex condition mechanics
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
  state?: HexState              // WHY: Optional state for special location mechanics (depleting resources, portals, etc.)
  exploredLocation?: string     // WHY: Location ID for re-roll tracking (e.g., "SL21", "SL11-16")
  exploredCondition?: string    // WHY: Condition ID for re-roll tracking (e.g., "SC21", "SC11-16")
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

/**
 * Operative Kill Details for Wound-Based Tracking (Issue #50)
 * WHY: HEADHUNTER victory category uses wound-based counting (not raw kill count)
 */
export interface OperativeKill {
  round: number                  // WHY: Track which round the kill occurred
  operativeName: string          // WHY: Track operative type killed
  wounds: number                 // WHY: Wound characteristic determines point value
  woundValue: number             // WHY: Calculated value: 0 (≤5W), 1 (6-10W), 2 (11+W)
  opponentId?: number | null     // WHY: Track opponent (null for external/non-campaign opponents)
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
  hasDimensionalKey?: boolean  // WHY: Track if player has the unique Dimensional Key (Issue #59)
  intelCount?: number  // WHY: Track intel available for free scouts (Issue #59)
  supplyPointsSpent?: number  // WHY: Track cumulative SP spent for PIONEER victory category (Issue #50)
  operativeKillDetails?: OperativeKill[]  // WHY: Track kill details for wound-based HEADHUNTER category (Issue #50)
}

// WHY: Track warning level for approaching campaign end (1-2 levels from target)
export type ThreatWarningLevel = 'none' | 'moderate' | 'critical'

/**
 * WHY: Track Released Prisoner entity state (Issue #59)
 * Released Prisoner is spawned when camping at Hyperfractal Gaol (TL32)
 * Moves and attacks during Threat Phase
 */
export interface ReleasedPrisonerEntity {
  active: boolean                 // WHY: Is prisoner currently on the map?
  currentHexId: string           // WHY: Which hex is prisoner currently in?
  controllingPlayerId: number    // WHY: Which player controls prisoner movement?
  movedThisRound: boolean        // WHY: Track if prisoner moved this round
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

// WHY: Issue #51 - Victory tie-breaking system
// Defines a single tie-breaking criterion with name and getter function
export interface TieBreakerCriterion {
  name: string                            // Display name (e.g., "Most Campaign Points")
  getter: (player: Player) => number      // Function to extract stat value from player
}

// WHY: Issue #51 - Result of tie-breaking resolution
// Contains winners, which tie-breaker was used, and eliminated players for UI display
export interface TieBreakerResult {
  winners: Player[]                       // One or more winners (multiple if ultimate tie)
  tieBreaker: string | null               // Name of tie-breaker used (null if no tie or shared)
  eliminatedPlayers: Player[]             // Players eliminated during resolution
  tieBreakerValues?: Record<number, number>  // Optional: tie-breaker values for tooltips
}
