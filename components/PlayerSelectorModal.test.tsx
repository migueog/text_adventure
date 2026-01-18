import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PlayerSelectorModal from './PlayerSelectorModal'
import type { Player } from '@/types/campaign'

/**
 * WHY: Test suite for player selection modal
 * Verifies modal display and player selection handling
 */

const createTestPlayer = (id: number, name: string, color: string): Player => ({
  id,
  name,
  killTeamName: `Team ${id}`,
  color,
  position: { row: 0, col: 0 },
  supplyPoints: 5,
  campaignPoints: 0,
  bases: [],
  camps: [],
  exploredHexes: 0,
  operativesKilled: 0,
  gamesPlayed: 0,
  gamesWon: 0,
  gamesLost: 0,
  history: [],
  battleResult: null,
  searchedHexes: [],
  battleHistory: [],
  supplyPointsSpent: 0,
  operativeKillDetails: [],
})

describe('PlayerSelectorModal', () => {
  const mockOnSelect = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    mockOnSelect.mockClear()
    mockOnCancel.mockClear()
  })

  describe('rendering', () => {
    it('should display modal title', () => {
      const players = [createTestPlayer(0, 'Player 1', '#ff0000')]

      render(
        <PlayerSelectorModal
          players={players}
          onSelect={mockOnSelect}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByText(/Select Player/)).toBeInTheDocument()
    })

    it('should render all provided players', () => {
      const players = [
        createTestPlayer(0, 'Player 1', '#ff0000'),
        createTestPlayer(1, 'Player 2', '#00ff00'),
        createTestPlayer(2, 'Player 3', '#0000ff'),
      ]

      render(
        <PlayerSelectorModal
          players={players}
          onSelect={mockOnSelect}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByText('Player 1')).toBeInTheDocument()
      expect(screen.getByText('Player 2')).toBeInTheDocument()
      expect(screen.getByText('Player 3')).toBeInTheDocument()
    })

    it('should display player kill team names', () => {
      const players = [createTestPlayer(0, 'Alice', '#ff0000')]
      players[0].killTeamName = 'Kill Team Alpha'

      render(
        <PlayerSelectorModal
          players={players}
          onSelect={mockOnSelect}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByText('Kill Team Alpha')).toBeInTheDocument()
    })
  })

  describe('player selection', () => {
    it('should call onSelect with player ID when player clicked', async () => {
      const user = userEvent.setup()
      const players = [
        createTestPlayer(0, 'Player 1', '#ff0000'),
        createTestPlayer(1, 'Player 2', '#00ff00'),
      ]

      render(
        <PlayerSelectorModal
          players={players}
          onSelect={mockOnSelect}
          onCancel={mockOnCancel}
        />
      )

      const player2Button = screen.getByRole('button', { name: /Player 2/ })
      await user.click(player2Button)

      expect(mockOnSelect).toHaveBeenCalledWith(1)
    })
  })

  describe('cancel button', () => {
    it('should render cancel button', () => {
      const players = [createTestPlayer(0, 'Player 1', '#ff0000')]

      render(
        <PlayerSelectorModal
          players={players}
          onSelect={mockOnSelect}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByRole('button', { name: /Cancel/ })).toBeInTheDocument()
    })

    it('should call onCancel when cancel clicked', async () => {
      const user = userEvent.setup()
      const players = [createTestPlayer(0, 'Player 1', '#ff0000')]

      render(
        <PlayerSelectorModal
          players={players}
          onSelect={mockOnSelect}
          onCancel={mockOnCancel}
        />
      )

      const cancelButton = screen.getByRole('button', { name: /Cancel/ })
      await user.click(cancelButton)

      expect(mockOnCancel).toHaveBeenCalledOnce()
    })
  })

  describe('modal overlay', () => {
    it('should render modal with overlay', () => {
      const players = [createTestPlayer(0, 'Player 1', '#ff0000')]

      const { container } = render(
        <PlayerSelectorModal
          players={players}
          onSelect={mockOnSelect}
          onCancel={mockOnCancel}
        />
      )

      const overlay = container.querySelector('.modal-overlay')
      expect(overlay).toBeInTheDocument()
    })

    it('should call onCancel when overlay clicked', async () => {
      const user = userEvent.setup()
      const players = [createTestPlayer(0, 'Player 1', '#ff0000')]

      const { container } = render(
        <PlayerSelectorModal
          players={players}
          onSelect={mockOnSelect}
          onCancel={mockOnCancel}
        />
      )

      const overlay = container.querySelector('.modal-overlay')
      if (overlay) {
        await user.click(overlay)
        expect(mockOnCancel).toHaveBeenCalledOnce()
      }
    })
  })
})
