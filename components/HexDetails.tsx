'use client'

import type { Hex, Player } from '@/types/campaign'
import { SURFACE_LOCATIONS, TOMB_LOCATIONS, SURFACE_CONDITIONS, TOMB_CONDITIONS } from '@/lib/data/campaignData'
import { hexId } from '@/lib/utils/hexUtils'

interface HexDetailsProps {
  hex?: Hex
  players: Player[]
}

export default function HexDetails({ hex, players }: HexDetailsProps) {
  if (!hex) {
    return (
      <div className="hex-details">
        <h3>Hex Details</h3>
        <p className="no-selection">Click on a hex to view details</p>
      </div>
    )
  }

  const hexIdStr = hexId(hex.row, hex.col)
  const playersHere = players.filter(p => {
    const pIdStr = hexId(p.position.row, p.position.col)
    return pIdStr === hexIdStr
  })

  const location = hex.location ? (hex.type === 'surface' ? SURFACE_LOCATIONS[hex.location] : TOMB_LOCATIONS[hex.location]) : null
  const condition = hex.condition ? (hex.type === 'surface' ? SURFACE_CONDITIONS[hex.condition] : TOMB_CONDITIONS[hex.condition]) : null

  // Check if any player has a base or camp here
  const basesHere = players.filter(p => p.bases.some(b => b.row === hex.row && b.col === hex.col))
  const campsHere = players.filter(p => p.camps.some(c => c.row === hex.row && c.col === hex.col))

  return (
    <div className="hex-details">
      <h3>Hex Details</h3>

      <div className="hex-info">
        <div className="info-row">
          <span className="info-label">Coordinates:</span>
          <span className="info-value">{hexIdStr}</span>
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

        {hex.explored && location && (
          <>
            <div className="section-divider" />
            <h4>Location</h4>
            <div className="location-name">{location.name}</div>
            <div className="location-desc">{location.description}</div>
            {location.effect !== 'none' && (
              <div className="location-effect">
                Effect: {location.effect}
                {location.value && ` (${location.value})`}
              </div>
            )}
          </>
        )}

        {hex.explored && condition && (
          <>
            <div className="section-divider" />
            <h4>Condition</h4>
            <div className="condition-name">{condition.name}</div>
            <div className="condition-desc">{condition.description}</div>
            {condition.effect !== 'none' && (
              <div className="condition-effect">
                Effect: {condition.effect}
                {condition.modifier && ` (${condition.modifier > 0 ? '+' : ''}${condition.modifier})`}
              </div>
            )}
          </>
        )}

        {(basesHere.length > 0 || campsHere.length > 0) && (
          <>
            <div className="section-divider" />
            <h4>Structures</h4>
            {basesHere.map(player => (
              <div key={`base-${player.id}`} className="structure base">
                ⌂ Base ({player.name})
              </div>
            ))}
            {campsHere.map(player => (
              <div key={`camp-${player.id}`} className="structure camp">
                ⛺ Camp ({player.name})
              </div>
            ))}
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
  )
}
