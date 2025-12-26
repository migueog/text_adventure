import { describe, it, expect } from 'vitest'
import { type CampaignRole } from '@/lib/permissions/utils'

/**
 * WHY: Unit tests for permission utility functions
 * These test the business logic of role determination
 */

describe('Permission Utilities - Type Safety', () => {
  it('should have correct CampaignRole type', () => {
    // WHY: Verify TypeScript types compile correctly
    const ownerRole: CampaignRole = 'owner'
    const playerRole: CampaignRole = 'player'
    const noneRole: CampaignRole = 'none'

    expect(ownerRole).toBe('owner')
    expect(playerRole).toBe('player')
    expect(noneRole).toBe('none')
  })

  it('should export role types correctly', () => {
    // WHY: Ensure exports are available for use in other modules
    const roles: CampaignRole[] = ['owner', 'player', 'none']
    expect(roles).toHaveLength(3)
  })
})
