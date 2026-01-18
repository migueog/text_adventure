import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import Toast from './Toast'

/**
 * WHY: Tests for Toast component (Issue #33 - Phase 1)
 * Ensures toast notifications render correctly, auto-dismiss, and follow accessibility standards
 */

describe('Toast', () => {
  describe('when rendered with a message', () => {
    it('should display the message text', () => {
      render(<Toast message="Test message" type="info" duration={3000} onDismiss={vi.fn()} />)

      expect(screen.getByText('Test message')).toBeInTheDocument()
    })

    it('should apply info styling for info type', () => {
      render(<Toast message="Info message" type="info" duration={3000} onDismiss={vi.fn()} />)

      const toast = screen.getByRole('status')
      expect(toast).toHaveClass('toast-info')
    })

    it('should apply warning styling for warning type', () => {
      render(<Toast message="Warning message" type="warning" duration={3000} onDismiss={vi.fn()} />)

      const toast = screen.getByRole('alert')
      expect(toast).toHaveClass('toast-warning')
    })

    it('should apply error styling for error type', () => {
      render(<Toast message="Error message" type="error" duration={3000} onDismiss={vi.fn()} />)

      const toast = screen.getByRole('alert')
      expect(toast).toHaveClass('toast-error')
    })
  })

  describe('when auto-dismiss duration elapses', () => {
    it('should call onDismiss after specified duration', async () => {
      const onDismiss = vi.fn()
      render(<Toast message="Test" type="info" duration={100} onDismiss={onDismiss} />)

      expect(onDismiss).not.toHaveBeenCalled()

      // Wait for auto-dismiss to trigger
      await waitFor(() => {
        expect(onDismiss).toHaveBeenCalledOnce()
      }, { timeout: 200 })
    })
  })

  describe('when component unmounts', () => {
    it('should clear timeout to prevent memory leak', async () => {
      const onDismiss = vi.fn()
      const { unmount } = render(
        <Toast message="Test" type="info" duration={1000} onDismiss={onDismiss} />
      )

      // Unmount immediately before timer fires
      unmount()

      // Wait a bit to ensure timer doesn't fire after unmount
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(onDismiss).not.toHaveBeenCalled()
    })
  })

  describe('accessibility', () => {
    it('should use role="status" for info messages', () => {
      render(<Toast message="Info" type="info" duration={3000} onDismiss={vi.fn()} />)

      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('should use role="alert" for warning and error messages', () => {
      const { rerender } = render(
        <Toast message="Warning" type="warning" duration={3000} onDismiss={vi.fn()} />
      )

      expect(screen.getByRole('alert')).toBeInTheDocument()

      rerender(<Toast message="Error" type="error" duration={3000} onDismiss={vi.fn()} />)

      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('should have aria-live="polite" for info', () => {
      render(<Toast message="Info" type="info" duration={3000} onDismiss={vi.fn()} />)

      const toast = screen.getByRole('status')
      expect(toast).toHaveAttribute('aria-live', 'polite')
    })

    it('should have aria-live="assertive" for warnings and errors', () => {
      render(<Toast message="Warning" type="warning" duration={3000} onDismiss={vi.fn()} />)

      const toast = screen.getByRole('alert')
      expect(toast).toHaveAttribute('aria-live', 'assertive')
    })
  })
})
