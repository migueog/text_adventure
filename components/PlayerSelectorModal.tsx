'use client'

import type { Player } from '@/types/campaign'

/**
 * WHY: Modal for selecting which player to act with in multi-player hexes
 * Appears when clicking hex with 2+ players
 */

interface PlayerSelectorModalProps {
  players: Player[]                     // WHY: Players in the clicked hex
  onSelect: (playerId: number) => void  // WHY: Player selection handler
  onCancel: () => void                   // WHY: Cancel handler
}

export default function PlayerSelectorModal({
  players,
  onSelect,
  onCancel,
}: PlayerSelectorModalProps) {
  /**
   * WHY: Prevent click propagation on modal content
   * Stops overlay click from closing when clicking inside modal
   */
  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  return (
    <div
      className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onCancel}
    >
      <div
        className="bg-gray-900 rounded-lg shadow-xl border border-gray-700 p-6 max-w-md w-full mx-4"
        onClick={handleContentClick}
      >
        {/* WHY: Modal header */}
        <h2 className="text-xl font-bold text-white mb-4">
          Select Player
        </h2>

        {/* WHY: Instruction text */}
        <p className="text-gray-400 text-sm mb-4">
          Multiple players are in this hex. Select which player to act with:
        </p>

        {/* WHY: Player list */}
        <div className="space-y-2 mb-4">
          {players.map((player) => (
            <button
              key={player.id}
              onClick={() => onSelect(player.id)}
              className="w-full px-4 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors text-left flex items-center gap-3"
            >
              {/* WHY: Color badge */}
              <div
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: player.color }}
              />

              {/* WHY: Player info */}
              <div className="flex-1">
                <div className="text-white font-medium">{player.name}</div>
                <div className="text-gray-400 text-sm">{player.killTeamName}</div>
              </div>

              {/* WHY: SP/CP display */}
              <div className="text-right text-sm">
                <div className="text-green-400">{player.supplyPoints} SP</div>
                <div className="text-blue-400">{player.campaignPoints} CP</div>
              </div>
            </button>
          ))}
        </div>

        {/* WHY: Cancel button */}
        <button
          onClick={onCancel}
          className="w-full px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
