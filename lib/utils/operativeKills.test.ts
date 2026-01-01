import { describe, it, expect } from 'vitest'
import {
  calculateOperativeWoundValue,
  recordOperativeKill,
  calculateHeadhunterScore,
  getKillSummary
} from './operativeKills'
import type { Player, OperativeKill } from '@/types/campaign'

/**
 * Tests for Operative Kill Tracking (Issue #50 - Phase 2)
 * WHY: Verify wound-based HEADHUNTER category calculations
 */

describe('calculateOperativeWoundValue (Issue #50)', () => {
  describe('wound value calculation', () => {
    it('should return 0 for 1 wound', () => {
      // WHY: Operatives with 5 or fewer wounds are worth 0 points
      expect(calculateOperativeWoundValue(1)).toBe(0)
    })

    it('should return 0 for 5 wounds', () => {
      // WHY: 5 wounds is the upper limit for 0 points
      expect(calculateOperativeWoundValue(5)).toBe(0)
    })

    it('should return 1 for 6 wounds', () => {
      // WHY: 6 wounds is the lower limit for 1 point
      expect(calculateOperativeWoundValue(6)).toBe(1)
    })

    it('should return 1 for 10 wounds', () => {
      // WHY: 10 wounds is the upper limit for 1 point
      expect(calculateOperativeWoundValue(10)).toBe(1)
    })

    it('should return 2 for 11 wounds', () => {
      // WHY: 11 wounds is the lower limit for 2 points
      expect(calculateOperativeWoundValue(11)).toBe(2)
    })

    it('should return 2 for 20 wounds', () => {
      // WHY: Any operative with 11+ wounds is worth 2 points
      expect(calculateOperativeWoundValue(20)).toBe(2)
    })

    it('should handle edge cases', () => {
      // WHY: Validate boundary conditions
      expect(calculateOperativeWoundValue(0)).toBe(0)  // Invalid but handle gracefully
      expect(calculateOperativeWoundValue(100)).toBe(2)  // Very high wound count
    })
  })
})

describe('recordOperativeKill (Issue #50)', () => {
  it('should create kill record with correct wound value for 7-wound operative', () => {
    // WHY: Fire Warrior (7W) should be worth 1 point
    const mockPlayer: Partial<Player> = { id: 1, name: 'Test Player' }
    const kill = recordOperativeKill(
      mockPlayer as Player,
      3,  // round
      'Fire Warrior',
      7,  // wounds
      2  // opponentId
    )

    expect(kill).toEqual({
      round: 3,
      operativeName: 'Fire Warrior',
      wounds: 7,
      woundValue: 1,
      opponentId: 2
    })
  })

  it('should create kill record with correct wound value for 12-wound operative', () => {
    // WHY: Ork Nob (12W) should be worth 2 points
    const mockPlayer: Partial<Player> = { id: 1, name: 'Test Player' }
    const kill = recordOperativeKill(
      mockPlayer as Player,
      5,
      'Ork Nob',
      12,
      3
    )

    expect(kill).toEqual({
      round: 5,
      operativeName: 'Ork Nob',
      wounds: 12,
      woundValue: 2,
      opponentId: 3
    })
  })

  it('should handle external opponent with null opponentId', () => {
    // WHY: External opponents have null ID
    const mockPlayer: Partial<Player> = { id: 1, name: 'Test Player' }
    const kill = recordOperativeKill(
      mockPlayer as Player,
      2,
      'Chaos Marine',
      8,
      null
    )

    expect(kill.opponentId).toBeNull()
    expect(kill.woundValue).toBe(1)
  })

  it('should create kill record for low-wound operative (0 points)', () => {
    // WHY: Gretchin (4W) should be worth 0 points
    const mockPlayer: Partial<Player> = { id: 1, name: 'Test Player' }
    const kill = recordOperativeKill(
      mockPlayer as Player,
      1,
      'Gretchin',
      4,
      2
    )

    expect(kill.woundValue).toBe(0)
  })
})

describe('calculateHeadhunterScore (Issue #50)', () => {
  it('should sum wound values correctly from kill details', () => {
    // WHY: HEADHUNTER score is sum of all wound values
    const player: Partial<Player> = {
      id: 1,
      name: 'Test Player',
      operativesKilled: 5,  // Raw count (not used when details exist)
      operativeKillDetails: [
        { round: 1, operativeName: 'Fire Warrior', wounds: 7, woundValue: 1, opponentId: 2 },
        { round: 1, operativeName: 'Ork Nob', wounds: 12, woundValue: 2, opponentId: 3 },
        { round: 2, operativeName: 'Gretchin', wounds: 4, woundValue: 0, opponentId: 3 },
        { round: 3, operativeName: 'Space Marine', wounds: 8, woundValue: 1, opponentId: 2 }
      ]
    }

    const score = calculateHeadhunterScore(player as Player)
    expect(score).toBe(4)  // 1 + 2 + 0 + 1 = 4
  })

  it('should return 0 for player with no kills', () => {
    // WHY: Player with empty kill details should have 0 score
    const player: Partial<Player> = {
      id: 1,
      name: 'Test Player',
      operativesKilled: 0,
      operativeKillDetails: []
    }

    expect(calculateHeadhunterScore(player as Player)).toBe(0)
  })

  it('should fallback to operativesKilled if no details exist', () => {
    // WHY: Backward compatibility for legacy save data
    const player: Partial<Player> = {
      id: 1,
      name: 'Test Player',
      operativesKilled: 10,
      operativeKillDetails: undefined
    }

    expect(calculateHeadhunterScore(player as Player)).toBe(10)
  })

  it('should fallback to operativesKilled if details array is empty', () => {
    // WHY: Empty details array should use legacy fallback
    const player: Partial<Player> = {
      id: 1,
      name: 'Test Player',
      operativesKilled: 7,
      operativeKillDetails: []
    }

    expect(calculateHeadhunterScore(player as Player)).toBe(7)
  })

  it('should handle mixed wound values correctly', () => {
    // WHY: Test all three value tiers (0, 1, 2)
    const player: Partial<Player> = {
      id: 1,
      name: 'Test Player',
      operativeKillDetails: [
        { round: 1, operativeName: 'Gretchin 1', wounds: 3, woundValue: 0 },
        { round: 1, operativeName: 'Gretchin 2', wounds: 4, woundValue: 0 },
        { round: 2, operativeName: 'Fire Warrior', wounds: 7, woundValue: 1 },
        { round: 2, operativeName: 'Pathfinder', wounds: 8, woundValue: 1 },
        { round: 3, operativeName: 'Ork Nob', wounds: 12, woundValue: 2 },
        { round: 3, operativeName: 'Terminator', wounds: 15, woundValue: 2 }
      ]
    }

    const score = calculateHeadhunterScore(player as Player)
    expect(score).toBe(6)  // 0 + 0 + 1 + 1 + 2 + 2 = 6
  })
})

describe('getKillSummary (Issue #50)', () => {
  it('should categorize kills by wound ranges', () => {
    // WHY: Summary breaks down kills into wound categories
    const player: Partial<Player> = {
      id: 1,
      name: 'Test Player',
      operativeKillDetails: [
        { round: 1, operativeName: 'Gretchin', wounds: 4, woundValue: 0 },
        { round: 1, operativeName: 'Gretchin', wounds: 5, woundValue: 0 },
        { round: 2, operativeName: 'Fire Warrior', wounds: 7, woundValue: 1 },
        { round: 2, operativeName: 'Marine', wounds: 10, woundValue: 1 },
        { round: 3, operativeName: 'Ork Nob', wounds: 12, woundValue: 2 },
        { round: 3, operativeName: 'Terminator', wounds: 20, woundValue: 2 }
      ]
    }

    const summary = getKillSummary(player as Player)

    expect(summary).toEqual({
      totalKills: 6,
      woundScore: 6,  // 0+0+1+1+2+2
      heavyKills: 2,   // 12W, 20W
      standardKills: 2,  // 7W, 10W
      lightKills: 2    // 4W, 5W
    })
  })

  it('should handle empty kill details', () => {
    // WHY: Player with no kills should have all zeros
    const player: Partial<Player> = {
      id: 1,
      name: 'Test Player',
      operativesKilled: 0,
      operativeKillDetails: []
    }

    const summary = getKillSummary(player as Player)

    expect(summary).toEqual({
      totalKills: 0,
      woundScore: 0,
      heavyKills: 0,
      standardKills: 0,
      lightKills: 0
    })
  })

  it('should handle undefined kill details', () => {
    // WHY: Backward compatibility for legacy data
    const player: Partial<Player> = {
      id: 1,
      name: 'Test Player',
      operativesKilled: 5,
      operativeKillDetails: undefined
    }

    const summary = getKillSummary(player as Player)

    expect(summary).toEqual({
      totalKills: 0,
      woundScore: 5,  // Fallback to operativesKilled
      heavyKills: 0,
      standardKills: 0,
      lightKills: 0
    })
  })

  it('should correctly classify edge case wounds (5, 6, 10, 11)', () => {
    // WHY: Test boundary conditions between tiers
    const player: Partial<Player> = {
      id: 1,
      name: 'Test Player',
      operativeKillDetails: [
        { round: 1, operativeName: 'W5', wounds: 5, woundValue: 0 },   // Upper limit of light
        { round: 2, operativeName: 'W6', wounds: 6, woundValue: 1 },   // Lower limit of standard
        { round: 3, operativeName: 'W10', wounds: 10, woundValue: 1 }, // Upper limit of standard
        { round: 4, operativeName: 'W11', wounds: 11, woundValue: 2 }  // Lower limit of heavy
      ]
    }

    const summary = getKillSummary(player as Player)

    expect(summary).toEqual({
      totalKills: 4,
      woundScore: 4,  // 0+1+1+2
      heavyKills: 1,     // 11W
      standardKills: 2,  // 6W, 10W
      lightKills: 1      // 5W
    })
  })
})
