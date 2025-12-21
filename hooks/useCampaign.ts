'use client'

import { useState } from 'react'
import type { Player, Hex, MapConfig, Event } from '@/types/campaign'

export function useCampaign() {
  const [gameStarted] = useState(false)
  const [gameEnded] = useState(false)

  return {
    gameStarted,
    gameEnded,
    soloMode: false,
    currentRound: 1,
    currentPhase: 'Movement' as const,
    currentPlayerIndex: 0,
    threatLevel: 1,
    targetThreatLevel: 7,
    selectedHex: null as string | null,
    players: [] as Player[],
    hexes: {} as Record<string, Hex>,
    mapConfig: null as MapConfig | null,
    eventLog: [] as Event[],
    setTargetThreatLevel: (_level: number) => {},
    startGame: (_playerCount: number, _soloMode: boolean) => {},
    updatePlayer: (_index: number, _updates: Partial<Player>) => {},
    setSelectedHex: (_hexId: string | null) => {},
    nextPhase: () => {},
    movePlayer: (_fromHex: any, _toHex: any) => {},
    performAction: (_action: string, _options?: any) => {},
    recordBattle: (_result: any) => {},
    calculateEncampCost: (_hex: any) => 0,
  }
}
