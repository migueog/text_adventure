import { describe, it, expect } from 'vitest'
import {
  createHexSnapshot,
  recordAudit,
  getHexHistory,
  getPlayerActions,
  getAuditByRound,
  diffHexSnapshots
} from './auditTrail'
import type { Hex, AuditEntry, CampaignAuditLog, HexSnapshot } from '@/types/campaign'

/**
 * WHY: Test suite for audit trail functionality (Issue #23 - Phase 3)
 * Ensures audit logging, snapshots, and querying work correctly
 */

// WHY: Helper to create a basic hex for testing
function createHex(overrides: Partial<Hex> = {}): Hex {
  return {
    explored: false,
    location: 0,
    condition: 0,
    exploredBy: [],
    ...overrides
  }
}

describe('createHexSnapshot', () => {
  describe('when creating snapshot', () => {
    it('should capture all required hex fields', () => {
      const hex: Hex = createHex({
        explored: true,
        location: 5,
        condition: 12,
        exploredBy: [0, 1],
        exploredLocation: 'Ancient Ruins',
        exploredCondition: 'Foggy'
      })

      const snapshot = createHexSnapshot(hex)

      expect(snapshot.explored).toBe(true)
      expect(snapshot.location).toBe(5)
      expect(snapshot.condition).toBe(12)
      expect(snapshot.exploredBy).toEqual([0, 1])
      expect(snapshot.exploredLocation).toBe('Ancient Ruins')
      expect(snapshot.exploredCondition).toBe('Foggy')
    })

    it('should create deep copy of arrays', () => {
      const exploredBy = [0, 1, 2]
      const hex: Hex = createHex({ exploredBy })

      const snapshot = createHexSnapshot(hex)

      // WHY: Mutating original should not affect snapshot
      exploredBy.push(3)
      expect(snapshot.exploredBy).toEqual([0, 1, 2])
      expect(snapshot.exploredBy).not.toBe(exploredBy)
    })

    it('should handle hex with state object', () => {
      const hex: Hex = createHex({
        state: {
          intelRemaining: 3,
          portalDestination: '1,2'
        }
      })

      const snapshot = createHexSnapshot(hex)

      expect(snapshot.state).toEqual({
        intelRemaining: 3,
        portalDestination: '1,2'
      })
    })

    it('should deep copy state object', () => {
      const state = { intelRemaining: 5 }
      const hex: Hex = createHex({ state })

      const snapshot = createHexSnapshot(hex)

      // WHY: Mutating original should not affect snapshot
      state.intelRemaining = 0
      expect(snapshot.state?.intelRemaining).toBe(5)
    })

    it('should handle unexplored hex', () => {
      const hex: Hex = createHex({
        explored: false,
        exploredBy: []
      })

      const snapshot = createHexSnapshot(hex)

      expect(snapshot.explored).toBe(false)
      expect(snapshot.exploredBy).toEqual([])
      expect(snapshot.exploredLocation).toBeUndefined()
      expect(snapshot.exploredCondition).toBeUndefined()
    })
  })
})

describe('recordAudit', () => {
  describe('when creating audit entry', () => {
    it('should generate unique ID', () => {
      const before = createHexSnapshot(createHex())
      const after = createHexSnapshot(createHex({ explored: true }))

      const entry1 = recordAudit('2,3', 'EXPLORE', before, after, 0, 'Player 1', 1, 'Movement', 'Explored new hex')
      const entry2 = recordAudit('2,3', 'EXPLORE', before, after, 0, 'Player 1', 1, 'Movement', 'Explored new hex')

      expect(entry1.id).toBeDefined()
      expect(entry2.id).toBeDefined()
      expect(entry1.id).not.toBe(entry2.id)
    })

    it('should include all required fields', () => {
      const before = createHexSnapshot(createHex())
      const after = createHexSnapshot(createHex({ explored: true }))

      const entry = recordAudit('2,3', 'EXPLORE', before, after, 0, 'Player 1', 5, 'Movement', 'Explored new hex')

      expect(entry.hexId).toBe('2,3')
      expect(entry.action).toBe('EXPLORE')
      expect(entry.playerId).toBe(0)
      expect(entry.playerName).toBe('Player 1')
      expect(entry.round).toBe(5)
      expect(entry.phase).toBe('Movement')
      expect(entry.reason).toBe('Explored new hex')
      expect(entry.before).toEqual(before)
      expect(entry.after).toEqual(after)
      expect(entry.timestamp).toBeDefined()
    })

    it('should create ISO timestamp', () => {
      const before = createHexSnapshot(createHex())
      const after = createHexSnapshot(createHex({ explored: true }))

      const entry = recordAudit('2,3', 'EXPLORE', before, after, 0, 'Player 1', 1, 'Movement', 'Test')

      expect(() => new Date(entry.timestamp)).not.toThrow()
      expect(entry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    })

    it('should preserve snapshot immutability', () => {
      const before = createHexSnapshot(createHex({ location: 5 }))
      const after = createHexSnapshot(createHex({ location: 5, explored: true }))

      const entry = recordAudit('2,3', 'EXPLORE', before, after, 0, 'Player 1', 1, 'Movement', 'Test')

      // WHY: Mutating snapshots should not affect entry
      before.location = 99
      after.location = 88

      expect(entry.before.location).toBe(5)
      expect(entry.after.location).toBe(5)
    })
  })
})

describe('getHexHistory', () => {
  describe('when filtering by hex', () => {
    it('should return all entries for specified hex', () => {
      const auditLog: CampaignAuditLog = {
        entries: [
          recordAudit('2,3', 'EXPLORE', createHexSnapshot(createHex()), createHexSnapshot(createHex({ explored: true })), 0, 'P1', 1, 'Movement', 'Test'),
          recordAudit('4,5', 'MOVE', createHexSnapshot(createHex()), createHexSnapshot(createHex()), 1, 'P2', 1, 'Movement', 'Test'),
          recordAudit('2,3', 'SEARCH', createHexSnapshot(createHex({ explored: true })), createHexSnapshot(createHex({ explored: true })), 0, 'P1', 2, 'Action', 'Test')
        ],
        version: '1.0.0'
      }

      const history = getHexHistory(auditLog, '2,3')

      expect(history).toHaveLength(2)
      expect(history[0].hexId).toBe('2,3')
      expect(history[0].action).toBe('EXPLORE')
      expect(history[1].hexId).toBe('2,3')
      expect(history[1].action).toBe('SEARCH')
    })

    it('should return empty array for hex with no history', () => {
      const auditLog: CampaignAuditLog = {
        entries: [
          recordAudit('2,3', 'EXPLORE', createHexSnapshot(createHex()), createHexSnapshot(createHex({ explored: true })), 0, 'P1', 1, 'Movement', 'Test')
        ],
        version: '1.0.0'
      }

      const history = getHexHistory(auditLog, '9,9')

      expect(history).toEqual([])
    })

    it('should return chronological order', () => {
      const auditLog: CampaignAuditLog = {
        entries: [
          recordAudit('2,3', 'EXPLORE', createHexSnapshot(createHex()), createHexSnapshot(createHex({ explored: true })), 0, 'P1', 1, 'Movement', 'First'),
          recordAudit('2,3', 'SEARCH', createHexSnapshot(createHex({ explored: true })), createHexSnapshot(createHex({ explored: true })), 0, 'P1', 3, 'Action', 'Third'),
          recordAudit('2,3', 'SCOUT', createHexSnapshot(createHex({ explored: true })), createHexSnapshot(createHex({ explored: true })), 1, 'P2', 2, 'Action', 'Second')
        ],
        version: '1.0.0'
      }

      const history = getHexHistory(auditLog, '2,3')

      expect(history[0].reason).toBe('First')
      expect(history[1].reason).toBe('Second')
      expect(history[2].reason).toBe('Third')
    })
  })
})

describe('getPlayerActions', () => {
  describe('when filtering by player', () => {
    it('should return all entries for specified player', () => {
      const auditLog: CampaignAuditLog = {
        entries: [
          recordAudit('2,3', 'EXPLORE', createHexSnapshot(createHex()), createHexSnapshot(createHex({ explored: true })), 0, 'P1', 1, 'Movement', 'Test'),
          recordAudit('4,5', 'MOVE', createHexSnapshot(createHex()), createHexSnapshot(createHex()), 1, 'P2', 1, 'Movement', 'Test'),
          recordAudit('6,7', 'SEARCH', createHexSnapshot(createHex({ explored: true })), createHexSnapshot(createHex({ explored: true })), 0, 'P1', 2, 'Action', 'Test')
        ],
        version: '1.0.0'
      }

      const actions = getPlayerActions(auditLog, 0)

      expect(actions).toHaveLength(2)
      expect(actions[0].playerId).toBe(0)
      expect(actions[0].action).toBe('EXPLORE')
      expect(actions[1].playerId).toBe(0)
      expect(actions[1].action).toBe('SEARCH')
    })

    it('should return empty array for player with no actions', () => {
      const auditLog: CampaignAuditLog = {
        entries: [
          recordAudit('2,3', 'EXPLORE', createHexSnapshot(createHex()), createHexSnapshot(createHex({ explored: true })), 0, 'P1', 1, 'Movement', 'Test')
        ],
        version: '1.0.0'
      }

      const actions = getPlayerActions(auditLog, 99)

      expect(actions).toEqual([])
    })

    it('should return chronological order', () => {
      const auditLog: CampaignAuditLog = {
        entries: [
          recordAudit('2,3', 'EXPLORE', createHexSnapshot(createHex()), createHexSnapshot(createHex({ explored: true })), 0, 'P1', 1, 'Movement', 'First'),
          recordAudit('4,5', 'SEARCH', createHexSnapshot(createHex({ explored: true })), createHexSnapshot(createHex({ explored: true })), 0, 'P1', 3, 'Action', 'Third'),
          recordAudit('6,7', 'SCOUT', createHexSnapshot(createHex({ explored: true })), createHexSnapshot(createHex({ explored: true })), 0, 'P1', 2, 'Action', 'Second')
        ],
        version: '1.0.0'
      }

      const actions = getPlayerActions(auditLog, 0)

      expect(actions[0].reason).toBe('First')
      expect(actions[1].reason).toBe('Second')
      expect(actions[2].reason).toBe('Third')
    })
  })
})

describe('getAuditByRound', () => {
  describe('when filtering by round range', () => {
    it('should return entries within range (inclusive)', () => {
      const auditLog: CampaignAuditLog = {
        entries: [
          recordAudit('2,3', 'EXPLORE', createHexSnapshot(createHex()), createHexSnapshot(createHex({ explored: true })), 0, 'P1', 1, 'Movement', 'R1'),
          recordAudit('4,5', 'MOVE', createHexSnapshot(createHex()), createHexSnapshot(createHex()), 1, 'P2', 2, 'Movement', 'R2'),
          recordAudit('6,7', 'SEARCH', createHexSnapshot(createHex({ explored: true })), createHexSnapshot(createHex({ explored: true })), 0, 'P1', 3, 'Action', 'R3'),
          recordAudit('8,9', 'SCOUT', createHexSnapshot(createHex({ explored: true })), createHexSnapshot(createHex({ explored: true })), 1, 'P2', 4, 'Action', 'R4')
        ],
        version: '1.0.0'
      }

      const filtered = getAuditByRound(auditLog, 2, 3)

      expect(filtered).toHaveLength(2)
      expect(filtered[0].round).toBe(2)
      expect(filtered[1].round).toBe(3)
    })

    it('should return empty array if no entries in range', () => {
      const auditLog: CampaignAuditLog = {
        entries: [
          recordAudit('2,3', 'EXPLORE', createHexSnapshot(createHex()), createHexSnapshot(createHex({ explored: true })), 0, 'P1', 1, 'Movement', 'Test')
        ],
        version: '1.0.0'
      }

      const filtered = getAuditByRound(auditLog, 5, 10)

      expect(filtered).toEqual([])
    })

    it('should handle single round filter', () => {
      const auditLog: CampaignAuditLog = {
        entries: [
          recordAudit('2,3', 'EXPLORE', createHexSnapshot(createHex()), createHexSnapshot(createHex({ explored: true })), 0, 'P1', 1, 'Movement', 'R1'),
          recordAudit('4,5', 'MOVE', createHexSnapshot(createHex()), createHexSnapshot(createHex()), 1, 'P2', 2, 'Movement', 'R2'),
          recordAudit('6,7', 'SEARCH', createHexSnapshot(createHex({ explored: true })), createHexSnapshot(createHex({ explored: true })), 0, 'P1', 2, 'Action', 'R2-2')
        ],
        version: '1.0.0'
      }

      const filtered = getAuditByRound(auditLog, 2, 2)

      expect(filtered).toHaveLength(2)
      expect(filtered[0].round).toBe(2)
      expect(filtered[1].round).toBe(2)
    })
  })
})

describe('diffHexSnapshots', () => {
  describe('when comparing snapshots', () => {
    it('should detect explored state change', () => {
      const before = createHexSnapshot(createHex({ explored: false }))
      const after = createHexSnapshot(createHex({ explored: true }))

      const diff = diffHexSnapshots(before, after)

      expect(diff).toContainEqual({
        field: 'explored',
        before: false,
        after: true
      })
    })

    it('should detect location change', () => {
      const before = createHexSnapshot(createHex({ location: 5 }))
      const after = createHexSnapshot(createHex({ location: 12 }))

      const diff = diffHexSnapshots(before, after)

      expect(diff).toContainEqual({
        field: 'location',
        before: 5,
        after: 12
      })
    })

    it('should detect array changes in exploredBy', () => {
      const before = createHexSnapshot(createHex({ exploredBy: [0, 1] }))
      const after = createHexSnapshot(createHex({ exploredBy: [0, 1, 2] }))

      const diff = diffHexSnapshots(before, after)

      expect(diff.some(d => d.field === 'exploredBy')).toBe(true)
    })

    it('should return empty array for identical snapshots', () => {
      const snapshot = createHexSnapshot(createHex({
        explored: true,
        location: 5,
        condition: 12,
        exploredBy: [0, 1]
      }))

      const diff = diffHexSnapshots(snapshot, snapshot)

      expect(diff).toEqual([])
    })

    it('should detect state object changes', () => {
      const before = createHexSnapshot(createHex({ state: { intelRemaining: 5 } }))
      const after = createHexSnapshot(createHex({ state: { intelRemaining: 3 } }))

      const diff = diffHexSnapshots(before, after)

      expect(diff.some(d => d.field === 'state')).toBe(true)
    })

    it('should detect multiple field changes', () => {
      const before = createHexSnapshot(createHex({
        explored: false,
        location: 0,
        condition: 0
      }))
      const after = createHexSnapshot(createHex({
        explored: true,
        location: 5,
        condition: 12
      }))

      const diff = diffHexSnapshots(before, after)

      expect(diff.length).toBeGreaterThanOrEqual(3)
      expect(diff.some(d => d.field === 'explored')).toBe(true)
      expect(diff.some(d => d.field === 'location')).toBe(true)
      expect(diff.some(d => d.field === 'condition')).toBe(true)
    })

    it('should handle optional field addition', () => {
      const before = createHexSnapshot(createHex({ explored: false }))
      const after = createHexSnapshot(createHex({
        explored: true,
        exploredLocation: 'Ancient Ruins'
      }))

      const diff = diffHexSnapshots(before, after)

      expect(diff.some(d => d.field === 'exploredLocation')).toBe(true)
    })
  })
})
