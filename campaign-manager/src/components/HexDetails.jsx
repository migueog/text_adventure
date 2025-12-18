import React from 'react';

export default function HexDetails({ hex, players }) {
  if (!hex) {
    return (
      <div className="hex-details">
        <h3>Hex Details</h3>
        <p className="no-selection">Click on a hex to view details</p>
      </div>
    );
  }

  const playersHere = players.filter(p => p.position === hex.id);

  return (
    <div className="hex-details">
      <h3>Hex Details</h3>

      <div className="hex-info">
        <div className="info-row">
          <span className="info-label">Coordinates:</span>
          <span className="info-value">{hex.id}</span>
        </div>

        <div className="info-row">
          <span className="info-label">Type:</span>
          <span className={`info-value type-${hex.type}`}>
            {hex.type === 'surface' ? 'Surface' : 'Tomb'}
          </span>
        </div>

        <div className="info-row">
          <span className="info-label">Status:</span>
          <span className={`info-value ${hex.explored ? 'explored' : 'unexplored'}`}>
            {hex.explored ? 'Explored' : 'Unexplored'}
          </span>
        </div>

        {hex.blocked && (
          <div className="info-row warning">
            <span className="info-label">⚠ Blocked</span>
          </div>
        )}

        {hex.explored && hex.location && (
          <>
            <div className="section-divider" />
            <h4>Location</h4>
            <div className="location-name">{hex.location.name}</div>
            <div className="location-desc">{hex.location.description}</div>
            {hex.location.effect !== 'none' && (
              <div className="location-effect">
                Effect: {hex.location.effect}
                {hex.location.value && ` (${hex.location.value})`}
              </div>
            )}
          </>
        )}

        {hex.explored && hex.condition && (
          <>
            <div className="section-divider" />
            <h4>Condition</h4>
            <div className="condition-name">{hex.condition.name}</div>
            <div className="condition-desc">{hex.condition.description}</div>
            {hex.condition.effect !== 'none' && (
              <div className="condition-effect">
                Effect: {hex.condition.effect}
                {hex.condition.modifier && ` (${hex.condition.modifier > 0 ? '+' : ''}${hex.condition.modifier})`}
              </div>
            )}
          </>
        )}

        {(hex.hasBase || hex.hasCamp) && (
          <>
            <div className="section-divider" />
            <h4>Structures</h4>
            {hex.hasBase && (
              <div className="structure base">
                ⌂ Base (Player {hex.baseOwner + 1})
              </div>
            )}
            {hex.hasCamp && (
              <div className="structure camp">
                ⛺ Camp (Player {hex.campOwner + 1})
              </div>
            )}
          </>
        )}

        {playersHere.length > 0 && (
          <>
            <div className="section-divider" />
            <h4>Players Here</h4>
            <div className="players-list">
              {playersHere.map(player => (
                <div
                  key={player.id}
                  className="player-badge"
                  style={{ backgroundColor: player.color }}
                >
                  {player.name}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
