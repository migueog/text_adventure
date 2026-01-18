import { useState, useEffect } from 'react'

/**
 * WHY: Hook to fetch user's role in a campaign (owner vs player)
 * Also fetches campaign metadata including status and players list
 * Used to show/hide admin controls and render appropriate UI
 */

interface CampaignMetadata {
  id: number
  name: string
  ownerId: number
  status: string
  settings: {
    playerCount: number
    targetThreatLevel: number
    soloMode?: boolean
  }
  createdAt: string
  updatedAt: string
}

interface Player {
  id: number
  userId: number
  playerName: string
  joinedAt: string
}

interface CampaignRole {
  isOwner: boolean
  isPlayer: boolean
  isLoading: boolean
  error: string | null
  campaign: CampaignMetadata | null
  players: Player[]
}

export function useCampaignRole(campaignId: number | null): CampaignRole {
  const [role, setRole] = useState<CampaignRole>({
    isOwner: false,
    isPlayer: false,
    isLoading: false,
    error: null,
    campaign: null,
    players: []
  })

  useEffect(() => {
    // WHY: Don't fetch if no campaign selected
    if (!campaignId) {
      setRole({
        isOwner: false,
        isPlayer: false,
        isLoading: false,
        error: null,
        campaign: null,
        players: []
      })
      return
    }

    setRole(prev => ({ ...prev, isLoading: true, error: null }))

    fetch(`/api/campaigns/${campaignId}/metadata`)
      .then(async res => {
        if (!res.ok) {
          const error = await res.json()
          throw new Error(error.error || 'Failed to fetch role information')
        }
        return res.json()
      })
      .then(data => {
        setRole({
          isOwner: data.role.isOwner,
          isPlayer: data.role.isPlayer,
          isLoading: false,
          error: null,
          campaign: data.campaign,
          players: data.players || []
        })
      })
      .catch(err => {
        setRole({
          isOwner: false,
          isPlayer: false,
          isLoading: false,
          error: err.message,
          campaign: null,
          players: []
        })
      })
  }, [campaignId])

  return role
}
