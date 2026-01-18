// Type definitions for the campaign manager

// WHY: Import extended battle types for enhanced battle history
import type { ExtendedBattleRecord } from './battle'

// WHY: Define search rule type system for location-based search rewards
export type SearchRule =
  | { type: 'sp', amount: 'd3' | 'd3+1' | number }
  | { type: 'cp', amount: number }
  | { type: 'both', sp: 'd3' | 'd3+1' | number, cp: number }
  | null  // WHY: null means no search available at this location

// WHY: Define campaign phase type for phase guidance (Issue #33)
export type Phase = 'Movement' | 'Battle' | 'Action' | 'Threat'

/**
 * WHY: Return type for REGROUP destination calculation (Issue #38)
 * Supports tie-breaking when multiple destinations are equidistant
 */
export interface RegroupDestinationResult {
  destinations: HexPosition[]
  distance: number
  requiresChoice: boolean
}

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
  backstory?: string  // WHY: Kill team narrative/backstory for campaign storytelling (Issue #22)
  faction?: string    // WHY: Optional faction name for narrative flavor (Issue #22)
}

// WHY: Track warning level for approaching campaign end (1-2 levels from target)
export type ThreatWarningLevel = 'none' | 'moderate' | 'critical'

/**
 * WHY: Issue #52 - Operative database for quick-select UI in kill recording
 * Pre-defined Kill Team operatives with wound characteristics for HEADHUNTER tracking
 */
export interface Operative {
  id: string            // Unique identifier (kebab-case, e.g., "fire-warrior")
  name: string          // Display name (e.g., "Fire Warrior")
  faction: string       // Faction name (e.g., "T'au Empire")
  wounds: number        // Wound characteristic (determines woundValue)
  woundValue: number    // Pre-calculated: 0 (≤5W), 1 (6-10W), 2 (11+W)
  category?: string     // Optional: "Troops", "Leader", "Elite", etc.
}

export type OperativeDatabase = Record<string, Operative>

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
  type: 'system' | 'movement' | 'exploration' | 'reward' | 'action' | 'battle' | 'warning' | 'error' | 'milestone'
  icon: string
  message: string
  round: number
  phase: string
  timestamp: string
  // WHY: Add narrative enrichment for campaign storytelling (Issue #22)
  narrative?: {
    flavor: string           // Auto-generated narrative text
    category: 'combat' | 'exploration' | 'movement' | 'custom' | 'milestone'
    isCustom: boolean        // true = player-written, false = auto-generated
    locationName?: string    // Context for exploration events
    playerNames?: string[]   // Players involved in event
  }
}

/**
 * WHY: Phase guidance state for tutorial tooltips (Issue #33)
 * Tracks which phase guidance tooltips have been dismissed by the user
 * Stored in localStorage for persistence across sessions
 */
export interface PhaseGuidanceState {
  movement: boolean
  battle: boolean
  action: boolean
  threat: boolean
  enabledGlobally: boolean
}

/**
 * WHY: Phase guidance content structure (Issue #33)
 * Defines all help text and instructions shown for each campaign phase
 */
export interface PhaseGuidanceContent {
  title: string
  instruction: string
  availableActions: string[]
  keyRules: string[]
  tutorialTip: string
}

/**
 * WHY: Audit trail types for tracking hex modification history (Issue #23 - Phase 3)
 * Provides before/after snapshots and queryable audit log
 */

/**
 * WHY: Snapshot of hex state at a point in time
 * Used for before/after comparisons in audit entries
 */
export interface HexSnapshot {
  explored: boolean
  location: number
  condition: number
  exploredBy: number[]
  state?: {
    intelRemaining?: number
    portalDestination?: string
    blockedHex?: string
    beastLairActive?: boolean
    prisoners?: number
  }
  exploredLocation?: string
  exploredCondition?: string
}

/**
 * WHY: Types of actions that modify hex state
 * Used to categorize audit entries
 */
export type AuditActionType =
  | 'EXPLORE'           // Player explores hex
  | 'MOVE'              // Player moves to hex
  | 'SCOUT'             // Player scouts hex
  | 'SEARCH'            // Player searches hex (Intel Cache)
  | 'ENCAMP'            // Player builds camp
  | 'DEMOLISH'          // Player demolishes structure
  | 'PORTAL_CONFIG'     // Portal network configured
  | 'HEX_BLOCK'         // Hex blocking configured
  | 'STATE_CHANGE'      // Generic hex state change

/**
 * WHY: Single audit log entry with before/after snapshots
 * Immutable record of a hex modification
 */
export interface AuditEntry {
  id: string                    // Unique identifier
  timestamp: string             // ISO timestamp
  round: number                 // Campaign round when action occurred
  phase: string                 // Phase when action occurred
  playerId: number              // Player who performed action
  playerName: string            // Player name (for display)
  action: AuditActionType       // Type of action
  hexId: string                 // Hex that was modified
  before: HexSnapshot           // Hex state before modification
  after: HexSnapshot            // Hex state after modification
  reason: string                // Human-readable description
}

/**
 * WHY: Complete audit log with version for migration support
 * Contains all audit entries for a campaign
 */
export interface CampaignAuditLog {
  entries: AuditEntry[]
  version: string
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
  hexSelection: HexSelection        // WHY: Dual-selection state for hex-based controls
  players: Player[]
  hexes: Record<string, Hex>
  mapConfig: MapConfig | null
  eventLog: Event[]

  // WHY: Solo campaign mode tracking (Issue #53)
  soloVictory?: boolean  // true = 10+ CP success, false = threat 10 failure, undefined = ongoing

  // WHY: Solo campaign settings (Issue #53 - future-ready for Issue #35)
  soloSettings?: {
    jointOpsMode: boolean           // Playing with Joint Ops missions
    ignoreConditions: boolean       // Skip hex conditions for battles
    resupplyReductionsUsed: number  // Track 0-3 uses (not enforced yet)
  }
}

// WHY: Solo mode threat trigger types (Issue #54)
export type SoloThreatTrigger =
  | 'TOMB_EXPLORATION'
  | 'BATTLE_WIN'
  | 'BATTLE_LOSS_DRAW'
  | 'SEARCH_ACTION'
  | 'TROPHY_HALL_DEMOLISH'      // TL24
  | 'VOID_SHIELD_SEARCH'         // TL35

// WHY: Structured result for threat check execution (Issue #54)
export interface ThreatCheckResult {
  trigger: SoloThreatTrigger
  triggerName: string           // Human-readable name
  roll: number                  // Dice roll value (1-6 for D6, 1-3 for D3)
  threshold?: number            // Required roll (undefined = automatic)
  success: boolean              // Did threat increase?
  increase: number              // Amount threat increased (0-3)
  preventable: boolean          // Can player spend SP to prevent?
  prevented: boolean            // Did player prevent it?
  description: string           // Event log message
}

// WHY: Resupply threat reduction result (Issue #54)
export interface ResupplyReductionResult {
  available: boolean            // Can reduction be used?
  usesRemaining: number         // 0-3 uses left
  reductionAmount: number | 'D3'  // Fixed amount or roll D3
  location: 'base' | 'camp' | 'other'  // Location type
  roll?: number                 // Actual D3 roll (only if D3)
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

/**
 * WHY: Map state validation types (Issue #23 - Phase 1)
 * Categorizes different types of map state integrity violations
 */
export type MapValidationErrorType =
  | 'OVERLAPPING_BASE'      // Multiple bases at same hex
  | 'OVERLAPPING_CAMP'      // Multiple camps at same hex
  | 'INVALID_PLAYER_ID'     // exploredBy contains non-existent player
  | 'BROKEN_PORTAL'         // Portal destination doesn't exist
  | 'BEAST_LAIR_VIOLATION'  // Beast Lair at wrong location (not TL23)
  | 'INTEL_OVERFLOW'        // Intel Cache count > D6 (6)
  | 'INVALID_HEX_STATE'     // Hex state inconsistency

/**
 * WHY: Individual map validation error with context and suggested fix
 */
export interface MapValidationError {
  type: MapValidationErrorType
  hexId: string
  severity: 'error' | 'warning'
  message: string
  affectedPlayerIds?: number[]
  suggestedFix?: string
}

/**
 * WHY: Complete validation result with timestamp for audit trail
 */
export interface MapValidationResult {
  valid: boolean
  errors: MapValidationError[]
  warnings: MapValidationError[]
  timestamp: string
}

/**
 * WHY: Round statistics for summary display (Issue #31 - Phase 1)
 * Calculated on-demand from event log and player history
 */
export interface RoundStatistics {
  hexesExplored: number
  battles: {
    wins: number
    losses: number
    draws: number
    byes: number
  }
  spChanges: Record<number, number>  // playerId → SP delta
  cpChanges: Record<number, number>  // playerId → CP delta
  threatChange: {
    from: number
    to: number
  }
  majorEvents: Event[]
}

/**
 * WHY: Milestone notification for significant round markers (Issue #31 - Phase 1)
 * Triggered at intervals, halfway point, and final warning
 */
export interface Milestone {
  type: 'interval' | 'halfway' | 'final-warning'
  round: number
  message: string
  icon: string
}

/**
 * WHY: Exploration result data structure (Issue #58)
 * Contains discovered location and condition from D36 hex exploration
 */
export interface ExplorationResult {
  hexId: string
  hexNumber: number
  location: { name: string; description: string; effect: string }
  condition: { name: string; description: string; effect: string }
  locationRoll: number
  conditionRoll: number
  playerName: string
}

/**
 * WHY: Hex-based action menu system (hex-based player controls)
 * Tracks source/target selection for contextual action menus on canvas
 */
export interface HexSelection {
  sourceHex: string | null          // WHY: Player's current hex (where they are positioned)
  targetHex: string | null          // WHY: Target hex for action (where they want to act)
  selectedPlayerId: number | null   // WHY: Which player is acting (for multi-player hexes)
  menuPosition: { x: number; y: number } | null  // WHY: Canvas coordinates for contextual menu
}

/**
 * WHY: Available action for contextual menu display
 * Combines validation logic with UI presentation
 */
export interface ActionOption {
  type: 'move' | 'scout' | 'search' | 'encamp' | 'hold' | 'resupply' | 'regroup'
  label: string         // WHY: Display text (e.g., "Move here (2 SP)")
  cost: number          // WHY: SP cost for action
  valid: boolean        // WHY: Can this action be executed?
  reason?: string       // WHY: Error message if invalid (shown in disabled state)
}
