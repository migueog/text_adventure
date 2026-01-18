'use client'

import type { Phase, Player } from '@/types/campaign'
import UserMenu from './UserMenu'

interface EnhancedHeaderProps {
  phase: Phase
  currentPlayer: Player | null
  round: number
  threatLevel: number
  targetThreat: number
  isOwner: boolean
  isSoloMode: boolean
  campaignPoints?: number
  onSettingsClick?: () => void
}

/**
 * WHY: Enhanced header component that consolidates all essential campaign information
 * Replaces scattered information displays with a unified header bar
 * Shows phase, current player, round, and threat level in one place
 */
export default function EnhancedHeader({
  phase,
  currentPlayer,
  round,
  threatLevel,
  targetThreat,
  isOwner,
  isSoloMode,
  campaignPoints,
  onSettingsClick
}: EnhancedHeaderProps) {
  return (
    <header className="enhanced-header">
      {/* WHY: Left section - Campaign title and phase badge */}
      <div className="header-left">
        <h1 className="campaign-title">Ctesiphus Expedition</h1>
        <PhaseBadge phase={phase} />
      </div>

      {/* WHY: Center section - Current turn and round information */}
      <div className="header-center">
        {renderCurrentPlayer(currentPlayer)}
        <span className="round-indicator">Round {round}</span>
        <span className="threat-indicator">Threat: {threatLevel}/{targetThreat}</span>
        {renderSoloCampaignPoints(isSoloMode, campaignPoints)}
      </div>

      {/* WHY: Right section - Settings and user menu */}
      <div className="header-right">
        {renderSettingsButton(isOwner, onSettingsClick)}
        <UserMenu />
      </div>
    </header>
  )
}

/**
 * WHY: Extract phase badge rendering to keep main component under 20 lines
 * Applies color-coded CSS classes for visual phase distinction
 */
function PhaseBadge({ phase }: { phase: Phase }) {
  const phaseClass = getPhaseClassName(phase)
  return (
    <span className={`phase-badge ${phaseClass}`}>
      {phase}
    </span>
  )
}

/**
 * WHY: Map phase to CSS class name for consistent styling
 * Movement: blue, Battle: red, Action: green, Threat: purple
 */
function getPhaseClassName(phase: Phase): string {
  const phaseMap: Record<Phase, string> = {
    'Movement': 'phase-movement',
    'Battle': 'phase-battle',
    'Action': 'phase-action',
    'Threat': 'phase-threat'
  }
  return phaseMap[phase]
}

/**
 * WHY: Render current player indicator with color border
 * Shows null state gracefully when no current player
 */
function renderCurrentPlayer(player: Player | null): JSX.Element | null {
  if (!player) {
    return null
  }

  return (
    <span
      className="current-player-indicator"
      data-testid="current-player-indicator"
      style={{ borderColor: player.color }}
    >
      {player.name}'s Turn
    </span>
  )
}

/**
 * WHY: Render solo campaign points progress
 * Only shown in solo mode to track progress toward 10+ CP victory goal
 */
function renderSoloCampaignPoints(
  isSoloMode: boolean,
  campaignPoints?: number
): JSX.Element | null {
  if (!isSoloMode || campaignPoints === undefined) {
    return null
  }

  return (
    <span className="solo-cp-indicator">
      {campaignPoints} CP
    </span>
  )
}

/**
 * WHY: Render settings button only for campaign owner
 * Non-owners cannot access campaign settings
 */
function renderSettingsButton(
  isOwner: boolean,
  onSettingsClick?: () => void
): JSX.Element | null {
  if (!isOwner) {
    return null
  }

  return (
    <button
      className="settings-button"
      onClick={onSettingsClick}
      aria-label="Settings"
    >
      ⚙️
    </button>
  )
}
