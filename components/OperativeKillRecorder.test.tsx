import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import OperativeKillRecorder from './OperativeKillRecorder'
import type { OperativeKillInput } from '@/types/battle'

describe('OperativeKillRecorder', () => {
  const mockOnChange = vi.fn()
  const defaultProps = {
    kills: [],
    onChange: mockOnChange
  }

  beforeEach(() => {
    mockOnChange.mockClear()
  })

  describe('initial render', () => {
    it('should render empty state initially', () => {
      render(<OperativeKillRecorder {...defaultProps} />)

      expect(screen.getByText(/no operatives recorded yet/i)).toBeInTheDocument()
    })

    it('should show quick select mode by default', () => {
      render(<OperativeKillRecorder {...defaultProps} />)

      const quickButton = screen.getByRole('button', { name: /quick select/i })
      expect(quickButton).toHaveClass('active')
    })

    it('should show opponent name when provided', () => {
      render(<OperativeKillRecorder {...defaultProps} opponentName="Red Player" />)

      expect(screen.getByText(/vs Red Player/i)).toBeInTheDocument()
    })
  })

  describe('mode switching', () => {
    it('should switch to custom mode when custom button clicked', async () => {
      const user = userEvent.setup()
      render(<OperativeKillRecorder {...defaultProps} />)

      const customButton = screen.getByRole('button', { name: /custom entry/i })
      await user.click(customButton)

      expect(customButton).toHaveClass('active')
      expect(screen.getByPlaceholderText(/operative name/i)).toBeInTheDocument()
    })

    it('should switch back to quick mode', async () => {
      const user = userEvent.setup()
      render(<OperativeKillRecorder {...defaultProps} />)

      // Switch to custom
      const customButton = screen.getByRole('button', { name: /custom entry/i })
      await user.click(customButton)

      // Switch back to quick
      const quickButton = screen.getByRole('button', { name: /quick select/i })
      await user.click(quickButton)

      expect(quickButton).toHaveClass('active')
    })
  })

  describe('quick select mode', () => {
    it('should add kill from quick select', async () => {
      const user = userEvent.setup()
      render(<OperativeKillRecorder {...defaultProps} />)

      // Select operative
      const select = screen.getByRole('combobox')
      await user.selectOptions(select, 'fire-warrior')

      // Click add
      const addButton = screen.getByRole('button', { name: /add kill/i })
      await user.click(addButton)

      expect(mockOnChange).toHaveBeenCalledWith([
        { operativeName: 'Fire Warrior', wounds: 7 }
      ])
    })

    it('should disable add button when no operative selected', () => {
      render(<OperativeKillRecorder {...defaultProps} />)

      const addButton = screen.getByRole('button', { name: /add kill/i })
      expect(addButton).toBeDisabled()
    })

    it('should clear selection after adding kill', async () => {
      const user = userEvent.setup()
      render(<OperativeKillRecorder {...defaultProps} />)

      const select = screen.getByRole('combobox')
      await user.selectOptions(select, 'fire-warrior')

      const addButton = screen.getByRole('button', { name: /add kill/i })
      await user.click(addButton)

      // Selection should be reset
      expect(select).toHaveValue('')
    })
  })

  describe('custom entry mode', () => {
    it('should add kill from custom entry', async () => {
      const user = userEvent.setup()
      render(<OperativeKillRecorder {...defaultProps} />)

      // Switch to custom mode
      const customButton = screen.getByRole('button', { name: /custom entry/i })
      await user.click(customButton)

      // Enter operative name
      const nameInput = screen.getByPlaceholderText(/operative name/i)
      await user.type(nameInput, 'Custom Operative')

      // Enter wounds
      const woundInput = screen.getByLabelText(/wounds:/i)
      await user.clear(woundInput)
      await user.type(woundInput, '12')

      // Click add
      const addButton = screen.getByRole('button', { name: /add kill/i })
      await user.click(addButton)

      expect(mockOnChange).toHaveBeenCalledWith([
        { operativeName: 'Custom Operative', wounds: 12 }
      ])
    })

    it('should disable add button when name is empty', async () => {
      const user = userEvent.setup()
      render(<OperativeKillRecorder {...defaultProps} />)

      // Switch to custom mode
      const customButton = screen.getByRole('button', { name: /custom entry/i })
      await user.click(customButton)

      const addButton = screen.getByRole('button', { name: /add kill/i })
      expect(addButton).toBeDisabled()
    })

    it('should show live wound value calculation', async () => {
      const user = userEvent.setup()
      render(<OperativeKillRecorder {...defaultProps} />)

      // Switch to custom mode
      const customButton = screen.getByRole('button', { name: /custom entry/i })
      await user.click(customButton)

      const woundInput = screen.getByLabelText(/wounds:/i)

      // Test 5 wounds (0 points)
      await user.clear(woundInput)
      await user.type(woundInput, '5')
      expect(screen.getByText('0 pt')).toBeInTheDocument()

      // Test 7 wounds (1 point)
      await user.clear(woundInput)
      await user.type(woundInput, '7')
      expect(screen.getByText('1 pt')).toBeInTheDocument()

      // Test 12 wounds (2 points)
      await user.clear(woundInput)
      await user.type(woundInput, '12')
      expect(screen.getByText('2 pt')).toBeInTheDocument()
    })

    it('should clear inputs after adding kill', async () => {
      const user = userEvent.setup()
      render(<OperativeKillRecorder {...defaultProps} />)

      // Switch to custom mode
      const customButton = screen.getByRole('button', { name: /custom entry/i })
      await user.click(customButton)

      const nameInput = screen.getByPlaceholderText(/operative name/i)
      const woundInput = screen.getByLabelText(/wounds:/i)

      await user.type(nameInput, 'Test Operative')
      await user.clear(woundInput)
      await user.type(woundInput, '8')

      const addButton = screen.getByRole('button', { name: /add kill/i })
      await user.click(addButton)

      // Inputs should be cleared
      expect(nameInput).toHaveValue('')
      expect(woundInput).toHaveValue('7') // Reset to default
    })
  })

  describe('kill list display', () => {
    const kills: OperativeKillInput[] = [
      { operativeName: 'Fire Warrior', wounds: 7 },
      { operativeName: 'Ork Nob', wounds: 12 },
      { operativeName: 'Gretchin', wounds: 4 }
    ]

    it('should display all kills', () => {
      render(<OperativeKillRecorder {...defaultProps} kills={kills} />)

      expect(screen.getByText('Fire Warrior')).toBeInTheDocument()
      expect(screen.getByText('Ork Nob')).toBeInTheDocument()
      expect(screen.getByText('Gretchin')).toBeInTheDocument()
    })

    it('should show wound values for each kill', () => {
      render(<OperativeKillRecorder {...defaultProps} kills={kills} />)

      const woundLabels = screen.getAllByText(/W/i)
      expect(woundLabels.some(el => el.textContent?.includes('7W'))).toBe(true)
      expect(woundLabels.some(el => el.textContent?.includes('12W'))).toBe(true)
      expect(woundLabels.some(el => el.textContent?.includes('4W'))).toBe(true)
    })

    it('should display running total correctly', () => {
      render(<OperativeKillRecorder {...defaultProps} kills={kills} />)

      // Fire Warrior (7W) = 1 pt, Ork Nob (12W) = 2 pt, Gretchin (4W) = 0 pt
      // Total = 3 points
      expect(screen.getByText(/3 points/i)).toBeInTheDocument()
    })

    it('should show kill count', () => {
      render(<OperativeKillRecorder {...defaultProps} kills={kills} />)

      expect(screen.getByText(/kills recorded \(3\)/i)).toBeInTheDocument()
    })
  })

  describe('kill removal', () => {
    it('should remove kill when remove button clicked', async () => {
      const user = userEvent.setup()
      const kills: OperativeKillInput[] = [
        { operativeName: 'Fire Warrior', wounds: 7 },
        { operativeName: 'Ork Nob', wounds: 12 }
      ]

      render(<OperativeKillRecorder {...defaultProps} kills={kills} />)

      // Click first remove button
      const removeButtons = screen.getAllByRole('button', { name: /remove/i })
      await user.click(removeButtons[0] as HTMLElement)

      expect(mockOnChange).toHaveBeenCalledWith([
        { operativeName: 'Ork Nob', wounds: 12 }
      ])
    })

    it('should have correct aria-label for remove buttons', () => {
      const kills: OperativeKillInput[] = [
        { operativeName: 'Fire Warrior', wounds: 7 }
      ]

      render(<OperativeKillRecorder {...defaultProps} kills={kills} />)

      expect(screen.getByRole('button', { name: /remove Fire Warrior/i })).toBeInTheDocument()
    })
  })

  describe('onChange callback', () => {
    it('should call onChange with updated kills array', async () => {
      const user = userEvent.setup()
      render(<OperativeKillRecorder {...defaultProps} />)

      const select = screen.getByRole('combobox')
      await user.selectOptions(select, 'fire-warrior')

      const addButton = screen.getByRole('button', { name: /add kill/i })
      await user.click(addButton)

      expect(mockOnChange).toHaveBeenCalledTimes(1)
      expect(mockOnChange).toHaveBeenCalledWith([
        { operativeName: 'Fire Warrior', wounds: 7 }
      ])
    })

    it('should preserve existing kills when adding new ones', async () => {
      const user = userEvent.setup()
      const existingKills: OperativeKillInput[] = [
        { operativeName: 'Ork Boy', wounds: 8 }
      ]

      render(<OperativeKillRecorder {...defaultProps} kills={existingKills} />)

      const select = screen.getByRole('combobox')
      await user.selectOptions(select, 'fire-warrior')

      const addButton = screen.getByRole('button', { name: /add kill/i })
      await user.click(addButton)

      expect(mockOnChange).toHaveBeenCalledWith([
        { operativeName: 'Ork Boy', wounds: 8 },
        { operativeName: 'Fire Warrior', wounds: 7 }
      ])
    })
  })
})
