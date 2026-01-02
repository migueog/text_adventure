'use client'

import { useState, useRef } from 'react'
import { validateImportData, migrateCampaignData, importCampaignData } from '@/lib/utils/campaignImport'
import type { CampaignExport } from '@/lib/utils/campaignExport'

/**
 * WHY: Campaign import UI component (Issue #23 - Phase 2)
 * Allows users to load saved campaigns with validation and preview
 */

interface CampaignImportProps {
  onImport: (data: CampaignExport) => void
  onCancel: () => void
}

export default function CampaignImport({ onImport, onCancel }: CampaignImportProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewData, setPreviewData] = useState<CampaignExport | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [validationWarnings, setValidationWarnings] = useState<string[]>([])
  const [migrationInfo, setMigrationInfo] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // WHY: Handle file selection and validation
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setSelectedFile(file)
    setPreviewData(null)
    setValidationErrors([])
    setValidationWarnings([])
    setMigrationInfo(null)
    setLoadError(null)
    setIsLoading(true)

    try {
      // WHY: Import and validate file
      const data = await importCampaignData(file)
      const validation = validateImportData(data)

      setValidationErrors(validation.errors)
      setValidationWarnings(validation.warnings)

      // WHY: Check if migration is needed
      if (validation.versionMismatch) {
        const { migration } = migrateCampaignData(data)
        if (migration.migrated) {
          setMigrationInfo(
            `Campaign will be migrated from ${migration.fromVersion} to ${migration.toVersion}`
          )
        }
      }

      setPreviewData(data)
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Failed to load campaign')
    } finally {
      setIsLoading(false)
    }
  }

  // WHY: Confirm and import campaign
  const handleConfirmImport = () => {
    if (!previewData) return

    // WHY: Apply migration if needed
    const { data } = migrateCampaignData(previewData)
    onImport(data)
  }

  // WHY: Reset file input
  const handleCancel = () => {
    setSelectedFile(null)
    setPreviewData(null)
    setValidationErrors([])
    setValidationWarnings([])
    setMigrationInfo(null)
    setLoadError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onCancel()
  }

  const canImport = previewData && validationErrors.length === 0

  return (
    <div className="campaign-import-modal">
      <div className="modal-header">
        <h2>Load Campaign</h2>
        <button type="button" onClick={handleCancel} className="close-btn">
          ✕
        </button>
      </div>

      <div className="modal-content">
        {/* File Selection */}
        <div className="file-input-section">
          <label htmlFor="campaign-file">
            Select Campaign File (.json):
          </label>
          <input
            ref={fileInputRef}
            id="campaign-file"
            type="file"
            accept=".json,application/json"
            onChange={handleFileSelect}
            disabled={isLoading}
          />
          {selectedFile && (
            <p className="file-info">
              Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
            </p>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="loading-indicator">
            <p>Loading campaign...</p>
          </div>
        )}

        {/* Load Error */}
        {loadError && (
          <div className="error-message">
            <h4>❌ Error Loading Campaign</h4>
            <p>{loadError}</p>
          </div>
        )}

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="validation-errors">
            <h4>❌ Validation Errors</h4>
            <ul>
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
            <p className="error-hint">
              This file cannot be imported. Please use a valid campaign export file.
            </p>
          </div>
        )}

        {/* Validation Warnings */}
        {validationWarnings.length > 0 && (
          <div className="validation-warnings">
            <h4>⚠️ Warnings</h4>
            <ul>
              {validationWarnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Migration Info */}
        {migrationInfo && (
          <div className="migration-info">
            <h4>🔄 Migration Required</h4>
            <p>{migrationInfo}</p>
            <p className="migration-note">
              Campaign data will be automatically updated to the current format.
            </p>
          </div>
        )}

        {/* Campaign Preview */}
        {previewData && (
          <div className="campaign-preview">
            <h4>Campaign Preview</h4>
            <div className="preview-details">
              <div className="preview-item">
                <strong>Round:</strong> {previewData.campaign.currentRound}
              </div>
              <div className="preview-item">
                <strong>Phase:</strong> {previewData.campaign.currentPhase}
              </div>
              <div className="preview-item">
                <strong>Threat Level:</strong> {previewData.campaign.threatLevel} /{' '}
                {previewData.campaign.targetThreatLevel}
              </div>
              <div className="preview-item">
                <strong>Players:</strong> {previewData.players.length}
              </div>
              <div className="preview-item">
                <strong>Hexes Explored:</strong> {
                  Object.values(previewData.campaign.hexMap).filter(h => h.explored).length
                } / {Object.keys(previewData.campaign.hexMap).length}
              </div>
              <div className="preview-item">
                <strong>Events Logged:</strong> {previewData.events.length}
              </div>
              <div className="preview-item">
                <strong>Exported:</strong> {new Date(previewData.exportedAt).toLocaleString()}
              </div>
            </div>

            {previewData.players.length > 0 && (
              <div className="players-preview">
                <h5>Players:</h5>
                <ul>
                  {previewData.players.map(player => (
                    <li key={player.id}>
                      {player.name} ({player.killTeamName}) - SP: {player.supplyPoints}, CP: {player.campaignPoints}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Warning about overwriting */}
        {canImport && (
          <div className="import-warning">
            <h4>⚠️ Warning</h4>
            <p>
              Loading this campaign will <strong>replace all current game data</strong>.
              Make sure you have exported your current campaign if you want to save it.
            </p>
          </div>
        )}
      </div>

      <div className="modal-footer">
        <button
          type="button"
          onClick={handleCancel}
          className="action-btn secondary"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirmImport}
          disabled={!canImport}
          className="action-btn primary"
        >
          {migrationInfo ? 'Migrate and Load Campaign' : 'Load Campaign'}
        </button>
      </div>
    </div>
  )
}
