import { describe, it, expect, vi } from 'vitest';

// Mock Phaser since it requires canvas which jsdom doesn't provide
vi.mock('phaser', () => ({
  default: {},
  Game: vi.fn(),
  AUTO: 'auto',
}));

describe('App', () => {
  describe('smoke test', () => {
    it('should pass basic test to verify infrastructure', () => {
      // Basic smoke test to verify testing infrastructure is set up correctly
      expect(true).toBe(true);
    });
  });
});
