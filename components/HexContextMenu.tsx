'use client'

import type { ActionOption } from '@/types/campaign'

/**
 * WHY: Contextual menu for hex-based actions
 * Shows available actions near selected hex with visual feedback
 */

interface HexContextMenuProps {
  position: { x: number; y: number }  // WHY: Canvas coordinates for menu placement
  actions: ActionOption[]              // WHY: Available actions from validation
  onAction: (type: string) => void     // WHY: Action execution handler
  onCancel: () => void                 // WHY: Cancel/close menu handler
}

export default function HexContextMenu({
  position,
  actions,
  onAction,
  onCancel,
}: HexContextMenuProps) {
  // WHY: Offset menu slightly from hex center for better visibility
  const menuStyle = {
    position: 'absolute' as const,
    left: `${position.x + 20}px`,
    top: `${position.y + 10}px`,
    zIndex: 1000,
  }

  return (
    <div
      style={menuStyle}
      className="bg-gray-900 bg-opacity-95 rounded-lg shadow-lg border border-gray-700 p-3 min-w-[200px]"
    >
      {/* WHY: Show message when no actions available */}
      {actions.length === 0 && (
        <div className="text-gray-400 text-sm text-center py-2">
          No actions available
        </div>
      )}

      {/* WHY: Render action buttons */}
      {actions.map((action) => (
        <div key={action.type} className="mb-2 last:mb-0">
          <button
            onClick={() => action.valid && onAction(action.type)}
            disabled={!action.valid}
            className={`
              w-full px-3 py-2 rounded text-sm font-medium transition-colors
              ${action.valid
                ? 'bg-green-600 hover:bg-green-700 text-white valid'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed invalid'
              }
            `}
          >
            {action.label}
          </button>

          {/* WHY: Show error reason for invalid actions */}
          {!action.valid && action.reason && (
            <div className="text-red-400 text-xs mt-1 px-1">
              {action.reason}
            </div>
          )}
        </div>
      ))}

      {/* WHY: Cancel button always visible */}
      <button
        onClick={onCancel}
        className="w-full mt-3 px-3 py-2 rounded text-sm font-medium bg-gray-700 hover:bg-gray-600 text-white transition-colors"
      >
        Cancel
      </button>
    </div>
  )
}
