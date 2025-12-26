import { describe, it, expect } from 'vitest'
import { authConfig } from './auth.config'

describe('Auth Configuration', () => {
  it('should have credentials provider configured', () => {
    expect(authConfig.providers).toBeDefined()
    expect(authConfig.providers.length).toBeGreaterThan(0)
  })

  it('should use JWT strategy', () => {
    expect(authConfig.session?.strategy).toBe('jwt')
  })

  it('should have pages configured', () => {
    expect(authConfig.pages?.signIn).toBe('/auth/signin')
  })

  it('should have callbacks defined', () => {
    expect(authConfig.callbacks?.jwt).toBeDefined()
    expect(authConfig.callbacks?.session).toBeDefined()
  })
})
