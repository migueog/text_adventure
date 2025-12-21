// Type definitions for the campaign manager

export interface Location {
  name: string
  description: string
  effect: string
  value?: number | string
  modifier?: number
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

export interface Hex {
  id: string
  row: number
  col: number
  type: 'surface' | 'tomb'
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

export type BattleResult = 'win' | 'loss' | 'draw' | 'bye'

export type ActionType = 'scout' | 'resupply' | 'search' | 'encamp' | 'demolish'
