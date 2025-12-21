'use client'

import type { Event } from '@/types/campaign'

interface EventLogProps {
  events: Event[]
}

export default function EventLog({ events }: EventLogProps) {
  return (
    <div className="event-log">
      <h3>Event Log</h3>
      <div className="event-list">
        {events.length === 0 ? (
          <div className="no-events">No events yet. Start the campaign!</div>
        ) : (
          events.map((event, idx) => (
            <div key={idx} className={`event-item ${event.type}`}>
              <span className="event-icon">{event.icon}</span>
              <span className="event-message">{event.message}</span>
              <span className="event-meta">
                R{event.round} • {event.phase} • {event.timestamp}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
