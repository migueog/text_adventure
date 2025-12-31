/**
 * @vitest-environment jsdom
 * WHY: Test suite for BattleForm component (Issue #34)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BattleForm from './BattleForm'
import type { Player } from '@/types/campaign'

/**
 * WHY: Create minimal player mock for testing
 */
const createMockPlayer = (id: number, name: string): Pick<Player, 'id' | 'name' | 'color'> => ({
  id,
  name,
  color: '#000000'
})

describe('BattleForm', () => {
  const mockPlayers = [
    createMockPlayer(0, 'Player 1'),
    createMockPlayer(1, 'Player 2'),
    createMockPlayer(2, 'Player 3')
  ]

  const defaultProps = {
    currentPlayerId: 0,
    players: mockPlayers,
    currentRound: 1,
    onRecordBattle: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Battle Result Display', () => {
    it('should display all battle result options with rewards', () => {
      render(<BattleForm {...defaultProps} />)

      // WHY: Users need to see rewards for each option
      expect(screen.getByText(/Victory \(\+1 CP\)/i)).toBeDefined()
      expect(screen.getByText(/Draw \(\+1 SP\)/i)).toBeDefined()
      expect(screen.getByText(/Defeat \(\+1 SP\)/i)).toBeDefined()
      expect(screen.getByText(/Bye.*\+2 SP/i)).toBeDefined()
    })

    it('should have WIN selected by default', () => {
      render(<BattleForm {...defaultProps} />)

      const resultSelect = screen.getByLabelText(/Battle Result/i) as HTMLSelectElement
      expect(resultSelect.value).toBe('WIN')
    })
  })

  describe('Opponent Selection', () => {
    it('should show opponent dropdown for non-BYE results', () => {
      render(<BattleForm {...defaultProps} />)

      // WHY: Non-BYE battles need opponent selection - use ID selector
      expect(screen.getByRole('combobox', { name: /^Opponent:/ })).toBeDefined()
    })

    it('should hide opponent dropdown when BYE is selected', async () => {
      const user = userEvent.setup()
      render(<BattleForm {...defaultProps} />)

      await user.selectOptions(screen.getByLabelText(/Battle Result/i), 'BYE')

      expect(screen.queryByRole('combobox', { name: /^Opponent:/ })).toBeNull()
    })

    it('should not include current player in opponent list', () => {
      render(<BattleForm {...defaultProps} />)

      const opponentSelect = screen.getByRole('combobox', { name: /^Opponent:/ }) as HTMLSelectElement
      const options = Array.from(opponentSelect.querySelectorAll('option'))
      const optionTexts = options.map(o => o.textContent)

      // WHY: Can't battle yourself
      expect(optionTexts).toContain('Player 2')
      expect(optionTexts).toContain('Player 3')
      expect(optionTexts).not.toContain('Player 1')
    })
  })

  describe('External Opponent Toggle', () => {
    it('should show external opponent checkbox for non-BYE results', () => {
      render(<BattleForm {...defaultProps} />)

      expect(screen.getByLabelText(/External opponent/i)).toBeDefined()
    })

    it('should hide opponent dropdown when external is checked', async () => {
      const user = userEvent.setup()
      render(<BattleForm {...defaultProps} />)

      await user.click(screen.getByLabelText(/External opponent/i))

      expect(screen.queryByRole('combobox', { name: /^Opponent:/ })).toBeNull()
    })

    it('should not show external checkbox for BYE', async () => {
      const user = userEvent.setup()
      render(<BattleForm {...defaultProps} />)

      await user.selectOptions(screen.getByLabelText(/Battle Result/i), 'BYE')

      expect(screen.queryByLabelText(/External opponent/i)).toBeNull()
    })
  })

  describe('Challenge Refused Checkbox', () => {
    it('should show challenge checkbox when opponent is selected', async () => {
      const user = userEvent.setup()
      render(<BattleForm {...defaultProps} />)

      await user.selectOptions(screen.getByRole('combobox', { name: /^Opponent:/ }), '1')

      expect(screen.getByLabelText(/Game challenged but didn't happen/i)).toBeDefined()
    })

    it('should not show challenge checkbox for external opponent', async () => {
      const user = userEvent.setup()
      render(<BattleForm {...defaultProps} />)

      await user.click(screen.getByLabelText(/External opponent/i))

      expect(screen.queryByLabelText(/Game challenged/i)).toBeNull()
    })
  })

  describe('Detailed Mode Toggle', () => {
    it('should show "Show Details" button', () => {
      render(<BattleForm {...defaultProps} />)

      expect(screen.getByRole('button', { name: /Show Details/i })).toBeDefined()
    })

    it('should toggle to detailed mode when clicked', async () => {
      const user = userEvent.setup()
      render(<BattleForm {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: /Show Details/i }))

      // WHY: Detailed mode shows additional fields
      expect(screen.getByLabelText(/Mission/i)).toBeDefined()
      expect(screen.getByLabelText(/VP Scored/i)).toBeDefined()
      expect(screen.getByLabelText(/VP Opponent/i)).toBeDefined()
      expect(screen.getByLabelText(/Operatives Lost/i)).toBeDefined()
      expect(screen.getByLabelText(/Notes/i)).toBeDefined()
    })

    it('should show "Hide Details" when in detailed mode', async () => {
      const user = userEvent.setup()
      render(<BattleForm {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: /Show Details/i }))

      expect(screen.getByRole('button', { name: /Hide Details/i })).toBeDefined()
    })

    it('should show Random Mission button in detailed mode', async () => {
      const user = userEvent.setup()
      render(<BattleForm {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: /Show Details/i }))

      expect(screen.getByRole('button', { name: /Random Mission/i })).toBeDefined()
    })

    it('should populate mission select when Random Mission clicked', async () => {
      const user = userEvent.setup()
      render(<BattleForm {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: /Show Details/i }))
      await user.click(screen.getByRole('button', { name: /Random Mission/i }))

      const missionSelect = screen.getByLabelText(/Mission/i) as HTMLSelectElement
      expect(missionSelect.value).not.toBe('')
    })
  })

  describe('Form Validation', () => {
    it('should disable submit when no opponent selected for non-BYE', () => {
      render(<BattleForm {...defaultProps} />)

      const submitButton = screen.getByRole('button', { name: /Record Battle/i })
      expect(submitButton).toBeDisabled()
    })

    it('should show validation message when submit disabled', () => {
      render(<BattleForm {...defaultProps} />)

      expect(screen.getByText(/Please select an opponent/i)).toBeDefined()
    })

    it('should enable submit when opponent selected', async () => {
      const user = userEvent.setup()
      render(<BattleForm {...defaultProps} />)

      await user.selectOptions(screen.getByRole('combobox', { name: /^Opponent:/ }), '1')

      const submitButton = screen.getByRole('button', { name: /Record Battle/i })
      expect(submitButton).not.toBeDisabled()
    })

    it('should enable submit when external opponent checked', async () => {
      const user = userEvent.setup()
      render(<BattleForm {...defaultProps} />)

      await user.click(screen.getByLabelText(/External opponent/i))

      const submitButton = screen.getByRole('button', { name: /Record Battle/i })
      expect(submitButton).not.toBeDisabled()
    })

    it('should enable submit for BYE without opponent', async () => {
      const user = userEvent.setup()
      render(<BattleForm {...defaultProps} />)

      await user.selectOptions(screen.getByLabelText(/Battle Result/i), 'BYE')

      const submitButton = screen.getByRole('button', { name: /Record Battle/i })
      expect(submitButton).not.toBeDisabled()
    })
  })

  describe('Form Submission', () => {
    it('should call onRecordBattle with basic WIN record', async () => {
      const onRecordBattle = vi.fn()
      const user = userEvent.setup()
      render(<BattleForm {...defaultProps} onRecordBattle={onRecordBattle} />)

      await user.selectOptions(screen.getByRole('combobox', { name: /^Opponent:/ }), '1')
      await user.click(screen.getByRole('button', { name: /Record Battle/i }))

      expect(onRecordBattle).toHaveBeenCalledWith(
        expect.objectContaining({
          result: 'WIN',
          opponent: 1,
          isExternalOpponent: false,
          cpEarned: 1,
          spEarned: 0,
          status: 'completed'
        })
      )
    })

    it('should call onRecordBattle with BYE record', async () => {
      const onRecordBattle = vi.fn()
      const user = userEvent.setup()
      render(<BattleForm {...defaultProps} onRecordBattle={onRecordBattle} />)

      await user.selectOptions(screen.getByLabelText(/Battle Result/i), 'BYE')
      await user.click(screen.getByRole('button', { name: /Record Battle/i }))

      expect(onRecordBattle).toHaveBeenCalledWith(
        expect.objectContaining({
          result: 'BYE',
          opponent: null,
          cpEarned: 0,
          spEarned: 2
        })
      )
    })

    it('should include operatives killed', async () => {
      const onRecordBattle = vi.fn()
      const user = userEvent.setup()
      render(<BattleForm {...defaultProps} onRecordBattle={onRecordBattle} />)

      await user.selectOptions(screen.getByRole('combobox', { name: /^Opponent:/ }), '1')
      await user.clear(screen.getByLabelText(/Operatives Killed/i))
      await user.type(screen.getByLabelText(/Operatives Killed/i), '5')
      await user.click(screen.getByRole('button', { name: /Record Battle/i }))

      expect(onRecordBattle).toHaveBeenCalledWith(
        expect.objectContaining({
          operativesKilled: 5
        })
      )
    })

    it('should include external opponent flag', async () => {
      const onRecordBattle = vi.fn()
      const user = userEvent.setup()
      render(<BattleForm {...defaultProps} onRecordBattle={onRecordBattle} />)

      await user.click(screen.getByLabelText(/External opponent/i))
      await user.click(screen.getByRole('button', { name: /Record Battle/i }))

      expect(onRecordBattle).toHaveBeenCalledWith(
        expect.objectContaining({
          isExternalOpponent: true,
          opponent: null
        })
      )
    })

    it('should include challenged-refused status', async () => {
      const onRecordBattle = vi.fn()
      const user = userEvent.setup()
      render(<BattleForm {...defaultProps} onRecordBattle={onRecordBattle} />)

      await user.selectOptions(screen.getByRole('combobox', { name: /^Opponent:/ }), '1')
      await user.click(screen.getByLabelText(/Game challenged/i))
      await user.click(screen.getByRole('button', { name: /Record Battle/i }))

      expect(onRecordBattle).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'challenged-refused'
        })
      )
    })

    it('should include detailed fields when provided', async () => {
      const onRecordBattle = vi.fn()
      const user = userEvent.setup()
      render(<BattleForm {...defaultProps} onRecordBattle={onRecordBattle} />)

      await user.selectOptions(screen.getByRole('combobox', { name: /^Opponent:/ }), '1')
      await user.click(screen.getByRole('button', { name: /Show Details/i }))
      await user.type(screen.getByLabelText(/VP Scored/i), '12')
      await user.type(screen.getByLabelText(/VP Opponent/i), '8')
      await user.type(screen.getByLabelText(/Operatives Lost/i), '2')
      await user.type(screen.getByLabelText(/Notes/i), 'Great game!')
      await user.click(screen.getByRole('button', { name: /Record Battle/i }))

      expect(onRecordBattle).toHaveBeenCalledWith(
        expect.objectContaining({
          vpScored: 12,
          vpOpponent: 8,
          operativesLost: 2,
          notes: 'Great game!'
        })
      )
    })

    it('should reset form after successful submission', async () => {
      const onRecordBattle = vi.fn()
      const user = userEvent.setup()
      render(<BattleForm {...defaultProps} onRecordBattle={onRecordBattle} />)

      await user.selectOptions(screen.getByRole('combobox', { name: /^Opponent:/ }), '1')
      await user.clear(screen.getByLabelText(/Operatives Killed/i))
      await user.type(screen.getByLabelText(/Operatives Killed/i), '5')
      await user.click(screen.getByRole('button', { name: /Record Battle/i }))

      // WHY: Form should reset for next battle entry
      const operativesInput = screen.getByLabelText(/Operatives Killed/i) as HTMLInputElement
      expect(operativesInput.value).toBe('0')
    })
  })
})
