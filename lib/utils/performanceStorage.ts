/**
 * WHY: Issue #56 - localStorage operations for solo performance history
 *
 * Provides functions to load, save, and clear solo campaign performance
 * records from browser localStorage. Pattern follows phaseGuidance.ts.
 */

import type { SoloPerformanceHistory, SoloPerformanceRecord } from '@/types/soloPerformance'
import { createEmptyPersonalBests, updatePersonalBests } from './performanceCalculations'

const STORAGE_KEY = 'ctesiphus-solo-performance'

/**
 * WHY: Load solo performance history from localStorage
 * Returns empty history if none exists or if data is corrupted
 * Pattern: Follow lib/utils/phaseGuidance.ts (lines 82-94)
 */
export function loadPerformanceHistory(): SoloPerformanceHistory {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)

    if (!stored || stored === 'null') {
      return createEmptyHistory()
    }

    return JSON.parse(stored)
  } catch (error) {
    // WHY: Log error but don't crash - fall back to empty history
    console.error('Failed to load performance history:', error)
    return createEmptyHistory()
  }
}

/**
 * WHY: Save new performance record to localStorage
 * Adds record to history, updates personal bests, and persists to storage
 */
export function savePerformanceRecord(record: SoloPerformanceRecord): void {
  const history = loadPerformanceHistory()

  // WHY: Add to campaigns (most recent first for chronological display)
  history.campaigns.unshift(record)

  // WHY: Update personal bests with new campaign data
  history.personalBests = updatePersonalBests(
    history.personalBests,
    record
  )

  // WHY: Update timestamp to track when history was last modified
  history.lastUpdated = new Date().toISOString()

  localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
}

/**
 * WHY: Clear all performance history from localStorage
 * Used for "Clear History" button - removes all saved campaigns
 */
export function clearPerformanceHistory(): void {
  localStorage.removeItem(STORAGE_KEY)
}

/**
 * WHY: Create empty performance history structure
 * Used when no history exists or when localStorage is corrupted
 */
function createEmptyHistory(): SoloPerformanceHistory {
  return {
    campaigns: [],
    personalBests: createEmptyPersonalBests(),
    lastUpdated: new Date().toISOString()
  }
}
