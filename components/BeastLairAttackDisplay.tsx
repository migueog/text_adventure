'use client'

/**
 * BeastLairAttackDisplay component for Issue #59
 * WHY: Displays Beast Lair attack resolution during Threat Phase
 *
 * Shows:
 * - Beast Lair hex location
 * - Target player name
 * - Attack roll (D6 + distance)
 * - Damage dealt (D6 SP)
 */

interface BeastLairAttackDisplayProps {
  beastLairHexId: string
  targetPlayerName: string
  roll: number
  damage: number
}

export default function BeastLairAttackDisplay({
  beastLairHexId,
  targetPlayerName,
  roll,
  damage
}: BeastLairAttackDisplayProps) {
  return (
    <div className="beast-lair-attack-display">
      <div className="beast-lair-attack-banner">
        <span className="beast-icon">🐉</span>
        <h4 className="beast-attack-title">Beast Lair Attack!</h4>
      </div>

      <div className="beast-attack-details">
        <p className="beast-location">
          <strong>Location:</strong> Hex {beastLairHexId}
        </p>
        <p className="beast-target">
          <strong>Target:</strong> {targetPlayerName}
        </p>
        <p className="beast-roll">
          <strong>Attack Roll:</strong> {roll} (D6 + distance)
        </p>
        <p className="beast-damage">
          <strong>Damage:</strong> {damage} SP
        </p>
      </div>
    </div>
  )
}
