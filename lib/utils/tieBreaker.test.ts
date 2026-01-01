import { describe, it, expect } from 'vitest'
import type { Player } from '@/types/campaign'
import {
  getTieBreakerCriteria,
  detectTie,
  getTiedPlayers,
  applyCriterion,
  resolveTie
} from './tieBreaker'

// WHY: Helper to create test players with minimal required fields
function createTestPlayer(id: number, overrides: Partial<Player> = {}): Player {
  return {
    id,
    name: `Player ${id}`,
    killTeamName: `Team ${id}`,
    color: '#000000',
    supplyPoints: 5,
    campaignPoints: 0,
    exploredHexes: 0,
    gamesPlayed: 0,
    gamesWon: 0,
    operativesKilled: 0,
    location: '0,0',
    ...overrides
  } as Player
}

describe('getTieBreakerCriteria', () => {
  it('should return 4 tie-breaker criteria', () => {
    const criteria = getTieBreakerCriteria()
    expect(criteria).toHaveLength(4)
  })

  it('should return criteria in correct priority order', () => {
    const criteria = getTieBreakerCriteria()

    expect(criteria[0].name).toBe('Most Campaign Points')
    expect(criteria[1].name).toBe('Most Games Won')
    expect(criteria[2].name).toBe('Most Supply Points Spent')
    expect(criteria[3].name).toBe('Most Hexes Explored')
  })

  it('should have working getter functions', () => {
    const criteria = getTieBreakerCriteria()
    const player = createTestPlayer(1, {
      campaignPoints: 10,
      gamesWon: 5,
      supplyPointsSpent: 15,
      exploredHexes: 8
    })

    expect(criteria[0]?.getter(player)).toBe(10)
    expect(criteria[1]?.getter(player)).toBe(5)
    expect(criteria[2]?.getter(player)).toBe(15)
    expect(criteria[3]?.getter(player)).toBe(8)
  })

  it('should handle missing supplyPointsSpent with fallback to 0', () => {
    const criteria = getTieBreakerCriteria()
    const player = createTestPlayer(1, { supplyPointsSpent: undefined })

    expect(criteria[2]?.getter(player)).toBe(0)
  })
})

describe('detectTie', () => {
  it('should detect when players are tied', () => {
    const players = [
      createTestPlayer(1, { exploredHexes: 8 }),
      createTestPlayer(2, { exploredHexes: 8 })
    ]

    const hasTie = detectTie(players, p => p.exploredHexes)
    expect(hasTie).toBe(true)
  })

  it('should return false when no tie exists', () => {
    const players = [
      createTestPlayer(1, { exploredHexes: 10 }),
      createTestPlayer(2, { exploredHexes: 8 })
    ]

    const hasTie = detectTie(players, p => p.exploredHexes)
    expect(hasTie).toBe(false)
  })

  it('should return false for single player', () => {
    const players = [createTestPlayer(1, { exploredHexes: 8 })]

    const hasTie = detectTie(players, p => p.exploredHexes)
    expect(hasTie).toBe(false)
  })
})

describe('getTiedPlayers', () => {
  it('should return all players tied at maximum value', () => {
    const players = [
      createTestPlayer(1, { exploredHexes: 10 }),
      createTestPlayer(2, { exploredHexes: 10 }),
      createTestPlayer(3, { exploredHexes: 8 })
    ]

    const tied = getTiedPlayers(players, p => p.exploredHexes)
    expect(tied).toHaveLength(2)
    expect(tied.map(p => p.id)).toEqual([1, 2])
  })

  it('should return single player when no tie', () => {
    const players = [
      createTestPlayer(1, { exploredHexes: 12 }),
      createTestPlayer(2, { exploredHexes: 10 })
    ]

    const tied = getTiedPlayers(players, p => p.exploredHexes)
    expect(tied).toHaveLength(1)
    expect(tied[0]?.id).toBe(1)
  })

  it('should handle all players tied', () => {
    const players = [
      createTestPlayer(1, { exploredHexes: 8 }),
      createTestPlayer(2, { exploredHexes: 8 }),
      createTestPlayer(3, { exploredHexes: 8 })
    ]

    const tied = getTiedPlayers(players, p => p.exploredHexes)
    expect(tied).toHaveLength(3)
  })
})

describe('applyCriterion', () => {
  it('should filter to players with maximum criterion value', () => {
    const players = [
      createTestPlayer(1, { campaignPoints: 12 }),
      createTestPlayer(2, { campaignPoints: 10 })
    ]
    const criterion = { name: 'Most CP', getter: (p: Player) => p.campaignPoints }

    const result = applyCriterion(players, criterion)
    expect(result).toHaveLength(1)
    expect(result[0]?.id).toBe(1)
  })

  it('should keep all players if tied on criterion', () => {
    const players = [
      createTestPlayer(1, { campaignPoints: 12 }),
      createTestPlayer(2, { campaignPoints: 12 })
    ]
    const criterion = { name: 'Most CP', getter: (p: Player) => p.campaignPoints }

    const result = applyCriterion(players, criterion)
    expect(result).toHaveLength(2)
  })
})

describe('resolveTie', () => {
  it('should break 2-way tie using Most Campaign Points', () => {
    const players = [
      createTestPlayer(1, { exploredHexes: 8, campaignPoints: 12 }),
      createTestPlayer(2, { exploredHexes: 8, campaignPoints: 10 })
    ]

    const result = resolveTie(players, p => p.exploredHexes)

    expect(result.winners).toHaveLength(1)
    expect(result.winners[0]?.id).toBe(1)
    expect(result.tieBreaker).toBe('Most Campaign Points')
    expect(result.eliminatedPlayers).toHaveLength(1)
  })

  it('should break 2-way tie requiring multiple tie-breakers', () => {
    const players = [
      createTestPlayer(1, {
        exploredHexes: 8,
        campaignPoints: 10,
        gamesWon: 5,
        supplyPointsSpent: 15
      }),
      createTestPlayer(2, {
        exploredHexes: 8,
        campaignPoints: 10,
        gamesWon: 3,
        supplyPointsSpent: 12
      })
    ]

    const result = resolveTie(players, p => p.exploredHexes)

    expect(result.winners).toHaveLength(1)
    expect(result.winners[0]?.id).toBe(1)
    expect(result.tieBreaker).toBe('Most Games Won')
  })

  it('should handle 3-way tie with partial elimination', () => {
    const players = [
      createTestPlayer(1, { exploredHexes: 8, campaignPoints: 12 }),
      createTestPlayer(2, { exploredHexes: 8, campaignPoints: 12 }),
      createTestPlayer(3, { exploredHexes: 8, campaignPoints: 10 })
    ]

    const result = resolveTie(players, p => p.exploredHexes)

    // Should eliminate player 3, but players 1 and 2 still tied
    expect(result.eliminatedPlayers.some(p => p.id === 3)).toBe(true)
  })

  it('should handle ultimate tie (shared victory)', () => {
    const players = [
      createTestPlayer(1, {
        exploredHexes: 8,
        campaignPoints: 10,
        gamesWon: 5,
        supplyPointsSpent: 15
      }),
      createTestPlayer(2, {
        exploredHexes: 8,
        campaignPoints: 10,
        gamesWon: 5,
        supplyPointsSpent: 15
      })
    ]

    const result = resolveTie(players, p => p.exploredHexes)

    expect(result.winners).toHaveLength(2)
    expect(result.tieBreaker).toBeNull()
  })

  it('should skip tie-breaker when it matches primary stat', () => {
    // WARRIOR category uses gamesWon as primary, which is also TB#2
    const players = [
      createTestPlayer(1, {
        gamesWon: 10,
        campaignPoints: 8,
        supplyPointsSpent: 20
      }),
      createTestPlayer(2, {
        gamesWon: 10,
        campaignPoints: 8,
        supplyPointsSpent: 15
      })
    ]

    const result = resolveTie(players, p => p.gamesWon)

    // Should skip CP and Games Won (same as primary), use SP Spent
    expect(result.winners).toHaveLength(1)
    expect(result.winners[0]?.id).toBe(1)
    expect(result.tieBreaker).toBe('Most Supply Points Spent')
  })

  it('should handle missing supplyPointsSpent gracefully', () => {
    const players = [
      createTestPlayer(1, {
        exploredHexes: 8,
        campaignPoints: 10,
        gamesWon: 5,
        supplyPointsSpent: undefined
      }),
      createTestPlayer(2, {
        exploredHexes: 8,
        campaignPoints: 10,
        gamesWon: 5,
        supplyPointsSpent: 10
      })
    ]

    const result = resolveTie(players, p => p.exploredHexes)

    // Player 2 should win via SP Spent (10 > 0)
    expect(result.winners).toHaveLength(1)
    expect(result.winners[0]?.id).toBe(2)
  })

  it('should return single player when no tie exists', () => {
    const players = [createTestPlayer(1, { exploredHexes: 8 })]

    const result = resolveTie(players, p => p.exploredHexes)

    expect(result.winners).toHaveLength(1)
    expect(result.tieBreaker).toBeNull()
    expect(result.eliminatedPlayers).toHaveLength(0)
  })

  it('should break tie using each criterion independently', () => {
    // Test each tie-breaker criterion
    const testCases = [
      {
        stat: 'campaignPoints',
        expectedBreaker: 'Most Campaign Points',
        primaryGetter: (p: Player) => p.exploredHexes,
        p1: { exploredHexes: 8, campaignPoints: 12 },
        p2: { exploredHexes: 8, campaignPoints: 10 }
      },
      {
        stat: 'gamesWon',
        expectedBreaker: 'Most Games Won',
        primaryGetter: (p: Player) => p.exploredHexes,
        p1: { exploredHexes: 8, campaignPoints: 10, gamesWon: 5 },
        p2: { exploredHexes: 8, campaignPoints: 10, gamesWon: 3 }
      },
      {
        stat: 'supplyPointsSpent',
        expectedBreaker: 'Most Supply Points Spent',
        primaryGetter: (p: Player) => p.exploredHexes,
        p1: { exploredHexes: 8, campaignPoints: 10, gamesWon: 5, supplyPointsSpent: 20 },
        p2: { exploredHexes: 8, campaignPoints: 10, gamesWon: 5, supplyPointsSpent: 15 }
      },
      {
        stat: 'exploredHexes',
        expectedBreaker: 'Most Hexes Explored',
        primaryGetter: (p: Player) => p.campaignPoints,  // WHY: Use different primary to test hexes as TB
        p1: { campaignPoints: 10, gamesWon: 5, supplyPointsSpent: 20, exploredHexes: 12 },
        p2: { campaignPoints: 10, gamesWon: 5, supplyPointsSpent: 20, exploredHexes: 10 }
      }
    ]

    testCases.forEach(({ expectedBreaker, primaryGetter, p1, p2 }) => {
      const players = [
        createTestPlayer(1, p1),
        createTestPlayer(2, p2)
      ]

      const result = resolveTie(players, primaryGetter)

      expect(result.winners[0]?.id).toBe(1)
      expect(result.tieBreaker).toBe(expectedBreaker)
    })
  })
})
