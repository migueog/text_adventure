/**
 * WHY: Issue #56 - Solo Performance Categories and Tracking
 *
 * Type definitions for solo campaign performance tracking, history storage,
 * and personal best records. Supports 5 performance categories: PIONEER,
 * EXPLORER, TROOPER, WARRIOR, and HEADHUNTER.
 */

/**
 * WHY: Represents a single performance category with its value and metadata
 */
export interface PerformanceCategory {
  name: string
  value: number
  description: string
}

/**
 * WHY: Calculated statistics derived from campaign performance
 * Used for comparative analysis across campaigns
 */
export interface PerformanceStats {
  winRate: number           // Games won / games played (0-1)
  avgCPPerRound: number     // Campaign points / rounds
  spSpentPerRound: number   // Supply points spent / rounds
  hexesPerRound: number     // Hexes explored / rounds
}

/**
 * WHY: Complete record of a single solo campaign performance
 * Saved to localStorage after each campaign completion
 */
export interface SoloPerformanceRecord {
  campaignId: string        // Unique identifier (e.g., 'campaign-1234567890')
  date: string              // ISO 8601 timestamp
  success: boolean          // True if 10+ CP achieved at threat 10
  finalCP: number           // Campaign points at campaign end
  finalThreat: number       // Threat level at campaign end
  rounds: number            // Number of rounds completed

  categories: {
    pioneer: PerformanceCategory       // Supply points spent
    explorer: PerformanceCategory      // Hexes explored
    trooper: PerformanceCategory       // Games played
    warrior: PerformanceCategory       // Games won
    headhunter: PerformanceCategory    // Enemy operative wounds inflicted
  }

  stats: PerformanceStats   // Calculated statistics
}

/**
 * WHY: Tracks the campaign that holds a personal best record
 * Nullable to support empty history (no campaigns yet)
 */
export interface PersonalBestRecord {
  value: number             // The best value achieved
  campaignId: string        // ID of campaign that set this record
  date: string              // ISO 8601 timestamp when record was set
}

/**
 * WHY: Collection of all personal best records across categories
 * Updated after each campaign completion
 */
export interface PersonalBests {
  highestCP: PersonalBestRecord | null                // Most campaign points
  mostSPSpent: PersonalBestRecord | null              // Most supply points spent
  mostHexesExplored: PersonalBestRecord | null        // Most hexes explored
  mostGamesPlayed: PersonalBestRecord | null          // Most battles fought
  mostGamesWon: PersonalBestRecord | null             // Most victories
  mostOperatives: PersonalBestRecord | null           // Most operative wounds inflicted
  shortestVictory: PersonalBestRecord | null          // Fewest rounds to victory
  longestVictory: PersonalBestRecord | null           // Most rounds to victory
}

/**
 * WHY: Complete solo performance history stored in localStorage
 * Contains all completed campaigns and current personal bests
 */
export interface SoloPerformanceHistory {
  campaigns: SoloPerformanceRecord[]    // All campaigns (newest first)
  personalBests: PersonalBests          // Current record holders
  lastUpdated: string                   // ISO 8601 timestamp of last save
}
