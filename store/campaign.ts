import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { Player, Hex, Event, HexPosition } from '@/types/campaign'
import {
  MAP_CONFIGS,
  SURFACE_LOCATIONS,
  TOMB_LOCATIONS,
  SURFACE_CONDITIONS,
  TOMB_CONDITIONS,
  PLAYER_COLORS,
  PHASES,
  BattleResultInfo
} from '@/lib/data/campaignData'
import { rollD36 } from '@/lib/utils/dice'
import { hexId } from '@/lib/utils/hexUtils'

/**
 * Campaign store state interface
 * WHY: Combines game state with API/persistence state
 */
interface CampaignStore {
  // Game State
  campaignId: number | null
  campaignName: string
  gameStarted: boolean
  gameEnded: boolean
  soloMode: boolean
  playerCount: number
  players: Player[]
  hexes: Record<string, Hex>
  currentRound: number
  currentPhase: number
  currentPlayerIndex: number
  threatLevel: number
  targetThreatLevel: number
  eventLog: Event[]

  // API State
  isLoading: boolean
  isSaving: boolean
  lastSaved: Date | null
  error: string | null

  // Game Actions
  startGame: (numPlayers: number, isSolo: boolean, names: string[]) => void
  exploreHex: (hexKey: string) => void
  movePlayer: (playerIndex: number, targetHex: string, cost: number) => void
  performAction: (action: string, params?: any) => void
  recordBattle: (result: BattleResultInfo, playerIndex: number, opKilled: number) => void
  nextPhase: () => void
  updatePlayer: (playerIndex: number, updates: Partial<Player>) => void
  addEvent: (message: string, type?: Event['type']) => void

  // Persistence Actions
  createCampaign: (name: string, settings: any) => Promise<void>
  loadCampaign: (campaignId: number) => Promise<void>
  saveCampaign: () => Promise<void>
  reset: () => void
}

/**
 * Constants
 * WHY: Reusable values for game mechanics
 */
const SP_MIN = 0
const SP_MAX = 10
const clampSP = (value: number) => Math.max(SP_MIN, Math.min(SP_MAX, value))

/**
 * Helper: Create initial hex grid
 * WHY: Separated to keep store actions under 20 lines
 */
const createInitialHexGrid = (config: any): Record<string, Hex> => {
  const hexes: Record<string, Hex> = {}
  for (let row = 0; row < config.rows; row++) {
    for (let col = 0; col < config.cols; col++) {
      const id = hexId(row, col)
      const isSurface = row < config.surfaceRows
      hexes[id] = {
        id,
        row,
        col,
        type: isSurface ? 'surface' : 'tomb',
        explored: false,
        location: 0,
        condition: 0,
        exploredBy: []
      }
    }
  }
  return hexes
}

/**
 * Helper: Create player
 * WHY: Separated to keep store actions under 20 lines
 */
const createPlayer = (
  id: number,
  name: string,
  color: string,
  startHex: HexPosition
): Player => ({
  id,
  name,
  color,
  killTeamName: `Kill Team ${id + 1}`,
  position: startHex,
  supplyPoints: 10,
  campaignPoints: 0,
  exploredHexes: 0,
  operativesKilled: 0,
  gamesPlayed: 0,
  gamesWon: 0,
  gamesLost: 0,
  bases: [startHex],
  camps: [],
  history: []
})

/**
 * Campaign Zustand Store
 * WHY: Centralized state management with persistence
 */
export const useCampaignStore = create<CampaignStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial State
        campaignId: null,
        campaignName: '',
        gameStarted: false,
        gameEnded: false,
        soloMode: false,
        playerCount: 4,
        players: [],
        hexes: {},
        currentRound: 1,
        currentPhase: 0,
        currentPlayerIndex: 0,
        threatLevel: 1,
        targetThreatLevel: 7,
        eventLog: [],
        isLoading: false,
        isSaving: false,
        lastSaved: null,
        error: null,

        // Start Game
        startGame: (numPlayers, isSolo, names) => {
          const config = MAP_CONFIGS[numPlayers as keyof typeof MAP_CONFIGS]
          if (!config) {
            console.error('Invalid player count:', numPlayers)
            return
          }

          const hexes = createInitialHexGrid(config)

          // WHY: Create players with starting positions
          const players = Array.from({ length: numPlayers }, (_, i) => {
            const row = i < numPlayers / 2 ? 0 : config.rows - 1
            const col = Math.floor((i % (numPlayers / 2)) * (config.cols / (numPlayers / 2)))
            const playerName = names[i] || `Player ${i + 1}`
            const color = PLAYER_COLORS[i] || '#ffffff'
            return createPlayer(i, playerName, color, { row, col })
          })

          set({
            gameStarted: true,
            soloMode: isSolo,
            playerCount: numPlayers,
            players,
            hexes,
            currentRound: 1,
            currentPhase: 0,
            threatLevel: 1
          })

          get().addEvent('Campaign started!', 'system')
        },

        // Explore Hex
        exploreHex: (hexKey) => {
          const state = get()
          const hex = state.hexes[hexKey]
          if (!hex || hex.explored) return

          // WHY: Roll for location and condition
          const locationRoll = rollD36()
          const conditionRoll = rollD36()

          const locations = hex.type === 'surface' ? SURFACE_LOCATIONS : TOMB_LOCATIONS
          const conditions = hex.type === 'surface' ? SURFACE_CONDITIONS : TOMB_CONDITIONS

          const newHexes = {
            ...state.hexes,
            [hexKey]: {
              ...hex,
              explored: true,
              location: locationRoll,
              condition: conditionRoll,
              exploredBy: [state.currentPlayerIndex]
            }
          }

          set({ hexes: newHexes })

          // WHY: Get location and condition names safely
          const location = locations[locationRoll - 1]
          const condition = conditions[conditionRoll - 1]
          get().addEvent(
            `Hex ${hexKey} explored: ${location?.name || 'Unknown'} (${condition?.name || 'Unknown'})`,
            'exploration'
          )
        },

        // Move Player
        movePlayer: (playerIndex, targetHex, cost) => {
          const hex = get().hexes[targetHex]
          if (!hex) {
            console.error('Invalid hex:', targetHex)
            return
          }

          const players = get().players.map((p, i) => {
            if (i !== playerIndex) return p
            return {
              ...p,
              position: { row: hex.row, col: hex.col },
              supplyPoints: clampSP(p.supplyPoints - cost)
            }
          })

          set({ players })
          get().saveCampaign()
        },

        // Perform Action
        performAction: (action, params = {}) => {
          const state = get()
          const player = state.players[state.currentPlayerIndex]
          if (!player) {
            console.error('No current player')
            return
          }

          switch (action) {
            case 'scout':
              // WHY: Explore hex action
              if (params.targetHex) {
                get().exploreHex(params.targetHex)
              }
              break

            case 'resupply':
              // WHY: Gain supply points
              const spGain = params.amount || 1
              get().updatePlayer(state.currentPlayerIndex, {
                supplyPoints: clampSP(player.supplyPoints + spGain)
              })
              get().addEvent(`${player.name} resupplied +${spGain} SP`, 'action')
              break

            case 'encamp':
              // WHY: Place camp
              const hexKey = hexId(player.position.row, player.position.col)
              get().updatePlayer(state.currentPlayerIndex, {
                camps: [...player.camps, player.position]
              })
              get().addEvent(`${player.name} placed camp at ${hexKey}`, 'action')
              break
          }

          get().saveCampaign()
        },

        // Record Battle
        recordBattle: (result, playerIndex, opKilled) => {
          const player = get().players[playerIndex]
          if (!player) {
            console.error('Invalid player index:', playerIndex)
            return
          }

          const cpGain = result.cpGain
          const spGain = result.spGain

          // WHY: Determine if win or loss from result name
          const isWin = result.name === 'Victory'
          const isLoss = result.name === 'Defeat'

          get().updatePlayer(playerIndex, {
            campaignPoints: player.campaignPoints + cpGain,
            supplyPoints: clampSP(player.supplyPoints + spGain),
            gamesPlayed: player.gamesPlayed + 1,
            gamesWon: isWin ? player.gamesWon + 1 : player.gamesWon,
            gamesLost: isLoss ? player.gamesLost + 1 : player.gamesLost,
            operativesKilled: player.operativesKilled + opKilled
          })

          get().addEvent(
            `${player.name} ${result.name}: +${cpGain} CP, +${spGain} SP`,
            'battle'
          )
          get().saveCampaign()
        },

        // Next Phase
        nextPhase: () => {
          const state = get()
          const nextPhase = state.currentPhase + 1

          // WHY: Cycle through phases (0: Movement, 1: Battle, 2: Action, 3: Threat)
          if (nextPhase > 3) {
            // WHY: New round
            set({
              currentPhase: 0,
              currentRound: state.currentRound + 1,
              threatLevel: state.threatLevel + 1
            })
            get().addEvent(`Round ${state.currentRound + 1} begins`, 'system')
          } else {
            set({ currentPhase: nextPhase })
          }

          get().saveCampaign()
        },

        // Update Player
        updatePlayer: (playerIndex, updates) => {
          const players = get().players.map((p, i) =>
            i === playerIndex ? { ...p, ...updates } : p
          )
          set({ players })
        },

        // Add Event
        addEvent: (message, type = 'system') => {
          const currentPhase = get().currentPhase
          const event: Event = {
            round: get().currentRound,
            phase: PHASES[currentPhase] || 'Unknown',
            type,
            message,
            timestamp: new Date().toISOString(),
            icon: type === 'system' ? 'ℹ️' : type === 'movement' ? '➡️' :
                  type === 'exploration' ? '🔍' : type === 'reward' ? '🎁' :
                  type === 'action' ? '⚡' : type === 'battle' ? '⚔️' :
                  type === 'warning' ? '⚠️' : '❌'
          }
          set({ eventLog: [...get().eventLog, event] })
        },

        // Create Campaign
        createCampaign: async (name, settings) => {
          set({ isLoading: true, error: null })
          try {
            const response = await fetch('/api/campaigns', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name, settings })
            })

            if (!response.ok) throw new Error('Failed to create campaign')

            const { campaign } = await response.json()
            set({ campaignId: campaign.id, campaignName: name, isLoading: false })
          } catch (error: any) {
            set({ error: error.message, isLoading: false })
          }
        },

        // Load Campaign
        loadCampaign: async (campaignId) => {
          set({ isLoading: true, error: null })
          try {
            const response = await fetch(`/api/campaigns/${campaignId}/state`)
            if (!response.ok) throw new Error('Failed to load campaign')

            const { gameState } = await response.json()
            set({ ...gameState, campaignId, isLoading: false })
          } catch (error: any) {
            set({ error: error.message, isLoading: false })
          }
        },

        // Save Campaign
        saveCampaign: async () => {
          const state = get()
          if (!state.campaignId || state.isSaving) return

          set({ isSaving: true })
          try {
            const gameState = {
              gameStarted: state.gameStarted,
              gameEnded: state.gameEnded,
              soloMode: state.soloMode,
              players: state.players,
              hexes: state.hexes,
              currentRound: state.currentRound,
              currentPhase: state.currentPhase,
              currentPlayerIndex: state.currentPlayerIndex,
              threatLevel: state.threatLevel,
              targetThreatLevel: state.targetThreatLevel,
              eventLog: state.eventLog
            }

            await fetch(`/api/campaigns/${state.campaignId}/state`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ gameState })
            })

            set({ isSaving: false, lastSaved: new Date() })
          } catch (error: any) {
            set({ isSaving: false, error: error.message })
          }
        },

        // Reset
        reset: () => {
          set({
            campaignId: null,
            campaignName: '',
            gameStarted: false,
            gameEnded: false,
            players: [],
            hexes: {},
            currentRound: 1,
            currentPhase: 0,
            error: null
          })
        }
      }),
      {
        name: 'campaign-storage',
        partialize: (state) => ({
          // WHY: Only persist game state, not loading/error states
          campaignId: state.campaignId,
          gameStarted: state.gameStarted,
          players: state.players,
          hexes: state.hexes
        })
      }
    ),
    { name: 'CampaignStore' }
  )
)
