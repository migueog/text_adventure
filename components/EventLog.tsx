'use client'

import { useState } from 'react'
import type { Event } from '@/types/campaign'
import { useCampaignStore } from '@/store/campaign'

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

  // WHY: View mode toggle for narrative system (Issue #22 - Phase 5)
  const [viewMode, setViewMode] = useState<'mechanical' | 'narrative'>('mechanical')

  // WHY: Custom narrative entry modal state (Issue #22 - Phase 5)
  const [showNarrativeModal, setShowNarrativeModal] = useState(false)
  const [narrativeText, setNarrativeText] = useState('')

  // WHY: Access addCustomNarrative from campaign store (Issue #22 - Phase 5)
  const addCustomNarrative = useCampaignStore((state) => state.addCustomNarrative)

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

  // WHY: Handle custom narrative submission (Issue #22 - Phase 5)
  const handleAddNarrative = () => {
    if (narrativeText.trim()) {
      addCustomNarrative(narrativeText)
      setNarrativeText('')
      setShowNarrativeModal(false)
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
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* WHY: View mode toggle (Issue #22 - Phase 5) */}
          <div className="view-mode-toggle" style={{ display: 'flex', gap: '0.25rem', border: '1px solid #ccc', borderRadius: '4px', overflow: 'hidden' }}>
            <button
              onClick={() => setViewMode('mechanical')}
              className={viewMode === 'mechanical' ? 'active' : ''}
              style={{
                padding: '0.25rem 0.5rem',
                border: 'none',
                background: viewMode === 'mechanical' ? '#4CAF50' : '#f0f0f0',
                color: viewMode === 'mechanical' ? 'white' : '#333',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: viewMode === 'mechanical' ? 'bold' : 'normal'
              }}
            >
              Mechanical
            </button>
            <button
              onClick={() => setViewMode('narrative')}
              className={viewMode === 'narrative' ? 'active' : ''}
              style={{
                padding: '0.25rem 0.5rem',
                border: 'none',
                background: viewMode === 'narrative' ? '#4CAF50' : '#f0f0f0',
                color: viewMode === 'narrative' ? 'white' : '#333',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: viewMode === 'narrative' ? 'bold' : 'normal'
              }}
            >
              Narrative
            </button>
          </div>

          {/* WHY: Add custom narrative button (Issue #22 - Phase 5) */}
          <button
            onClick={() => setShowNarrativeModal(true)}
            title="Add custom narrative entry"
            style={{
              padding: '0.25rem 0.5rem',
              borderRadius: '4px',
              border: '1px solid #9C27B0',
              background: '#9C27B0',
              color: 'white',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: 'bold'
            }}
          >
            + Narrative
          </button>

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
          renderGroupedEvents(groupedEvents, viewMode)
        ) : selectedRound === 'all' ? (
          renderCollapsibleRounds(filteredEvents, expandedRounds, toggleRound, viewMode)
        ) : (
          filteredEvents.map((event, idx) => (
            viewMode === 'narrative' && event.narrative ? (
              <NarrativeEventItem key={idx} event={event} />
            ) : viewMode === 'mechanical' ? (
              <EventItem key={idx} event={event} />
            ) : null
          ))
        )}
      </div>

      {/* WHY: Custom narrative entry modal (Issue #22 - Phase 5) */}
      {showNarrativeModal && (
        <div className="narrative-modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="narrative-modal" style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '8px',
            maxWidth: '600px',
            width: '90%',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Add Custom Narrative Entry</h3>
            <textarea
              value={narrativeText}
              onChange={(e) => setNarrativeText(e.target.value)}
              placeholder="Write your narrative entry here... (e.g., 'The kill team discovered an ancient artifact pulsing with eldritch energy...')"
              style={{
                width: '100%',
                minHeight: '150px',
                padding: '0.75rem',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontFamily: 'inherit',
                fontSize: '0.875rem',
                resize: 'vertical'
              }}
              maxLength={1000}
            />
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '0.5rem'
            }}>
              <small style={{ color: '#666' }}>
                {narrativeText.length}/1000 characters
              </small>
            </div>
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              justifyContent: 'flex-end',
              marginTop: '1rem'
            }}>
              <button
                onClick={() => {
                  setShowNarrativeModal(false)
                  setNarrativeText('')
                }}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                  background: '#f0f0f0',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddNarrative}
                disabled={!narrativeText.trim()}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  border: '1px solid #9C27B0',
                  background: narrativeText.trim() ? '#9C27B0' : '#ccc',
                  color: 'white',
                  cursor: narrativeText.trim() ? 'pointer' : 'not-allowed'
                }}
              >
                Add Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Helper component for individual event (mechanical view)
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

// WHY: Narrative view component with category badges (Issue #22 - Phase 5)
function NarrativeEventItem({ event }: { event: Event }) {
  if (!event.narrative) return null

  const categoryColors = {
    combat: '#ef4444',
    exploration: '#3b82f6',
    movement: '#22c55e',
    custom: '#a855f7',
    milestone: '#f59e0b'
  }

  return (
    <div className="narrative-event" style={{
      background: '#f9f9f9',
      border: '1px solid #e0e0e0',
      borderRadius: '6px',
      padding: '1rem',
      marginBottom: '0.75rem'
    }}>
      <div
        className="category-badge"
        style={{
          display: 'inline-block',
          backgroundColor: categoryColors[event.narrative.category],
          color: 'white',
          padding: '0.25rem 0.5rem',
          borderRadius: '4px',
          fontSize: '0.75rem',
          fontWeight: 'bold',
          marginBottom: '0.5rem',
          textTransform: 'capitalize'
        }}
      >
        {event.narrative.isCustom ? '✒️' : event.icon} {event.narrative.category}
      </div>
      <p className="narrative-flavor" style={{
        fontSize: '0.95rem',
        lineHeight: '1.5',
        margin: '0.5rem 0',
        fontStyle: event.narrative.isCustom ? 'italic' : 'normal'
      }}>
        {event.narrative.flavor}
      </p>
      <div className="narrative-meta" style={{
        fontSize: '0.75rem',
        color: '#666',
        marginTop: '0.5rem'
      }}>
        Round {event.round} • {event.phase} • {event.timestamp}
        {event.narrative.locationName && ` • ${event.narrative.locationName}`}
        {event.narrative.playerNames && ` • ${event.narrative.playerNames.join(', ')}`}
      </div>
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

// WHY: Render collapsible rounds with view mode support (Issue #31, #22 - Phase 5)
function renderCollapsibleRounds(
  events: Event[],
  expandedRounds: Set<number>,
  toggleRound: (round: number) => void,
  viewMode: 'mechanical' | 'narrative'
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
            viewMode={viewMode}
          />
        )
      })}
    </>
  )
}

// WHY: Collapsible round component with view mode support (Issue #31, #22 - Phase 5)
function CollapsibleRound({
  round,
  events,
  isExpanded,
  onToggle,
  viewMode
}: {
  round: number
  events: Event[]
  isExpanded: boolean
  onToggle: () => void
  viewMode: 'mechanical' | 'narrative'
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
            viewMode === 'narrative' && event.narrative ? (
              <NarrativeEventItem key={idx} event={event} />
            ) : viewMode === 'mechanical' ? (
              <EventItem key={idx} event={event} />
            ) : null
          ))}
        </div>
      )}
    </div>
  )
}

// WHY: Render grouped events with view mode support (Issue #31, #22 - Phase 5)
function renderGroupedEvents(grouped: Map<number, Event[]>, viewMode: 'mechanical' | 'narrative') {
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
              viewMode === 'narrative' && event.narrative ? (
                <NarrativeEventItem key={idx} event={event} />
              ) : viewMode === 'mechanical' ? (
                <EventItem key={idx} event={event} />
              ) : null
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
