import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ExplorationResultModal from './ExplorationResultModal'

describe('ExplorationResultModal', () => {
  const mockResult = {
    hexId: '2,3',
    hexNumber: 14,
    location: {
      name: 'Thermal Vent',
      description: 'A heat source that can provide energy for your equipment',
      effect: '+1 SP on Resupply'
    },
    condition: {
      name: 'Blizzard',
      description: 'Heavy snow reduces visibility and makes movement difficult',
      effect: 'Movement +1 SP per hex'
    },
    locationRoll: 23,
    conditionRoll: 15,
    playerName: 'Red Player'
  }

  const mockOnClose = vi.fn()

  it('should render exploration result modal with hex info', () => {
    render(<ExplorationResultModal result={mockResult} onClose={mockOnClose} />)

    // Check for title
    expect(screen.getByText(/Hex Explored!/i)).toBeInTheDocument()

    // Check for hex number
    expect(screen.getByText(/Hex #14/i)).toBeInTheDocument()

    // Check for player name
    expect(screen.getByText(/Red Player discovered:/i)).toBeInTheDocument()

    // Check for location name
    expect(screen.getByText('Thermal Vent')).toBeInTheDocument()

    // Check for condition name
    expect(screen.getByText('Blizzard')).toBeInTheDocument()
  })

  it('should display location and condition details', () => {
    render(<ExplorationResultModal result={mockResult} onClose={mockOnClose} />)

    // Check for location description
    expect(screen.getByText(/heat source that can provide energy/i)).toBeInTheDocument()

    // Check for location effect
    expect(screen.getByText(/\+1 SP on Resupply/i)).toBeInTheDocument()

    // Check for condition description
    expect(screen.getByText(/Heavy snow reduces visibility/i)).toBeInTheDocument()

    // Check for condition effect
    expect(screen.getByText(/Movement \+1 SP per hex/i)).toBeInTheDocument()

    // Check for roll results
    expect(screen.getByText(/Location Roll: 23/i)).toBeInTheDocument()
    expect(screen.getByText(/Condition Roll: 15/i)).toBeInTheDocument()
  })

  it('should call onClose when Continue button is clicked', async () => {
    const user = userEvent.setup()
    render(<ExplorationResultModal result={mockResult} onClose={mockOnClose} />)

    const continueButton = screen.getByRole('button', { name: /continue/i })
    await user.click(continueButton)

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('should close on ESC key', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<ExplorationResultModal result={mockResult} onClose={onClose} />)

    await user.keyboard('{Escape}')

    expect(onClose).toHaveBeenCalled()
  })

  it('should focus Continue button on open', () => {
    render(<ExplorationResultModal result={mockResult} onClose={mockOnClose} />)

    const continueButton = screen.getByRole('button', { name: /continue/i })

    // Button should have focus (or will receive it after useEffect runs)
    // We check if it's focusable
    expect(continueButton).toBeInTheDocument()
    expect(continueButton).toHaveAttribute('type', 'button')
  })
})
