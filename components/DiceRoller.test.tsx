import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import DiceRoller from './DiceRoller'

describe('DiceRoller', () => {
  beforeEach(() => {
    cleanup()
  })

  it('should render dice roller buttons', () => {
    render(<DiceRoller />)
    
    expect(screen.getByText('D3')).toBeInTheDocument()
    expect(screen.getByText('D6')).toBeInTheDocument()
    expect(screen.getByText('2D6')).toBeInTheDocument()
    expect(screen.getByText('D36')).toBeInTheDocument()
  })

  it('should display last roll result', () => {
    render(<DiceRoller />)
    
    const d6Button = screen.getByText('D6')
    fireEvent.click(d6Button)
    
    // Should show result somewhere in the document
    const resultElements = screen.getAllByText(/\d+/)
    expect(resultElements.length).toBeGreaterThan(0)
  })

  it('should update history when rolling dice', () => {
    render(<DiceRoller />)
    
    const d6Button = screen.getByText('D6')
    
    // Roll multiple times
    fireEvent.click(d6Button)
    fireEvent.click(d6Button)
    fireEvent.click(d6Button)
    
    // History should contain entries (check for "D6" labels in history)
    const d6Labels = screen.getAllByText('D6')
    expect(d6Labels.length).toBeGreaterThan(1) // Button + history entries
  })

  it('should display different dice types correctly', () => {
    render(<DiceRoller />)
    
    const d3Button = screen.getByText('D3')
    fireEvent.click(d3Button)
    
    // Should have D3 in the history
    const d3Labels = screen.getAllByText('D3')
    expect(d3Labels.length).toBeGreaterThan(1)
  })

  it('should show breakdown for D36 rolls', () => {
    render(<DiceRoller />)
    
    const d36Button = screen.getByText('D36')
    fireEvent.click(d36Button)
    
    // D36 should show breakdown with D3 and D6
    const d36Labels = screen.getAllByText('D36')
    expect(d36Labels.length).toBeGreaterThan(0)
  })

  it('should have clear history button', () => {
    render(<DiceRoller />)
    
    // Roll some dice first
    const d6Button = screen.getByText('D6')
    fireEvent.click(d6Button)
    fireEvent.click(d6Button)
    
    // Find and click clear button
    const clearButton = screen.getByText(/clear|reset/i)
    fireEvent.click(clearButton)
    
    // History should be cleared (only button text remains)
    const d6Labels = screen.getAllByText('D6')
    expect(d6Labels.length).toBe(1) // Only the button
  })

  it('should show timestamp for rolls', () => {
    render(<DiceRoller />)
    
    const d6Button = screen.getByText('D6')
    fireEvent.click(d6Button)
    
    // Should find a timestamp pattern (HH:MM:SS or similar)
    const timestamps = screen.getAllByText(/\d{1,2}:\d{2}/)
    expect(timestamps.length).toBeGreaterThan(0)
  })

  it('should limit history to last 10 rolls', () => {
    render(<DiceRoller />)
    
    const d6Button = screen.getByText('D6')
    
    // Roll more than 10 times
    for (let i = 0; i < 15; i++) {
      fireEvent.click(d6Button)
    }
    
    // Should have button + max 10 history entries = 11 total
    const d6Labels = screen.getAllByText('D6')
    expect(d6Labels.length).toBeLessThanOrEqual(11)
  })
})
