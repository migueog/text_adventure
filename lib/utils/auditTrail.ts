import type { Hex, HexSnapshot, AuditEntry, AuditActionType, CampaignAuditLog } from '@/types/campaign'

/**
 * WHY: Audit trail utilities for tracking hex modifications (Issue #23 - Phase 3)
 * Provides snapshot creation, audit logging, and history querying
 */

/**
 * WHY: Create immutable snapshot of hex state
 * Deep copies arrays and objects to prevent reference leaks
 */
export function createHexSnapshot(hex: Hex): HexSnapshot {
  return {
    explored: hex.explored,
    location: hex.location,
    condition: hex.condition,
    exploredBy: [...hex.exploredBy],
    state: hex.state ? { ...hex.state } : undefined,
    exploredLocation: hex.exploredLocation,
    exploredCondition: hex.exploredCondition
  }
}

/**
 * WHY: Create audit entry with unique ID and timestamps
 * Records before/after snapshots for hex modifications
 */
export function recordAudit(
  hexId: string,
  action: AuditActionType,
  before: HexSnapshot,
  after: HexSnapshot,
  playerId: number,
  playerName: string,
  round: number,
  phase: string,
  reason: string
): AuditEntry {
  return {
    id: generateUniqueId(),
    timestamp: new Date().toISOString(),
    round,
    phase,
    playerId,
    playerName,
    action,
    hexId,
    before: { ...before, exploredBy: [...before.exploredBy], state: before.state ? { ...before.state } : undefined },
    after: { ...after, exploredBy: [...after.exploredBy], state: after.state ? { ...after.state } : undefined },
    reason
  }
}

/**
 * WHY: Filter audit log by hex ID
 * Returns entries in chronological order (by round, then timestamp)
 */
export function getHexHistory(auditLog: CampaignAuditLog, hexId: string): AuditEntry[] {
  return auditLog.entries
    .filter(entry => entry.hexId === hexId)
    .sort((a, b) => {
      if (a.round !== b.round) return a.round - b.round
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    })
}

/**
 * WHY: Filter audit log by player ID
 * Returns entries in chronological order (by round, then timestamp)
 */
export function getPlayerActions(auditLog: CampaignAuditLog, playerId: number): AuditEntry[] {
  return auditLog.entries
    .filter(entry => entry.playerId === playerId)
    .sort((a, b) => {
      if (a.round !== b.round) return a.round - b.round
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    })
}

/**
 * WHY: Filter audit log by round range (inclusive)
 * Returns entries within specified round range
 */
export function getAuditByRound(
  auditLog: CampaignAuditLog,
  startRound: number,
  endRound: number
): AuditEntry[] {
  return auditLog.entries.filter(
    entry => entry.round >= startRound && entry.round <= endRound
  )
}

/**
 * WHY: Compare two hex snapshots and identify changes
 * Returns array of changed fields with before/after values
 */
export function diffHexSnapshots(
  before: HexSnapshot,
  after: HexSnapshot
): Array<{ field: string; before: any; after: any }> {
  const changes: Array<{ field: string; before: any; after: any }> = []

  // WHY: Check primitive fields
  if (before.explored !== after.explored) {
    changes.push({ field: 'explored', before: before.explored, after: after.explored })
  }
  if (before.location !== after.location) {
    changes.push({ field: 'location', before: before.location, after: after.location })
  }
  if (before.condition !== after.condition) {
    changes.push({ field: 'condition', before: before.condition, after: after.condition })
  }

  // WHY: Check optional string fields
  if (before.exploredLocation !== after.exploredLocation) {
    changes.push({ field: 'exploredLocation', before: before.exploredLocation, after: after.exploredLocation })
  }
  if (before.exploredCondition !== after.exploredCondition) {
    changes.push({ field: 'exploredCondition', before: before.exploredCondition, after: after.exploredCondition })
  }

  // WHY: Check array changes (stringify for comparison)
  const beforeExploredBy = JSON.stringify(before.exploredBy)
  const afterExploredBy = JSON.stringify(after.exploredBy)
  if (beforeExploredBy !== afterExploredBy) {
    changes.push({ field: 'exploredBy', before: before.exploredBy, after: after.exploredBy })
  }

  // WHY: Check state object changes (stringify for comparison)
  const beforeState = JSON.stringify(before.state)
  const afterState = JSON.stringify(after.state)
  if (beforeState !== afterState) {
    changes.push({ field: 'state', before: before.state, after: after.state })
  }

  return changes
}

/**
 * WHY: Export audit log to downloadable JSON file
 * Allows archiving or sharing audit history
 */
export function exportAuditLog(auditLog: CampaignAuditLog, campaignName: string): void {
  const json = JSON.stringify(auditLog, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14)
  const datepart = timestamp.slice(0, 8)
  const timepart = timestamp.slice(8, 14)
  const filename = `${campaignName}_audit_${datepart}_${timepart}.json`

  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()

  URL.revokeObjectURL(url)
}

/**
 * WHY: Generate unique identifier for audit entries
 * Uses timestamp + random string for uniqueness
 */
function generateUniqueId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 9)
  return `audit_${timestamp}_${random}`
}
