// WHY: Pure functions for hex positioning, testable without Phaser dependency

export const HEX_SIZE = 40
export const HEX_HEIGHT = Math.sqrt(3) * HEX_SIZE
export const HEX_WIDTH = HEX_SIZE * 2

/**
 * Calculate the pixel position of a hex at given grid coordinates
 * WHY: Extracted for testability and reuse
 */
export function getHexPosition(row: number, col: number): { x: number; y: number } {
  // WHY: Removed +20 offset - was causing camera centering mismatch
  const x = col * HEX_WIDTH * 0.75 + HEX_SIZE
  const y = row * HEX_HEIGHT + (col % 2 === 1 ? HEX_HEIGHT / 2 : 0) + HEX_SIZE
  return { x, y }
}

/**
 * Calculate camera center position for a map
 * WHY: Center on actual middle hex position
 */
export function getCameraCenterPosition(rows: number, cols: number): { x: number; y: number } {
  const centerRow = Math.floor(rows / 2)
  const centerCol = Math.floor(cols / 2)
  return getHexPosition(centerRow, centerCol)
}

/**
 * Calculate camera bounds for a map
 * WHY: Bounds should contain entire map plus padding
 */
export function getCameraBounds(rows: number, cols: number): {
  x: number
  y: number
  width: number
  height: number
} {
  const bottomRightPos = getHexPosition(rows - 1, cols - 1)
  return {
    x: 0,
    y: 0,
    width: bottomRightPos.x + HEX_SIZE * 2,
    height: bottomRightPos.y + HEX_SIZE * 2,
  }
}

/**
 * Calculate camera scroll position to center map
 * WHY: setScroll() works during scene creation, unlike centerOn()
 *
 * @param rows Map rows
 * @param cols Map columns
 * @param viewportWidth Camera viewport width
 * @param viewportHeight Camera viewport height
 */
export function getCameraScroll(
  rows: number,
  cols: number,
  viewportWidth: number,
  viewportHeight: number
): { scrollX: number; scrollY: number } {
  const centerPos = getCameraCenterPosition(rows, cols)

  // WHY: Scroll = center position - half viewport
  // This centers the hex in the camera view
  return {
    scrollX: centerPos.x - viewportWidth / 2,
    scrollY: centerPos.y - viewportHeight / 2,
  }
}
