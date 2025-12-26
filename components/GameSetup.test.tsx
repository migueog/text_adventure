import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import GameSetup from './GameSetup'

describe('GameSetup', () => {
  const mockOnStartGame = vi.fn()

  beforeEach(() => {
    mockOnStartGame.mockClear()
  })

  it('should render game setup form', () => {
    render(<GameSetup onStartGame={mockOnStartGame} />)
    
    expect(screen.getByText(/Ctesiphus Expedition/i)).toBeInTheDocument()
    expect(screen.getByText(/Kill Team Campaign Manager/i)).toBeInTheDocument()
  })

  it('should have player count selector', () => {
    render(<GameSetup onStartGame={mockOnStartGame} />)
    
    // Should have buttons for player counts
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
    
    // "5" and "6" appear in both player count and threat level sections
    const playerCountSection = screen.getByText(/Number of Players/i).closest('.setting-group')
    expect(playerCountSection).toBeInTheDocument()
  })

  it('should allow changing player count', () => {
    render(<GameSetup onStartGame={mockOnStartGame} />)
    
    // Find and click the button with text "3"
    const threePlayerButton = screen.getByText('3')
    fireEvent.click(threePlayerButton)
    
    // Button should now have 'active' class
    expect(threePlayerButton).toHaveClass('active')
  })

  it('should have target threat selector', () => {
    render(<GameSetup onStartGame={mockOnStartGame} />)
    
    // Look for threat level controls
    const threatElements = screen.getAllByText(/threat/i)
    expect(threatElements.length).toBeGreaterThan(0)
  })

  it('should have solo mode toggle', () => {
    render(<GameSetup onStartGame={mockOnStartGame} />)
    
    const soloButton = screen.getByText(/Solo\/Co-op/i)
    expect(soloButton).toBeInTheDocument()
  })

  it('should have player name inputs', () => {
    render(<GameSetup onStartGame={mockOnStartGame} />)
    
    const inputs = screen.getAllByRole('textbox')
    expect(inputs.length).toBeGreaterThan(0)
  })

  it('should allow editing player names', () => {
    render(<GameSetup onStartGame={mockOnStartGame} />)
    
    const inputs = screen.getAllByRole('textbox')
    const firstInput = inputs[0]
    
    if (firstInput) {
      fireEvent.change(firstInput, { target: { value: 'Test Player' } })
      expect(firstInput).toHaveValue('Test Player')
    }
  })

  it('should have start game button', () => {
    render(<GameSetup onStartGame={mockOnStartGame} />)
    
    const startButton = screen.getByText(/start/i)
    expect(startButton).toBeInTheDocument()
  })

  it('should call onStartGame when start button clicked', () => {
    render(<GameSetup onStartGame={mockOnStartGame} />)
    
    const startButton = screen.getByText(/start/i)
    fireEvent.click(startButton)
    
    expect(mockOnStartGame).toHaveBeenCalledTimes(1)
  })

  it('should pass correct parameters to onStartGame', () => {
    render(<GameSetup onStartGame={mockOnStartGame} />)
    
    const startButton = screen.getByText(/start/i)
    fireEvent.click(startButton)
    
    expect(mockOnStartGame).toHaveBeenCalledWith(
      expect.any(Number), // playerCount
      expect.any(Boolean), // soloMode
      expect.any(Number), // targetThreat
      expect.any(Array) // playerNames
    )
  })

  it('should display map configuration info', () => {
    render(<GameSetup onStartGame={mockOnStartGame} />)
    
    // Should show map preview section
    expect(screen.getByText(/Map Preview/i)).toBeInTheDocument()
  })

  it('should toggle solo mode', () => {
    render(<GameSetup onStartGame={mockOnStartGame} />)
    
    const soloButton = screen.getByText(/Solo\/Co-op/i)
    fireEvent.click(soloButton)
    
    // Button should now have 'active' class
    expect(soloButton).toHaveClass('active')
  })

  it('should show appropriate number of player name fields', () => {
    render(<GameSetup onStartGame={mockOnStartGame} />)
    
    // Default is 4 players, so should have 4 inputs
    const inputs = screen.getAllByRole('textbox')
    expect(inputs.length).toBe(4)
    
    // Change to 3 players
    const threePlayerButton = screen.getByText('3')
    fireEvent.click(threePlayerButton)
    
    // Should now show 3 inputs
    const updatedInputs = screen.getAllByRole('textbox')
    expect(updatedInputs.length).toBe(3)
  })
})
