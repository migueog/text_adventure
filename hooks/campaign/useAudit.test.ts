/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAudit } from './useAudit'
import type { HexSnapshot, AuditActionType } from '@/types/campaign'

/**
 * WHY: Test-Driven Development for useAudit hook
 * Tests audit trail functionality for tracking hex modifications
 * Issue #23 - Phase 3
 */
describe('useAudit', () => {
  describe('initial state', () => {
    it('should initialize with empty audit log', () => {
      const { result } = renderHook(() => useAudit())

      expect(result.current.auditLog).toEqual({
        entries: [],
        version: '1.0.0'
      })
    })
  })

  describe('addAudit', () => {
    it('should add audit entry with correct metadata', () => {
      const { result } = renderHook(() => useAudit())

      const beforeSnapshot: HexSnapshot = {
        explored: false,
        location: 0,
        condition: 0,
        type: 'surface',
        exploredBy: []
      }

      const afterSnapshot: HexSnapshot = {
        explored: true,
        location: 12,
        condition: 11,
        type: 'surface',
        exploredBy: [1]
      }

      act(() => {
        result.current.addAudit(
          '0,0',
          'EXPLORE',
          beforeSnapshot,
          afterSnapshot,
          1,
          'Player 1',
          1,
          'Movement',
          'Explored Abandoned Outpost'
        )
      })

      expect(result.current.auditLog.entries).toHaveLength(1)
      const entry = result.current.auditLog.entries[0]!

      expect(entry.hexId).toBe('0,0')
      expect(entry.action).toBe('EXPLORE')
      expect(entry.playerId).toBe(1)
      expect(entry.playerName).toBe('Player 1')
      expect(entry.round).toBe(1)
      expect(entry.phase).toBe('Movement')
      expect(entry.reason).toBe('Explored Abandoned Outpost')
      expect(entry.before).toEqual(beforeSnapshot)
      expect(entry.after).toEqual(afterSnapshot)
      expect(entry.timestamp).toBeDefined()
    })

    it('should append multiple entries in chronological order', () => {
      const { result } = renderHook(() => useAudit())

      const snapshot1: HexSnapshot = { explored: false, location: 0, condition: 0, type: 'surface', exploredBy: [] }
      const snapshot2: HexSnapshot = { explored: true, location: 12, condition: 11, type: 'surface', exploredBy: [1] }
      const snapshot3: HexSnapshot = { explored: true, location: 12, condition: 11, type: 'surface', exploredBy: [1], state: { supplyCount: 5 } }

      act(() => {
        result.current.addAudit('0,0', 'EXPLORE', snapshot1, snapshot2, 1, 'Player 1', 1, 'Movement', 'First exploration')
        result.current.addAudit('0,0', 'SEARCH', snapshot2, snapshot3, 1, 'Player 1', 2, 'Action', 'Searched location')
      })

      expect(result.current.auditLog.entries).toHaveLength(2)
      expect(result.current.auditLog.entries[0]!.reason).toBe('First exploration')
      expect(result.current.auditLog.entries[1]!.reason).toBe('Searched location')
    })

    it('should handle all action types correctly', () => {
      const { result } = renderHook(() => useAudit())

      const before: HexSnapshot = { explored: true, location: 12, condition: 11, type: 'surface', exploredBy: [1] }
      const after: HexSnapshot = { explored: true, location: 12, condition: 11, type: 'blocked', exploredBy: [1] }

      const actionTypes: AuditActionType[] = ['EXPLORE', 'SEARCH', 'PORTAL_CONFIG', 'HEX_BLOCK', 'HEX_UNBLOCK']

      actionTypes.forEach((actionType, index) => {
        act(() => {
          result.current.addAudit(
            `${index},0`,
            actionType,
            before,
            after,
            1,
            'Player 1',
            1,
            'Action',
            `Action: ${actionType}`
          )
        })
      })

      expect(result.current.auditLog.entries).toHaveLength(5)
      expect(result.current.auditLog.entries.map(e => e.action)).toEqual(actionTypes)
    })
  })

  describe('getHexHistory', () => {
    it('should return empty array for hex with no history', () => {
      const { result } = renderHook(() => useAudit())

      const history = result.current.getHexHistory('5,5')

      expect(history).toEqual([])
    })

    it('should return all entries for specific hex', () => {
      const { result } = renderHook(() => useAudit())

      const snapshot: HexSnapshot = { explored: true, location: 12, condition: 11, type: 'surface', exploredBy: [1] }

      act(() => {
        result.current.addAudit('2,3', 'EXPLORE', snapshot, snapshot, 1, 'Player 1', 1, 'Movement', 'Explored')
        result.current.addAudit('2,3', 'SEARCH', snapshot, snapshot, 2, 'Player 2', 2, 'Action', 'Searched')
        result.current.addAudit('4,5', 'EXPLORE', snapshot, snapshot, 1, 'Player 1', 1, 'Movement', 'Different hex')
      })

      const history = result.current.getHexHistory('2,3')

      expect(history).toHaveLength(2)
      expect(history[0]!.reason).toBe('Explored')
      expect(history[1]!.reason).toBe('Searched')
    })

    it('should return entries in chronological order', () => {
      const { result } = renderHook(() => useAudit())

      const snapshot: HexSnapshot = { explored: true, location: 12, condition: 11, type: 'surface', exploredBy: [1] }

      act(() => {
        result.current.addAudit('1,1', 'EXPLORE', snapshot, snapshot, 1, 'P1', 1, 'Movement', 'First')
        result.current.addAudit('1,1', 'SEARCH', snapshot, snapshot, 1, 'P1', 2, 'Action', 'Second')
        result.current.addAudit('1,1', 'PORTAL_CONFIG', snapshot, snapshot, 2, 'P2', 3, 'Action', 'Third')
      })

      const history = result.current.getHexHistory('1,1')

      expect(history.map(e => e.reason)).toEqual(['First', 'Second', 'Third'])
    })
  })

  describe('getPlayerActions', () => {
    it('should return empty array for player with no actions', () => {
      const { result } = renderHook(() => useAudit())

      const actions = result.current.getPlayerActions(5)

      expect(actions).toEqual([])
    })

    it('should return all actions for specific player', () => {
      const { result } = renderHook(() => useAudit())

      const snapshot: HexSnapshot = { explored: true, location: 12, condition: 11, type: 'surface', exploredBy: [1] }

      act(() => {
        result.current.addAudit('0,0', 'EXPLORE', snapshot, snapshot, 1, 'Player 1', 1, 'Movement', 'Action 1')
        result.current.addAudit('1,1', 'SEARCH', snapshot, snapshot, 1, 'Player 1', 2, 'Action', 'Action 2')
        result.current.addAudit('2,2', 'EXPLORE', snapshot, snapshot, 2, 'Player 2', 1, 'Movement', 'Different player')
      })

      const actions = result.current.getPlayerActions(1)

      expect(actions).toHaveLength(2)
      expect(actions[0]!.reason).toBe('Action 1')
      expect(actions[1]!.reason).toBe('Action 2')
    })

    it('should return actions across multiple rounds', () => {
      const { result } = renderHook(() => useAudit())

      const snapshot: HexSnapshot = { explored: true, location: 12, condition: 11, type: 'surface', exploredBy: [1] }

      act(() => {
        result.current.addAudit('0,0', 'EXPLORE', snapshot, snapshot, 3, 'Alice', 1, 'Movement', 'Round 1')
        result.current.addAudit('1,1', 'SEARCH', snapshot, snapshot, 3, 'Alice', 5, 'Action', 'Round 5')
        result.current.addAudit('2,2', 'HEX_BLOCK', snapshot, snapshot, 3, 'Alice', 7, 'Action', 'Round 7')
      })

      const actions = result.current.getPlayerActions(3)

      expect(actions).toHaveLength(3)
      expect(actions.map(a => a.round)).toEqual([1, 5, 7])
    })
  })

  describe('exportAuditLog', () => {
    it('should export audit log with campaign name', () => {
      const { result } = renderHook(() => useAudit())

      const snapshot: HexSnapshot = { explored: true, location: 12, condition: 11, type: 'surface', exploredBy: [1] }

      act(() => {
        result.current.addAudit('0,0', 'EXPLORE', snapshot, snapshot, 1, 'Player 1', 1, 'Movement', 'Test entry')
      })

      const exported = result.current.exportAuditLog('Test Campaign')

      expect(exported.campaignName).toBe('Test Campaign')
      expect(exported.exportDate).toBeDefined()
      expect(exported.auditLog).toEqual(result.current.auditLog)
    })

    it('should include version in export', () => {
      const { result } = renderHook(() => useAudit())

      const exported = result.current.exportAuditLog('Campaign')

      expect(exported.auditLog.version).toBe('1.0.0')
    })

    it('should export empty log correctly', () => {
      const { result } = renderHook(() => useAudit())

      const exported = result.current.exportAuditLog('Empty Campaign')

      expect(exported.auditLog.entries).toEqual([])
      expect(exported.campaignName).toBe('Empty Campaign')
    })
  })

  describe('audit log persistence', () => {
    it('should maintain state across multiple operations', () => {
      const { result } = renderHook(() => useAudit())

      const snapshot: HexSnapshot = { explored: true, location: 12, condition: 11, type: 'surface', exploredBy: [1] }

      act(() => {
        result.current.addAudit('0,0', 'EXPLORE', snapshot, snapshot, 1, 'P1', 1, 'Movement', 'First')
      })

      const firstCount = result.current.auditLog.entries.length

      act(() => {
        result.current.getHexHistory('0,0')
        result.current.getPlayerActions(1)
      })

      expect(result.current.auditLog.entries.length).toBe(firstCount)

      act(() => {
        result.current.addAudit('1,1', 'SEARCH', snapshot, snapshot, 1, 'P1', 2, 'Action', 'Second')
      })

      expect(result.current.auditLog.entries.length).toBe(2)
    })
  })
})
