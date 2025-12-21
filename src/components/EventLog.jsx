import React from 'react';

export default function EventLog({ events }) {
  const getEventIcon = (type) => {
    switch (type) {
      case 'system': return '⚙';
      case 'movement': return '→';
      case 'exploration': return '🔍';
      case 'reward': return '★';
      case 'action': return '⚡';
      case 'battle': return '⚔';
      case 'warning': return '⚠';
      case 'error': return '✗';
      default: return '•';
    }
  };

  return (
    <div className="event-log">
      <h3>Event Log</h3>
      <div className="event-list">
        {events.length === 0 ? (
          <div className="no-events">No events yet. Start the campaign!</div>
        ) : (
          events.map((event) => (
            <div key={event.id} className={`event-item ${event.type}`}>
              <span className="event-icon">{getEventIcon(event.type)}</span>
              <span className="event-message">{event.message}</span>
              <span className="event-meta">
                R{event.round} • {event.phase} • {event.timestamp}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
