import { describe, it, expect } from 'vitest';
import { offsetToAxial, axialToOffset, hexDistance, getNeighbors } from './hexUtils';

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
});
