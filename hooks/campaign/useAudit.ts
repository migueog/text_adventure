'use client'

import { useState, useCallback } from 'react'
import type { CampaignAuditLog, HexSnapshot, AuditActionType, AuditEntry } from '@/types/campaign'
import {
  recordAudit,
  getHexHistory as getHexHistoryUtil,
  getPlayerActions as getPlayerActionsUtil
} from '@/lib/utils/auditTrail'

/**
 * WHY: Audit hook for tracking hex modifications (Issue #23 - Phase 3)
 * Manages audit log state and provides query functions
 */

interface AuditExport {
  campaignName: string
  exportDate: string
  auditLog: CampaignAuditLog
}

export function useAudit() {
  const [auditLog, setAuditLog] = useState<CampaignAuditLog>({
    entries: [],
    version: '1.0.0'
  })

  /**
   * WHY: Record audit entry for hex modification
   * Creates before/after snapshot and appends to log
   */
  const addAudit = useCallback((
    hexId: string,
    action: AuditActionType,
    before: HexSnapshot,
    after: HexSnapshot,
    playerId: number,
    playerName: string,
    round: number,
    phase: string,
    reason: string
  ) => {
    const entry = recordAudit(
      hexId,
      action,
      before,
      after,
      playerId,
      playerName,
      round,
      phase,
      reason
    )

    setAuditLog(prev => ({
      ...prev,
      entries: [...prev.entries, entry]
    }))
  }, [])

  /**
   * WHY: Get modification history for specific hex
   * Returns entries in chronological order
   */
  const getHexHistory = useCallback((hexId: string): AuditEntry[] => {
    return getHexHistoryUtil(auditLog, hexId)
  }, [auditLog])

  /**
   * WHY: Get all actions by specific player
   * Returns entries in chronological order
   */
  const getPlayerActions = useCallback((playerId: number): AuditEntry[] => {
    return getPlayerActionsUtil(auditLog, playerId)
  }, [auditLog])

  /**
   * WHY: Export audit log with metadata
   * Returns structured data for download or API use
   */
  const exportAuditLog = useCallback((campaignName: string): AuditExport => {
    return {
      campaignName,
      exportDate: new Date().toISOString(),
      auditLog
    }
  }, [auditLog])

  return {
    auditLog,
    addAudit,
    getHexHistory,
    getPlayerActions,
    exportAuditLog
  }
}
