import { describe, it, expect } from 'vitest'
import {
  generateInvitationToken,
  isTokenExpired,
  getExpirationDate
} from '@/lib/utils/invitation'

/**
 * WHY: Test invitation utility functions
 */

describe('Invitation Utilities', () => {
  describe('generateInvitationToken', () => {
    it('should generate 64-character hex token', () => {
      // WHY: 32 bytes = 64 hex characters
      const token = generateInvitationToken()
      expect(token).toHaveLength(64)
      expect(token).toMatch(/^[0-9a-f]{64}$/)
    })

    it('should generate unique tokens', () => {
      // WHY: Each token must be unique
      const token1 = generateInvitationToken()
      const token2 = generateInvitationToken()
      expect(token1).not.toBe(token2)
    })
  })

  describe('isTokenExpired', () => {
    it('should return false for future date', () => {
      // WHY: Invitations not yet expired
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 7)
      expect(isTokenExpired(futureDate)).toBe(false)
    })

    it('should return true for past date', () => {
      // WHY: Expired invitations should be rejected
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1)
      expect(isTokenExpired(pastDate)).toBe(true)
    })
  })

  describe('getExpirationDate', () => {
    it('should return date 7 days in future', () => {
      // WHY: Standard 7-day expiration period
      const expiration = getExpirationDate()
      const now = new Date()
      const daysDiff = Math.floor(
        (expiration.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )
      expect(daysDiff).toBe(7)
    })
  })
})
