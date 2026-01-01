'use client'

import { useState } from 'react'
import type { OperativeKillInput } from '@/types/battle'
import { getOperativeById, getCommonOperatives } from '@/lib/data/operatives'
import { calculateOperativeWoundValue } from '@/lib/utils/operativeKills'

/**
 * WHY: Issue #52 - UI component for recording operative kills with wound-based tracking
 *
 * Features:
 * - Quick-select mode: Choose from common Kill Team operatives (pre-filled wounds)
 * - Custom entry mode: Manually enter operative name and wounds
 * - Live wound value calculation (0/1/2 points)
 * - Kill list with remove capability
 * - Running total display
 */

interface OperativeKillRecorderProps {
  kills: OperativeKillInput[]
  onChange: (kills: OperativeKillInput[]) => void
  opponentName?: string
}

export default function OperativeKillRecorder({
  kills,
  onChange,
  opponentName
}: OperativeKillRecorderProps) {
  // WHY: Track UI mode (quick-select vs custom entry)
  const [selectedMode, setSelectedMode] = useState<'quick' | 'custom'>('quick')

  // WHY: Quick-select state
  const [quickSelectId, setQuickSelectId] = useState<string>('')

  // WHY: Custom entry state
  const [customName, setCustomName] = useState<string>('')
  const [customWounds, setCustomWounds] = useState<number>(7)

  // WHY: Add operative from quick-select dropdown
  const addQuickKill = () => {
    const operative = getOperativeById(quickSelectId)
    if (!operative) return

    onChange([...kills, {
      operativeName: operative.name,
      wounds: operative.wounds
    }])
    setQuickSelectId('')
  }

  // WHY: Add operative from custom entry form
  const addCustomKill = () => {
    if (!customName.trim()) return

    onChange([...kills, {
      operativeName: customName.trim(),
      wounds: customWounds
    }])
    setCustomName('')
    setCustomWounds(7)
  }

  // WHY: Remove kill entry by index
  const removeKill = (index: number) => {
    onChange(kills.filter((_, i) => i !== index))
  }

  // WHY: Calculate total wound-based value for display
  const totalWoundValue = kills.reduce((sum, kill) =>
    sum + calculateOperativeWoundValue(kill.wounds), 0
  )

  return (
    <div className="operative-kill-recorder">
      <div className="recorder-header">
        <h4>Record Enemy Operatives Killed</h4>
        {opponentName && <span className="opponent-label">vs {opponentName}</span>}
      </div>

      {/* Mode Toggle */}
      <div className="mode-toggle">
        <button
          className={selectedMode === 'quick' ? 'active' : ''}
          onClick={() => setSelectedMode('quick')}
        >
          Quick Select
        </button>
        <button
          className={selectedMode === 'custom' ? 'active' : ''}
          onClick={() => setSelectedMode('custom')}
        >
          Custom Entry
        </button>
      </div>

      {/* Quick Select Mode */}
      {selectedMode === 'quick' && (
        <div className="quick-select-panel">
          <select
            value={quickSelectId}
            onChange={(e) => setQuickSelectId(e.target.value)}
          >
            <option value="">-- Select Operative --</option>
            {getCommonOperatives().map(op => (
              <option key={op.id} value={op.id}>
                {op.name} ({op.wounds}W → {op.woundValue} pt)
              </option>
            ))}
          </select>
          <button onClick={addQuickKill} disabled={!quickSelectId}>
            Add Kill
          </button>
        </div>
      )}

      {/* Custom Entry Mode */}
      {selectedMode === 'custom' && (
        <div className="custom-entry-panel">
          <input
            type="text"
            placeholder="Operative name"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
          />
          <div className="wound-input-group">
            <label htmlFor="custom-wounds">Wounds:</label>
            <input
              id="custom-wounds"
              type="number"
              min={1}
              max={20}
              value={customWounds}
              onChange={(e) => setCustomWounds(Number(e.target.value))}
            />
            <span className="wound-value-badge">
              {calculateOperativeWoundValue(customWounds)} pt
            </span>
          </div>
          <button onClick={addCustomKill} disabled={!customName.trim()}>
            Add Kill
          </button>
        </div>
      )}

      {/* Kill List */}
      {kills.length > 0 && (
        <div className="kill-list">
          <h5>Kills Recorded ({kills.length})</h5>
          <ul>
            {kills.map((kill, index) => {
              const woundValue = calculateOperativeWoundValue(kill.wounds)
              return (
                <li key={index} className="kill-entry">
                  <span className="kill-name">{kill.operativeName}</span>
                  <span className="kill-wounds">({kill.wounds}W)</span>
                  <span className={`kill-value value-${woundValue}`}>
                    {woundValue} pt
                  </span>
                  <button
                    className="remove-kill"
                    onClick={() => removeKill(index)}
                    aria-label={`Remove ${kill.operativeName}`}
                  >
                    ✕
                  </button>
                </li>
              )
            })}
          </ul>
          <div className="kill-summary">
            <strong>Total Wound Value:</strong> {totalWoundValue} points
          </div>
        </div>
      )}

      {kills.length === 0 && (
        <div className="empty-state">
          No operatives recorded yet. Add kills above.
        </div>
      )}
    </div>
  )
}
