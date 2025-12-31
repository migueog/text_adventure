/**
 * @vitest-environment jsdom
 * WHY: Test suite for BattleHistory accordion component (Issue #34)
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BattleHistory from './BattleHistory'
import type { ExtendedBattleRecord } from '@/types/battle'

/**
 * WHY: Factory function to create test battle records
 */
const createBattleRecord = (
  overrides: Partial<ExtendedBattleRecord> = {}
): ExtendedBattleRecord => ({
  round: 1,
  opponent: 1,
  result: 'WIN',
  status: 'completed',
  operativesKilled: 3,
  isExternalOpponent: false,
  timestamp: new Date().toISOString(),
  cpEarned: 1,
  spEarned: 0,
  ...overrides
})

/**
 * WHY: Mock player data for opponent name display
 */
const mockPlayers = [
  { id: 0, name: 'Player 1' },
  { id: 1, name: 'Player 2' },
  { id: 2, name: 'Player 3' }
]

describe('BattleHistory', () => {
  describe('Accordion Behavior', () => {
    it('should render collapsed by default', () => {
      const history = [createBattleRecord()]
      render(<BattleHistory history={history} players={mockPlayers} />)

      // WHY: Only header visible when collapsed
      expect(screen.getByRole('button', { name: /Battle History/i })).toBeDefined()
      expect(screen.queryByText(/Win Rate/i)).toBeNull()
    })

    it('should expand when header clicked', async () => {
      const user = userEvent.setup()
      const history = [createBattleRecord()]
      render(<BattleHistory history={history} players={mockPlayers} />)

      await user.click(screen.getByRole('button', { name: /Battle History/i }))

      // WHY: Statistics should be visible when expanded
      expect(screen.getByText(/Win Rate/i)).toBeDefined()
    })

    it('should collapse when header clicked again', async () => {
      const user = userEvent.setup()
      const history = [createBattleRecord()]
      render(<BattleHistory history={history} players={mockPlayers} />)

      await user.click(screen.getByRole('button', { name: /Battle History/i }))
      await user.click(screen.getByRole('button', { name: /Battle History/i }))

      expect(screen.queryByText(/Win Rate/i)).toBeNull()
    })

    it('should show battle count in header', () => {
      const history = [
        createBattleRecord(),
        createBattleRecord({ round: 2 }),
        createBattleRecord({ round: 3 })
      ]
      render(<BattleHistory history={history} players={mockPlayers} />)

      expect(screen.getByText(/3 battles/i)).toBeDefined()
    })

    it('should show "1 battle" for singular', () => {
      const history = [createBattleRecord()]
      render(<BattleHistory history={history} players={mockPlayers} />)

      expect(screen.getByText(/1 battle\b/i)).toBeDefined()
    })
  })

  describe('Statistics Display', () => {
    it('should display win rate', async () => {
      const user = userEvent.setup()
      const history = [
        createBattleRecord({ result: 'WIN' }),
        createBattleRecord({ result: 'WIN', round: 2 }),
        createBattleRecord({ result: 'LOSS', round: 3 }),
        createBattleRecord({ result: 'DRAW', round: 4 })
      ]
      render(<BattleHistory history={history} players={mockPlayers} />)

      await user.click(screen.getByRole('button', { name: /Battle History/i }))

      // 2 wins out of 4 = 50%
      expect(screen.getByText(/50%/)).toBeDefined()
    })

    it('should display win-loss-draw record', async () => {
      const user = userEvent.setup()
      const history = [
        createBattleRecord({ result: 'WIN' }),
        createBattleRecord({ result: 'WIN', round: 2 }),
        createBattleRecord({ result: 'LOSS', round: 3 }),
        createBattleRecord({ result: 'DRAW', round: 4 })
      ]
      render(<BattleHistory history={history} players={mockPlayers} />)

      await user.click(screen.getByRole('button', { name: /Battle History/i }))

      expect(screen.getByText(/2-1-1/)).toBeDefined()
    })

    it('should display total CP earned', async () => {
      const user = userEvent.setup()
      const history = [
        createBattleRecord({ cpEarned: 1 }),
        createBattleRecord({ cpEarned: 1, round: 2 }),
        createBattleRecord({ cpEarned: 0, result: 'LOSS', round: 3 })
      ]
      render(<BattleHistory history={history} players={mockPlayers} />)

      await user.click(screen.getByRole('button', { name: /Battle History/i }))

      expect(screen.getByText(/2 CP/)).toBeDefined()
    })

    it('should display total SP earned', async () => {
      const user = userEvent.setup()
      const history = [
        createBattleRecord({ spEarned: 0, cpEarned: 1 }),
        createBattleRecord({ spEarned: 1, result: 'LOSS', round: 2, cpEarned: 0 }),
        createBattleRecord({ spEarned: 2, result: 'BYE', round: 3, opponent: null, cpEarned: 0 })
      ]
      render(<BattleHistory history={history} players={mockPlayers} />)

      await user.click(screen.getByRole('button', { name: /Battle History/i }))

      expect(screen.getByText(/3 SP/)).toBeDefined()
    })

    it('should display favorite opponent when exists', async () => {
      const user = userEvent.setup()
      const history = [
        createBattleRecord({ opponent: 1 }),
        createBattleRecord({ opponent: 2, round: 2 }),
        createBattleRecord({ opponent: 1, round: 3 }),
        createBattleRecord({ opponent: 1, round: 4 })
      ]
      render(<BattleHistory history={history} players={mockPlayers} />)

      await user.click(screen.getByRole('button', { name: /Battle History/i }))

      // Player 2 is opponent ID 1 (3 times)
      expect(screen.getByText(/Player 2.*3x/i)).toBeDefined()
    })
  })

  describe('Battle Entry Display', () => {
    it('should show round badge for each battle', async () => {
      const user = userEvent.setup()
      const history = [
        createBattleRecord({ round: 1 }),
        createBattleRecord({ round: 2 })
      ]
      render(<BattleHistory history={history} players={mockPlayers} />)

      await user.click(screen.getByRole('button', { name: /Battle History/i }))

      expect(screen.getByText('R1')).toBeDefined()
      expect(screen.getByText('R2')).toBeDefined()
    })

    it('should show result badge with correct styling class', async () => {
      const user = userEvent.setup()
      const history = [
        createBattleRecord({ result: 'WIN' }),
        createBattleRecord({ result: 'LOSS', round: 2 }),
        createBattleRecord({ result: 'DRAW', round: 3 })
      ]
      render(<BattleHistory history={history} players={mockPlayers} />)

      await user.click(screen.getByRole('button', { name: /Battle History/i }))

      const winBadge = screen.getByText('WIN')
      const lossBadge = screen.getByText('LOSS')
      const drawBadge = screen.getByText('DRAW')

      expect(winBadge.className).toContain('win')
      expect(lossBadge.className).toContain('loss')
      expect(drawBadge.className).toContain('draw')
    })

    it('should show opponent name', async () => {
      const user = userEvent.setup()
      const history = [createBattleRecord({ opponent: 1 })]
      render(<BattleHistory history={history} players={mockPlayers} />)

      await user.click(screen.getByRole('button', { name: /Battle History/i }))

      expect(screen.getByText(/vs.*Player 2/i)).toBeDefined()
    })

    it('should show "External" for external opponents', async () => {
      const user = userEvent.setup()
      const history = [createBattleRecord({ isExternalOpponent: true, opponent: null })]
      render(<BattleHistory history={history} players={mockPlayers} />)

      await user.click(screen.getByRole('button', { name: /Battle History/i }))

      expect(screen.getByText(/External/i)).toBeDefined()
    })

    it('should show "No opponent" for BYE', async () => {
      const user = userEvent.setup()
      const history = [createBattleRecord({ result: 'BYE', opponent: null })]
      render(<BattleHistory history={history} players={mockPlayers} />)

      await user.click(screen.getByRole('button', { name: /Battle History/i }))

      expect(screen.getByText(/No opponent/i)).toBeDefined()
    })

    it('should show CP/SP earned per battle', async () => {
      const user = userEvent.setup()
      const history = [createBattleRecord({ cpEarned: 1, spEarned: 0 })]
      render(<BattleHistory history={history} players={mockPlayers} />)

      await user.click(screen.getByRole('button', { name: /Battle History/i }))

      expect(screen.getByText(/\+1 CP/)).toBeDefined()
    })

    it('should show mission type when present', async () => {
      const user = userEvent.setup()
      const history = [createBattleRecord({ missionType: 'Loot and Salvage' })]
      render(<BattleHistory history={history} players={mockPlayers} />)

      await user.click(screen.getByRole('button', { name: /Battle History/i }))

      expect(screen.getByText(/Loot and Salvage/)).toBeDefined()
    })

    it('should show VP scores when present', async () => {
      const user = userEvent.setup()
      const history = [createBattleRecord({ vpScored: 12, vpOpponent: 8 })]
      render(<BattleHistory history={history} players={mockPlayers} />)

      await user.click(screen.getByRole('button', { name: /Battle History/i }))

      expect(screen.getByText(/12.*-.*8/)).toBeDefined()
    })

    it('should show operatives killed and lost when present', async () => {
      const user = userEvent.setup()
      const history = [createBattleRecord({ operativesKilled: 5, operativesLost: 2 })]
      render(<BattleHistory history={history} players={mockPlayers} />)

      await user.click(screen.getByRole('button', { name: /Battle History/i }))

      expect(screen.getByText(/5 killed/i)).toBeDefined()
      expect(screen.getByText(/2 lost/i)).toBeDefined()
    })

    it('should show notes when present', async () => {
      const user = userEvent.setup()
      const history = [createBattleRecord({ notes: 'Great game, close finish!' })]
      render(<BattleHistory history={history} players={mockPlayers} />)

      await user.click(screen.getByRole('button', { name: /Battle History/i }))

      expect(screen.getByText(/Great game, close finish!/)).toBeDefined()
    })
  })

  describe('Filter Controls', () => {
    it('should show filter controls when expanded', async () => {
      const user = userEvent.setup()
      const history = [createBattleRecord()]
      render(<BattleHistory history={history} players={mockPlayers} />)

      await user.click(screen.getByRole('button', { name: /Battle History/i }))

      expect(screen.getByLabelText(/Filter by result/i)).toBeDefined()
    })

    it('should filter by result when selected', async () => {
      const user = userEvent.setup()
      const history = [
        createBattleRecord({ result: 'WIN', round: 1 }),
        createBattleRecord({ result: 'LOSS', round: 2 }),
        createBattleRecord({ result: 'WIN', round: 3 })
      ]
      render(<BattleHistory history={history} players={mockPlayers} />)

      await user.click(screen.getByRole('button', { name: /Battle History/i }))
      await user.selectOptions(screen.getByLabelText(/Filter by result/i), 'LOSS')

      // Only LOSS battle should be visible
      expect(screen.queryByText('R1')).toBeNull()
      expect(screen.getByText('R2')).toBeDefined()
      expect(screen.queryByText('R3')).toBeNull()
    })

    it('should show all battles when "All" filter selected', async () => {
      const user = userEvent.setup()
      const history = [
        createBattleRecord({ result: 'WIN', round: 1 }),
        createBattleRecord({ result: 'LOSS', round: 2 })
      ]
      render(<BattleHistory history={history} players={mockPlayers} />)

      await user.click(screen.getByRole('button', { name: /Battle History/i }))
      await user.selectOptions(screen.getByLabelText(/Filter by result/i), 'LOSS')
      await user.selectOptions(screen.getByLabelText(/Filter by result/i), '')

      expect(screen.getByText('R1')).toBeDefined()
      expect(screen.getByText('R2')).toBeDefined()
    })
  })

  describe('Empty State', () => {
    it('should show empty message when no battles', async () => {
      const user = userEvent.setup()
      render(<BattleHistory history={[]} players={mockPlayers} />)

      await user.click(screen.getByRole('button', { name: /Battle History/i }))

      expect(screen.getByText(/No battles recorded/i)).toBeDefined()
    })

    it('should show empty message when filter returns no results', async () => {
      const user = userEvent.setup()
      const history = [createBattleRecord({ result: 'WIN' })]
      render(<BattleHistory history={history} players={mockPlayers} />)

      await user.click(screen.getByRole('button', { name: /Battle History/i }))
      await user.selectOptions(screen.getByLabelText(/Filter by result/i), 'LOSS')

      expect(screen.getByText(/No battles match/i)).toBeDefined()
    })
  })

  describe('Battle Order', () => {
    it('should display battles in reverse chronological order', async () => {
      const user = userEvent.setup()
      const history = [
        createBattleRecord({ round: 1, timestamp: '2024-01-01T10:00:00Z' }),
        createBattleRecord({ round: 2, timestamp: '2024-01-02T10:00:00Z' }),
        createBattleRecord({ round: 3, timestamp: '2024-01-03T10:00:00Z' })
      ]
      render(<BattleHistory history={history} players={mockPlayers} />)

      await user.click(screen.getByRole('button', { name: /Battle History/i }))

      const roundBadges = screen.getAllByText(/R\d/)
      const roundNumbers = roundBadges.map(badge => badge.textContent)

      // Most recent first
      expect(roundNumbers).toEqual(['R3', 'R2', 'R1'])
    })
  })
})
