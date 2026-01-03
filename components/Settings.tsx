'use client'

/**
 * WHY: Campaign settings component (Issue #31 - Phase 6, Issue #33 - Phase 5)
 * Allows users to toggle round summary, phase guidance, and other preferences
 */

import { savePhaseGuidanceState } from '@/lib/utils/phaseGuidance'

interface SettingsProps {
  showRoundSummary: boolean
  onToggleRoundSummary: (enabled: boolean) => void
  phaseGuidanceEnabled: boolean
  onTogglePhaseGuidance: (enabled: boolean) => void
}

export default function Settings({
  showRoundSummary,
  onToggleRoundSummary,
  phaseGuidanceEnabled,
  onTogglePhaseGuidance
}: SettingsProps) {
  return (
    <div className="settings-panel">
      <h3>Campaign Settings</h3>

      {/* WHY: Round summary toggle (Issue #31 - Phase 6) */}
      <div className="setting-item">
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showRoundSummary}
            onChange={(e) => onToggleRoundSummary(e.target.checked)}
            style={{ cursor: 'pointer' }}
          />
          <span>Show round summary between rounds</span>
        </label>
        <p className="setting-description" style={{ marginLeft: '1.5rem', fontSize: '0.875rem', color: '#666' }}>
          Display statistics and summary at the end of each round
        </p>
      </div>

      {/* WHY: Phase guidance toggle (Issue #33 - Phase 5) */}
      <div className="setting-item">
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={phaseGuidanceEnabled}
            onChange={(e) => {
              const enabled = e.target.checked
              onTogglePhaseGuidance(enabled)

              // WHY: Reset all phase guidance dismissals when re-enabling
              if (enabled) {
                const state = {
                  movement: false,
                  battle: false,
                  action: false,
                  threat: false,
                  enabledGlobally: true
                }
                savePhaseGuidanceState(state)
              }
            }}
            style={{ cursor: 'pointer' }}
          />
          <span>Show phase guidance tooltips</span>
        </label>
        <p className="setting-description" style={{ marginLeft: '1.5rem', fontSize: '0.875rem', color: '#666' }}>
          Display helpful tooltips when entering each phase (resets all dismissed tooltips when enabled)
        </p>
      </div>
    </div>
  )
}
