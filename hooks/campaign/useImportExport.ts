'use client'

import { useCallback } from 'react'
import type { Player, Event, Hex, CampaignAuditLog } from '@/types/campaign'
import type { CampaignExport } from '@/lib/utils/campaignExport'
import { generateExportData, exportCampaignJSON } from '@/lib/utils/campaignExport'

/**
 * WHY: Import/export hook for campaign save/load functionality (Issue #23)
 * Handles campaign export to JSON and import from saved files
 */

interface UseImportExportProps {
  importModalOpen: boolean
  players: Player[]
  hexes: Record<string, Hex>
  threatLevel: number
  targetThreatLevel: number
  currentRound: number
  currentPhase: string
  eventLog: Event[]
  auditLog: CampaignAuditLog
  setPlayers: (players: Player[]) => void
  setHexes: (hexes: Record<string, Hex>) => void
  setThreatLevel: (level: number) => void
  setTargetThreatLevel: (level: number) => void
  setCurrentRound: (round: number) => void
  setCurrentPhase: (phaseIndex: number) => void
  setEventLog: (events: Event[]) => void
  setSoloMode: (isSolo: boolean) => void
  addEvent: (message: string, type?: Event['type']) => void
}

interface ImportModalState {
  importModalOpen: boolean
}

/**
 * WHY: Phase names for converting phase string to index
 */
const PHASES = ['Movement', 'Battle', 'Action', 'Threat']

export function useImportExport(props: UseImportExportProps) {
  const {
    importModalOpen,
    players,
    hexes,
    threatLevel,
    targetThreatLevel,
    currentRound,
    currentPhase,
    eventLog,
    auditLog,
    setPlayers,
    setHexes,
    setThreatLevel,
    setTargetThreatLevel,
    setCurrentRound,
    setCurrentPhase,
    setEventLog,
    setSoloMode,
    addEvent,
  } = props

  /**
   * WHY: Export current campaign state to JSON file
   * Generates complete campaign snapshot for archival/sharing
   */
  const exportCampaign = useCallback(() => {
    // WHY: Generate victory data (empty for in-progress campaigns)
    const victoryCategories: Record<string, string> = {}
    const champion = ''

    const exportData = generateExportData(
      threatLevel,
      targetThreatLevel,
      currentRound,
      currentPhase,
      hexes,
      players,
      eventLog,
      victoryCategories,
      champion,
      auditLog
    )

    exportCampaignJSON(exportData)
    addEvent('Campaign exported successfully', 'system')
  }, [
    threatLevel,
    targetThreatLevel,
    currentRound,
    currentPhase,
    hexes,
    players,
    eventLog,
    auditLog,
    addEvent
  ])

  /**
   * WHY: Load campaign from imported data (Issue #23 - Phase 2)
   * Apply validated and migrated campaign export to current state
   */
  const loadCampaign = useCallback((data: CampaignExport) => {
    try {
      // WHY: Apply all state from imported campaign
      setPlayers(data.players)
      setHexes(data.campaign.hexMap)
      setThreatLevel(data.campaign.threatLevel)
      setTargetThreatLevel(data.campaign.targetThreatLevel)
      setCurrentRound(data.campaign.currentRound)
      setCurrentPhase(PHASES.indexOf(data.campaign.currentPhase))
      setEventLog(data.events)

      // WHY: Detect solo mode from player count
      setSoloMode(data.players.length === 1)

      addEvent('Campaign loaded successfully', 'system')
    } catch (error) {
      addEvent('Failed to load campaign', 'error')
    }
  }, [
    setPlayers,
    setHexes,
    setThreatLevel,
    setTargetThreatLevel,
    setCurrentRound,
    setCurrentPhase,
    setEventLog,
    setSoloMode,
    addEvent
  ])

  /**
   * WHY: Control import modal visibility
   */
  const setImportModalOpen = useCallback((open: boolean): ImportModalState => {
    return {
      importModalOpen: open
    }
  }, [])

  return {
    // State
    importModalOpen,

    // Actions
    exportCampaign,
    loadCampaign,
    setImportModalOpen,
  }
}
