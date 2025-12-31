/**
 * Tests for MissingPlayerModal Component (Issue #41)
 *
 * WHY: TDD - write tests first before implementation
 * Tests cover modal display, opponent selection, confirmation flow,
 * and proper reward messaging.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import MissingPlayerModal from './MissingPlayerModal'
import type { Player } from '@/types/campaign'

// WHY: Minimal player data for testing
const mockCurrentPlayer: Pick<Player, 'id' | 'name' | 'color'> = {
  id: 1,
  name: 'Red Player',
  color: '#ff0000'
}

const mockOtherPlayers: Array<Pick<Player, 'id' | 'name' | 'color'>> = [
  { id: 2, name: 'Blue Player', color: '#0000ff' },
  { id: 3, name: 'Green Player', color: '#00ff00' },
  { id: 4, name: 'Yellow Player', color: '#ffff00' }
]

describe('MissingPlayerModal', () => {
  describe('when closed', () => {
    it('should not render anything when isOpen is false', () => {
      render(
        <MissingPlayerModal
          isOpen={false}
          currentPlayer={mockCurrentPlayer}
          otherPlayers={mockOtherPlayers}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      )

      expect(screen.queryByText('Record Missing Opponent')).not.toBeInTheDocument()
    })
  })

  describe('when open', () => {
    it('should display modal title', () => {
      render(
        <MissingPlayerModal
          isOpen={true}
          currentPlayer={mockCurrentPlayer}
          otherPlayers={mockOtherPlayers}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      )

      expect(screen.getByText('Record Missing Opponent')).toBeInTheDocument()
    })

    it('should show opponent selection dropdown', () => {
      render(
        <MissingPlayerModal
          isOpen={true}
          currentPlayer={mockCurrentPlayer}
          otherPlayers={mockOtherPlayers}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      )

      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    it('should list all other players in dropdown', () => {
      render(
        <MissingPlayerModal
          isOpen={true}
          currentPlayer={mockCurrentPlayer}
          otherPlayers={mockOtherPlayers}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      )

      const dropdown = screen.getByRole('combobox')

      expect(dropdown).toHaveTextContent('Blue Player')
      expect(dropdown).toHaveTextContent('Green Player')
      expect(dropdown).toHaveTextContent('Yellow Player')
    })

    it('should not include current player in dropdown', () => {
      render(
        <MissingPlayerModal
          isOpen={true}
          currentPlayer={mockCurrentPlayer}
          otherPlayers={mockOtherPlayers}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      )

      const dropdown = screen.getByRole('combobox')

      // Red Player should not be an option
      expect(dropdown).not.toHaveTextContent('Red Player')
    })

    it('should show reward explanation text after selecting opponent', async () => {
      const user = userEvent.setup()

      render(
        <MissingPlayerModal
          isOpen={true}
          currentPlayer={mockCurrentPlayer}
          otherPlayers={mockOtherPlayers}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      )

      // WHY: Select an opponent first to show rewards
      const dropdown = screen.getByRole('combobox')
      await user.selectOptions(dropdown, '2')

      expect(screen.getByText(/\+1 CP/)).toBeInTheDocument()
      expect(screen.getByText(/\+1 SP/)).toBeInTheDocument()
    })

    it('should have confirm and cancel buttons', () => {
      render(
        <MissingPlayerModal
          isOpen={true}
          currentPlayer={mockCurrentPlayer}
          otherPlayers={mockOtherPlayers}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      )

      expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    })

    it('should disable confirm button when no opponent selected', () => {
      render(
        <MissingPlayerModal
          isOpen={true}
          currentPlayer={mockCurrentPlayer}
          otherPlayers={mockOtherPlayers}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      )

      const confirmBtn = screen.getByRole('button', { name: /confirm/i })
      expect(confirmBtn).toBeDisabled()
    })
  })

  describe('opponent selection', () => {
    it('should enable confirm button after selecting opponent', async () => {
      const user = userEvent.setup()

      render(
        <MissingPlayerModal
          isOpen={true}
          currentPlayer={mockCurrentPlayer}
          otherPlayers={mockOtherPlayers}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      )

      const dropdown = screen.getByRole('combobox')
      await user.selectOptions(dropdown, '2')

      const confirmBtn = screen.getByRole('button', { name: /confirm/i })
      expect(confirmBtn).not.toBeDisabled()
    })

    it('should show selected opponent name in explanation', async () => {
      const user = userEvent.setup()

      render(
        <MissingPlayerModal
          isOpen={true}
          currentPlayer={mockCurrentPlayer}
          otherPlayers={mockOtherPlayers}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      )

      const dropdown = screen.getByRole('combobox')
      await user.selectOptions(dropdown, '2')

      // WHY: Check for opponent name in the reward explanation (not the dropdown)
      const rewardExplanation = screen.getByText(/LOSS \(\+1 SP\)/).closest('p')
      expect(rewardExplanation).toHaveTextContent('Blue Player')
    })
  })

  describe('confirmation flow', () => {
    it('should call onConfirm with absent player ID when confirmed', async () => {
      const user = userEvent.setup()
      const onConfirm = vi.fn()

      render(
        <MissingPlayerModal
          isOpen={true}
          currentPlayer={mockCurrentPlayer}
          otherPlayers={mockOtherPlayers}
          onConfirm={onConfirm}
          onCancel={vi.fn()}
        />
      )

      const dropdown = screen.getByRole('combobox')
      await user.selectOptions(dropdown, '3')

      const confirmBtn = screen.getByRole('button', { name: /confirm/i })
      await user.click(confirmBtn)

      expect(onConfirm).toHaveBeenCalledWith(3)
    })

    it('should call onCancel when cancel button clicked', async () => {
      const user = userEvent.setup()
      const onCancel = vi.fn()

      render(
        <MissingPlayerModal
          isOpen={true}
          currentPlayer={mockCurrentPlayer}
          otherPlayers={mockOtherPlayers}
          onConfirm={vi.fn()}
          onCancel={onCancel}
        />
      )

      const cancelBtn = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelBtn)

      expect(onCancel).toHaveBeenCalled()
    })
  })

  describe('sporting rule messaging', () => {
    it('should include sporting rule reminder', () => {
      render(
        <MissingPlayerModal
          isOpen={true}
          currentPlayer={mockCurrentPlayer}
          otherPlayers={mockOtherPlayers}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      )

      // Look for sporting rule text
      expect(screen.getByText(/sporting/i)).toBeInTheDocument()
    })
  })
})
