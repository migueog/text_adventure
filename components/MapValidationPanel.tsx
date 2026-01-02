'use client'

import { useState } from 'react'
import type { MapValidationResult, MapValidationError } from '@/types/campaign'

/**
 * WHY: Display map validation errors and warnings (Issue #23 - Phase 1)
 * Shows integrity violations with suggested fixes
 */

interface MapValidationPanelProps {
  validationResult: MapValidationResult
  onClose?: () => void
}

export default function MapValidationPanel({
  validationResult,
  onClose
}: MapValidationPanelProps) {
  const [expandedErrors, setExpandedErrors] = useState<Set<string>>(new Set())

  // WHY: Toggle error details visibility
  const toggleError = (errorId: string) => {
    setExpandedErrors(prev => {
      const next = new Set(prev)
      if (next.has(errorId)) {
        next.delete(errorId)
      } else {
        next.add(errorId)
      }
      return next
    })
  }

  // WHY: Generate unique ID for each error
  const getErrorId = (error: MapValidationError, index: number): string => {
    return `${error.type}-${error.hexId}-${index}`
  }

  const { valid, errors, warnings, timestamp } = validationResult
  const hasIssues = errors.length > 0 || warnings.length > 0

  if (valid && !hasIssues) {
    return (
      <div className="map-validation-panel success">
        <div className="validation-header">
          <h3>✓ Map Validation</h3>
          {onClose && (
            <button type="button" onClick={onClose} className="close-btn">
              ✕
            </button>
          )}
        </div>
        <p className="success-message">
          No integrity issues found. Map state is valid.
        </p>
        <p className="timestamp">Validated at {new Date(timestamp).toLocaleTimeString()}</p>
      </div>
    )
  }

  return (
    <div className="map-validation-panel">
      <div className="validation-header">
        <h3>⚠️ Map Validation Report</h3>
        {onClose && (
          <button type="button" onClick={onClose} className="close-btn">
            ✕
          </button>
        )}
      </div>

      <div className="validation-summary">
        <p>
          Found {errors.length} error{errors.length !== 1 ? 's' : ''} and{' '}
          {warnings.length} warning{warnings.length !== 1 ? 's' : ''}
        </p>
        <p className="timestamp">Validated at {new Date(timestamp).toLocaleTimeString()}</p>
      </div>

      {errors.length > 0 && (
        <div className="validation-section errors">
          <h4>Errors ({errors.length})</h4>
          <p className="section-description">
            Critical issues that should be resolved
          </p>
          {errors.map((error, index) => (
            <ErrorItem
              key={getErrorId(error, index)}
              error={error}
              errorId={getErrorId(error, index)}
              isExpanded={expandedErrors.has(getErrorId(error, index))}
              onToggle={() => toggleError(getErrorId(error, index))}
            />
          ))}
        </div>
      )}

      {warnings.length > 0 && (
        <div className="validation-section warnings">
          <h4>Warnings ({warnings.length})</h4>
          <p className="section-description">
            Non-critical issues that may indicate problems
          </p>
          {warnings.map((warning, index) => (
            <ErrorItem
              key={getErrorId(warning, index)}
              error={warning}
              errorId={getErrorId(warning, index)}
              isExpanded={expandedErrors.has(getErrorId(warning, index))}
              onToggle={() => toggleError(getErrorId(warning, index))}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * WHY: Individual error/warning item with expandable details
 */
interface ErrorItemProps {
  error: MapValidationError
  errorId: string
  isExpanded: boolean
  onToggle: () => void
}

function ErrorItem({ error, isExpanded, onToggle }: ErrorItemProps) {
  const icon = error.severity === 'error' ? '🔴' : '⚠️'
  const typeLabel = formatErrorType(error.type)

  return (
    <div className={`validation-item ${error.severity}`}>
      <button
        type="button"
        className="validation-item-header"
        onClick={onToggle}
        aria-expanded={isExpanded}
      >
        <span className="icon">{icon}</span>
        <span className="type-label">{typeLabel}</span>
        <span className="hex-id">Hex {error.hexId}</span>
        <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
      </button>

      {isExpanded && (
        <div className="validation-item-details">
          <p className="message">{error.message}</p>

          {error.affectedPlayerIds && error.affectedPlayerIds.length > 0 && (
            <div className="affected-players">
              <strong>Affected Players:</strong> {error.affectedPlayerIds.join(', ')}
            </div>
          )}

          {error.suggestedFix && (
            <div className="suggested-fix">
              <strong>Suggested Fix:</strong>
              <p>{error.suggestedFix}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * WHY: Format error type enum to human-readable label
 */
function formatErrorType(type: string): string {
  return type
    .split('_')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ')
}
