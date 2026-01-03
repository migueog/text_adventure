'use client'

/**
 * WHY: Quick reference component for phase guidance (Issue #33 - Phase 3)
 * Provides collapsible help section showing rules and available actions for current phase
 */

import { useState } from 'react'
import { PHASE_GUIDANCE } from '@/lib/utils/phaseGuidance'
import type { Phase } from '@/types/campaign'

interface PhaseQuickReferenceProps {
  phase: Phase
}

/**
 * WHY: Collapsible quick reference panel for phase-specific help
 * Shows available actions and key rules for the current campaign phase
 * Can be expanded/collapsed by user to reduce visual clutter
 */
export default function PhaseQuickReference({ phase }: PhaseQuickReferenceProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const guidance = PHASE_GUIDANCE[phase]

  return (
    <div className="phase-quick-reference">
      <button
        className="quick-ref-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <span className="toggle-icon">{isExpanded ? '▼' : '▶'}</span>
        <span className="toggle-text">Quick Reference: {guidance.title}</span>
        <span className="help-icon">❓</span>
      </button>

      {isExpanded && (
        <div className="quick-ref-content">
          <section className="ref-section">
            <h5>Available Actions</h5>
            <ul>
              {guidance.availableActions.map((action, idx) => (
                <li key={idx}>{action}</li>
              ))}
            </ul>
          </section>

          <section className="ref-section">
            <h5>Key Rules</h5>
            <ul>
              {guidance.keyRules.map((rule, idx) => (
                <li key={idx}>{rule}</li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  )
}
