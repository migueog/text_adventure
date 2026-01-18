'use client'

import type { Player, ThreatWarningLevel, ActiveThreatPhaseRule } from '@/types/campaign'

interface ThreatPhaseModalProps {
  isOpen: boolean
  currentPlayer: Player
  players: Player[]
  threatLevel: number
  targetThreatLevel: number
  threatWarning: ThreatWarningLevel
  soloMode: boolean
  onNextPhase: () => void
  onClose: () => void
  activeThreatRules?: ActiveThreatPhaseRule[]
  threatRulesResolved?: boolean
  onResolveThreatRules?: () => void
  hasActiveThreatAttacks?: boolean
  onResolveThreatAttacks?: () => void
}

/**
 * WHY: Modal dialog for Threat Phase (extracted from PhaseTracker/ThreatPhase.tsx)
 * Displays during Threat phase with location rules, threat attacks, and threat warnings
 * Simplified modal version focused on core threat functionality
 */
export default function ThreatPhaseModal({
  isOpen,
  currentPlayer,
  players,
  threatLevel,
  targetThreatLevel,
  threatWarning,
  soloMode,
  onNextPhase,
  onClose,
  activeThreatRules,
  threatRulesResolved,
  onResolveThreatRules,
  hasActiveThreatAttacks,
  onResolveThreatAttacks
}: ThreatPhaseModalProps) {
  if (!isOpen) return null

  const hasActiveRules = activeThreatRules && activeThreatRules.length > 0 && !threatRulesResolved
  const showStandardContent = !hasActiveRules && !hasActiveThreatAttacks

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-content threat-phase-modal">
        <div className="modal-header">
          <h3>{soloMode ? '🎯 Threat Phase (Solo)' : '⚠️ Threat Phase'}</h3>
          <button
            className="modal-close-button"
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <div className="modal-body">
          {renderThreatInstructions(soloMode)}
          {renderLocationRules(hasActiveRules, activeThreatRules, onResolveThreatRules)}
          {renderThreatAttacks(hasActiveThreatAttacks, onResolveThreatAttacks)}
          {renderStandardContent(showStandardContent, threatLevel, threatWarning, currentPlayer, players, onNextPhase)}
        </div>
      </div>
    </div>
  )
}

/**
 * WHY: Extract threat instructions to keep main component under 20 lines
 */
function renderThreatInstructions(soloMode: boolean): JSX.Element {
  if (soloMode) {
    return (
      <div className="solo-threat-instructions">
        <p><strong>Dynamic Threat:</strong> Threat may increase based on your actions this round.</p>
        <p className="threat-reminder">Campaign ends if threat reaches 10!</p>
      </div>
    )
  }

  return (
    <div className="competitive-threat-instructions">
      <p>Threat level increases by 1 at the end of each round.</p>
    </div>
  )
}

/**
 * WHY: Extract location rules rendering to keep function size under 20 lines
 */
function renderLocationRules(
  hasActiveRules: boolean,
  activeThreatRules: ActiveThreatPhaseRule[] | undefined,
  onResolveThreatRules: (() => void) | undefined
): JSX.Element | null {
  if (!hasActiveRules || !activeThreatRules) {
    return null
  }

  return (
    <div className="threat-location-rules">
      <h5>Location Rules Resolving</h5>
      <p>The following location effects trigger in priority order:</p>
      <ol className="location-rule-list">
        {activeThreatRules.map((rule) => renderLocationRuleItem(rule))}
      </ol>
      <button className="action-btn primary" onClick={onResolveThreatRules}>
        Resolve Location Rules
      </button>
    </div>
  )
}

/**
 * WHY: Extract location rule item rendering to keep function size under 20 lines
 */
function renderLocationRuleItem(rule: ActiveThreatPhaseRule): JSX.Element {
  return (
    <li key={`${rule.player.id}-${rule.hexId}`} className="location-rule-item">
      <span className="player-indicator" style={{ backgroundColor: rule.player.color }} />
      <span className="player-name">{rule.player.name}</span>
      <span className="location-name">({rule.location.name})</span>
      <span className="rule-effect">{rule.rule.description}</span>
    </li>
  )
}

/**
 * WHY: Extract threat attacks rendering to keep function size under 20 lines
 */
function renderThreatAttacks(
  hasActiveThreatAttacks: boolean | undefined,
  onResolveThreatAttacks: (() => void) | undefined
): JSX.Element | null {
  if (!hasActiveThreatAttacks || !onResolveThreatAttacks) {
    return null
  }

  return (
    <div className="threat-attacks-section">
      <h5>Threat Phase Attacks</h5>
      <p>Beast Lairs and Released Prisoners may attack during Threat Phase.</p>
      <button className="action-btn primary" onClick={onResolveThreatAttacks}>
        Resolve Threat Attacks
      </button>
    </div>
  )
}

/**
 * WHY: Extract standard content rendering to keep function size under 20 lines
 */
function renderStandardContent(
  showStandardContent: boolean,
  threatLevel: number,
  threatWarning: ThreatWarningLevel,
  currentPlayer: Player,
  players: Player[],
  onNextPhase: () => void
): JSX.Element | null {
  if (!showStandardContent) {
    return null
  }

  return (
    <>
      <p>The tomb stirs...</p>
      {renderThreatInfo(threatLevel, currentPlayer, players)}
      {renderThreatWarning(threatWarning)}
      <button className="action-btn primary" onClick={onNextPhase}>
        End Turn
      </button>
    </>
  )
}

/**
 * WHY: Extract threat info rendering to keep function size under 20 lines
 */
function renderThreatInfo(
  threatLevel: number,
  currentPlayer: Player,
  players: Player[]
): JSX.Element {
  const isLastPlayer = currentPlayer.id === players.length - 1

  return (
    <div className="threat-info">
      <p>
        Current Threat Level: <strong>{threatLevel}</strong>
      </p>
      <p>
        At the end of this phase, threat will increase and the next player&apos;s turn will begin.
      </p>
      {isLastPlayer && (
        <p className="warning">
          This is the last player - threat will increase after this turn!
        </p>
      )}
    </div>
  )
}

/**
 * WHY: Extract threat warning rendering to keep function size under 20 lines
 */
function renderThreatWarning(threatWarning: ThreatWarningLevel): JSX.Element | null {
  if (threatWarning === 'none') {
    return null
  }

  const warningClass = `threat-phase-warning ${threatWarning}`
  const warningMessage = threatWarning === 'critical'
    ? '⚠️ CRITICAL: Campaign ending next round!'
    : '⚠️ WARNING: Approaching campaign end'

  return <div className={warningClass}>{warningMessage}</div>
}
