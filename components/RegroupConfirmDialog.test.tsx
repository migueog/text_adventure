import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RegroupConfirmDialog from './RegroupConfirmDialog'

/**
 * WHY: Test suite for RegroupConfirmDialog (Issue #38 - Phase 4)
 * Ensures confirmation dialog displays destination preview correctly
 */
describe('RegroupConfirmDialog', () => {
  const destination = { row: 0, col: 2 }

  it('should not render when destination is null', () => {
    const { container } = render(
      <RegroupConfirmDialog
        destination={null}
        distance={3}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    expect(container.firstChild).toBeNull()
  })

  it('should display destination hex ID', () => {
    render(
      <RegroupConfirmDialog
        destination={destination}
        distance={3}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    expect(screen.getByText('0,2')).toBeInTheDocument()
  })

  it('should display distance in hexes', () => {
    render(
      <RegroupConfirmDialog
        destination={destination}
        distance={3}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    expect(screen.getByText(/3 hexes/i)).toBeInTheDocument()
  })

  it('should display singular "hex" when distance is 1', () => {
    render(
      <RegroupConfirmDialog
        destination={destination}
        distance={1}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    expect(screen.getByText(/1 hex$/i)).toBeInTheDocument()
  })

  it('should display FREE badge', () => {
    render(
      <RegroupConfirmDialog
        destination={destination}
        distance={3}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    expect(screen.getByText(/FREE/i)).toBeInTheDocument()
  })

  it('should call onConfirm when confirm button is clicked', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()

    render(
      <RegroupConfirmDialog
        destination={destination}
        distance={3}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />
    )

    await user.click(screen.getByRole('button', { name: /regroup/i }))

    expect(onConfirm).toHaveBeenCalled()
  })

  it('should call onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()

    render(
      <RegroupConfirmDialog
        destination={destination}
        distance={3}
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    )

    await user.click(screen.getByRole('button', { name: /cancel/i }))

    expect(onCancel).toHaveBeenCalled()
  })

  it('should call onCancel when clicking overlay', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()

    render(
      <RegroupConfirmDialog
        destination={destination}
        distance={3}
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    )

    const overlay = screen.getByText(/Regroup to Base\/Camp/i).closest('.modal-overlay')
    if (overlay) {
      await user.click(overlay)
      expect(onCancel).toHaveBeenCalled()
    }
  })

  it('should display modal title', () => {
    render(
      <RegroupConfirmDialog
        destination={destination}
        distance={3}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    expect(screen.getByText(/Regroup to Base\/Camp/i)).toBeInTheDocument()
  })

  it('should display all preview items', () => {
    render(
      <RegroupConfirmDialog
        destination={destination}
        distance={3}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    expect(screen.getByText(/Destination:/i)).toBeInTheDocument()
    expect(screen.getByText(/Distance:/i)).toBeInTheDocument()
    expect(screen.getByText(/Cost:/i)).toBeInTheDocument()
  })
})
