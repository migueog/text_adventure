import { describe, it, expect, beforeEach } from 'vitest'
import { useCampaignStore } from '@/store/campaign'

/**
 * WHY: Test Zustand campaign store functionality
 */

describe('Campaign Store', () => {
  beforeEach(() => {
    // WHY: Reset store before each test
    const store = useCampaignStore.getState()
    store.reset()
  })

  it('should have correct initial state', () => {
    const state = useCampaignStore.getState()

    expect(state.campaignId).toBeNull()
    expect(state.gameStarted).toBe(false)
    expect(state.players).toEqual([])
    expect(state.currentRound).toBe(1)
    expect(state.threatLevel).toBe(1)
  })

  it('should start game with correct player count', () => {
    const state = useCampaignStore.getState()
    state.startGame(4, false, ['P1', 'P2', 'P3', 'P4'])

    const newState = useCampaignStore.getState()
    expect(newState.gameStarted).toBe(true)
    expect(newState.players).toHaveLength(4)
    expect(newState.players[0].name).toBe('P1')
  })

  it('should advance to next phase', () => {
    const state = useCampaignStore.getState()
    state.startGame(2, false, ['P1', 'P2'])

    const initialPhase = useCampaignStore.getState().currentPhase
    state.nextPhase()

    expect(useCampaignStore.getState().currentPhase).toBe(initialPhase + 1)
  })

  it('should update player stats', () => {
    const state = useCampaignStore.getState()
    state.startGame(2, false, ['P1', 'P2'])

    state.updatePlayer(0, { campaignPoints: 10 })

    const player = useCampaignStore.getState().players[0]
    expect(player.campaignPoints).toBe(10)
  })

  it('should add events to log', () => {
    const state = useCampaignStore.getState()
    const initialEventCount = state.eventLog.length
    state.addEvent('Test event', 'system')

    const events = useCampaignStore.getState().eventLog
    // WHY: Check that event was added (persist middleware may have previous events)
    expect(events.length).toBe(initialEventCount + 1)
    expect(events[events.length - 1]?.message).toBe('Test event')
  })

  it('should explore hex', () => {
    const state = useCampaignStore.getState()
    state.startGame(2, false, ['P1', 'P2'])

    const hexes = useCampaignStore.getState().hexes
    const firstHexKey = Object.keys(hexes)[0]

    state.exploreHex(firstHexKey)

    const exploredHex = useCampaignStore.getState().hexes[firstHexKey]
    expect(exploredHex.explored).toBe(true)
  })

  it('should handle solo mode', () => {
    const state = useCampaignStore.getState()
    state.startGame(2, true, ['Solo Player', 'P2'])

    expect(useCampaignStore.getState().soloMode).toBe(true)
  })
})
