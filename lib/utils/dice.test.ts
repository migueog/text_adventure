import { describe, it, expect, vi } from 'vitest';
import { 
  rollD3, 
  rollD6, 
  rollD36, 
  roll2D6, 
  rollDice, 
  parseValue,
  rollWithBreakdown 
} from './dice';

describe('dice utilities', () => {
  describe('rollD3', () => {
    it('should return a number between 1 and 3', () => {
      const result = rollD3();
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(3);
    });
  });

  describe('rollD6', () => {
    it('should return a number between 1 and 6', () => {
      const result = rollD6();
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(6);
    });
  });

  describe('rollD36', () => {
    it('should return a number between 11 and 36', () => {
      const result = rollD36();
      expect(result).toBeGreaterThanOrEqual(11);
      expect(result).toBeLessThanOrEqual(36);
    });

    it('should only return valid D36 values', () => {
      // Valid D36 values are 11-16, 21-26, 31-36
      const result = rollD36();
      const tensDigit = Math.floor(result / 10);
      const unitsDigit = result % 10;
      expect([1, 2, 3]).toContain(tensDigit);
      expect(unitsDigit).toBeGreaterThanOrEqual(1);
      expect(unitsDigit).toBeLessThanOrEqual(6);
    });
  });

  describe('roll2D6', () => {
    it('should return a number between 2 and 12', () => {
      const result = roll2D6();
      expect(result).toBeGreaterThanOrEqual(2);
      expect(result).toBeLessThanOrEqual(12);
    });
  });

  describe('rollDice', () => {
    it('should parse and roll D6 notation', () => {
      const result = rollDice('D6');
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(6);
    });

    it('should parse and roll 2D6 notation', () => {
      const result = rollDice('2D6');
      expect(result).toBeGreaterThanOrEqual(2);
      expect(result).toBeLessThanOrEqual(12);
    });

    it('should handle modifiers like D3+1', () => {
      const result = rollDice('D3+1');
      expect(result).toBeGreaterThanOrEqual(2);
      expect(result).toBeLessThanOrEqual(4);
    });

    it('should return 0 for invalid notation', () => {
      expect(rollDice('invalid')).toBe(0);
      expect(rollDice('')).toBe(0);
    });
  });

  describe('parseValue', () => {
    it('should return numbers as-is', () => {
      expect(parseValue(5)).toBe(5);
      expect(parseValue(0)).toBe(0);
    });

    it('should parse numeric strings', () => {
      expect(parseValue('10')).toBe(10);
    });

    it('should roll dice notation strings', () => {
      const result = parseValue('D6');
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(6);
    });

    it('should return 0 for invalid input', () => {
      expect(parseValue('invalid')).toBe(0);
      expect(parseValue(null)).toBe(0);
      expect(parseValue(undefined)).toBe(0);
    });
  });

  describe('rollWithBreakdown', () => {
    it('should return breakdown for D6', () => {
      const result = rollWithBreakdown('D6');
      
      expect(result.notation).toBe('D6');
      expect(result.rolls.length).toBe(1);
      expect(result.rolls[0]).toBeGreaterThanOrEqual(1);
      expect(result.rolls[0]).toBeLessThanOrEqual(6);
      expect(result.modifier).toBe(0);
      expect(result.total).toBe(result.rolls[0]);
    });

    it('should handle multiple dice (2D6)', () => {
      const result = rollWithBreakdown('2D6');
      
      expect(result.notation).toBe('2D6');
      expect(result.rolls.length).toBe(2);
      expect(result.modifier).toBe(0);
      
      result.rolls.forEach(roll => {
        expect(roll).toBeGreaterThanOrEqual(1);
        expect(roll).toBeLessThanOrEqual(6);
      });
      
      const expectedTotal = result.rolls.reduce((sum, r) => sum + r, 0);
      expect(result.total).toBe(expectedTotal);
    });

    it('should handle positive modifiers (D6+2)', () => {
      const result = rollWithBreakdown('D6+2');
      
      expect(result.notation).toBe('D6+2');
      expect(result.rolls.length).toBe(1);
      expect(result.modifier).toBe(2);
      expect(result.total).toBe(result.rolls[0]! + 2);
    });

    it('should handle negative modifiers (2D6-3)', () => {
      const result = rollWithBreakdown('2D6-3');
      
      expect(result.notation).toBe('2D6-3');
      expect(result.rolls.length).toBe(2);
      expect(result.modifier).toBe(-3);
      
      const rollSum = result.rolls.reduce((sum, r) => sum + r, 0);
      expect(result.total).toBe(rollSum - 3);
    });

    it('should handle 3D10+5', () => {
      const result = rollWithBreakdown('3D10+5');
      
      expect(result.notation).toBe('3D10+5');
      expect(result.rolls.length).toBe(3);
      expect(result.modifier).toBe(5);
      
      result.rolls.forEach(roll => {
        expect(roll).toBeGreaterThanOrEqual(1);
        expect(roll).toBeLessThanOrEqual(10);
      });
    });

    it('should return zero breakdown for invalid notation', () => {
      const result = rollWithBreakdown('invalid');
      
      expect(result.total).toBe(0);
      expect(result.rolls).toEqual([]);
      expect(result.modifier).toBe(0);
      expect(result.notation).toBe('invalid');
    });

    it('should be case insensitive', () => {
      const lower = rollWithBreakdown('d6');
      const upper = rollWithBreakdown('D6');
      
      expect(lower.rolls.length).toBe(1);
      expect(upper.rolls.length).toBe(1);
    });
  });
});
