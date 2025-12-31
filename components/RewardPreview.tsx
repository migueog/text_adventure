'use client'

/**
 * Reward Preview Component (Issue #41)
 *
 * WHY: Shows battle reward before confirmation with SP cap warning
 * when reward would exceed maximum. Helps players understand rewards
 * before committing to a result.
 */

import { useMemo } from 'react'
import type { BattleResult } from '@/types/campaign'
import { BATTLE_RESULTS } from '@/lib/data/campaignData'
import { calculateRewardWithCap } from '@/lib/utils/battleRewards'

interface RewardPreviewProps {
  /** WHY: Selected battle result to show rewards for */
  result: BattleResult
  /** WHY: Player's current CP for display */
  currentCP: number
  /** WHY: Player's current SP for cap calculation */
  currentSP: number
  /** WHY: Whether this is an extra game (no rewards) */
  isExtraGame?: boolean
}

/**
 * WHY: Displays expected rewards before battle result is recorded
 */
export default function RewardPreview({
  result,
  currentCP,
  currentSP,
  isExtraGame = false
}: RewardPreviewProps) {
  const preview = useMemo(() => {
    // WHY: Extra game helper gets no rewards
    if (isExtraGame) {
      return {
        cpGain: 0,
        spGain: 0,
        newCP: currentCP,
        newSP: currentSP,
        wasCapped: false,
        cappedAmount: 0,
        resultName: BATTLE_RESULTS[result]?.name || result
      }
    }

    const rewards = BATTLE_RESULTS[result]
    if (!rewards) {
      return null
    }

    const spResult = calculateRewardWithCap(currentSP, rewards.spGain)

    return {
      cpGain: rewards.cpGain,
      spGain: rewards.spGain,
      newCP: currentCP + rewards.cpGain,
      newSP: spResult.newSP,
      wasCapped: spResult.wasCapped,
      cappedAmount: spResult.cappedAmount,
      resultName: rewards.name
    }
  }, [result, currentCP, currentSP, isExtraGame])

  if (!preview) {
    return null
  }

  return (
    <div className={`reward-preview ${preview.wasCapped ? 'capped' : ''}`}>
      <div className="reward-preview-header">
        <span className="result-name">{preview.resultName}</span>
        {isExtraGame && (
          <span className="extra-game-badge">Extra Game</span>
        )}
      </div>

      <div className="reward-preview-details">
        {/* WHY: Show CP change if applicable */}
        {preview.cpGain > 0 && (
          <div className="reward-line cp">
            <span className="reward-label">Campaign Points:</span>
            <span className="reward-change">
              {currentCP} → {preview.newCP}
              <span className="reward-delta">+{preview.cpGain} CP</span>
            </span>
          </div>
        )}

        {/* WHY: Show SP change if applicable */}
        {preview.spGain > 0 && (
          <div className="reward-line sp">
            <span className="reward-label">Supply Points:</span>
            <span className="reward-change">
              {currentSP} → {preview.newSP}
              <span className="reward-delta">+{preview.spGain} SP</span>
            </span>
          </div>
        )}

        {/* WHY: Show no rewards message for extra games */}
        {isExtraGame && (
          <div className="reward-line no-reward">
            <span className="reward-label">No rewards</span>
            <span className="reward-note">(helping odd player)</span>
          </div>
        )}

        {/* WHY: No changes for some results like WIN that only give CP */}
        {!isExtraGame && preview.cpGain === 0 && preview.spGain === 0 && (
          <div className="reward-line">
            <span className="reward-label">No resource changes</span>
          </div>
        )}
      </div>

      {/* WHY: Show warning when SP would be capped */}
      {preview.wasCapped && (
        <div className="sp-cap-warning">
          SP capped at maximum (10) — {preview.cappedAmount} SP lost
        </div>
      )}
    </div>
  )
}
