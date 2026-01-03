import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PhaseTutorialTooltip from './PhaseTutorialTooltip'

/**
 * WHY: Tests for PhaseTutorialTooltip component (Issue #33 - Phase 2)
 * Ensures tutorial tooltips render, dismiss correctly, and follow accessibility standards
 */

describe('PhaseTutorialTooltip', () => {
  const defaultProps = {
    phase: 'Movement' as const,
    content: 'This is a test tutorial tip for the Movement Phase.',
    onDismiss: vi.fn(),
    show: true
  }

  describe('when show is false', () => {
    it('should not render', () => {
      render(<PhaseTutorialTooltip {...defaultProps} show={false} />)

      expect(screen.queryByRole('dialog')).toBeNull()
    })
  })

  describe('when show is true', () => {
    it('should render after delay', async () => {
      render(<PhaseTutorialTooltip {...defaultProps} />)

      // Should not be visible immediately
      expect(screen.queryByRole('dialog')).toBeNull()

      // Should appear after delay
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeDefined()
      }, { timeout: 1000 })
    })

    it('should render with correct content', async () => {
      render(<PhaseTutorialTooltip {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeDefined()
      })

      expect(screen.getByText('Movement Phase Guide')).toBeDefined()
      expect(screen.getByText('This is a test tutorial tip for the Movement Phase.')).toBeDefined()
    })

    it('should have correct ARIA attributes', async () => {
      render(<PhaseTutorialTooltip {...defaultProps} />)

      await waitFor(() => {
        const dialog = screen.getByRole('dialog')
        expect(dialog).toBeDefined()
        expect(dialog.getAttribute('aria-labelledby')).toBe('tutorial-tooltip-title')
        expect(dialog.getAttribute('aria-modal')).toBe('false')
      })
    })

    it('should show light bulb icon', async () => {
      render(<PhaseTutorialTooltip {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('💡')).toBeDefined()
      })
    })

    it('should have "Got it!" button', async () => {
      render(<PhaseTutorialTooltip {...defaultProps} />)

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /got it/i })
        expect(button).toBeDefined()
      })
    })

    it('should auto-focus "Got it!" button', async () => {
      render(<PhaseTutorialTooltip {...defaultProps} />)

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /got it/i })
        expect(button).toBeDefined()
        expect(document.activeElement).toBe(button)
      })
    })
  })

  describe('when dismissing', () => {
    it('should call onDismiss when "Got it!" button is clicked', async () => {
      const user = userEvent.setup()
      const onDismiss = vi.fn()

      render(<PhaseTutorialTooltip {...defaultProps} onDismiss={onDismiss} />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /got it/i })).toBeDefined()
      })

      const button = screen.getByRole('button', { name: /got it/i })
      await user.click(button)

      expect(onDismiss).toHaveBeenCalledOnce()
    })

    it('should hide when show becomes false', async () => {
      const { rerender } = render(<PhaseTutorialTooltip {...defaultProps} show={true} />)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeDefined()
      })

      rerender(<PhaseTutorialTooltip {...defaultProps} show={false} />)

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).toBeNull()
      })
    })
  })

  describe('for different phases', () => {
    it('should render with Battle phase', async () => {
      render(<PhaseTutorialTooltip {...defaultProps} phase="Battle" />)

      await waitFor(() => {
        expect(screen.getByText('Battle Phase Guide')).toBeDefined()
      })
    })

    it('should render with Action phase', async () => {
      render(<PhaseTutorialTooltip {...defaultProps} phase="Action" />)

      await waitFor(() => {
        expect(screen.getByText('Action Phase Guide')).toBeDefined()
      })
    })

    it('should render with Threat phase', async () => {
      render(<PhaseTutorialTooltip {...defaultProps} phase="Threat" />)

      await waitFor(() => {
        expect(screen.getByText('Threat Phase Guide')).toBeDefined()
      })
    })
  })

  describe('cleanup', () => {
    it('should clean up timer on unmount', () => {
      vi.useFakeTimers()

      const { unmount } = render(<PhaseTutorialTooltip {...defaultProps} />)

      // Unmount before timer fires
      unmount()

      // Advance timers - should not cause issues
      vi.advanceTimersByTime(1000)

      // Dialog should not exist
      expect(screen.queryByRole('dialog')).toBeNull()

      vi.useRealTimers()
    })
  })
})
