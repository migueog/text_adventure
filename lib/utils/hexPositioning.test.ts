import { describe, it, expect } from 'vitest'
import {
  getHexPosition,
  getCameraCenterPosition,
  getCameraBounds,
  getCameraScroll,
  HEX_SIZE,
  HEX_HEIGHT,
  HEX_WIDTH,
} from './hexPositioning'

describe('hexPositioning', () => {
  describe('Phase 1.1: getHexPosition without offset', () => {
    it('should calculate position without arbitrary offset for origin hex', () => {
      const { x, y } = getHexPosition(0, 0)

      // WHY: Position based only on hex grid math, no arbitrary +20 padding
      expect(x).toBe(HEX_SIZE) // 40, not 60
      expect(y).toBe(HEX_SIZE) // 40, not 60
    })

    it('should offset odd columns vertically by half hex height', () => {
      const { x, y } = getHexPosition(0, 1)

      // WHY: Odd columns shift down by half hex height for offset grid
      expect(x).toBe(HEX_SIZE + HEX_WIDTH * 0.75)
      expect(y).toBe(HEX_SIZE + HEX_HEIGHT / 2)
    })

    it('should not offset even columns vertically', () => {
      const { x, y } = getHexPosition(0, 2)

      // WHY: Even columns stay at base vertical position
      expect(x).toBe(HEX_SIZE + HEX_WIDTH * 0.75 * 2)
      expect(y).toBe(HEX_SIZE)
    })

    it('should calculate correct position for middle hex', () => {
      const { x, y } = getHexPosition(2, 2)

      // WHY: Middle hex position used for camera centering
      const expectedX = HEX_SIZE + HEX_WIDTH * 0.75 * 2
      const expectedY = HEX_SIZE + HEX_HEIGHT * 2
      expect(x).toBe(expectedX)
      expect(y).toBe(expectedY)
    })

    it('should calculate correct position for bottom-right hex', () => {
      const { x, y } = getHexPosition(4, 4)

      // WHY: Bottom-right position used for camera bounds
      const expectedX = HEX_SIZE + HEX_WIDTH * 0.75 * 4
      const expectedY = HEX_SIZE + HEX_HEIGHT * 4
      expect(x).toBe(expectedX)
      expect(y).toBe(expectedY)
    })
  })

  describe('Phase 1.2: getCameraCenterPosition', () => {
    it('should return center hex position for 5x5 map', () => {
      const { x, y } = getCameraCenterPosition(5, 5)
      const expectedPos = getHexPosition(2, 2)

      // WHY: Camera should center on actual middle hex
      expect(x).toBe(expectedPos.x)
      expect(y).toBe(expectedPos.y)
    })

    it('should handle even-sized maps correctly', () => {
      const { x, y } = getCameraCenterPosition(6, 6)
      const expectedPos = getHexPosition(3, 3)

      expect(x).toBe(expectedPos.x)
      expect(y).toBe(expectedPos.y)
    })

    it('should handle odd-sized maps correctly', () => {
      const { x, y } = getCameraCenterPosition(7, 7)
      const expectedPos = getHexPosition(3, 3)

      expect(x).toBe(expectedPos.x)
      expect(y).toBe(expectedPos.y)
    })

    it('should handle rectangular maps', () => {
      const { x, y } = getCameraCenterPosition(5, 7)
      const expectedPos = getHexPosition(2, 3)

      expect(x).toBe(expectedPos.x)
      expect(y).toBe(expectedPos.y)
    })
  })

  describe('Phase 1.3: getCameraBounds', () => {
    it('should set bounds to contain entire 5x5 map with padding', () => {
      const bounds = getCameraBounds(5, 5)
      const bottomRightPos = getHexPosition(4, 4)

      // WHY: Bounds should contain entire map plus padding for right/bottom edges
      expect(bounds.x).toBe(0)
      expect(bounds.y).toBe(0)
      expect(bounds.width).toBe(bottomRightPos.x + HEX_SIZE * 2)
      expect(bounds.height).toBe(bottomRightPos.y + HEX_SIZE * 2)
    })

    it('should set bounds correctly for small map (5x5)', () => {
      const bounds = getCameraBounds(5, 5)
      const bottomRightPos = getHexPosition(4, 4)

      expect(bounds).toEqual({
        x: 0,
        y: 0,
        width: bottomRightPos.x + HEX_SIZE * 2,
        height: bottomRightPos.y + HEX_SIZE * 2,
      })
    })

    it('should set bounds correctly for medium map (6x6)', () => {
      const bounds = getCameraBounds(6, 6)
      const bottomRightPos = getHexPosition(5, 5)

      expect(bounds).toEqual({
        x: 0,
        y: 0,
        width: bottomRightPos.x + HEX_SIZE * 2,
        height: bottomRightPos.y + HEX_SIZE * 2,
      })
    })

    it('should set bounds correctly for large map (7x7)', () => {
      const bounds = getCameraBounds(7, 7)
      const bottomRightPos = getHexPosition(6, 6)

      expect(bounds).toEqual({
        x: 0,
        y: 0,
        width: bottomRightPos.x + HEX_SIZE * 2,
        height: bottomRightPos.y + HEX_SIZE * 2,
      })
    })

    it('should handle rectangular maps', () => {
      const bounds = getCameraBounds(5, 7)
      const bottomRightPos = getHexPosition(4, 6)

      expect(bounds).toEqual({
        x: 0,
        y: 0,
        width: bottomRightPos.x + HEX_SIZE * 2,
        height: bottomRightPos.y + HEX_SIZE * 2,
      })
    })
  })

  describe('Phase 3: getCameraScroll', () => {
    it('should calculate scroll to center 5x5 map in viewport', () => {
      const { scrollX, scrollY } = getCameraScroll(5, 5, 800, 600)
      const centerPos = getHexPosition(2, 2)

      // WHY: Scroll = center position - half viewport
      // This centers the hex in the camera view
      expect(scrollX).toBe(centerPos.x - 400)
      expect(scrollY).toBe(centerPos.y - 300)
    })

    it('should calculate scroll for different viewport sizes', () => {
      const { scrollX, scrollY } = getCameraScroll(7, 7, 1024, 768)
      const centerPos = getHexPosition(3, 3)

      // WHY: Larger viewport requires different scroll offset
      expect(scrollX).toBe(centerPos.x - 512)
      expect(scrollY).toBe(centerPos.y - 384)
    })

    it('should calculate scroll for 6x6 map', () => {
      const { scrollX, scrollY } = getCameraScroll(6, 6, 800, 600)
      const centerPos = getHexPosition(3, 3)

      // WHY: Even-sized map centers on floor(rows/2), floor(cols/2)
      expect(scrollX).toBe(centerPos.x - 400)
      expect(scrollY).toBe(centerPos.y - 300)
    })

    it('should calculate scroll for rectangular map', () => {
      const { scrollX, scrollY } = getCameraScroll(5, 7, 800, 600)
      const centerPos = getHexPosition(2, 3)

      // WHY: Rectangular maps use different center coordinates
      expect(scrollX).toBe(centerPos.x - 400)
      expect(scrollY).toBe(centerPos.y - 300)
    })
  })
})
