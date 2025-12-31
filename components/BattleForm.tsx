'use client'

/**
 * Enhanced battle recording form (Issue #34)
 *
 * WHY: Provides both quick entry (basic) and full details (detailed) modes
 * for recording battle results with optional mission and VP tracking.
 */

import { useState, useCallback } from 'react'
import type { ExtendedBattleRecord } from '@/types/battle'
import type { BattleResult } from '@/types/campaign'
import { BATTLE_RESULTS } from '@/lib/data/campaignData'
import { KILL_TEAM_MISSIONS, getRandomMission } from '@/lib/data/missions'

interface BattleFormProps {
  currentPlayerId: number
  players: Array<{ id: number; name: string; color: string }>
  currentRound: number
  onRecordBattle: (record: Omit<ExtendedBattleRecord, 'round' | 'timestamp'>) => void
}

export default function BattleForm({
  currentPlayerId,
  players,
  onRecordBattle
}: BattleFormProps) {
  // Basic form state
  const [result, setResult] = useState<BattleResult>('WIN')
  const [opponentId, setOpponentId] = useState<number | null>(null)
  const [isExternal, setIsExternal] = useState(false)
  const [operativesKilled, setOperativesKilled] = useState(0)
  const [challengedRefused, setChallengedRefused] = useState(false)

  // Detailed mode state
  const [showDetails, setShowDetails] = useState(false)
  const [mission, setMission] = useState('')
  const [vpScored, setVpScored] = useState<number | ''>('')
  const [vpOpponent, setVpOpponent] = useState<number | ''>('')
  const [operativesLost, setOperativesLost] = useState<number | ''>('')
  const [notes, setNotes] = useState('')

  const isBye = result === 'BYE'
  const needsOpponent = !isBye && !isExternal
  const canSubmit = isBye || isExternal || opponentId !== null
  const otherPlayers = players.filter(p => p.id !== currentPlayerId)

  const handleResultChange = useCallback((newResult: BattleResult) => {
    setResult(newResult)
    if (newResult === 'BYE') {
      setOpponentId(null)
      setIsExternal(false)
      setChallengedRefused(false)
    }
  }, [])

  const handleExternalToggle = useCallback((checked: boolean) => {
    setIsExternal(checked)
    if (checked) {
      setOpponentId(null)
      setChallengedRefused(false)
    }
  }, [])

  const handleRandomMission = useCallback(() => {
    const randomMission = getRandomMission()
    setMission(randomMission.name)
  }, [])

  const resetForm = useCallback(() => {
    setOperativesKilled(0)
    setOpponentId(null)
    setChallengedRefused(false)
    setIsExternal(false)
    setMission('')
    setVpScored('')
    setVpOpponent('')
    setOperativesLost('')
    setNotes('')
  }, [])

  const handleSubmit = useCallback(() => {
    if (!canSubmit) return

    const rewards = BATTLE_RESULTS[result]
    // WHY: Guard against undefined (shouldn't happen with controlled select)
    if (!rewards) return

    const status = challengedRefused ? 'challenged-refused' : 'completed'

    const record: Omit<ExtendedBattleRecord, 'round' | 'timestamp'> = {
      opponent: opponentId,
      result,
      status,
      operativesKilled,
      isExternalOpponent: isExternal,
      cpEarned: rewards.cpGain,
      spEarned: rewards.spGain,
      // Optional detailed fields - only include if provided
      ...(mission && { missionType: mission }),
      ...(vpScored !== '' && { vpScored: vpScored as number }),
      ...(vpOpponent !== '' && { vpOpponent: vpOpponent as number }),
      ...(operativesLost !== '' && { operativesLost: operativesLost as number }),
      ...(notes && { notes })
    }

    onRecordBattle(record)
    resetForm()
  }, [
    result, opponentId, isExternal, operativesKilled,
    challengedRefused, mission, vpScored, vpOpponent,
    operativesLost, notes, canSubmit, onRecordBattle, resetForm
  ])

  return (
    <div className="battle-form">
      {/* Result Selector */}
      <div className="form-group">
        <label htmlFor="battle-result">Battle Result:</label>
        <select
          id="battle-result"
          value={result}
          onChange={(e) => handleResultChange(e.target.value as BattleResult)}
        >
          <option value="WIN">Victory (+1 CP)</option>
          <option value="DRAW">Draw (+1 SP)</option>
          <option value="LOSS">Defeat (+1 SP)</option>
          <option value="BYE">Bye - No Opponent (+2 SP)</option>
        </select>
      </div>

      {/* Opponent Selection (non-BYE only) */}
      {!isBye && (
        <>
          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={isExternal}
                onChange={(e) => handleExternalToggle(e.target.checked)}
              />
              {' '}External opponent (not in campaign)
            </label>
          </div>

          {needsOpponent && (
            <div className="form-group">
              <label htmlFor="opponent">
                Opponent: <span className="required">*</span>
              </label>
              <select
                id="opponent"
                value={opponentId ?? ''}
                onChange={(e) => setOpponentId(e.target.value ? parseInt(e.target.value) : null)}
              >
                <option value="">-- Select Opponent --</option>
                {otherPlayers.map(player => (
                  <option key={player.id} value={player.id}>
                    {player.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Challenge Refused Checkbox - only for campaign opponents */}
          {opponentId !== null && !isExternal && (
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={challengedRefused}
                  onChange={(e) => setChallengedRefused(e.target.checked)}
                />
                {' '}Game challenged but didn&apos;t happen (refused/no-show)
              </label>
            </div>
          )}
        </>
      )}

      {/* Operatives Killed */}
      <div className="form-group">
        <label htmlFor="operatives-killed">Operatives Killed:</label>
        <input
          id="operatives-killed"
          type="number"
          min="0"
          value={operativesKilled}
          onChange={(e) => setOperativesKilled(parseInt(e.target.value) || 0)}
        />
      </div>

      {/* Details Toggle */}
      <button
        type="button"
        className="details-toggle"
        onClick={() => setShowDetails(!showDetails)}
      >
        {showDetails ? 'Hide Details' : 'Show Details'}
      </button>

      {/* Detailed Mode Fields */}
      {showDetails && (
        <div className="battle-details">
          <div className="form-group">
            <label htmlFor="mission">Mission:</label>
            <div className="mission-input">
              <select
                id="mission"
                value={mission}
                onChange={(e) => setMission(e.target.value)}
              >
                <option value="">-- Select Mission --</option>
                {KILL_TEAM_MISSIONS.map(m => (
                  <option key={m.id} value={m.name}>
                    {m.name} ({m.category})
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="random-mission-btn"
                onClick={handleRandomMission}
              >
                Random Mission
              </button>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="vp-scored">VP Scored:</label>
              <input
                id="vp-scored"
                type="number"
                min="0"
                value={vpScored}
                onChange={(e) => setVpScored(e.target.value ? parseInt(e.target.value) : '')}
              />
            </div>
            <div className="form-group">
              <label htmlFor="vp-opponent">VP Opponent:</label>
              <input
                id="vp-opponent"
                type="number"
                min="0"
                value={vpOpponent}
                onChange={(e) => setVpOpponent(e.target.value ? parseInt(e.target.value) : '')}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="operatives-lost">Operatives Lost:</label>
            <input
              id="operatives-lost"
              type="number"
              min="0"
              value={operativesLost}
              onChange={(e) => setOperativesLost(e.target.value ? parseInt(e.target.value) : '')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notes:</label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Battle notes..."
              rows={2}
            />
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="button"
        className="action-btn primary"
        onClick={handleSubmit}
        disabled={!canSubmit}
      >
        Record Battle
      </button>

      {/* Validation Message */}
      {!canSubmit && !isBye && (
        <p className="validation-message">
          Please select an opponent or mark as external opponent.
        </p>
      )}
    </div>
  )
}
