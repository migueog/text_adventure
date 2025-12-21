'use client'

import { useState } from 'react'

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
    selectedHex: null,
    players: [],
    hexes: {},
    mapConfig: null,
    eventLog: [],
    setTargetThreatLevel: () => {},
    startGame: () => {},
    updatePlayer: () => {},
    setSelectedHex: () => {},
    nextPhase: () => {},
    movePlayer: () => {},
    performAction: () => {},
    recordBattle: () => {},
    calculateEncampCost: () => 0,
  }
}
