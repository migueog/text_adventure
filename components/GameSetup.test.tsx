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
    
    // Should have options for 2-6 players
    const playerOptions = screen.getAllByRole('radio', { name: /player/i })
    expect(playerOptions.length).toBeGreaterThan(0)
  })

  it('should allow changing player count', () => {
    render(<GameSetup onStartGame={mockOnStartGame} />)
    
    // Find and click different player count option
    const fourPlayerOption = screen.getByLabelText(/4 players?/i) || 
                            screen.getByRole('radio', { name: /4/ })
    
    if (fourPlayerOption) {
      fireEvent.click(fourPlayerOption)
      expect(fourPlayerOption).toBeChecked()
    }
  })

  it('should have target threat selector', () => {
    render(<GameSetup onStartGame={mockOnStartGame} />)
    
    // Look for threat level controls
    const threatElements = screen.getAllByText(/threat/i)
    expect(threatElements.length).toBeGreaterThan(0)
  })

  it('should have solo mode toggle', () => {
    render(<GameSetup onStartGame={mockOnStartGame} />)
    
    const soloToggle = screen.getByLabelText(/solo/i) || 
                       screen.getByRole('checkbox', { name: /solo/i })
    
    expect(soloToggle).toBeInTheDocument()
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
    
    // Should show some map info (rows, cols, hexes, etc.)
    const mapInfo = screen.getByText(/map|grid|hex/i)
    expect(mapInfo).toBeInTheDocument()
  })

  it('should toggle solo mode', () => {
    render(<GameSetup onStartGame={mockOnStartGame} />)
    
    const soloToggle = screen.getByLabelText(/solo/i) || 
                       screen.getByRole('checkbox', { name: /solo/i })
    
    fireEvent.click(soloToggle)
    expect(soloToggle).toBeChecked()
    
    fireEvent.click(soloToggle)
    expect(soloToggle).not.toBeChecked()
  })

  it('should show appropriate number of player name fields', () => {
    render(<GameSetup onStartGame={mockOnStartGame} />)
    
    // Change to 3 players if possible
    const threePlayerOption = screen.queryByLabelText(/3 players?/i)
    if (threePlayerOption) {
      fireEvent.click(threePlayerOption)
      
      // Should show visible inputs for selected player count
      const visibleInputs = screen.getAllByRole('textbox')
        .filter(input => !input.closest('[style*="display: none"]'))
      
      expect(visibleInputs.length).toBeGreaterThanOrEqual(3)
    }
  })
})
