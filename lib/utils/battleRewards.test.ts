/**
 * Tests for Battle Rewards Utilities (Issue #41)
 *
 * WHY: TDD - write tests first before implementation
 * Tests cover SP cap calculation, missing player record creation,
 * and extra game reward handling.
 */

import { describe, it, expect } from 'vitest'
import {
  calculateRewardWithCap,
  createMissingPlayerRecords,
  getRewardForResult,
  SP_MAX,
  SP_MIN
} from './battleRewards'
import type { Player } from '@/types/campaign'

describe('Battle Rewards Utilities', () => {
  describe('calculateRewardWithCap', () => {
    it('should add SP reward when under cap', () => {
      const result = calculateRewardWithCap(5, 2)

      expect(result.newSP).toBe(7)
      expect(result.wasCapped).toBe(false)
      expect(result.cappedAmount).toBe(0)
    })

    it('should cap SP at maximum (10) when reward would exceed', () => {
      const result = calculateRewardWithCap(9, 2)

      expect(result.newSP).toBe(10)
      expect(result.wasCapped).toBe(true)
      expect(result.cappedAmount).toBe(1)
    })

    it('should handle BYE reward (2 SP) near cap', () => {
      const result = calculateRewardWithCap(9, 2)

      expect(result.newSP).toBe(10)
      expect(result.wasCapped).toBe(true)
      expect(result.cappedAmount).toBe(1)
    })

    it('should return unchanged when already at max and adding reward', () => {
      const result = calculateRewardWithCap(10, 1)

      expect(result.newSP).toBe(10)
      expect(result.wasCapped).toBe(true)
      expect(result.cappedAmount).toBe(1)
    })

    it('should handle zero reward', () => {
      const result = calculateRewardWithCap(5, 0)

      expect(result.newSP).toBe(5)
      expect(result.wasCapped).toBe(false)
      expect(result.cappedAmount).toBe(0)
    })

    it('should not go below minimum (0)', () => {
      // Edge case: negative reward (not typical but defensive)
      const result = calculateRewardWithCap(1, -5)

      expect(result.newSP).toBe(0)
      expect(result.wasCapped).toBe(false)
      expect(result.cappedAmount).toBe(0)
    })

    it('should export SP_MAX constant as 10', () => {
      expect(SP_MAX).toBe(10)
    })

    it('should export SP_MIN constant as 0', () => {
      expect(SP_MIN).toBe(0)
    })
  })

  describe('createMissingPlayerRecords', () => {
    const mockPresentPlayer: Pick<Player, 'id' | 'name'> = {
      id: 1,
      name: 'Present Player'
    }

    const mockAbsentPlayer: Pick<Player, 'id' | 'name'> = {
      id: 2,
      name: 'Absent Player'
    }

    it('should create WIN record for present player with +1 CP', () => {
      const result = createMissingPlayerRecords(mockPresentPlayer, mockAbsentPlayer, 3)

      expect(result.winRecord.result).toBe('WIN')
      expect(result.winRecord.cpEarned).toBe(1)
      expect(result.winRecord.spEarned).toBe(0)
      expect(result.winRecord.opponent).toBe(mockAbsentPlayer.id)
      expect(result.winRecord.isMissingOpponent).toBe(true)
    })

    it('should create LOSS record for absent player with +1 SP', () => {
      const result = createMissingPlayerRecords(mockPresentPlayer, mockAbsentPlayer, 3)

      expect(result.lossRecord.result).toBe('LOSS')
      expect(result.lossRecord.cpEarned).toBe(0)
      expect(result.lossRecord.spEarned).toBe(1)
      expect(result.lossRecord.opponent).toBe(mockPresentPlayer.id)
      expect(result.lossRecord.isMissingOpponent).toBe(true)
    })

    it('should include round number in both records', () => {
      const result = createMissingPlayerRecords(mockPresentPlayer, mockAbsentPlayer, 5)

      expect(result.winRecord.round).toBe(5)
      expect(result.lossRecord.round).toBe(5)
    })

    it('should include timestamps in both records', () => {
      const before = new Date().toISOString()
      const result = createMissingPlayerRecords(mockPresentPlayer, mockAbsentPlayer, 1)
      const after = new Date().toISOString()

      expect(result.winRecord.timestamp).toBeDefined()
      expect(result.lossRecord.timestamp).toBeDefined()
      // Timestamps should be between before and after
      expect(result.winRecord.timestamp >= before).toBe(true)
      expect(result.winRecord.timestamp <= after).toBe(true)
    })

    it('should set operativesKilled to 0 for both records', () => {
      const result = createMissingPlayerRecords(mockPresentPlayer, mockAbsentPlayer, 1)

      expect(result.winRecord.operativesKilled).toBe(0)
      expect(result.lossRecord.operativesKilled).toBe(0)
    })

    it('should mark as completed status', () => {
      const result = createMissingPlayerRecords(mockPresentPlayer, mockAbsentPlayer, 1)

      expect(result.winRecord.status).toBe('completed')
      expect(result.lossRecord.status).toBe('completed')
    })

    it('should not mark as external opponent', () => {
      const result = createMissingPlayerRecords(mockPresentPlayer, mockAbsentPlayer, 1)

      expect(result.winRecord.isExternalOpponent).toBe(false)
      expect(result.lossRecord.isExternalOpponent).toBe(false)
    })
  })

  describe('getRewardForResult', () => {
    it('should return +1 CP for WIN', () => {
      const result = getRewardForResult('WIN')

      expect(result.cpGain).toBe(1)
      expect(result.spGain).toBe(0)
    })

    it('should return +1 SP for DRAW', () => {
      const result = getRewardForResult('DRAW')

      expect(result.cpGain).toBe(0)
      expect(result.spGain).toBe(1)
    })

    it('should return +1 SP for LOSS', () => {
      const result = getRewardForResult('LOSS')

      expect(result.cpGain).toBe(0)
      expect(result.spGain).toBe(1)
    })

    it('should return +2 SP for BYE', () => {
      const result = getRewardForResult('BYE')

      expect(result.cpGain).toBe(0)
      expect(result.spGain).toBe(2)
    })

    it('should return zero rewards when isExtraGame is true', () => {
      const result = getRewardForResult('WIN', true)

      expect(result.cpGain).toBe(0)
      expect(result.spGain).toBe(0)
    })

    it('should return zero rewards for LOSS when isExtraGame is true', () => {
      const result = getRewardForResult('LOSS', true)

      expect(result.cpGain).toBe(0)
      expect(result.spGain).toBe(0)
    })

    it('should return normal rewards when isExtraGame is false', () => {
      const result = getRewardForResult('WIN', false)

      expect(result.cpGain).toBe(1)
      expect(result.spGain).toBe(0)
    })
  })
})
