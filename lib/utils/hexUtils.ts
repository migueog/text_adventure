// Hex grid utilities using axial coordinates

export interface AxialCoords {
  q: number
  r: number
}

export interface OffsetCoords {
  row: number
  col: number
}

export interface CubeCoords {
  x: number
  y: number
  z: number
}

export interface HexPosition {
  row: number
  col: number
  distance?: number
}

export interface PixelPosition {
  x: number
  y: number
}

/**
 * Convert offset coordinates (row, col) to axial coordinates (q, r)
 */
export function offsetToAxial(row: number, col: number): AxialCoords {
  const q = col - Math.floor(row / 2)
  const r = row
  return { q, r }
}

/**
 * Convert axial coordinates to offset coordinates
 */
export function axialToOffset(q: number, r: number): OffsetCoords {
  const col = q + Math.floor(r / 2)
  const row = r
  return { row, col }
}

/**
 * Get cube coordinates from axial (useful for distance calculation)
 */
export function axialToCube(q: number, r: number): CubeCoords {
  return { x: q, y: -q - r, z: r }
}

/**
 * Calculate distance between two hexes using cube coordinates
 */
export function hexDistance(row1: number, col1: number, row2: number, col2: number): number {
  const a = offsetToAxial(row1, col1)
  const b = offsetToAxial(row2, col2)

  const ac = axialToCube(a.q, a.r)
  const bc = axialToCube(b.q, b.r)

  return Math.max(
    Math.abs(ac.x - bc.x),
    Math.abs(ac.y - bc.y),
    Math.abs(ac.z - bc.z)
  )
}

/**
 * Get all neighbors of a hex
 */
export function getNeighbors(row: number, col: number, maxRows: number, maxCols: number): HexPosition[] {
  const directions = row % 2 === 0
    ? [
        [-1, -1], [-1, 0],  // top-left, top-right
        [0, -1], [0, 1],    // left, right
        [1, -1], [1, 0]     // bottom-left, bottom-right
      ]
    : [
        [-1, 0], [-1, 1],   // top-left, top-right
        [0, -1], [0, 1],    // left, right
        [1, 0], [1, 1]      // bottom-left, bottom-right
      ]

  return directions
    .map(([dr, dc]) => ({ row: row + dr, col: col + dc }))
    .filter(({ row: r, col: c }) =>
      r >= 0 && r < maxRows && c >= 0 && c < maxCols
    )
}

/**
 * Get all hexes within a certain distance
 */
export function getHexesInRange(
  centerRow: number,
  centerCol: number,
  range: number,
  maxRows: number,
  maxCols: number
): HexPosition[] {
  const hexes: HexPosition[] = []
  for (let r = 0; r < maxRows; r++) {
    for (let c = 0; c < maxCols; c++) {
      const dist = hexDistance(centerRow, centerCol, r, c)
      if (dist <= range && dist > 0) {
        hexes.push({ row: r, col: c, distance: dist })
      }
    }
  }
  return hexes
}

/**
 * Find path between two hexes (BFS for shortest path)
 */
export function findPath(
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number,
  maxRows: number,
  maxCols: number,
  blockedHexes: Set<string> = new Set()
): HexPosition[] | null {
  const start = `${startRow},${startCol}`
  const end = `${endRow},${endCol}`

  if (start === end) return []
  if (blockedHexes.has(end)) return null

  const queue: HexPosition[][] = [[{ row: startRow, col: startCol }]]
  const visited = new Set([start])

  while (queue.length > 0) {
    const path = queue.shift()
    if (!path) continue
    
    const current = path[path.length - 1]
    if (!current) continue

    const neighbors = getNeighbors(current.row, current.col, maxRows, maxCols)

    for (const neighbor of neighbors) {
      const key = `${neighbor.row},${neighbor.col}`

      if (visited.has(key) || blockedHexes.has(key)) continue

      const newPath = [...path, neighbor]

      if (key === end) {
        return newPath.slice(1) // Remove start position
      }

      visited.add(key)
      queue.push(newPath)
    }
  }

  return null // No path found
}

/**
 * Generate hex ID from coordinates
 */
export function hexId(row: number, col: number): string {
  return `${row},${col}`
}

/**
 * Parse hex ID back to coordinates
 */
export function parseHexId(id: string): OffsetCoords {
  const [row, col] = id.split(',').map(Number)
  return { row, col }
}

/**
 * Calculate pixel position for hex rendering (pointy-top hexes)
 */
export function hexToPixel(row: number, col: number, hexSize: number): PixelPosition {
  const width = hexSize * 2
  const height = Math.sqrt(3) * hexSize
  const horizDist = width * 0.75
  const vertDist = height

  const x = col * horizDist
  const y = row * vertDist + (col % 2 === 1 ? vertDist / 2 : 0)

  return { x, y }
}

/**
 * Calculate pixel position for flat-top hexes (alternative layout)
 */
export function hexToPixelFlat(row: number, col: number, hexSize: number): PixelPosition {
  const width = Math.sqrt(3) * hexSize
  const height = hexSize * 2
  const horizDist = width
  const vertDist = height * 0.75

  const x = col * horizDist + (row % 2 === 1 ? horizDist / 2 : 0)
  const y = row * vertDist

  return { x, y }
}
