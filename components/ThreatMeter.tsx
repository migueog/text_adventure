'use client'

import { useState, useEffect } from 'react'
import { THREAT_LEVELS } from '@/lib/data/campaignData'
import type { ThreatWarningLevel } from '@/types/campaign'

interface ThreatMeterProps {
  currentThreat: number
  targetThreat: number
  soloMode: boolean
  warningLevel?: ThreatWarningLevel
}

export default function ThreatMeter({ currentThreat, targetThreat, soloMode, warningLevel }: ThreatMeterProps) {
  const [recentlyIncreased, setRecentlyIncreased] = useState(false)

  useEffect(() => {
    // WHY: Trigger pulse animation when threat increases
    setRecentlyIncreased(true)
    const timer = setTimeout(() => setRecentlyIncreased(false), 2000)
    return () => clearTimeout(timer)
  }, [currentThreat])
  const maxDisplay = Math.max(targetThreat, 10) // Display at least up to 10
  
  return (
    <div className="threat-meter">
      <div className="threat-meter-header">
        <h3>Threat Level</h3>
        {soloMode && <span className="solo-badge">Solo/Co-op Mode</span>}
      </div>
      
      <div className="threat-meter-bar">
        {Array.from({ length: maxDisplay }, (_, i) => i + 1).map(level => {
          const isActive = level <= currentThreat
          const isTarget = level === targetThreat
          const isCurrent = level === currentThreat
          
          return (
            <div
              key={level}
              className={`threat-level ${isActive ? 'active' : ''} ${isTarget ? 'target' : ''} ${isCurrent ? 'current' : ''} ${isCurrent && recentlyIncreased ? 'increased' : ''}`}
              title={`Level ${level}: ${THREAT_LEVELS[level] || 'Unknown'}`}
            >
              <div className="threat-level-number">{level}</div>
              {isTarget && <div className="target-marker">🎯</div>}
              {isCurrent && <div className="current-pulse" />}
            </div>
          )
        })}
      </div>
      
      <div className="threat-meter-footer">
        <span className="threat-label">
          {THREAT_LEVELS[currentThreat] || 'Unknown'}
        </span>
        <span className="threat-progress">
          {currentThreat} / {targetThreat}
        </span>
      </div>

      {warningLevel === 'critical' && (
        <div className="threat-warning critical">
          ⚠️ CRITICAL - Campaign Ending Soon!
        </div>
      )}
      {warningLevel === 'moderate' && (
        <div className="threat-warning moderate">
          ⚠️ Approaching Target Threat
        </div>
      )}
    </div>
  )
}
