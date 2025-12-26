import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword } from './utils'

describe('Auth Utils', () => {
  describe('hashPassword', () => {
    it('should hash password with bcrypt', async () => {
      const password = 'TestPass123!'
      const hash = await hashPassword(password)

      expect(hash).not.toBe(password)
      expect(hash.length).toBeGreaterThan(50)
    })

    it('should generate different hashes for same password', async () => {
      const password = 'TestPass123!'
      const hash1 = await hashPassword(password)
      const hash2 = await hashPassword(password)

      expect(hash1).not.toBe(hash2) // bcrypt uses salt
    })
  })

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'TestPass123!'
      const hash = await hashPassword(password)

      const isValid = await verifyPassword(password, hash)
      expect(isValid).toBe(true)
    })

    it('should reject incorrect password', async () => {
      const password = 'TestPass123!'
      const hash = await hashPassword(password)

      const isValid = await verifyPassword('WrongPassword', hash)
      expect(isValid).toBe(false)
    })
  })
})
