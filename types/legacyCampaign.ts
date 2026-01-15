/**
 * WHY: Issue #57 - Legacy Campaign Continuation System
 * Type definitions for campaign snapshot and restoration
 */

import type { HexPosition, HexState } from './campaign'

/**
 * WHY: Snapshot of campaign state for legacy continuation
 * Stores final map state when solo campaign ends for future restoration
 */
export interface CampaignSnapshot {
  campaignId: string
  campaignName: string
  playerName: string
  killTeamName: string
  faction?: string
  backstory?: string

  // Map state
  mapSize: { rows: number; cols: number }
  exploredHexes: HexSnapshot[]

  // Campaign results
  finalCP: number
  finalThreat: number
  rounds: number
  success: boolean

  // Metadata
  completedDate: string
  targetThreatLevel: number
}

/**
 * WHY: Minimal hex state for legacy map restoration
 * Only stores explored hexes with their discovered locations/conditions
 * Tracks interaction history for strategic considerations
 */
export interface HexSnapshot {
  hexId: string          // e.g., "0-0"
  row: number
  col: number
  type: 'surface' | 'tomb'
  locationNumber: number // D36 roll result
  conditionNumber: number // D36 roll result
  locationId?: string    // e.g., "SL25", "SL11-16"
  conditionId?: string   // e.g., "SC21"
  state?: HexState       // Portal links, intel, depleting resources, etc.
  searched: boolean      // Was this hex searched by previous expedition?
  camped: boolean        // Was this hex used for camping?
}

/**
 * WHY: Settings for legacy campaign initialization
 * Passed from LegacyCampaignSetup to startGame() in store
 */
export interface LegacyCampaignSettings {
  useLegacyMap: boolean
  legacyCampaignId: string
  newBaseHex: HexPosition
  abandonedCampHexId: string
  abandonedCampCondition: number  // D36 roll for new condition at old base
}

/**
 * WHY: Container for all legacy campaign snapshots
 * Stored in localStorage, parallel to solo performance history
 * Pattern follows SoloPerformanceHistory structure
 */
export interface LegacyCampaignHistory {
  snapshots: CampaignSnapshot[]
  lastUpdated: string
}
