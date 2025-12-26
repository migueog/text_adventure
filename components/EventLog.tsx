'use client'

import { useState } from 'react'
import type { Event } from '@/types/campaign'

interface EventLogProps {
  events: Event[]
  groupByRound?: boolean
  onExport?: () => void
}

export default function EventLog({
  events,
  groupByRound = false,
  onExport
}: EventLogProps) {
  const [filter, setFilter] = useState<string>('all')

  // Filter events based on selected type
  const filteredEvents = filter === 'all'
    ? events
    : events.filter(event => event.type === filter)

  // Group events by round if enabled
  const groupedEvents = groupByRound
    ? groupEventsByRound(filteredEvents)
    : null

  // Handle export functionality
  const handleExport = () => {
    if (onExport) {
      onExport()
    } else {
      exportEventsAsJSON(filteredEvents)
    }
  }

  return (
    <div className="event-log">
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem'
      }}>
        <h3>Event Log</h3>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <label htmlFor="event-filter" style={{ fontSize: '0.875rem' }}>
            Filter:
          </label>
          <select
            id="event-filter"
            role="combobox"
            aria-label="Filter events by type"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              padding: '0.25rem 0.5rem',
              borderRadius: '4px',
              border: '1px solid #ccc'
            }}
          >
            <option value="all">All</option>
            <option value="system">System</option>
            <option value="movement">Movement</option>
            <option value="exploration">Exploration</option>
            <option value="battle">Battle</option>
            <option value="action">Action</option>
            <option value="reward">Reward</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
          </select>
          <button
            onClick={handleExport}
            style={{
              padding: '0.25rem 0.5rem',
              borderRadius: '4px',
              border: '1px solid #ccc',
              background: '#f0f0f0',
              cursor: 'pointer'
            }}
          >
            Export
          </button>
        </div>
      </div>

      <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
        {filteredEvents.length} events
      </div>

      <div className="event-list">
        {filteredEvents.length === 0 ? (
          <div className="no-events">No events yet. Start the campaign!</div>
        ) : groupedEvents ? (
          renderGroupedEvents(groupedEvents)
        ) : (
          filteredEvents.map((event, idx) => (
            <EventItem key={idx} event={event} />
          ))
        )}
      </div>
    </div>
  )
}

// Helper component for individual event
function EventItem({ event }: { event: Event }) {
  return (
    <div className={`event-item ${event.type}`}>
      <span className="event-icon">{event.icon}</span>
      <span className="event-message">{event.message}</span>
      <span className="event-meta">
        R{event.round} • {event.phase} • {event.timestamp}
      </span>
    </div>
  )
}

// Group events by round number
function groupEventsByRound(events: Event[]): Map<number, Event[]> {
  const grouped = new Map<number, Event[]>()

  events.forEach(event => {
    const roundEvents = grouped.get(event.round) || []
    roundEvents.push(event)
    grouped.set(event.round, roundEvents)
  })

  return grouped
}

// Render grouped events with round headers
function renderGroupedEvents(grouped: Map<number, Event[]>) {
  const rounds = Array.from(grouped.keys()).sort((a, b) => a - b)

  return (
    <>
      {rounds.map(round => {
        const roundEvents = grouped.get(round) || []

        return (
          <div key={round} style={{ marginBottom: '1rem' }}>
            <div style={{
              fontWeight: 'bold',
              fontSize: '0.875rem',
              padding: '0.5rem',
              background: '#f0f0f0',
              borderRadius: '4px',
              marginBottom: '0.5rem'
            }}>
              Round {round}
            </div>
            {roundEvents.map((event, idx) => (
              <EventItem key={idx} event={event} />
            ))}
          </div>
        )
      })}
    </>
  )
}

// Export events as JSON file
function exportEventsAsJSON(events: Event[]) {
  const dataStr = JSON.stringify(events, null, 2)
  const blob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `campaign-log-${new Date().toISOString()}.json`
  link.click()

  URL.revokeObjectURL(url)
}
