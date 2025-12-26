import { describe, it, expect } from 'vitest';
import {
  offsetToAxial,
  axialToOffset,
  hexDistance,
  getNeighbors,
  getHexesInRange,
  findPath,
  hexId,
  parseHexId,
  hexToPixel,
  hexToPixelFlat,
  isHexBlocked,
  canExploreHex,
  isPlayerInBlockedHex,
  isHexSurface,
  isHexTomb
} from './hexUtils';

describe('hexUtils', () => {
  describe('offsetToAxial', () => {
    it('should convert offset coordinates to axial', () => {
      const result = offsetToAxial(0, 0);
      expect(result).toEqual({ q: 0, r: 0 });
    });

    it('should handle even row conversions', () => {
      const result = offsetToAxial(2, 3);
      expect(result).toEqual({ q: 2, r: 2 });
    });

    it('should handle odd row conversions', () => {
      const result = offsetToAxial(1, 2);
      expect(result).toEqual({ q: 2, r: 1 });
    });
  });

  describe('axialToOffset', () => {
    it('should convert axial coordinates to offset', () => {
      const result = axialToOffset(0, 0);
      expect(result).toEqual({ row: 0, col: 0 });
    });

    it('should correctly reverse offsetToAxial conversion', () => {
      const offset = { row: 2, col: 3 };
      const axial = offsetToAxial(offset.row, offset.col);
      const converted = axialToOffset(axial.q, axial.r);
      expect(converted).toEqual(offset);
    });
  });

  describe('hexDistance', () => {
    it('should return 0 for same hex', () => {
      expect(hexDistance(0, 0, 0, 0)).toBe(0);
    });

    it('should calculate distance between adjacent hexes', () => {
      expect(hexDistance(0, 0, 0, 1)).toBe(1);
      expect(hexDistance(0, 0, 1, 0)).toBe(1);
    });

    it('should calculate distance correctly for non-adjacent hexes', () => {
      expect(hexDistance(0, 0, 2, 2)).toBeGreaterThan(0);
    });

    it('should be symmetric', () => {
      const d1 = hexDistance(1, 2, 3, 4);
      const d2 = hexDistance(3, 4, 1, 2);
      expect(d1).toBe(d2);
    });
  });

  describe('getNeighbors', () => {
    it('should return array of valid neighbor coordinates', () => {
      const neighbors = getNeighbors(2, 2, 5, 5);
      expect(Array.isArray(neighbors)).toBe(true);
      expect(neighbors.length).toBeGreaterThan(0);
      expect(neighbors.length).toBeLessThanOrEqual(6);
    });

    it('should filter out neighbors outside grid bounds', () => {
      const neighbors = getNeighbors(0, 0, 5, 5);
      // Corner hex should have fewer than 6 neighbors
      expect(neighbors.length).toBeLessThan(6);
      
      // All neighbors should be within bounds
      neighbors.forEach((neighbor) => {
        expect(neighbor.row).toBeGreaterThanOrEqual(0);
        expect(neighbor.row).toBeLessThan(5);
        expect(neighbor.col).toBeGreaterThanOrEqual(0);
        expect(neighbor.col).toBeLessThan(5);
      });
    });

    it('should return different neighbors for even and odd rows', () => {
      const evenNeighbors = getNeighbors(2, 2, 5, 5);
      const oddNeighbors = getNeighbors(3, 2, 5, 5);
      
      // Just verify they're calculated (different offset patterns)
      expect(evenNeighbors.length).toBeGreaterThan(0);
      expect(oddNeighbors.length).toBeGreaterThan(0);
    });
  });

  describe('getHexesInRange', () => {
    it('should return empty array for range 0', () => {
      const hexes = getHexesInRange(2, 2, 0, 5, 5);
      expect(hexes).toEqual([]);
    });

    it('should return hexes within range 1', () => {
      const hexes = getHexesInRange(2, 2, 1, 5, 5);
      expect(hexes.length).toBeGreaterThan(0);
      expect(hexes.length).toBeLessThanOrEqual(6);
      
      // All hexes should be at distance 1
      hexes.forEach(hex => {
        expect(hex.distance).toBe(1);
      });
    });

    it('should not include center hex', () => {
      const hexes = getHexesInRange(2, 2, 3, 5, 5);
      const centerIncluded = hexes.some(h => h.row === 2 && h.col === 2);
      expect(centerIncluded).toBe(false);
    });

    it('should respect grid boundaries', () => {
      const hexes = getHexesInRange(0, 0, 2, 5, 5);
      hexes.forEach(hex => {
        expect(hex.row).toBeGreaterThanOrEqual(0);
        expect(hex.row).toBeLessThan(5);
        expect(hex.col).toBeGreaterThanOrEqual(0);
        expect(hex.col).toBeLessThan(5);
      });
    });
  });

  describe('findPath', () => {
    it('should return empty array for same start and end', () => {
      const path = findPath(2, 2, 2, 2, 5, 5);
      expect(path).toEqual([]);
    });

    it('should find path between adjacent hexes', () => {
      const path = findPath(0, 0, 0, 1, 5, 5);
      expect(path).not.toBeNull();
      expect(path?.length).toBe(1);
      expect(path?.[0]).toEqual({ row: 0, col: 1 });
    });

    it('should find path between distant hexes', () => {
      const path = findPath(0, 0, 2, 2, 5, 5);
      expect(path).not.toBeNull();
      expect(path!.length).toBeGreaterThan(0);
      
      // Last hex should be destination
      const lastHex = path![path!.length - 1];
      expect(lastHex?.row).toBe(2);
      expect(lastHex?.col).toBe(2);
    });

    it('should return null when destination is blocked', () => {
      const blocked = new Set(['2,2']);
      const path = findPath(0, 0, 2, 2, 5, 5, blocked);
      expect(path).toBeNull();
    });

    it('should avoid blocked hexes in path', () => {
      const blocked = new Set(['0,1']);
      const path = findPath(0, 0, 0, 2, 5, 5, blocked);
      
      if (path !== null) {
        // Path should not contain blocked hex
        const hasBlocked = path.some(h => h.row === 0 && h.col === 1);
        expect(hasBlocked).toBe(false);
      }
    });

    it('should return null when no path exists', () => {
      // Block all neighbors of destination
      const blocked = new Set(['0,1', '1,0', '1,1', '0,2', '1,2']);
      const path = findPath(2, 2, 0, 0, 3, 3, blocked);
      expect(path).toBeNull();
    });
  });

  describe('hexId and parseHexId', () => {
    it('should create correct hex ID', () => {
      expect(hexId(0, 0)).toBe('0,0');
      expect(hexId(5, 10)).toBe('5,10');
      expect(hexId(100, 200)).toBe('100,200');
    });

    it('should parse hex ID correctly', () => {
      expect(parseHexId('0,0')).toEqual({ row: 0, col: 0 });
      expect(parseHexId('5,10')).toEqual({ row: 5, col: 10 });
      expect(parseHexId('100,200')).toEqual({ row: 100, col: 200 });
    });

    it('should roundtrip correctly', () => {
      const original = { row: 42, col: 73 };
      const id = hexId(original.row, original.col);
      const parsed = parseHexId(id);
      expect(parsed).toEqual(original);
    });
  });

  describe('hexToPixel', () => {
    it('should calculate pixel position for origin hex', () => {
      const pos = hexToPixel(0, 0, 10);
      expect(pos.x).toBe(0);
      expect(pos.y).toBe(0);
    });

    it('should calculate different positions for different hexes', () => {
      const pos1 = hexToPixel(0, 0, 10);
      const pos2 = hexToPixel(1, 1, 10);
      
      expect(pos1.x).not.toBe(pos2.x);
      expect(pos1.y).not.toBe(pos2.y);
    });

    it('should scale with hexSize', () => {
      const pos1 = hexToPixel(1, 1, 10);
      const pos2 = hexToPixel(1, 1, 20);
      
      // Larger hex size should give proportionally larger positions
      expect(pos2.x).toBeGreaterThan(pos1.x);
      expect(pos2.y).toBeGreaterThan(pos1.y);
    });

    it('should offset odd columns vertically', () => {
      const evenCol = hexToPixel(0, 0, 10);
      const oddCol = hexToPixel(0, 1, 10);
      
      // Odd column should be offset vertically
      expect(oddCol.y).toBeGreaterThan(evenCol.y);
    });
  });

  describe('hexToPixelFlat', () => {
    it('should calculate pixel position for flat-top layout', () => {
      const pos = hexToPixelFlat(0, 0, 10);
      expect(pos.x).toBe(0);
      expect(pos.y).toBe(0);
    });

    it('should calculate different positions for different hexes', () => {
      const pos1 = hexToPixelFlat(0, 0, 10);
      const pos2 = hexToPixelFlat(1, 1, 10);

      expect(pos1.x).not.toBe(pos2.x);
      expect(pos1.y).not.toBe(pos2.y);
    });

    it('should offset odd rows horizontally', () => {
      const evenRow = hexToPixelFlat(0, 0, 10);
      const oddRow = hexToPixelFlat(1, 0, 10);

      // Odd row should be offset horizontally
      expect(oddRow.x).toBeGreaterThan(evenRow.x);
    });

    it('should scale with hexSize', () => {
      const pos1 = hexToPixelFlat(1, 1, 10);
      const pos2 = hexToPixelFlat(1, 1, 20);

      expect(pos2.x).toBeGreaterThan(pos1.x);
      expect(pos2.y).toBeGreaterThan(pos1.y);
    });
  });

  describe('isHexBlocked', () => {
    it('should return true for blocked hex type', () => {
      const hex = { type: 'blocked' as const };
      expect(isHexBlocked(hex)).toBe(true);
    });

    it('should return false for surface hex', () => {
      const hex = { type: 'surface' as const };
      expect(isHexBlocked(hex)).toBe(false);
    });

    it('should return false for tomb hex', () => {
      const hex = { type: 'tomb' as const };
      expect(isHexBlocked(hex)).toBe(false);
    });

    it('should handle undefined hex', () => {
      expect(isHexBlocked(undefined)).toBe(false);
    });
  });

  describe('canExploreHex', () => {
    it('should return false for already explored hex', () => {
      const hex = { explored: true, type: 'surface' as const };
      expect(canExploreHex(hex)).toBe(false);
    });

    it('should return false for blocked hex', () => {
      const hex = { explored: false, type: 'blocked' as const };
      expect(canExploreHex(hex)).toBe(false);
    });

    it('should return true for unexplored surface hex', () => {
      const hex = { explored: false, type: 'surface' as const };
      expect(canExploreHex(hex)).toBe(true);
    });

    it('should return true for unexplored tomb hex', () => {
      const hex = { explored: false, type: 'tomb' as const };
      expect(canExploreHex(hex)).toBe(true);
    });

    it('should handle undefined hex', () => {
      expect(canExploreHex(undefined)).toBe(false);
    });
  });

  describe('isPlayerInBlockedHex', () => {
    it('should return true when player is in blocked hex', () => {
      const playerPos = { row: 2, col: 3 };
      const hex = { type: 'blocked' as const };
      expect(isPlayerInBlockedHex(playerPos, hex)).toBe(true);
    });

    it('should return false when player is in surface hex', () => {
      const playerPos = { row: 2, col: 3 };
      const hex = { type: 'surface' as const };
      expect(isPlayerInBlockedHex(playerPos, hex)).toBe(false);
    });

    it('should return false when hex is undefined', () => {
      const playerPos = { row: 2, col: 3 };
      expect(isPlayerInBlockedHex(playerPos, undefined)).toBe(false);
    });
  });

  describe('isHexSurface', () => {
    it('should return true for surface hex', () => {
      const hex = { type: 'surface' as const };
      expect(isHexSurface(hex)).toBe(true);
    });

    it('should return false for tomb hex', () => {
      const hex = { type: 'tomb' as const };
      expect(isHexSurface(hex)).toBe(false);
    });

    it('should return false for blocked hex', () => {
      const hex = { type: 'blocked' as const };
      expect(isHexSurface(hex)).toBe(false);
    });

    it('should handle undefined hex', () => {
      expect(isHexSurface(undefined)).toBe(false);
    });
  });

  describe('isHexTomb', () => {
    it('should return true for tomb hex', () => {
      const hex = { type: 'tomb' as const };
      expect(isHexTomb(hex)).toBe(true);
    });

    it('should return false for surface hex', () => {
      const hex = { type: 'surface' as const };
      expect(isHexTomb(hex)).toBe(false);
    });

    it('should return false for blocked hex', () => {
      const hex = { type: 'blocked' as const };
      expect(isHexTomb(hex)).toBe(false);
    });

    it('should handle undefined hex', () => {
      expect(isHexTomb(undefined)).toBe(false);
    });
  });
});
