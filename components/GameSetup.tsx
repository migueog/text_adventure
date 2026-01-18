'use client'

import { useState, useEffect } from 'react'
import { MAP_CONFIGS, PLAYER_COLORS } from '@/lib/data/campaignData'
import { useCampaignStore } from '@/store/campaign'
import { loadLegacyCampaignHistory } from '@/lib/utils/legacyCampaignStorage'
import type { LegacyCampaignHistory } from '@/types/legacyCampaign'
import type { HexPosition } from '@/types/campaign'
import LegacyCampaignPreview from './LegacyCampaignPreview'
import LegacyCampaignSetup from './LegacyCampaignSetup'
import { rollD36 } from '@/lib/utils/dice'

interface GameSetupProps {
  onCancel?: () => void
}

/**
 * WHY: Component manages campaign creation via Zustand
 * Optional onCancel callback to return to campaign dashboard
 */
export default function GameSetup({ onCancel }: GameSetupProps = {}) {
  const [campaignName, setCampaignName] = useState('')
  const [maxPlayers, setMaxPlayers] = useState(4)
  const [targetThreat, setTargetThreat] = useState(7)
  const [soloMode, setSoloMode] = useState(false)
  const [validationError, setValidationError] = useState('')

  // WHY: Solo mode options (Issue #53)
  const [jointOpsMode, setJointOpsMode] = useState(false)
  const [ignoreConditions, setIgnoreConditions] = useState(false)

  // WHY: Legacy campaign selection (Issue #57)
  const [useLegacyMap, setUseLegacyMap] = useState(false)
  const [selectedLegacyCampaign, setSelectedLegacyCampaign] = useState<string | null>(null)
  const [legacyHistory, setLegacyHistory] = useState<LegacyCampaignHistory | null>(null)
  const [showLegacySetup, setShowLegacySetup] = useState(false)

  // WHY: Access Zustand store for campaign creation
  const createCampaign = useCampaignStore((state) => state.createCampaign)
  const startGame = useCampaignStore((state) => state.startGame)
  const isLoading = useCampaignStore((state) => state.isLoading)
  const error = useCampaignStore((state) => state.error)

  // WHY: Load legacy campaign history when solo mode is enabled (Issue #57)
  useEffect(() => {
    if (soloMode) {
      const history = loadLegacyCampaignHistory()
      setLegacyHistory(history)

      // Auto-select most recent campaign if available
      if (history.snapshots.length > 0) {
        setSelectedLegacyCampaign(history.snapshots[0]!.campaignId)
      }
    } else {
      // Reset legacy campaign state when switching to competitive
      setUseLegacyMap(false)
      setSelectedLegacyCampaign(null)
      setLegacyHistory(null)
    }
  }, [soloMode])

  const config = MAP_CONFIGS[maxPlayers]
  if (!config) return null

  /**
   * Validate campaign name
   * WHY: Ensure campaign name meets requirements before creation
   */
  const validateCampaignName = (): boolean => {
    if (!campaignName.trim()) {
      setValidationError('Campaign name is required')
      return false
    }
    if (campaignName.length < 3) {
      setValidationError('Campaign name must be at least 3 characters')
      return false
    }
    if (campaignName.length > 100) {
      setValidationError('Campaign name cannot exceed 100 characters')
      return false
    }
    setValidationError('')
    return true
  }

  /**
   * Handle campaign creation and game start
   * WHY: Create campaign in database, then start game with initial state
   */
  /**
   * WHY: Handle legacy campaign confirmation (Issue #57)
   * Called when user selects new base hex in legacy campaign setup
   */
  const handleLegacyConfirm = async (newBaseHex: HexPosition) => {
    if (!selectedLegacyCampaign) return

    // WHY: Roll D36 for abandoned camp condition
    const abandonedCampCondition = rollD36()

    try {
      // WHY: Create campaign in database first
      await createCampaign(campaignName, {
        playerCount: 1,  // Legacy campaigns are always solo (1 player)
        targetThreatLevel: targetThreat,
        soloMode: true,
        soloSettings: {
          jointOpsMode,
          ignoreConditions,
          resupplyReductionsUsed: 0
        }
      })

      // WHY: Start game with legacy campaign settings
      // Player data will come from user profile
      startGame(
        1,  // Solo mode = 1 player
        true,
        [],  // Player names from profile
        [],  // Kill team names from profile
        [],  // Backstories from profile
        [],  // Factions from profile
        {
          useLegacyMap: true,
          legacyCampaignId: selectedLegacyCampaign,
          newBaseHex,
          abandonedCampHexId: '', // Not used directly
          abandonedCampCondition
        }
      )
    } catch (err) {
      console.error('Failed to start legacy campaign:', err)
    }
  }

  const handleCreate = async () => {
    if (!validateCampaignName()) return

    // WHY: If using legacy map, navigate to legacy campaign setup (Issue #57)
    if (soloMode && useLegacyMap && selectedLegacyCampaign) {
      setShowLegacySetup(true)
      return
    }

    try {
      // WHY: Create campaign in database
      await createCampaign(campaignName, {
        playerCount: soloMode ? 1 : maxPlayers,
        targetThreatLevel: targetThreat,
        soloMode,
        soloSettings: soloMode ? {
          jointOpsMode,
          ignoreConditions,
          resupplyReductionsUsed: 0
        } : undefined
      })

      if (soloMode) {
        // WHY: Solo mode - start game immediately with owner as only player
        // Player data will come from user profile
        startGame(1, true, [], [], [], [])
      } else {
        // WHY: Competitive mode - return to dashboard
        // Campaign is now 'setup' status and open for players to join
        if (onCancel) {
          onCancel()
        }
      }
    } catch (err) {
      console.error('Failed to create campaign:', err)
    }
  }

  return (
    <div className="game-setup">
      <div className="setup-header">
        <h1>Ctesiphus Expedition</h1>
        <h2>Kill Team Campaign Manager</h2>
      </div>

      <div className="setup-content">
        <div className="setup-section">
          <h3>Campaign Settings</h3>

          {/* WHY: Campaign name input - required for database storage */}
          <div className="setting-group">
            <label htmlFor="campaign-name">Campaign Name:</label>
            <input
              id="campaign-name"
              type="text"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="Enter campaign name (3-100 characters)"
              className={validationError ? 'input-error' : ''}
              maxLength={100}
              disabled={isLoading}
            />
            {validationError && (
              <p className="validation-error">{validationError}</p>
            )}
          </div>

          <div className="setting-group">
            <label htmlFor="maxPlayers">Maximum Players (2-20):</label>
            <select
              id="maxPlayers"
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
              disabled={soloMode}
              className="player-count-select"
            >
              {Array.from({ length: 19 }, (_, i) => i + 2).map(num => (
                <option key={num} value={num}>
                  {num} Players - {MAP_CONFIGS[num]?.name || `${num} Players`}
                </option>
              ))}
            </select>
            <p className="setting-hint">
              {soloMode ? 'Solo mode is always 1 player' : 'Players can join until campaign reaches this limit'}
            </p>
          </div>

          <div className="setting-group">
            <label>Target Threat Level (Campaign Length):</label>
            <div className="button-group">
              {[5, 6, 7, 8, 9, 10].map(num => (
                <button
                  key={num}
                  className={`setting-btn ${targetThreat === num ? 'active' : ''}`}
                  onClick={() => setTargetThreat(num)}
                >
                  {num}
                </button>
              ))}
            </div>
            <p className="setting-hint">
              Standard campaign: 7 rounds. Shorter: 5-6. Longer: 8-10.
            </p>
          </div>

          <div className="setting-group">
            <label>Game Mode:</label>
            <div className="button-group">
              <button
                className={`setting-btn ${!soloMode ? 'active' : ''}`}
                onClick={() => setSoloMode(false)}
              >
                Competitive
              </button>
              <button
                className={`setting-btn ${soloMode ? 'active' : ''}`}
                onClick={() => setSoloMode(true)}
              >
                Solo/Co-op
              </button>
            </div>
            {soloMode && (
              <p className="setting-hint">
                Solo/Co-op mode has different threat mechanics.
              </p>
            )}
          </div>

          {/* WHY: Legacy campaign selection (Issue #57) */}
          {soloMode && (
            <div className="setting-group">
              <label>Map Selection:</label>
              <div className="button-group">
                <button
                  className={`setting-btn ${!useLegacyMap ? 'active' : ''}`}
                  onClick={() => setUseLegacyMap(false)}
                >
                  Generate New Map
                </button>
                <button
                  className={`setting-btn ${useLegacyMap ? 'active' : ''}`}
                  onClick={() => setUseLegacyMap(true)}
                  disabled={!legacyHistory || legacyHistory.snapshots.length === 0}
                >
                  Continue Previous Expedition
                  {legacyHistory && legacyHistory.snapshots.length > 0 && (
                    <span className="badge">{legacyHistory.snapshots.length}</span>
                  )}
                </button>
              </div>
              {!useLegacyMap && (
                <p className="setting-hint">
                  Fresh start on unexplored Ctesiphus
                </p>
              )}
              {useLegacyMap && legacyHistory && legacyHistory.snapshots.length > 0 && (
                <div className="legacy-campaign-selector">
                  <label htmlFor="legacy-campaign-select">Select Campaign to Continue:</label>
                  <select
                    id="legacy-campaign-select"
                    value={selectedLegacyCampaign || ''}
                    onChange={(e) => setSelectedLegacyCampaign(e.target.value)}
                    className="legacy-campaign-dropdown"
                  >
                    {legacyHistory.snapshots.map(snapshot => (
                      <option key={snapshot.campaignId} value={snapshot.campaignId}>
                        {snapshot.campaignName} - {snapshot.killTeamName}
                        ({snapshot.finalCP} CP, {snapshot.exploredHexes.length} hexes explored)
                      </option>
                    ))}
                  </select>

                  {selectedLegacyCampaign && (
                    <LegacyCampaignPreview
                      campaignId={selectedLegacyCampaign}
                      history={legacyHistory}
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {/* WHY: Solo mode options (Issue #53) */}
          {soloMode && (
            <div className="solo-options-section">
              <h4>Solo Mode Options</h4>

              <div className="solo-option">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={jointOpsMode}
                    onChange={(e) => setJointOpsMode(e.target.checked)}
                  />
                  <span>Playing with Joint Ops missions</span>
                </label>
                <p className="option-hint">
                  Recommended: Use Joint Ops mission packs for solo play
                </p>
              </div>

              {jointOpsMode && (
                <div className="solo-option nested">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={ignoreConditions}
                      onChange={(e) => setIgnoreConditions(e.target.checked)}
                    />
                    <span>Ignore hex conditions for Joint Ops battles</span>
                  </label>
                  <p className="option-hint">
                    Complex Joint Ops missions may already include environmental rules
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="setup-section">
          <h3>Map Preview</h3>
          <div className="map-preview-info">
            <p><strong>{config.name}</strong></p>
            <p>Grid Size: {config.rows} x {config.cols} hexes</p>
            <p>Surface Rows: {config.surfaceRows}</p>
            <p>Tomb Rows: {config.tombRows}</p>
          </div>
        </div>

        {/* WHY: Display API errors from campaign creation */}
        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
          </div>
        )}

        <div className="button-row">
          {onCancel && (
            <button
              type="button"
              className="cancel-btn"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </button>
          )}
          <button
            className="start-btn"
            onClick={handleCreate}
            disabled={isLoading}
          >
            {isLoading ? 'Creating Campaign...' : 'Create Campaign'}
          </button>
        </div>
      </div>

      <div className="setup-footer">
        <h4>Quick Reference</h4>
        <div className="reference-grid">
          <div className="reference-item">
            <strong>Movement:</strong> 1-3 hexes, costs 1 SP per hex
          </div>
          <div className="reference-item">
            <strong>Victory:</strong> Battle win = +1 CP, Loss/Draw = +1 SP
          </div>
          <div className="reference-item">
            <strong>Resupply:</strong> Base = 10 SP, Camp = D3+3, Other = 1
          </div>
          <div className="reference-item">
            <strong>Encamp:</strong> Cost = distance to nearest base/camp
          </div>
        </div>
      </div>

      {/* WHY: Issue #57 - Legacy campaign setup modal */}
      {showLegacySetup && selectedLegacyCampaign && legacyHistory && (
        <LegacyCampaignSetup
          snapshot={legacyHistory.snapshots.find(s => s.campaignId === selectedLegacyCampaign)!}
          onConfirm={handleLegacyConfirm}
          onCancel={() => setShowLegacySetup(false)}
        />
      )}
    </div>
  )
}
