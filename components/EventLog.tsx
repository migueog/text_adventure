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
  // WHY: Type filter state (existing)
  const [filter, setFilter] = useState<string>('all')

  // WHY: Round filter state (Issue #31 - Phase 5)
  const [selectedRound, setSelectedRound] = useState<number | 'all'>('all')

  // WHY: Get unique rounds for initialization (Issue #31 - Phase 5)
  const allRounds = Array.from(new Set(events.map(e => e.round)))

  // WHY: Track which rounds are expanded in collapsible view (Issue #31 - Phase 5)
  // Default: expand all rounds for better UX
  const [expandedRounds, setExpandedRounds] = useState<Set<number>>(new Set(allRounds))

  // WHY: Filter events by type AND round (Issue #31 - Phase 5)
  const filteredEvents = events
    .filter(event => filter === 'all' || event.type === filter)
    .filter(event => selectedRound === 'all' || event.round === selectedRound)

  // WHY: Get unique rounds for round selector (Issue #31 - Phase 5)
  const availableRounds = Array.from(new Set(events.map(e => e.round))).sort((a, b) => a - b)

  // WHY: Toggle round expansion (Issue #31 - Phase 5)
  const toggleRound = (round: number) => {
    const newExpanded = new Set(expandedRounds)
    if (newExpanded.has(round)) {
      newExpanded.delete(round)
    } else {
      newExpanded.add(round)
    }
    setExpandedRounds(newExpanded)
  }

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
            Type:
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
            <option value="milestone">Milestones</option>
          </select>
          <label htmlFor="round-filter" style={{ fontSize: '0.875rem' }}>
            Round:
          </label>
          <select
            id="round-filter"
            role="combobox"
            aria-label="Filter events by round"
            value={selectedRound}
            onChange={(e) => setSelectedRound(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
            style={{
              padding: '0.25rem 0.5rem',
              borderRadius: '4px',
              border: '1px solid #ccc'
            }}
          >
            <option value="all">All Rounds</option>
            {availableRounds.map(round => (
              <option key={round} value={round}>Round {round}</option>
            ))}
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
        ) : selectedRound === 'all' ? (
          renderCollapsibleRounds(filteredEvents, expandedRounds, toggleRound)
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

// WHY: Render collapsible rounds (Issue #31 - Phase 5)
function renderCollapsibleRounds(
  events: Event[],
  expandedRounds: Set<number>,
  toggleRound: (round: number) => void
) {
  const grouped = groupEventsByRound(events)
  const rounds = Array.from(grouped.keys()).sort((a, b) => b - a)

  return (
    <>
      {rounds.map(round => {
        const roundEvents = grouped.get(round) || []
        const isExpanded = expandedRounds.has(round)

        return (
          <CollapsibleRound
            key={round}
            round={round}
            events={roundEvents}
            isExpanded={isExpanded}
            onToggle={() => toggleRound(round)}
          />
        )
      })}
    </>
  )
}

// WHY: Collapsible round component (Issue #31 - Phase 5)
function CollapsibleRound({
  round,
  events,
  isExpanded,
  onToggle
}: {
  round: number
  events: Event[]
  isExpanded: boolean
  onToggle: () => void
}) {
  return (
    <div style={{ marginBottom: '0.5rem' }}>
      <button
        onClick={onToggle}
        aria-expanded={isExpanded}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.5rem',
          background: '#f0f0f0',
          border: '1px solid #ccc',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '0.875rem',
          fontWeight: 'bold'
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem' }}>{isExpanded ? '▼' : '▶'}</span>
          Round {round}
        </span>
        <span style={{ fontWeight: 'normal', color: '#666' }}>
          {events.length} events
        </span>
      </button>
      {isExpanded && (
        <div style={{ marginTop: '0.25rem', marginLeft: '1rem' }}>
          {events.map((event, idx) => (
            <EventItem key={idx} event={event} />
          ))}
        </div>
      )}
    </div>
  )
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
