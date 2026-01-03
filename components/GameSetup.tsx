'use client'

import { useState } from 'react'
import { MAP_CONFIGS, PLAYER_COLORS } from '@/lib/data/campaignData'
import { useCampaignStore } from '@/store/campaign'

/**
 * WHY: No props needed - component manages campaign creation via Zustand
 */
export default function GameSetup() {
  const [campaignName, setCampaignName] = useState('')
  const [playerCount, setPlayerCount] = useState(4)
  const [targetThreat, setTargetThreat] = useState(7)
  const [soloMode, setSoloMode] = useState(false)
  const [playerNames, setPlayerNames] = useState(
    Array(6).fill('').map((_, i) => `Player ${i + 1}`)
  )
  const [killTeamNames, setKillTeamNames] = useState<string[]>(
    Array(6).fill('')
  )
  const [factions, setFactions] = useState<string[]>(
    Array(6).fill('')
  )
  const [backstories, setBackstories] = useState<string[]>(
    Array(6).fill('')
  )
  const [validationError, setValidationError] = useState('')

  // WHY: Solo mode options (Issue #53)
  const [jointOpsMode, setJointOpsMode] = useState(false)
  const [ignoreConditions, setIgnoreConditions] = useState(false)

  // WHY: Access Zustand store for campaign creation
  const createCampaign = useCampaignStore((state) => state.createCampaign)
  const startGame = useCampaignStore((state) => state.startGame)
  const isLoading = useCampaignStore((state) => state.isLoading)
  const error = useCampaignStore((state) => state.error)

  const config = MAP_CONFIGS[playerCount]
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
  const handleStart = async () => {
    if (!validateCampaignName()) return

    try {
      // WHY: Create campaign in database first (Issue #53 - includes solo settings)
      await createCampaign(campaignName, {
        playerCount,
        targetThreatLevel: targetThreat,
        soloMode,
        soloSettings: soloMode ? {
          jointOpsMode,
          ignoreConditions,
          resupplyReductionsUsed: 0
        } : undefined
      })

      // WHY: Then start the game with player setup including narrative fields (Issue #22)
      startGame(
        playerCount,
        soloMode,
        playerNames.slice(0, playerCount),
        killTeamNames.slice(0, playerCount),
        backstories.slice(0, playerCount),
        factions.slice(0, playerCount)
      )
    } catch (err) {
      console.error('Failed to start campaign:', err)
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
            <label>Number of Players:</label>
            <div className="button-group">
              {[2, 3, 4, 5, 6].map(num => (
                <button
                  key={num}
                  className={`setting-btn ${playerCount === num ? 'active' : ''}`}
                  onClick={() => setPlayerCount(num)}
                >
                  {num}
                </button>
              ))}
            </div>
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
          <h3>Player Setup</h3>
          <p className="section-hint">Configure your kill teams (all narrative fields are optional)</p>
          <div className="player-inputs">
            {Array(playerCount).fill(null).map((_, idx) => (
              <div key={idx} className="player-setup-group">
                <div className="player-header">
                  <div
                    className="player-color-preview"
                    style={{ backgroundColor: PLAYER_COLORS[idx] }}
                  />
                  <h4>Player {idx + 1}</h4>
                </div>

                <div className="player-fields">
                  <input
                    type="text"
                    value={playerNames[idx]}
                    onChange={(e) => {
                      const newNames = [...playerNames]
                      newNames[idx] = e.target.value
                      setPlayerNames(newNames)
                    }}
                    placeholder={`Player ${idx + 1} Name`}
                    className="player-name-input"
                  />

                  <input
                    type="text"
                    value={killTeamNames[idx]}
                    onChange={(e) => {
                      const newTeamNames = [...killTeamNames]
                      newTeamNames[idx] = e.target.value
                      setKillTeamNames(newTeamNames)
                    }}
                    placeholder={`Kill Team ${idx + 1} (optional)`}
                    className="kill-team-input"
                  />

                  <input
                    type="text"
                    value={factions[idx]}
                    onChange={(e) => {
                      const newFactions = [...factions]
                      newFactions[idx] = e.target.value
                      setFactions(newFactions)
                    }}
                    placeholder="Faction (optional)"
                    className="faction-input"
                    maxLength={50}
                  />

                  <textarea
                    value={backstories[idx]}
                    onChange={(e) => {
                      const newBackstories = [...backstories]
                      newBackstories[idx] = e.target.value
                      setBackstories(newBackstories)
                    }}
                    placeholder="Kill team backstory (optional, max 500 chars)"
                    className="backstory-input"
                    maxLength={500}
                    rows={3}
                  />
                  {backstories[idx] && (
                    <small className="char-count">{backstories[idx].length}/500 characters</small>
                  )}
                </div>
              </div>
            ))}
          </div>
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

        <button
          className="start-btn"
          onClick={handleStart}
          disabled={isLoading}
        >
          {isLoading ? 'Creating Campaign...' : 'Start Campaign'}
        </button>
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
    </div>
  )
}
