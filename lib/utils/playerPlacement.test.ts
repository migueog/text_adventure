import { describe, it, expect } from 'vitest'
import { calculateStartPositions, markStartingHexes, assignPlayerStartPosition } from './playerPlacement'
import type { HexPosition, Hex, MapConfig, Player } from '@/types/campaign'

describe('calculateStartPositions', () => {
  describe('when calculating perimeter positions for different player counts', () => {
    it('should place 2 players at opposite corners (maximum distance)', () => {
      const mapConfig: MapConfig = { rows: 5, cols: 5 }
      const positions = calculateStartPositions(2, mapConfig)

      expect(positions).toHaveLength(2)
      // WHY: Top-left and bottom-right corners maximize starting distance
      expect(positions[0]).toEqual({ row: 0, col: 0 })
      expect(positions[1]).toEqual({ row: 4, col: 4 })
    })

    it('should place 3 players at three corners', () => {
      const mapConfig: MapConfig = { rows: 5, cols: 5 }
      const positions = calculateStartPositions(3, mapConfig)

      expect(positions).toHaveLength(3)
      // WHY: Top-left, bottom-right, top-right - maximizes spread
      expect(positions[0]).toEqual({ row: 0, col: 0 })
      expect(positions[1]).toEqual({ row: 4, col: 4 })
      expect(positions[2]).toEqual({ row: 0, col: 4 })
    })

    it('should place 4 players at all four corners', () => {
      const mapConfig: MapConfig = { rows: 6, cols: 6 }
      const positions = calculateStartPositions(4, mapConfig)

      expect(positions).toHaveLength(4)
      // WHY: All four corners provide maximum spread for competitive play
      expect(positions[0]).toEqual({ row: 0, col: 0 })      // top-left
      expect(positions[1]).toEqual({ row: 5, col: 5 })      // bottom-right
      expect(positions[2]).toEqual({ row: 0, col: 5 })      // top-right
      expect(positions[3]).toEqual({ row: 5, col: 0 })      // bottom-left
    })

    it('should place 5 players at corners plus right edge', () => {
      const mapConfig: MapConfig = { rows: 6, cols: 6 }
      const positions = calculateStartPositions(5, mapConfig)

      expect(positions).toHaveLength(5)
      // WHY: Four corners + right-middle edge
      expect(positions[0]).toEqual({ row: 0, col: 0 })      // top-left
      expect(positions[1]).toEqual({ row: 5, col: 5 })      // bottom-right
      expect(positions[2]).toEqual({ row: 0, col: 5 })      // top-right
      expect(positions[3]).toEqual({ row: 5, col: 0 })      // bottom-left
      expect(positions[4]).toEqual({ row: 3, col: 5 })      // right-middle
    })

    it('should place 6 players at corners plus both middle edges', () => {
      const mapConfig: MapConfig = { rows: 7, cols: 7 }
      const positions = calculateStartPositions(6, mapConfig)

      expect(positions).toHaveLength(6)
      // WHY: Four corners + right-middle + left-middle edges
      expect(positions[0]).toEqual({ row: 0, col: 0 })      // top-left
      expect(positions[1]).toEqual({ row: 6, col: 6 })      // bottom-right
      expect(positions[2]).toEqual({ row: 0, col: 6 })      // top-right
      expect(positions[3]).toEqual({ row: 6, col: 0 })      // bottom-left
      expect(positions[4]).toEqual({ row: 3, col: 6 })      // right-middle
      expect(positions[5]).toEqual({ row: 3, col: 0 })      // left-middle
    })
  })

  describe('when verifying maximum distance for 2 players', () => {
    it('should maximize Euclidean distance on 5x5 map', () => {
      const mapConfig: MapConfig = { rows: 5, cols: 5 }
      const positions = calculateStartPositions(2, mapConfig)

      // WHY: Opposite corners (0,0) to (4,4) create maximum possible distance
      const distance = Math.sqrt(
        Math.pow(positions[1].row - positions[0].row, 2) +
        Math.pow(positions[1].col - positions[0].col, 2)
      )

      // Distance from (0,0) to (4,4) should be sqrt(32) ≈ 5.66
      expect(distance).toBeCloseTo(5.66, 1)
    })
  })

  describe('when verifying positions are unique', () => {
    it('should ensure no two players share the same position', () => {
      const mapConfig: MapConfig = { rows: 6, cols: 6 }

      for (let numPlayers = 2; numPlayers <= 6; numPlayers++) {
        const positions = calculateStartPositions(numPlayers, mapConfig)
        const uniquePositions = new Set(positions.map(p => `${p.row},${p.col}`))

        expect(uniquePositions.size).toBe(numPlayers)
      }
    })
  })

  describe('when verifying deterministic placement', () => {
    it('should return same positions for repeated calls', () => {
      const mapConfig: MapConfig = { rows: 5, cols: 5 }

      const positions1 = calculateStartPositions(4, mapConfig)
      const positions2 = calculateStartPositions(4, mapConfig)

      expect(positions1).toEqual(positions2)
    })
  })

  describe('when handling edge cases', () => {
    it('should never exceed map width', () => {
      const mapConfig: MapConfig = { rows: 5, cols: 5 }
      const positions = calculateStartPositions(3, mapConfig)

      positions.forEach(pos => {
        expect(pos.col).toBeLessThan(mapConfig.cols)
        expect(pos.col).toBeGreaterThanOrEqual(0)
      })
    })

    it('should throw error for invalid player count (< 2)', () => {
      const mapConfig: MapConfig = { rows: 5, cols: 5 }

      expect(() => calculateStartPositions(1, mapConfig)).toThrow('Player count must be between 2 and 6')
      expect(() => calculateStartPositions(0, mapConfig)).toThrow('Player count must be between 2 and 6')
    })

    it('should throw error for invalid player count (> 6)', () => {
      const mapConfig: MapConfig = { rows: 7, cols: 7 }

      expect(() => calculateStartPositions(7, mapConfig)).toThrow('Player count must be between 2 and 6')
      expect(() => calculateStartPositions(10, mapConfig)).toThrow('Player count must be between 2 and 6')
    })
  })

  describe('when positions are on map perimeter', () => {
    it('should place all players on map edges (corners or midpoints)', () => {
      const mapConfig: MapConfig = { rows: 6, cols: 6 }
      const positions = calculateStartPositions(6, mapConfig)

      // WHY: Verify each position is on an edge (row or col is 0 or max)
      positions.forEach(pos => {
        const onTopOrBottom = pos.row === 0 || pos.row === mapConfig.rows - 1
        const onLeftOrRight = pos.col === 0 || pos.col === mapConfig.cols - 1

        expect(onTopOrBottom || onLeftOrRight).toBe(true)
      })
    })
  })
})

describe('markStartingHexes', () => {
  describe('when marking single position', () => {
    it('should set hex as explored base with correct properties', () => {
      const hexes: Record<string, Hex> = {
        '0,1': {
          position: { row: 0, col: 1 },
          explored: false,
          location: null,
          condition: null,
          exploredBy: []
        }
      }
      const positions: HexPosition[] = [{ row: 0, col: 1 }]

      markStartingHexes(hexes, positions)

      expect(hexes['0,1'].explored).toBe(true)
      expect(hexes['0,1'].location).toBe(11) // Base
      expect(hexes['0,1'].condition).toBe(11) // Clear
      expect(hexes['0,1'].exploredBy).toEqual([0])
    })
  })

  describe('when marking multiple positions', () => {
    it('should mark all hexes correctly with different player indices', () => {
      const hexes: Record<string, Hex> = {
        '0,1': {
          position: { row: 0, col: 1 },
          explored: false,
          location: null,
          condition: null,
          exploredBy: []
        },
        '0,3': {
          position: { row: 0, col: 3 },
          explored: false,
          location: null,
          condition: null,
          exploredBy: []
        },
        '0,5': {
          position: { row: 0, col: 5 },
          explored: false,
          location: null,
          condition: null,
          exploredBy: []
        }
      }
      const positions: HexPosition[] = [
        { row: 0, col: 1 },
        { row: 0, col: 3 },
        { row: 0, col: 5 }
      ]

      markStartingHexes(hexes, positions)

      expect(hexes['0,1'].explored).toBe(true)
      expect(hexes['0,1'].location).toBe(11)
      expect(hexes['0,1'].condition).toBe(11)
      expect(hexes['0,1'].exploredBy).toEqual([0])

      expect(hexes['0,3'].explored).toBe(true)
      expect(hexes['0,3'].location).toBe(11)
      expect(hexes['0,3'].condition).toBe(11)
      expect(hexes['0,3'].exploredBy).toEqual([1])

      expect(hexes['0,5'].explored).toBe(true)
      expect(hexes['0,5'].location).toBe(11)
      expect(hexes['0,5'].condition).toBe(11)
      expect(hexes['0,5'].exploredBy).toEqual([2])
    })
  })

  describe('when handling invalid hex IDs', () => {
    it('should skip positions that do not exist in hexes map', () => {
      const hexes: Record<string, Hex> = {
        '0,1': {
          position: { row: 0, col: 1 },
          explored: false,
          location: null,
          condition: null,
          exploredBy: []
        }
      }
      const positions: HexPosition[] = [
        { row: 0, col: 1 },
        { row: 0, col: 99 } // Non-existent hex
      ]

      // Should not throw error
      expect(() => markStartingHexes(hexes, positions)).not.toThrow()

      // Should mark the valid hex
      expect(hexes['0,1'].explored).toBe(true)
    })
  })

  describe('when preserving other hex properties', () => {
    it('should not modify unrelated hex properties', () => {
      const hexes: Record<string, Hex> = {
        '0,1': {
          position: { row: 0, col: 1 },
          explored: false,
          location: null,
          condition: null,
          exploredBy: []
        }
      }
      const positions: HexPosition[] = [{ row: 0, col: 1 }]

      markStartingHexes(hexes, positions)

      // Should preserve position
      expect(hexes['0,1'].position).toEqual({ row: 0, col: 1 })
    })
  })
})

describe('assignPlayerStartPosition', () => {
  describe('when assigning position to player', () => {
    it('should set position property', () => {
      const player: Partial<Player> = {
        id: 0,
        name: 'Player 1',
        position: null,
        bases: []
      }
      const position: HexPosition = { row: 0, col: 1 }

      const result = assignPlayerStartPosition(player, position)

      expect(result.position).toEqual({ row: 0, col: 1 })
    })

    it('should add position to bases array', () => {
      const player: Partial<Player> = {
        id: 0,
        name: 'Player 1',
        position: null,
        bases: []
      }
      const position: HexPosition = { row: 0, col: 1 }

      const result = assignPlayerStartPosition(player, position)

      expect(result.bases).toEqual([{ row: 0, col: 1 }])
    })

    it('should preserve other player properties', () => {
      const player: Partial<Player> = {
        id: 2,
        name: 'Player 3',
        killTeamName: 'Kill Team Alpha',
        color: '#ff0000',
        supplyPoints: 5,
        campaignPoints: 10,
        position: null,
        bases: []
      }
      const position: HexPosition = { row: 0, col: 3 }

      const result = assignPlayerStartPosition(player, position)

      expect(result.id).toBe(2)
      expect(result.name).toBe('Player 3')
      expect(result.killTeamName).toBe('Kill Team Alpha')
      expect(result.color).toBe('#ff0000')
      expect(result.supplyPoints).toBe(5)
      expect(result.campaignPoints).toBe(10)
    })

    it('should replace existing bases array', () => {
      const player: Partial<Player> = {
        id: 0,
        name: 'Player 1',
        position: null,
        bases: [{ row: 1, col: 1 }] // Existing base
      }
      const position: HexPosition = { row: 0, col: 1 }

      const result = assignPlayerStartPosition(player, position)

      // Should replace old bases with new starting position
      expect(result.bases).toEqual([{ row: 0, col: 1 }])
    })
  })

  describe('when handling different position values', () => {
    it('should handle position at origin (0,0)', () => {
      const player: Partial<Player> = {
        id: 0,
        name: 'Player 1',
        position: null,
        bases: []
      }
      const position: HexPosition = { row: 0, col: 0 }

      const result = assignPlayerStartPosition(player, position)

      expect(result.position).toEqual({ row: 0, col: 0 })
      expect(result.bases).toEqual([{ row: 0, col: 0 }])
    })

    it('should handle position at maximum coordinates', () => {
      const player: Partial<Player> = {
        id: 5,
        name: 'Player 6',
        position: null,
        bases: []
      }
      const position: HexPosition = { row: 0, col: 6 }

      const result = assignPlayerStartPosition(player, position)

      expect(result.position).toEqual({ row: 0, col: 6 })
      expect(result.bases).toEqual([{ row: 0, col: 6 }])
    })
  })
})
