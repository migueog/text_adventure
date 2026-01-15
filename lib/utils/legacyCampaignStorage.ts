/**
 * WHY: Issue #57 - localStorage operations for legacy campaign snapshots
 *
 * Provides functions to save, load, and manage campaign snapshots for
 * legacy continuation. Pattern follows performanceStorage.ts.
 */

import type { LegacyCampaignHistory, CampaignSnapshot } from '@/types/legacyCampaign'

const STORAGE_KEY = 'ctesiphus-legacy-campaigns'
const MAX_SNAPSHOTS = 20  // WHY: Prevent localStorage quota issues

/**
 * WHY: Load legacy campaign history from localStorage
 * Returns empty history if none exists or if data is corrupted
 * Pattern: Follow lib/utils/performanceStorage.ts
 */
export function loadLegacyCampaignHistory(): LegacyCampaignHistory {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)

    if (!stored || stored === 'null') {
      return createEmptyHistory()
    }

    return JSON.parse(stored)
  } catch (error) {
    // WHY: Log error but don't crash - fall back to empty history
    console.error('Failed to load legacy campaign history:', error)
    return createEmptyHistory()
  }
}

/**
 * WHY: Save campaign snapshot to localStorage
 * Adds snapshot to history and persists to storage
 * Limits to MAX_SNAPSHOTS to prevent quota issues
 */
export function saveCampaignSnapshot(snapshot: CampaignSnapshot): void {
  const history = loadLegacyCampaignHistory()

  // WHY: Add to snapshots (most recent first for chronological display)
  history.snapshots.unshift(snapshot)

  // WHY: Limit to MAX_SNAPSHOTS, remove oldest if exceeded
  if (history.snapshots.length > MAX_SNAPSHOTS) {
    history.snapshots = history.snapshots.slice(0, MAX_SNAPSHOTS)
  }

  // WHY: Update timestamp to track when history was last modified
  history.lastUpdated = new Date().toISOString()

  localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
}

/**
 * WHY: Retrieve specific campaign snapshot by ID
 * Used when player selects which legacy campaign to continue
 * Returns null if campaign not found
 */
export function getLegacyCampaignById(campaignId: string): CampaignSnapshot | null {
  const history = loadLegacyCampaignHistory()

  const snapshot = history.snapshots.find(
    s => s.campaignId === campaignId
  )

  return snapshot || null
}

/**
 * WHY: Clear all legacy campaign history from localStorage
 * Used for "Clear History" button in settings - removes all saved snapshots
 */
export function clearLegacyCampaignHistory(): void {
  localStorage.removeItem(STORAGE_KEY)
}

/**
 * WHY: Create empty legacy campaign history structure
 * Used when no history exists or when localStorage is corrupted
 */
function createEmptyHistory(): LegacyCampaignHistory {
  return {
    snapshots: [],
    lastUpdated: new Date().toISOString()
  }
}
