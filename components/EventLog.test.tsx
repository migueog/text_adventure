import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import EventLog from './EventLog'
import type { Event } from '@/types/campaign'

// Helper to create test events
function createEvent(
  type: Event['type'],
  message: string,
  round: number = 1,
  phase: string = 'Movement'
): Event {
  return {
    type,
    icon: type === 'error' ? '❌' : '📝',
    message,
    round,
    phase,
    timestamp: '10:00:00'
  }
}

describe('EventLog', () => {
  describe('when rendering empty events', () => {
    it('should show no events message', () => {
      render(<EventLog events={[]} />)
      expect(screen.getByText(/No events yet/i)).toBeDefined()
    })
  })

  describe('when rendering events', () => {
    it('should display all events', () => {
      const events = [
        createEvent('system', 'Game started'),
        createEvent('movement', 'Player moved'),
        createEvent('exploration', 'Hex explored')
      ]

      render(<EventLog events={events} />)

      expect(screen.getByText('Game started')).toBeDefined()
      expect(screen.getByText('Player moved')).toBeDefined()
      expect(screen.getByText('Hex explored')).toBeDefined()
    })

    it('should display event metadata', () => {
      const events = [createEvent('system', 'Test event', 3, 'Battle')]

      render(<EventLog events={events} />)

      // Check metadata is displayed (inside event-meta span)
      const metadata = screen.getByText(/R3/)
      expect(metadata).toBeDefined()
      expect(metadata.textContent).toContain('Battle')
      expect(metadata.textContent).toContain('10:00:00')
    })
  })

  describe('event filtering', () => {
    const mixedEvents = [
      createEvent('system', 'System event'),
      createEvent('movement', 'Move event'),
      createEvent('error', 'Error event'),
      createEvent('warning', 'Warning event'),
      createEvent('exploration', 'Explore event')
    ]

    it('should show all events by default', () => {
      render(<EventLog events={mixedEvents} />)
      expect(screen.getByText('System event')).toBeDefined()
      expect(screen.getByText('Move event')).toBeDefined()
      expect(screen.getByText('Error event')).toBeDefined()
    })

    it('should filter by event type when filter is selected', () => {
      render(<EventLog events={mixedEvents} />)

      // Find and click the type filter
      const filterSelect = screen.getByRole('combobox', { name: /filter.*type/i })
      fireEvent.change(filterSelect, { target: { value: 'error' } })

      // Only error events should be visible
      expect(screen.getByText('Error event')).toBeDefined()
      expect(screen.queryByText('System event')).toBeNull()
      expect(screen.queryByText('Move event')).toBeNull()
    })

    it('should show all events when filter is set to all', () => {
      render(<EventLog events={mixedEvents} />)

      const filterSelect = screen.getByRole('combobox', { name: /filter.*type/i })
      fireEvent.change(filterSelect, { target: { value: 'error' } })
      fireEvent.change(filterSelect, { target: { value: 'all' } })

      expect(screen.getByText('System event')).toBeDefined()
      expect(screen.getByText('Error event')).toBeDefined()
    })
  })

  describe('export functionality', () => {
    it('should have export button', () => {
      const events = [createEvent('system', 'Test event')]
      render(<EventLog events={events} />)

      const exportButton = screen.getByRole('button', { name: /export/i })
      expect(exportButton).toBeDefined()
    })

    it('should call export handler when export button clicked', () => {
      const events = [createEvent('system', 'Test event')]
      const onExport = vi.fn()

      render(<EventLog events={events} onExport={onExport} />)

      const exportButton = screen.getByRole('button', { name: /export/i })
      fireEvent.click(exportButton)

      expect(onExport).toHaveBeenCalledOnce()
    })

    it('should export events as JSON when no handler provided', () => {
      const events = [createEvent('system', 'Test event')]
      render(<EventLog events={events} />)

      // Simple mock that verifies export was triggered
      const createElementSpy = vi.spyOn(document, 'createElement')
      const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL')

      // Mock URL creation to avoid actual blob creation
      createObjectURLSpy.mockReturnValue('blob:test-url')

      const exportButton = screen.getByRole('button', { name: /export/i })
      fireEvent.click(exportButton)

      // Verify that createElement was called to create download link
      expect(createElementSpy).toHaveBeenCalled()
      const calls = createElementSpy.mock.calls
      const hasAnchorCall = calls.some(call => call[0] === 'a')
      expect(hasAnchorCall).toBe(true)

      createElementSpy.mockRestore()
      createObjectURLSpy.mockRestore()
    })
  })

  describe('round-by-round breakdown', () => {
    const multiRoundEvents = [
      createEvent('system', 'R1 Event 1', 1),
      createEvent('movement', 'R1 Event 2', 1),
      createEvent('system', 'R2 Event 1', 2),
      createEvent('battle', 'R2 Event 2', 2),
      createEvent('action', 'R3 Event 1', 3)
    ]

    it('should group events by round when grouping is enabled', () => {
      render(<EventLog events={multiRoundEvents} groupByRound={true} />)

      // Should show events in grouped sections (without collapsible buttons)
      expect(screen.getByText('R1 Event 1')).toBeDefined()
      expect(screen.getByText('R2 Event 1')).toBeDefined()
      expect(screen.getByText('R3 Event 1')).toBeDefined()

      // Should not have collapsible buttons when groupByRound is true
      const buttons = screen.queryAllByRole('button')
      const hasCollapsibleRounds = buttons.some(btn =>
        btn.textContent?.includes('Round') && btn.textContent?.includes('events')
      )
      expect(hasCollapsibleRounds).toBe(false)
    })

    it('should show events in chronological order within rounds', () => {
      render(<EventLog events={multiRoundEvents} groupByRound={true} />)

      // Events should appear in order (check by message text)
      expect(screen.getByText('R1 Event 1')).toBeDefined()
      expect(screen.getByText('R1 Event 2')).toBeDefined()
      expect(screen.getByText('R2 Event 1')).toBeDefined()
      expect(screen.getByText('R2 Event 2')).toBeDefined()
      expect(screen.getByText('R3 Event 1')).toBeDefined()
    })

    it('should not group when groupByRound is false', () => {
      render(<EventLog events={multiRoundEvents} groupByRound={false} />)

      // Should show collapsible round buttons instead
      const buttons = screen.getAllByRole('button')
      const hasCollapsibleRounds = buttons.some(btn =>
        btn.textContent?.includes('Round') && btn.textContent?.includes('events')
      )
      expect(hasCollapsibleRounds).toBe(true)
    })
  })

  describe('event count display', () => {
    it('should show total event count', () => {
      const events = [
        createEvent('system', 'Event 1'),
        createEvent('movement', 'Event 2'),
        createEvent('error', 'Event 3')
      ]

      const { container } = render(<EventLog events={events} />)

      // Look for the main event count (not in round headers)
      const countElement = container.querySelector('div[style*="font-size: 0.875rem"][style*="color: rgb(102, 102, 102)"]')
      expect(countElement?.textContent).toContain('3 events')
    })

    it('should update count when filtering', () => {
      const events = [
        createEvent('system', 'Event 1'),
        createEvent('error', 'Event 2'),
        createEvent('error', 'Event 3')
      ]

      const { container } = render(<EventLog events={events} />)

      const filterSelect = screen.getByRole('combobox', { name: /filter.*type/i })
      fireEvent.change(filterSelect, { target: { value: 'error' } })

      // Look for the main event count (not in round headers)
      const countElement = container.querySelector('div[style*="font-size: 0.875rem"][style*="color: rgb(102, 102, 102)"]')
      expect(countElement?.textContent).toContain('2 events')
    })
  })

  // WHY: Tests for Phase 5 enhancements (Issue #31)
  describe('round selector', () => {
    const multiRoundEvents = [
      createEvent('system', 'R1 System', 1),
      createEvent('movement', 'R1 Move', 1),
      createEvent('system', 'R2 System', 2),
      createEvent('battle', 'R2 Battle', 2),
      createEvent('action', 'R3 Action', 3)
    ]

    it('should have round filter dropdown', () => {
      render(<EventLog events={multiRoundEvents} />)

      const roundFilter = screen.getByRole('combobox', { name: /filter.*round/i })
      expect(roundFilter).toBeDefined()
    })

    it('should show all rounds option by default', () => {
      render(<EventLog events={multiRoundEvents} />)

      const roundFilter = screen.getByRole('combobox', { name: /filter.*round/i })
      expect((roundFilter as HTMLSelectElement).value).toBe('all')
    })

    it('should show available rounds in dropdown', () => {
      render(<EventLog events={multiRoundEvents} />)

      const roundFilter = screen.getByRole('combobox', { name: /filter.*round/i })
      const options = Array.from((roundFilter as HTMLSelectElement).options).map(o => o.text)

      expect(options).toContain('All Rounds')
      expect(options).toContain('Round 1')
      expect(options).toContain('Round 2')
      expect(options).toContain('Round 3')
    })

    it('should filter events by selected round', () => {
      render(<EventLog events={multiRoundEvents} />)

      const roundFilter = screen.getByRole('combobox', { name: /filter.*round/i })
      fireEvent.change(roundFilter, { target: { value: '2' } })

      // Only Round 2 events should be visible
      expect(screen.getByText('R2 System')).toBeDefined()
      expect(screen.getByText('R2 Battle')).toBeDefined()
      expect(screen.queryByText('R1 System')).toBeNull()
      expect(screen.queryByText('R3 Action')).toBeNull()
    })
  })

  describe('combined filtering', () => {
    const mixedEvents = [
      createEvent('system', 'R1 System', 1),
      createEvent('error', 'R1 Error', 1),
      createEvent('system', 'R2 System', 2),
      createEvent('error', 'R2 Error', 2),
      createEvent('battle', 'R2 Battle', 2)
    ]

    it('should filter by both type and round', () => {
      render(<EventLog events={mixedEvents} />)

      const typeFilter = screen.getByRole('combobox', { name: /filter.*type/i })
      const roundFilter = screen.getByRole('combobox', { name: /filter.*round/i })

      fireEvent.change(typeFilter, { target: { value: 'error' } })
      fireEvent.change(roundFilter, { target: { value: '2' } })

      // Only Round 2 error should be visible
      expect(screen.getByText('R2 Error')).toBeDefined()
      expect(screen.queryByText('R1 Error')).toBeNull()
      expect(screen.queryByText('R2 System')).toBeNull()
    })

    it('should update event count with combined filters', () => {
      render(<EventLog events={mixedEvents} />)

      const typeFilter = screen.getByRole('combobox', { name: /filter.*type/i })
      const roundFilter = screen.getByRole('combobox', { name: /filter.*round/i })

      fireEvent.change(typeFilter, { target: { value: 'system' } })
      fireEvent.change(roundFilter, { target: { value: '2' } })

      expect(screen.getByText(/1 events/i)).toBeDefined()
    })
  })

  describe('collapsible rounds', () => {
    const multiRoundEvents = [
      createEvent('system', 'R1 Event', 1),
      createEvent('system', 'R2 Event 1', 2),
      createEvent('battle', 'R2 Event 2', 2)
    ]

    it('should show collapsible round sections when viewing all rounds', () => {
      render(<EventLog events={multiRoundEvents} />)

      const roundButtons = screen.getAllByRole('button')
      const hasRoundButtons = roundButtons.some(btn =>
        btn.textContent?.includes('Round') && btn.textContent?.includes('events')
      )
      expect(hasRoundButtons).toBe(true)
    })

    it('should show event count in round header', () => {
      render(<EventLog events={multiRoundEvents} />)

      const round2Button = screen.getByRole('button', { name: /Round 2/i })
      expect(round2Button.textContent).toContain('2 events')
    })

    it('should expand round when header is clicked', () => {
      render(<EventLog events={multiRoundEvents} />)

      const round2Button = screen.getByRole('button', { name: /Round 2/i })

      // Rounds start expanded by default, so collapse first
      fireEvent.click(round2Button)
      expect(screen.queryByText('R2 Event 1')).toBeNull()

      // Then expand
      fireEvent.click(round2Button)
      expect(screen.getByText('R2 Event 1')).toBeDefined()
      expect(screen.getByText('R2 Event 2')).toBeDefined()
    })

    it('should collapse round when header is clicked again', () => {
      render(<EventLog events={multiRoundEvents} />)

      const round2Button = screen.getByRole('button', { name: /Round 2/i })

      // Rounds start expanded by default, so events are visible
      expect(screen.getByText('R2 Event 1')).toBeDefined()

      // Collapse
      fireEvent.click(round2Button)
      expect(screen.queryByText('R2 Event 1')).toBeNull()

      // Expand again
      fireEvent.click(round2Button)
      expect(screen.getByText('R2 Event 1')).toBeDefined()
    })
  })

  describe('milestone filtering', () => {
    it('should have milestone option in type filter', () => {
      const events = [createEvent('system', 'Test')]
      render(<EventLog events={events} />)

      const typeFilter = screen.getByRole('combobox', { name: /filter.*type/i })
      const options = Array.from((typeFilter as HTMLSelectElement).options).map(o => o.value)

      expect(options).toContain('milestone')
    })

    it('should filter milestone events', () => {
      const events = [
        createEvent('system', 'System event'),
        createEvent('milestone', 'Milestone event'),
        createEvent('error', 'Error event')
      ]

      render(<EventLog events={events} />)

      const typeFilter = screen.getByRole('combobox', { name: /filter.*type/i })
      fireEvent.change(typeFilter, { target: { value: 'milestone' } })

      expect(screen.getByText('Milestone event')).toBeDefined()
      expect(screen.queryByText('System event')).toBeNull()
    })
  })
})
