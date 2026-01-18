import { describe, it, expect, vi } from 'vitest'
import { getPlayersInHex, selectPlayerInHex, calculateHexCenter } from './hexClickHelpers'
import type { Player } from '@/types/campaign'

/**
 * WHY: Tests for hex click helper functions
 * Format note: hexId is "row,col" (e.g., "0,0"), position is { row: number, col: number }
 */
describe('hexClickHelpers', () => {
  describe('getPlayersInHex', () => {
    it('should return players at the specified hex position', () => {
      const players: Player[] = [
        { id: 0, name: 'Player 1', position: { row: 0, col: 0 }, sp: 5, cp: 0 } as unknown as Player,
        { id: 1, name: 'Player 2', position: { row: 0, col: 1 }, sp: 5, cp: 0 } as unknown as Player,
        { id: 2, name: 'Player 3', position: { row: 0, col: 0 }, sp: 5, cp: 0 } as unknown as Player,
      ]

      const result = getPlayersInHex('0,0', players)

      expect(result).toHaveLength(2)
      expect(result[0]?.id).toBe(0)
      expect(result[1]?.id).toBe(2)
    })

    it('should filter out players with null positions', () => {
      const players: Player[] = [
        { id: 0, name: 'Player 1', position: null, sp: 5, cp: 0 } as unknown as Player,
        { id: 1, name: 'Player 2', position: { row: 0, col: 0 }, sp: 5, cp: 0 } as unknown as Player,
        { id: 2, name: 'Player 3', position: null, sp: 5, cp: 0 } as unknown as Player,
      ]

      const result = getPlayersInHex('0,0', players)

      expect(result).toHaveLength(1)
      expect(result[0]?.id).toBe(1)
    })

    it('should return empty array when no players at hex', () => {
      const players: Player[] = [
        { id: 0, name: 'Player 1', position: { row: 1, col: 1 }, sp: 5, cp: 0 } as unknown as Player,
        { id: 1, name: 'Player 2', position: { row: 2, col: 2 }, sp: 5, cp: 0 } as unknown as Player,
      ]

      const result = getPlayersInHex('0,0', players)

      expect(result).toHaveLength(0)
    })
  })

  describe('selectPlayerInHex', () => {
    it('should auto-select current player if in hex', () => {
      const players: Player[] = [
        { id: 0, name: 'Player 1', position: { row: 0, col: 0 }, sp: 5, cp: 0 } as unknown as Player,
        { id: 1, name: 'Player 2', position: { row: 0, col: 0 }, sp: 5, cp: 0 } as unknown as Player,
      ]
      const setModalState = vi.fn()

      const result = selectPlayerInHex(players, 1, setModalState)

      expect(result).not.toBeNull()
      expect(result?.id).toBe(1)
      expect(setModalState).not.toHaveBeenCalled()
    })

    it('should return only player if single player in hex', () => {
      const players: Player[] = [
        { id: 0, name: 'Player 1', position: { row: 0, col: 0 }, sp: 5, cp: 0 } as unknown as Player,
      ]
      const setModalState = vi.fn()

      const result = selectPlayerInHex(players, 1, setModalState)

      expect(result).not.toBeNull()
      expect(result?.id).toBe(0)
      expect(setModalState).not.toHaveBeenCalled()
    })

    it('should trigger modal when multiple players and current player not in hex', () => {
      const players: Player[] = [
        { id: 0, name: 'Player 1', position: { row: 0, col: 0 }, sp: 5, cp: 0 } as unknown as Player,
        { id: 2, name: 'Player 3', position: { row: 0, col: 0 }, sp: 5, cp: 0 } as unknown as Player,
      ]
      const setModalState = vi.fn()

      const result = selectPlayerInHex(players, 1, setModalState)

      expect(result).toBeNull()
      expect(setModalState).toHaveBeenCalledWith(true, players)
    })

    it('should return null for empty player array', () => {
      const players: Player[] = []
      const setModalState = vi.fn()

      const result = selectPlayerInHex(players, 0, setModalState)

      expect(result).toBeNull()
      expect(setModalState).not.toHaveBeenCalled()
    })
  })

  describe('calculateHexCenter', () => {
    it('should calculate menu position for 0,0', () => {
      const result = calculateHexCenter('0,0')

      // Based on Phaser constants: hexWidth=60, hexHeight=52
      // Origin offset: 400, 300, Menu offset: 20
      expect(result.x).toBe(420) // 400 + 20
      expect(result.y).toBe(320) // 300 + 20
    })

    it('should calculate menu position for 2,3', () => {
      const result = calculateHexCenter('2,3')

      // col=3: pixelX = 400 + 60 * 0.75 * 3 = 400 + 135 = 535, +20 = 555
      // row=2: pixelY = 300 + 52 * (2 + 3 * 0.5) = 300 + 52 * 3.5 = 300 + 182 = 482, +20 = 502
      expect(result.x).toBe(555)
      expect(result.y).toBe(502)
    })

    it('should add menu offset to prevent overlap', () => {
      const result = calculateHexCenter('1,1')

      // col=1: pixelX = 400 + 60 * 0.75 * 1 = 400 + 45 = 445, +20 = 465
      // row=1: pixelY = 300 + 52 * (1 + 1 * 0.5) = 300 + 52 * 1.5 = 300 + 78 = 378, +20 = 398
      expect(result.x).toBe(465)
      expect(result.y).toBe(398)
    })
  })
})
