import { describe, it, expect } from 'vitest'
import { signupSchema, updateProfileSchema, isStrongPassword } from './auth'

describe('Validation Schemas', () => {
  describe('isStrongPassword', () => {
    it('should accept strong passwords', () => {
      expect(isStrongPassword('TestPass123!')).toBe(true)
      expect(isStrongPassword('MyP@ssw0rd')).toBe(true)
    })

    it('should reject weak passwords', () => {
      expect(isStrongPassword('short')).toBe(false) // Too short
      expect(isStrongPassword('alllowercase123')).toBe(false) // No uppercase
      expect(isStrongPassword('ALLUPPERCASE123')).toBe(false) // No lowercase
      expect(isStrongPassword('NoNumbers!')).toBe(false) // No numbers
    })
  })

  describe('signupSchema', () => {
    it('should validate correct signup data', () => {
      const result = signupSchema.safeParse({
        email: 'test@example.com',
        username: 'testuser',
        password: 'TestPass123!'
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const result = signupSchema.safeParse({
        email: 'invalid-email',
        username: 'testuser',
        password: 'TestPass123!'
      })
      expect(result.success).toBe(false)
    })

    it('should reject weak password', () => {
      const result = signupSchema.safeParse({
        email: 'test@example.com',
        username: 'testuser',
        password: 'weak'
      })
      expect(result.success).toBe(false)
    })

    it('should reject username with spaces', () => {
      const result = signupSchema.safeParse({
        email: 'test@example.com',
        username: 'test user',
        password: 'TestPass123!'
      })
      expect(result.success).toBe(false)
    })

    it('should reject short username', () => {
      const result = signupSchema.safeParse({
        email: 'test@example.com',
        username: 'ab',
        password: 'TestPass123!'
      })
      expect(result.success).toBe(false)
    })
  })

  describe('updateProfileSchema', () => {
    it('should allow updating username only', () => {
      const result = updateProfileSchema.safeParse({ username: 'newusername' })
      expect(result.success).toBe(true)
    })

    it('should allow updating email only', () => {
      const result = updateProfileSchema.safeParse({ email: 'new@example.com' })
      expect(result.success).toBe(true)
    })

    it('should reject invalid email in update', () => {
      const result = updateProfileSchema.safeParse({ email: 'invalid' })
      expect(result.success).toBe(false)
    })
  })
})
