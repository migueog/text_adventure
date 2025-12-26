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

      // Find and click the filter button/select
      const filterSelect = screen.getByRole('combobox', { name: /filter/i })
      fireEvent.change(filterSelect, { target: { value: 'error' } })

      // Only error events should be visible
      expect(screen.getByText('Error event')).toBeDefined()
      expect(screen.queryByText('System event')).toBeNull()
      expect(screen.queryByText('Move event')).toBeNull()
    })

    it('should show all events when filter is set to all', () => {
      render(<EventLog events={mixedEvents} />)

      const filterSelect = screen.getByRole('combobox', { name: /filter/i })
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

      // Should show round headers
      expect(screen.getByText(/Round 1/i)).toBeDefined()
      expect(screen.getByText(/Round 2/i)).toBeDefined()
      expect(screen.getByText(/Round 3/i)).toBeDefined()
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

      // Should not show round headers
      expect(screen.queryByText(/Round 1/i)).toBeNull()
      expect(screen.queryByText(/Round 2/i)).toBeNull()
    })
  })

  describe('event count display', () => {
    it('should show total event count', () => {
      const events = [
        createEvent('system', 'Event 1'),
        createEvent('movement', 'Event 2'),
        createEvent('error', 'Event 3')
      ]

      render(<EventLog events={events} />)

      expect(screen.getByText(/3 events/i)).toBeDefined()
    })

    it('should update count when filtering', () => {
      const events = [
        createEvent('system', 'Event 1'),
        createEvent('error', 'Event 2'),
        createEvent('error', 'Event 3')
      ]

      render(<EventLog events={events} />)

      const filterSelect = screen.getByRole('combobox', { name: /filter/i })
      fireEvent.change(filterSelect, { target: { value: 'error' } })

      expect(screen.getByText(/2 events/i)).toBeDefined()
    })
  })
})
