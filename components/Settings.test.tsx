import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Settings from './Settings'

/**
 * WHY: Test suite for Settings component (Issue #31 - Phase 6, Issue #33 - Phase 5)
 * Ensures settings toggle correctly and handle user interactions
 */

describe('Settings', () => {
  // WHY: Mock localStorage for phase guidance state persistence
  beforeEach(() => {
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    }
    globalThis.localStorage = localStorageMock as any
  })

  const defaultProps = {
    showRoundSummary: true,
    onToggleRoundSummary: vi.fn(),
    phaseGuidanceEnabled: true,
    onTogglePhaseGuidance: vi.fn()
  }

  describe('when rendering', () => {
    it('should display settings title', () => {
      render(<Settings {...defaultProps} />)

      expect(screen.getByText(/Campaign Settings/i)).toBeInTheDocument()
    })

    it('should display round summary setting', () => {
      render(<Settings {...defaultProps} />)

      expect(screen.getByText(/Show round summary between rounds/i)).toBeInTheDocument()
    })

    it('should display round summary description', () => {
      render(<Settings {...defaultProps} />)

      expect(screen.getByText(/Display statistics and summary/i)).toBeInTheDocument()
    })

    it('should display phase guidance setting', () => {
      render(<Settings {...defaultProps} />)

      expect(screen.getByText(/Show phase guidance tooltips/i)).toBeInTheDocument()
    })

    it('should display phase guidance description', () => {
      render(<Settings {...defaultProps} />)

      expect(screen.getByText(/Display helpful tooltips when entering each phase/i)).toBeInTheDocument()
    })
  })

  describe('when toggling round summary', () => {
    it('should show checkbox as checked when showRoundSummary is true', () => {
      render(<Settings {...defaultProps} showRoundSummary={true} />)

      const checkboxes = screen.getAllByRole('checkbox')
      const roundSummaryCheckbox = checkboxes[0] as HTMLInputElement
      expect(roundSummaryCheckbox.checked).toBe(true)
    })

    it('should show checkbox as unchecked when showRoundSummary is false', () => {
      render(<Settings {...defaultProps} showRoundSummary={false} />)

      const checkboxes = screen.getAllByRole('checkbox')
      const roundSummaryCheckbox = checkboxes[0] as HTMLInputElement
      expect(roundSummaryCheckbox.checked).toBe(false)
    })

    it('should call onToggleRoundSummary with true when checkbox is checked', async () => {
      const user = userEvent.setup()
      const onToggle = vi.fn()
      render(<Settings {...defaultProps} showRoundSummary={false} onToggleRoundSummary={onToggle} />)

      const checkboxes = screen.getAllByRole('checkbox')
      const roundSummaryCheckbox = checkboxes[0] as HTMLInputElement
      await user.click(roundSummaryCheckbox)

      expect(onToggle).toHaveBeenCalledWith(true)
    })

    it('should call onToggleRoundSummary with false when checkbox is unchecked', async () => {
      const user = userEvent.setup()
      const onToggle = vi.fn()
      render(<Settings {...defaultProps} showRoundSummary={true} onToggleRoundSummary={onToggle} />)

      const checkboxes = screen.getAllByRole('checkbox')
      const roundSummaryCheckbox = checkboxes[0] as HTMLInputElement
      await user.click(roundSummaryCheckbox)

      expect(onToggle).toHaveBeenCalledWith(false)
    })
  })

  describe('when toggling phase guidance', () => {
    it('should show checkbox as checked when phaseGuidanceEnabled is true', () => {
      render(<Settings {...defaultProps} phaseGuidanceEnabled={true} />)

      const checkboxes = screen.getAllByRole('checkbox')
      const phaseGuidanceCheckbox = checkboxes[1] as HTMLInputElement
      expect(phaseGuidanceCheckbox.checked).toBe(true)
    })

    it('should show checkbox as unchecked when phaseGuidanceEnabled is false', () => {
      render(<Settings {...defaultProps} phaseGuidanceEnabled={false} />)

      const checkboxes = screen.getAllByRole('checkbox')
      const phaseGuidanceCheckbox = checkboxes[1] as HTMLInputElement
      expect(phaseGuidanceCheckbox.checked).toBe(false)
    })

    it('should call onTogglePhaseGuidance with true when checkbox is checked', async () => {
      const user = userEvent.setup()
      const onToggle = vi.fn()
      render(<Settings {...defaultProps} phaseGuidanceEnabled={false} onTogglePhaseGuidance={onToggle} />)

      const checkboxes = screen.getAllByRole('checkbox')
      const phaseGuidanceCheckbox = checkboxes[1] as HTMLInputElement
      await user.click(phaseGuidanceCheckbox)

      expect(onToggle).toHaveBeenCalledWith(true)
    })

    it('should call onTogglePhaseGuidance with false when checkbox is unchecked', async () => {
      const user = userEvent.setup()
      const onToggle = vi.fn()
      render(<Settings {...defaultProps} phaseGuidanceEnabled={true} onTogglePhaseGuidance={onToggle} />)

      const checkboxes = screen.getAllByRole('checkbox')
      const phaseGuidanceCheckbox = checkboxes[1] as HTMLInputElement
      await user.click(phaseGuidanceCheckbox)

      expect(onToggle).toHaveBeenCalledWith(false)
    })
  })

  describe('accessibility', () => {
    it('should have accessible label for round summary checkbox', () => {
      render(<Settings {...defaultProps} />)

      const checkboxes = screen.getAllByRole('checkbox')
      const checkbox = checkboxes[0]
      const label = checkbox.closest('label')

      expect(label).toBeDefined()
      expect(label?.textContent).toContain('Show round summary')
    })

    it('should have accessible label for phase guidance checkbox', () => {
      render(<Settings {...defaultProps} />)

      const checkboxes = screen.getAllByRole('checkbox')
      const checkbox = checkboxes[1]
      const label = checkbox.closest('label')

      expect(label).toBeDefined()
      expect(label?.textContent).toContain('Show phase guidance')
    })

    it('should have cursor pointer for interactive elements', () => {
      render(<Settings {...defaultProps} />)

      const checkboxes = screen.getAllByRole('checkbox')

      checkboxes.forEach(checkbox => {
        const computedStyle = window.getComputedStyle(checkbox)
        expect(computedStyle.cursor).toBe('pointer')
      })
    })
  })
})
