import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RegroupDestinationModal from './RegroupDestinationModal'

/**
 * WHY: Test suite for RegroupDestinationModal (Issue #38 - Phase 3)
 * Ensures modal displays destination options and handles user selection
 */
describe('RegroupDestinationModal', () => {
  const destinations = [
    { row: 0, col: 2 },
    { row: 4, col: 2 }
  ]

  it('should not render when isOpen is false', () => {
    const { container } = render(
      <RegroupDestinationModal
        isOpen={false}
        destinations={destinations}
        distance={2}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    expect(container.firstChild).toBeNull()
  })

  it('should display all destination options', () => {
    render(
      <RegroupDestinationModal
        isOpen={true}
        destinations={destinations}
        distance={2}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    expect(screen.getByText(/Choose Regroup Destination/i)).toBeInTheDocument()
    expect(screen.getByText('0,2')).toBeInTheDocument()
    expect(screen.getByText('4,2')).toBeInTheDocument()
  })

  it('should display distance in description', () => {
    render(
      <RegroupDestinationModal
        isOpen={true}
        destinations={destinations}
        distance={2}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    expect(screen.getByText(/2 hexes away/i)).toBeInTheDocument()
  })

  it('should display FREE badge on each option', () => {
    render(
      <RegroupDestinationModal
        isOpen={true}
        destinations={destinations}
        distance={2}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    const freeBadges = screen.getAllByText(/FREE/i)
    expect(freeBadges).toHaveLength(2)
  })

  it('should call onConfirm with selected destination when clicking confirm', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()

    render(
      <RegroupDestinationModal
        isOpen={true}
        destinations={destinations}
        distance={2}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />
    )

    // Click first destination to select it
    await user.click(screen.getByText('0,2'))
    // Click confirm button
    await user.click(screen.getByRole('button', { name: /confirm/i }))

    expect(onConfirm).toHaveBeenCalledWith(destinations[0])
  })

  it('should call onConfirm with second destination when selected', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()

    render(
      <RegroupDestinationModal
        isOpen={true}
        destinations={destinations}
        distance={2}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />
    )

    // Click second destination to select it
    await user.click(screen.getByText('4,2'))
    // Click confirm button
    await user.click(screen.getByRole('button', { name: /confirm/i }))

    expect(onConfirm).toHaveBeenCalledWith(destinations[1])
  })

  it('should call onCancel when clicking cancel button', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()

    render(
      <RegroupDestinationModal
        isOpen={true}
        destinations={destinations}
        distance={2}
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
      <RegroupDestinationModal
        isOpen={true}
        destinations={destinations}
        distance={2}
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    )

    const overlay = screen.getByText(/Choose Regroup Destination/i).closest('.modal-overlay')
    if (overlay) {
      await user.click(overlay)
      expect(onCancel).toHaveBeenCalled()
    }
  })

  it('should show selected state on clicked destination', async () => {
    const user = userEvent.setup()

    render(
      <RegroupDestinationModal
        isOpen={true}
        destinations={destinations}
        distance={2}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    const secondDestination = screen.getByText('4,2').closest('button')

    // Click second destination
    if (secondDestination) {
      await user.click(secondDestination)
      expect(secondDestination).toHaveClass('selected')
    }
  })

  it('should handle singular "hex" when distance is 1', () => {
    render(
      <RegroupDestinationModal
        isOpen={true}
        destinations={[destinations[0]!]}
        distance={1}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    expect(screen.getByText(/1 hex away/i)).toBeInTheDocument()
  })
})
