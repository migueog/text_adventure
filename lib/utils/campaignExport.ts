import type { Player, Event, Hex } from '@/types/campaign'

export interface CampaignExport {
  version: string
  exportedAt: string
  campaign: {
    threatLevel: number
    targetThreatLevel: number
    currentRound: number
    currentPhase: string
    hexMap: Record<string, Hex>
  }
  players: Player[]
  events: Event[]
  victoryData: {
    categories: Record<string, string>
    champion: string
  }
}

/**
 * Generate complete export data for campaign
 * Why: Centralizes all campaign state into a single exportable object
 */
export function generateExportData(
  threatLevel: number,
  targetThreatLevel: number,
  currentRound: number,
  currentPhase: string,
  hexMap: Record<string, Hex>,
  players: Player[],
  events: Event[],
  victoryCategories: Record<string, string>,
  champion: string
): CampaignExport {
  return {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    campaign: {
      threatLevel,
      targetThreatLevel,
      currentRound,
      currentPhase,
      hexMap
    },
    players,
    events,
    victoryData: {
      categories: victoryCategories,
      champion
    }
  }
}

/**
 * Export campaign data as downloadable JSON file
 * Why: Allows users to save complete campaign state for archival/sharing
 */
export function exportCampaignJSON(data: CampaignExport): void {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  // Generate filename: campaign_export_YYYYMMDD_HHMMSS.json
  // Extract YYYYMMDDHHMMSS from ISO timestamp
  const timestamp = data.exportedAt.replace(/[-:T.Z]/g, '').slice(0, 14)
  const datepart = timestamp.slice(0, 8)
  const timepart = timestamp.slice(8, 14)
  const filename = `campaign_export_${datepart}_${timepart}.json`

  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()

  URL.revokeObjectURL(url)
}
