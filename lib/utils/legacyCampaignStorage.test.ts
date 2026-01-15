/**
 * WHY: Issue #57 - Tests for legacy campaign localStorage operations
 * TDD: Write tests first before implementation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  saveCampaignSnapshot,
  loadLegacyCampaignHistory,
  getLegacyCampaignById,
  clearLegacyCampaignHistory
} from './legacyCampaignStorage'
import type { CampaignSnapshot } from '@/types/legacyCampaign'

// WHY: Mock localStorage for testing
const mockLocalStorage = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    }
  }
})()

// WHY: Replace global localStorage with mock
global.localStorage = mockLocalStorage as Storage

describe('legacyCampaignStorage', () => {
  beforeEach(() => {
    // WHY: Clear localStorage before each test
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('loadLegacyCampaignHistory', () => {
    it('should return empty history when localStorage is empty', () => {
      const history = loadLegacyCampaignHistory()

      expect(history.snapshots).toEqual([])
      expect(history.lastUpdated).toBeDefined()
    })

    it('should return empty history when localStorage contains null', () => {
      localStorage.setItem('ctesiphus-legacy-campaigns', 'null')

      const history = loadLegacyCampaignHistory()

      expect(history.snapshots).toEqual([])
    })

    it('should load existing history from localStorage', () => {
      const mockHistory = {
        snapshots: [
          {
            campaignId: 'campaign-1',
            campaignName: 'Test Campaign',
            playerName: 'Player 1',
            killTeamName: 'Squad Alpha',
            mapSize: { rows: 5, cols: 5 },
            exploredHexes: [],
            finalCP: 11,
            finalThreat: 10,
            rounds: 12,
            success: true,
            completedDate: '2025-01-04T10:00:00Z',
            targetThreatLevel: 10
          }
        ],
        lastUpdated: '2025-01-04T10:00:00Z'
      }

      localStorage.setItem('ctesiphus-legacy-campaigns', JSON.stringify(mockHistory))

      const history = loadLegacyCampaignHistory()

      expect(history).toEqual(mockHistory)
      expect(history.snapshots).toHaveLength(1)
      expect(history.snapshots[0].campaignId).toBe('campaign-1')
    })

    it('should handle corrupted JSON gracefully', () => {
      localStorage.setItem('ctesiphus-legacy-campaigns', '{invalid json}')

      const history = loadLegacyCampaignHistory()

      expect(history.snapshots).toEqual([])
    })
  })

  describe('saveCampaignSnapshot', () => {
    const mockSnapshot: CampaignSnapshot = {
      campaignId: 'campaign-123',
      campaignName: 'Assault on Ctesiphus',
      playerName: 'Player 1',
      killTeamName: 'Blood Ravens',
      faction: 'Space Marines',
      backstory: 'Elite veterans',
      mapSize: { rows: 5, cols: 5 },
      exploredHexes: [
        {
          hexId: '0-2',
          row: 0,
          col: 2,
          type: 'surface',
          locationNumber: 25,
          conditionNumber: 21,
          locationId: 'SL25',
          conditionId: 'SC21',
          searched: true,
          camped: true
        }
      ],
      finalCP: 11,
      finalThreat: 10,
      rounds: 12,
      success: true,
      completedDate: '2025-01-04T10:00:00Z',
      targetThreatLevel: 10
    }

    it('should save snapshot to empty localStorage', () => {
      saveCampaignSnapshot(mockSnapshot)

      const stored = localStorage.getItem('ctesiphus-legacy-campaigns')
      expect(stored).toBeDefined()

      const history = JSON.parse(stored!)
      expect(history.snapshots).toHaveLength(1)
      expect(history.snapshots[0]).toEqual(mockSnapshot)
      expect(history.lastUpdated).toBeDefined()
    })

    it('should prepend new snapshot to existing history', () => {
      const existingSnapshot: CampaignSnapshot = {
        ...mockSnapshot,
        campaignId: 'campaign-old',
        campaignName: 'Old Campaign'
      }

      saveCampaignSnapshot(existingSnapshot)
      saveCampaignSnapshot(mockSnapshot)

      const history = loadLegacyCampaignHistory()

      expect(history.snapshots).toHaveLength(2)
      expect(history.snapshots[0].campaignId).toBe('campaign-123') // Most recent first
      expect(history.snapshots[1].campaignId).toBe('campaign-old')
    })

    it('should update lastUpdated timestamp', () => {
      const beforeSave = new Date().toISOString()
      saveCampaignSnapshot(mockSnapshot)
      const afterSave = new Date().toISOString()

      const history = loadLegacyCampaignHistory()

      expect(history.lastUpdated >= beforeSave).toBe(true)
      expect(history.lastUpdated <= afterSave).toBe(true)
    })

    it('should limit snapshots to 20 maximum', () => {
      // WHY: Prevent localStorage quota issues
      for (let i = 0; i < 25; i++) {
        const snapshot: CampaignSnapshot = {
          ...mockSnapshot,
          campaignId: `campaign-${i}`,
          campaignName: `Campaign ${i}`
        }
        saveCampaignSnapshot(snapshot)
      }

      const history = loadLegacyCampaignHistory()

      expect(history.snapshots).toHaveLength(20)
      expect(history.snapshots[0].campaignId).toBe('campaign-24') // Most recent
      expect(history.snapshots[19].campaignId).toBe('campaign-5') // Oldest kept
    })
  })

  describe('getLegacyCampaignById', () => {
    const mockSnapshot1: CampaignSnapshot = {
      campaignId: 'campaign-1',
      campaignName: 'Campaign 1',
      playerName: 'Player 1',
      killTeamName: 'Squad Alpha',
      mapSize: { rows: 5, cols: 5 },
      exploredHexes: [],
      finalCP: 11,
      finalThreat: 10,
      rounds: 12,
      success: true,
      completedDate: '2025-01-04T10:00:00Z',
      targetThreatLevel: 10
    }

    const mockSnapshot2: CampaignSnapshot = {
      ...mockSnapshot1,
      campaignId: 'campaign-2',
      campaignName: 'Campaign 2'
    }

    beforeEach(() => {
      saveCampaignSnapshot(mockSnapshot1)
      saveCampaignSnapshot(mockSnapshot2)
    })

    it('should retrieve snapshot by campaign ID', () => {
      const snapshot = getLegacyCampaignById('campaign-1')

      expect(snapshot).toBeDefined()
      expect(snapshot?.campaignId).toBe('campaign-1')
      expect(snapshot?.campaignName).toBe('Campaign 1')
    })

    it('should return null for non-existent campaign ID', () => {
      const snapshot = getLegacyCampaignById('campaign-999')

      expect(snapshot).toBeNull()
    })

    it('should return null when localStorage is empty', () => {
      localStorage.clear()

      const snapshot = getLegacyCampaignById('campaign-1')

      expect(snapshot).toBeNull()
    })
  })

  describe('clearLegacyCampaignHistory', () => {
    it('should remove history from localStorage', () => {
      const mockSnapshot: CampaignSnapshot = {
        campaignId: 'campaign-1',
        campaignName: 'Test Campaign',
        playerName: 'Player 1',
        killTeamName: 'Squad Alpha',
        mapSize: { rows: 5, cols: 5 },
        exploredHexes: [],
        finalCP: 11,
        finalThreat: 10,
        rounds: 12,
        success: true,
        completedDate: '2025-01-04T10:00:00Z',
        targetThreatLevel: 10
      }

      saveCampaignSnapshot(mockSnapshot)
      expect(localStorage.getItem('ctesiphus-legacy-campaigns')).toBeDefined()

      clearLegacyCampaignHistory()

      expect(localStorage.getItem('ctesiphus-legacy-campaigns')).toBeNull()
    })

    it('should not throw error when clearing empty localStorage', () => {
      expect(() => clearLegacyCampaignHistory()).not.toThrow()
    })
  })
})
