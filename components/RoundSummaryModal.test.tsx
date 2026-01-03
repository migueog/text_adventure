import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RoundSummaryModal from './RoundSummaryModal'
import type { RoundStatistics, Player, Event } from '@/types/campaign'

/**
 * WHY: Test suite for RoundSummaryModal component (Issue #31 - Phase 2)
 * Ensures modal displays correctly and handles user interactions
 */

// WHY: Helper to create mock statistics
function createMockStatistics(overrides?: Partial<RoundStatistics>): RoundStatistics {
  return {
    hexesExplored: 3,
    battles: {
      wins: 1,
      losses: 1,
      draws: 0,
      byes: 0
    },
    spChanges: {
      1: 2,
      2: -1
    },
    cpChanges: {
      1: 3,
      2: 0
    },
    threatChange: {
      from: 2,
      to: 3
    },
    majorEvents: [],
    ...overrides
  }
}

// WHY: Helper to create mock players
function createMockPlayers(): Player[] {
  return [
    {
      id: 1,
      name: 'Player One',
      killTeamName: 'Team One',
      color: '#ff0000',
      position: { row: 0, col: 0 },
      supplyPoints: 5,
      campaignPoints: 3,
      exploredHexes: 3,
      operativesKilled: 0,
      bases: [],
      camps: [],
      movementOrder: 1,
      battleResult: null,
      searchedHexes: [],
      battleHistory: [],
      history: [],
      eliminated: false,
      priority: 1
    },
    {
      id: 2,
      name: 'Player Two',
      killTeamName: 'Team Two',
      color: '#0000ff',
      position: { row: 0, col: 1 },
      supplyPoints: 4,
      campaignPoints: 0,
      exploredHexes: 2,
      operativesKilled: 0,
      bases: [],
      camps: [],
      movementOrder: 2,
      battleResult: null,
      searchedHexes: [],
      battleHistory: [],
      history: [],
      eliminated: false,
      priority: 2
    }
  ]
}

describe('RoundSummaryModal', () => {
  describe('when rendering', () => {
    it('should display round number in title', () => {
      const stats = createMockStatistics()
      const players = createMockPlayers()
      const onContinue = vi.fn()
      const onDisable = vi.fn()

      render(
        <RoundSummaryModal
          roundNumber={3}
          statistics={stats}
          players={players}
          onContinue={onContinue}
          onDisable={onDisable}
        />
      )

      expect(screen.getByText(/Round 3 Complete/i)).toBeInTheDocument()
    })

    it('should display threat level change', () => {
      const stats = createMockStatistics({
        threatChange: { from: 4, to: 5 }
      })
      const players = createMockPlayers()
      const onContinue = vi.fn()
      const onDisable = vi.fn()

      render(
        <RoundSummaryModal
          roundNumber={5}
          statistics={stats}
          players={players}
          onContinue={onContinue}
          onDisable={onDisable}
        />
      )

      expect(screen.getByText(/Threat Level: 4 → 5/i)).toBeInTheDocument()
    })

    it('should display hexes explored count', () => {
      const stats = createMockStatistics({ hexesExplored: 7 })
      const players = createMockPlayers()
      const onContinue = vi.fn()
      const onDisable = vi.fn()

      render(
        <RoundSummaryModal
          roundNumber={2}
          statistics={stats}
          players={players}
          onContinue={onContinue}
          onDisable={onDisable}
        />
      )

      expect(screen.getByText(/7/)).toBeInTheDocument()
      expect(screen.getByText(/hexes explored/i)).toBeInTheDocument()
    })
  })

  describe('when displaying battle stats', () => {
    it('should show wins, losses, draws, and byes', () => {
      const stats = createMockStatistics({
        battles: {
          wins: 2,
          losses: 1,
          draws: 1,
          byes: 1
        }
      })
      const players = createMockPlayers()
      const onContinue = vi.fn()
      const onDisable = vi.fn()

      render(
        <RoundSummaryModal
          roundNumber={1}
          statistics={stats}
          players={players}
          onContinue={onContinue}
          onDisable={onDisable}
        />
      )

      expect(screen.getByText(/Wins:/i)).toBeInTheDocument()
      expect(screen.getByText(/Losses:/i)).toBeInTheDocument()
      expect(screen.getByText(/Draws:/i)).toBeInTheDocument()
      expect(screen.getByText(/Byes:/i)).toBeInTheDocument()
    })

    it('should not show battle section if no battles occurred', () => {
      const stats = createMockStatistics({
        battles: {
          wins: 0,
          losses: 0,
          draws: 0,
          byes: 0
        }
      })
      const players = createMockPlayers()
      const onContinue = vi.fn()
      const onDisable = vi.fn()

      render(
        <RoundSummaryModal
          roundNumber={1}
          statistics={stats}
          players={players}
          onContinue={onContinue}
          onDisable={onDisable}
        />
      )

      expect(screen.queryByText(/Battles/i)).not.toBeInTheDocument()
    })
  })

  describe('when displaying player changes', () => {
    it('should show SP and CP changes for each player', () => {
      const stats = createMockStatistics({
        spChanges: { 1: 2, 2: -1 },
        cpChanges: { 1: 3, 2: 1 }
      })
      const players = createMockPlayers()
      const onContinue = vi.fn()
      const onDisable = vi.fn()

      render(
        <RoundSummaryModal
          roundNumber={1}
          statistics={stats}
          players={players}
          onContinue={onContinue}
          onDisable={onDisable}
        />
      )

      expect(screen.getByText(/Player One/i)).toBeInTheDocument()
      expect(screen.getByText(/SP \+2/i)).toBeInTheDocument()
      expect(screen.getByText(/CP \+3/i)).toBeInTheDocument()
    })

    it('should not show players with no changes', () => {
      const stats = createMockStatistics({
        spChanges: { 1: 0, 2: 0 },
        cpChanges: { 1: 0, 2: 0 }
      })
      const players = createMockPlayers()
      const onContinue = vi.fn()
      const onDisable = vi.fn()

      render(
        <RoundSummaryModal
          roundNumber={1}
          statistics={stats}
          players={players}
          onContinue={onContinue}
          onDisable={onDisable}
        />
      )

      // WHY: Player Changes section should exist but be empty
      expect(screen.queryByText(/Player One/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/Player Two/i)).not.toBeInTheDocument()
    })
  })

  describe('when displaying major events', () => {
    it('should show up to 5 major events', () => {
      const events: Event[] = [
        { type: 'exploration', icon: '🗺️', message: 'Found tomb', round: 1, phase: 'Movement', timestamp: '' },
        { type: 'battle', icon: '⚔️', message: 'Won battle', round: 1, phase: 'Battle', timestamp: '' },
        { type: 'reward', icon: '🎁', message: 'Gained CP', round: 1, phase: 'Action', timestamp: '' }
      ]
      const stats = createMockStatistics({ majorEvents: events })
      const players = createMockPlayers()
      const onContinue = vi.fn()
      const onDisable = vi.fn()

      render(
        <RoundSummaryModal
          roundNumber={1}
          statistics={stats}
          players={players}
          onContinue={onContinue}
          onDisable={onDisable}
        />
      )

      expect(screen.getByText(/Found tomb/i)).toBeInTheDocument()
      expect(screen.getByText(/Won battle/i)).toBeInTheDocument()
      expect(screen.getByText(/Gained CP/i)).toBeInTheDocument()
    })

    it('should show "+X more events" when more than 5 events', () => {
      const events: Event[] = Array.from({ length: 8 }, (_, i) => ({
        type: 'exploration' as const,
        icon: '🗺️',
        message: `Event ${i + 1}`,
        round: 1,
        phase: 'Movement',
        timestamp: ''
      }))
      const stats = createMockStatistics({ majorEvents: events })
      const players = createMockPlayers()
      const onContinue = vi.fn()
      const onDisable = vi.fn()

      render(
        <RoundSummaryModal
          roundNumber={1}
          statistics={stats}
          players={players}
          onContinue={onContinue}
          onDisable={onDisable}
        />
      )

      expect(screen.getByText(/\+3 more events/i)).toBeInTheDocument()
    })

    it('should not show major events section if no events', () => {
      const stats = createMockStatistics({ majorEvents: [] })
      const players = createMockPlayers()
      const onContinue = vi.fn()
      const onDisable = vi.fn()

      render(
        <RoundSummaryModal
          roundNumber={1}
          statistics={stats}
          players={players}
          onContinue={onContinue}
          onDisable={onDisable}
        />
      )

      expect(screen.queryByText(/Major Events/i)).not.toBeInTheDocument()
    })
  })

  describe('when handling user interactions', () => {
    it('should call onContinue when Continue button clicked', async () => {
      const user = userEvent.setup()
      const stats = createMockStatistics()
      const players = createMockPlayers()
      const onContinue = vi.fn()
      const onDisable = vi.fn()

      render(
        <RoundSummaryModal
          roundNumber={3}
          statistics={stats}
          players={players}
          onContinue={onContinue}
          onDisable={onDisable}
        />
      )

      const continueButton = screen.getByRole('button', { name: /Continue to Round 4/i })
      await user.click(continueButton)

      expect(onContinue).toHaveBeenCalledOnce()
    })

    it('should call onDisable when "Don\'t show again" clicked', async () => {
      const user = userEvent.setup()
      const stats = createMockStatistics()
      const players = createMockPlayers()
      const onContinue = vi.fn()
      const onDisable = vi.fn()

      render(
        <RoundSummaryModal
          roundNumber={3}
          statistics={stats}
          players={players}
          onContinue={onContinue}
          onDisable={onDisable}
        />
      )

      const disableButton = screen.getByRole('button', { name: /Don't show again/i })
      await user.click(disableButton)

      expect(onDisable).toHaveBeenCalledOnce()
    })
  })

  describe('when handling keyboard navigation', () => {
    it('should call onContinue when Escape key pressed', async () => {
      const user = userEvent.setup()
      const stats = createMockStatistics()
      const players = createMockPlayers()
      const onContinue = vi.fn()
      const onDisable = vi.fn()

      render(
        <RoundSummaryModal
          roundNumber={3}
          statistics={stats}
          players={players}
          onContinue={onContinue}
          onDisable={onDisable}
        />
      )

      await user.keyboard('{Escape}')

      expect(onContinue).toHaveBeenCalledOnce()
    })
  })
})
