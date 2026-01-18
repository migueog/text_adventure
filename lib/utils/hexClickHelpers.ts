import type { Player } from '@/types/campaign'

/**
 * Find all players at a given hex position
 *
 * WHY: Filters out players with null positions to handle early game state
 * where players haven't been placed on the map yet.
 *
 * Format: hexId is "row,col" (e.g., "0,0"), position is { row: number, col: number }
 */
export function getPlayersInHex(hexId: string, players: Player[]): Player[] {
  // Parse hexId string format "row,col" to compare with position object
  const parts = hexId.split(',')
  const row = parseInt(parts[0] ?? '0', 10)
  const col = parseInt(parts[1] ?? '0', 10)

  return players.filter(p => p.position && p.position.row === row && p.position.col === col)
}

/**
 * Auto-select player or trigger modal for multi-player hexes
 *
 * WHY: Reduces modal fatigue by auto-selecting current player when present,
 * or single player when alone in hex. Only shows modal when truly needed.
 *
 * @returns Selected player or null if modal should be shown
 */
export function selectPlayerInHex(
  players: Player[],
  currentPlayerIndex: number,
  setModalState: (open: boolean, players: Player[]) => void
): Player | null {
  if (players.length === 0) return null
  if (players.length === 1) return players[0] ?? null

  // Auto-select current player if in this hex (90% use case)
  const currentPlayer = players.find(p => p.id === currentPlayerIndex)
  if (currentPlayer) return currentPlayer

  // Multiple players, current player not here → show modal
  setModalState(true, players)
  return null
}

/**
 * Calculate pixel position for context menu at hex center
 *
 * WHY: Duplicates Phaser constants to avoid circular dependency.
 * These values are stable and defined in HexMapScene.ts.
 * Adds +20px offset to prevent overlap with hex borders.
 *
 * Format: hexId is "row,col" (e.g., "0,0")
 */
export function calculateHexCenter(hexId: string): { x: number; y: number } {
  // Parse hex coordinates from "row,col" format
  const parts = hexId.split(',')
  const row = parseInt(parts[0] ?? '0', 10)
  const col = parseInt(parts[1] ?? '0', 10)

  // Phaser constants from HexMapScene.ts
  const HEX_WIDTH = 60
  const HEX_HEIGHT = 52
  const ORIGIN_X = 400
  const ORIGIN_Y = 300
  const MENU_OFFSET = 20

  // Hex grid to pixel conversion (flat-top hexes, offset coordinates)
  const pixelX = ORIGIN_X + HEX_WIDTH * 0.75 * col
  const pixelY = ORIGIN_Y + HEX_HEIGHT * (row + col * 0.5)

  return {
    x: pixelX + MENU_OFFSET,
    y: pixelY + MENU_OFFSET,
  }
}
