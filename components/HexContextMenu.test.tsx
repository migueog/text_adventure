import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import HexContextMenu from './HexContextMenu'
import type { ActionOption } from '@/types/campaign'

/**
 * WHY: Test suite for hex contextual menu component
 * Verifies menu positioning, action display, and interaction
 */

describe('HexContextMenu', () => {
  const mockOnAction = vi.fn()
  const mockOnCancel = vi.fn()

  const defaultProps = {
    position: { x: 100, y: 200 },
    actions: [] as ActionOption[],
    onAction: mockOnAction,
    onCancel: mockOnCancel,
  }

  beforeEach(() => {
    mockOnAction.mockClear()
    mockOnCancel.mockClear()
  })

  describe('positioning', () => {
    it('should position menu at specified coordinates', () => {
      const { container } = render(
        <HexContextMenu {...defaultProps} position={{ x: 150, y: 250 }} />
      )

      const menu = container.firstChild as HTMLElement
      expect(menu.style.left).toBe('170px') // x + 20
      expect(menu.style.top).toBe('260px')  // y + 10
    })
  })

  describe('valid actions', () => {
    it('should render valid action as enabled button', async () => {
      const user = userEvent.setup()
      const actions: ActionOption[] = [
        { type: 'move', label: 'Move here (2 SP)', cost: 2, valid: true },
      ]

      render(<HexContextMenu {...defaultProps} actions={actions} />)

      const button = screen.getByRole('button', { name: /Move here/ })
      expect(button).not.toBeDisabled()
      expect(button).toHaveClass('valid')

      await user.click(button)
      expect(mockOnAction).toHaveBeenCalledWith('move')
    })

    it('should display action cost in label', () => {
      const actions: ActionOption[] = [
        { type: 'scout', label: 'Scout (3 SP)', cost: 3, valid: true },
      ]

      render(<HexContextMenu {...defaultProps} actions={actions} />)

      expect(screen.getByText('Scout (3 SP)')).toBeInTheDocument()
    })
  })

  describe('invalid actions', () => {
    it('should render invalid action as disabled button with reason', () => {
      const actions: ActionOption[] = [
        {
          type: 'move',
          label: 'Move here (4 SP)',
          cost: 4,
          valid: false,
          reason: 'Too far (max 3 hexes)',
        },
      ]

      render(<HexContextMenu {...defaultProps} actions={actions} />)

      const button = screen.getByRole('button', { name: /Move here/ })
      expect(button).toBeDisabled()
      expect(button).toHaveClass('invalid')
      expect(screen.getByText('Too far (max 3 hexes)')).toBeInTheDocument()
    })

    it('should not call onAction when clicking disabled button', async () => {
      const user = userEvent.setup()
      const actions: ActionOption[] = [
        {
          type: 'move',
          label: 'Move here (2 SP)',
          cost: 2,
          valid: false,
          reason: 'Not enough SP',
        },
      ]

      render(<HexContextMenu {...defaultProps} actions={actions} />)

      const button = screen.getByRole('button', { name: /Move here/ })
      await user.click(button)

      expect(mockOnAction).not.toHaveBeenCalled()
    })
  })

  describe('cancel button', () => {
    it('should render cancel button', () => {
      render(<HexContextMenu {...defaultProps} />)

      expect(screen.getByRole('button', { name: /Cancel/ })).toBeInTheDocument()
    })

    it('should call onCancel when cancel button clicked', async () => {
      const user = userEvent.setup()

      render(<HexContextMenu {...defaultProps} />)

      const cancelButton = screen.getByRole('button', { name: /Cancel/ })
      await user.click(cancelButton)

      expect(mockOnCancel).toHaveBeenCalledOnce()
    })
  })

  describe('multiple actions', () => {
    it('should render all provided actions', () => {
      const actions: ActionOption[] = [
        { type: 'move', label: 'Move here (1 SP)', cost: 1, valid: true },
        { type: 'scout', label: 'Scout (2 SP)', cost: 2, valid: true },
        { type: 'search', label: 'Search', cost: 0, valid: false, reason: 'Already searched' },
      ]

      render(<HexContextMenu {...defaultProps} actions={actions} />)

      expect(screen.getByText('Move here (1 SP)')).toBeInTheDocument()
      expect(screen.getByText('Scout (2 SP)')).toBeInTheDocument()
      expect(screen.getByText('Search')).toBeInTheDocument()
      expect(screen.getByText('Already searched')).toBeInTheDocument()
    })
  })

  describe('empty actions', () => {
    it('should show message when no actions available', () => {
      render(<HexContextMenu {...defaultProps} actions={[]} />)

      expect(screen.getByText(/No actions available/)).toBeInTheDocument()
    })
  })
})
