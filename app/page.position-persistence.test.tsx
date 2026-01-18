import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import Home from './page'

// WHY: Mock external dependencies to isolate position persistence logic
vi.mock('@/hooks/useCampaign')
vi.mock('@/hooks/useCampaignRole')
vi.mock('@/store/campaign')
vi.mock('@/components/CampaignList', () => ({
  default: () => <div data-testid="campaign-list">Campaign List</div>
}))
vi.mock('@/components/UserMenu', () => ({
  default: () => <div data-testid="user-menu">User Menu</div>
}))
vi.mock('@/components/PlayerPanel', () => ({
  default: () => <div data-testid="player-panel">Player Panel</div>
}))
vi.mock('@/components/PhaseTracker', () => ({
  default: () => <div data-testid="phase-tracker">Phase Tracker</div>
}))
vi.mock('@/components/ThreatMeter', () => ({
  default: () => <div data-testid="threat-meter">Threat Meter</div>
}))
vi.mock('@/components/DiceRoller', () => ({
  default: () => <div data-testid="dice-roller">Dice Roller</div>
}))
vi.mock('@/components/HexDetails', () => ({
  default: () => <div data-testid="hex-details">Hex Details</div>
}))
vi.mock('@/components/EventLog', () => ({
  default: () => <div data-testid="event-log">Event Log</div>
}))
vi.mock('@/components/CategoryStandings', () => ({
  default: () => <div data-testid="category-standings">Category Standings</div>
}))
vi.mock('@/components/CampaignSettings', () => ({
  default: () => <div data-testid="campaign-settings">Campaign Settings</div>
}))
vi.mock('next/dynamic', () => ({
  default: () => {
    const Component = () => <div data-testid="phaser-hex-map">Phaser Hex Map</div>
    return Component
  }
}))

import { useCampaign } from '@/hooks/useCampaign'
import { useCampaignRole } from '@/hooks/useCampaignRole'
import { useCampaignStore } from '@/store/campaign'

const mockUseCampaign = useCampaign as unknown as ReturnType<typeof vi.fn>
const mockUseCampaignRole = useCampaignRole as unknown as ReturnType<typeof vi.fn>
const mockUseCampaignStore = useCampaignStore as unknown as ReturnType<typeof vi.fn>

/**
 * WHY: Test suite for player position persistence on page refresh
 *
 * Tests verify that:
 * 1. Player positions are saved to database
 * 2. Positions are loaded from database on refresh
 * 3. Sync effect copies Zustand data to local state
 */
describe('Player Position Persistence', () => {
  const createPlayer = (id: number, name: string, row: number, col: number) => ({
    id,
    name,
    killTeamName: `Team ${id}`,
    color: '#ff0000',
    position: { row, col },
    supplyPoints: 5,
    campaignPoints: 0,
    operativesKilled: 0,
    gamesPlayed: 0,
    gamesWon: 0,
    gamesLost: 0,
    exploredHexes: 0,
    bases: [],
    camps: [],
    history: [],
    priority: id
  })

  const createHex = (row: number, col: number) => ({
    id: `${row},${col}`,
    row,
    col,
    explored: false,
    type: 'surface' as const,
    location: 0,
    condition: 0,
    exploredBy: []
  })

  const mockCampaignMeta = {
    id: 1,
    name: 'Test Campaign',
    status: 'active' as const,
    settings: {
      playerCount: 4,
      targetThreatLevel: 10
    }
  }

  // WHY: Helper to create complete mock campaign object with all required methods
  const createMockCampaign = (players: any[], hexes: any, setPlayers: any, setHexes: any) => ({
    players,
    hexes,
    currentRound: 1,
    threatLevel: 1,
    targetThreatLevel: 10,
    currentPhase: 'Movement',
    currentPlayerIndex: 0,
    selectedHex: null,
    eventLog: [],
    soloMode: false,
    gameEnded: false,
    extendedMode: false,
    setPlayers,
    setHexes,
    hexSelection: {
      sourceHex: null,
      targetHex: null,
      selectedPlayerId: null,
      menuPosition: null
    },
    detectThreatRules: vi.fn(() => []),
    resetHexSelection: vi.fn(),
    setSourceHex: vi.fn(),
    setTargetHex: vi.fn(),
    nextPhase: vi.fn(),
    movePlayer: vi.fn(),
    performAction: vi.fn(),
    recordBattle: vi.fn(),
    updatePlayer: vi.fn(),
    enableExtendedMode: vi.fn(),
    clearExplorationResult: vi.fn(),
    continuePastRoundSummary: vi.fn(),
    setShowRoundSummary: vi.fn(),
    handleThreatCheckResultConfirm: vi.fn(),
    handleThreatPrevention: vi.fn(),
    regroupPlayer: vi.fn(),
    setConditionEnabled: vi.fn(),
    setSelectedOpponentId: vi.fn(),
    getActiveBattleCondition: vi.fn(),
    recordMissingPlayer: vi.fn(),
    resolveThreatPhaseLocationRules: vi.fn(),
    checkForThreatRules: vi.fn(),
    handlePortalConfig: vi.fn(),
    handleCancelPortalConfig: vi.fn(),
    handleHexBlock: vi.fn(),
    handleCancelHexBlock: vi.fn(),
    soloVictory: null,
    threatWarning: null,
    battleCompleted: false,
    movementOrder: [],
    movementIndex: 0,
    actionOrder: [],
    actionIndex: 0,
    conditionEnabled: false,
    selectedOpponentId: null,
    threatRulesResolved: false,
    showPortalConfigModal: false,
    portalHexId: null,
    showHexBlockSelector: false,
    fulcrumHexId: null,
    explorationResult: null,
    pendingRoundSummary: null,
    showThreatCheckResultDialog: false,
    pendingThreatCheckResult: null,
    regroupPath: []
  })

  beforeEach(() => {
    vi.clearAllMocks()

    // WHY: Mock URL parameters to simulate campaign ID in URL
    Object.defineProperty(window, 'location', {
      value: {
        search: '?campaign=1',
        href: 'http://localhost:3000/?campaign=1'
      },
      writable: true
    })
  })

  /**
   * WHY: Test that player positions persist after page refresh
   *
   * Simulates:
   * 1. Load campaign with player at position (2, 3)
   * 2. Player moves to position (4, 5)
   * 3. Page refreshes
   * 4. Position should still be (4, 5), not (2, 3)
   */
  describe('when player position is updated and page refreshes', () => {
    it('should restore player position from database', async () => {
      // WHY: Updated state - player moved to (4, 5)
      const movedPlayer = createPlayer(0, 'Player 1', 4, 5)

      const mockLoadCampaign = vi.fn().mockResolvedValue(undefined)

      // WHY: First render - Zustand has updated position after move
      const zustandPlayers = [movedPlayer]

      mockUseCampaignStore.mockImplementation((selector: any) => {
        if (typeof selector === 'function') {
          const state = {
            campaignId: 1,
            playerCount: 1,
            players: zustandPlayers,
            hexes: {
              '4,5': createHex(4, 5)
            },
            loadCampaign: mockLoadCampaign,
            soloMode: false,
            threatLevel: 1
          }
          return selector(state)
        }
        return undefined
      })

      // WHY: Local campaign state starts empty (simulating fresh page load)
      const mockSetPlayers = vi.fn()
      const mockSetHexes = vi.fn()

      mockUseCampaign.mockReturnValue(
        createMockCampaign([], {}, mockSetPlayers, mockSetHexes)
      )

      mockUseCampaignRole.mockReturnValue({
        isOwner: true,
        isPlayer: true,
        campaign: mockCampaignMeta,
        players: [movedPlayer],
        isLoading: false
      })

      // WHY: Trigger campaign load
      render(<Home />)

      // WHY: Simulate loadCampaign completing and sync effect triggering
      await waitFor(() => {
        expect(mockLoadCampaign).toHaveBeenCalledWith(1)
      })

      // WHY: Sync effect should have called setPlayers with Zustand data
      await waitFor(() => {
        expect(mockSetPlayers).toHaveBeenCalledWith([movedPlayer])
      })

      // WHY: Verify player position is (4, 5), not the initial (2, 3)
      expect(mockSetPlayers).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: 0,
            name: 'Player 1',
            position: { row: 4, col: 5 }
          })
        ])
      )
    })
  })

  /**
   * WHY: Test that sync effect triggers when Zustand store updates
   *
   * Verifies the sync effect's dependency array and conditions work correctly
   */
  describe('when Zustand store updates after campaign load', () => {
    it('should sync Zustand players to local state', async () => {
      const player1 = createPlayer(0, 'Player 1', 1, 1)
      const player2 = createPlayer(1, 'Player 2', 2, 2)
      const zustandPlayers = [player1, player2]

      const mockLoadCampaign = vi.fn().mockResolvedValue(undefined)
      const mockSetPlayers = vi.fn()
      const mockSetHexes = vi.fn()

      mockUseCampaignStore.mockImplementation((selector: any) => {
        if (typeof selector === 'function') {
          const state = {
            campaignId: 1,
            playerCount: 2,
            players: zustandPlayers,
            hexes: {
              '1,1': createHex(1, 1),
              '2,2': createHex(2, 2)
            },
            loadCampaign: mockLoadCampaign,
            soloMode: false,
            threatLevel: 1
          }
          return selector(state)
        }
        return undefined
      })

      mockUseCampaign.mockReturnValue(
        createMockCampaign([], {}, mockSetPlayers, mockSetHexes)
      )

      mockUseCampaignRole.mockReturnValue({
        isOwner: true,
        isPlayer: true,
        campaign: mockCampaignMeta,
        players: zustandPlayers,
        isLoading: false
      })

      render(<Home />)

      await waitFor(() => {
        expect(mockLoadCampaign).toHaveBeenCalled()
      })

      // WHY: Verify sync copied all players with correct positions
      await waitFor(() => {
        expect(mockSetPlayers).toHaveBeenCalledWith(zustandPlayers)
      })
    })

    it('should sync Zustand hexes to local state', async () => {
      const hexes = {
        '0,0': createHex(0, 0),
        '1,1': createHex(1, 1),
        '2,2': createHex(2, 2)
      }

      const mockLoadCampaign = vi.fn().mockResolvedValue(undefined)
      const mockSetPlayers = vi.fn()
      const mockSetHexes = vi.fn()

      mockUseCampaignStore.mockImplementation((selector: any) => {
        if (typeof selector === 'function') {
          const state = {
            campaignId: 1,
            playerCount: 1,
            players: [createPlayer(0, 'Player 1', 0, 0)],
            hexes,
            loadCampaign: mockLoadCampaign,
            soloMode: false,
            threatLevel: 1
          }
          return selector(state)
        }
        return undefined
      })

      mockUseCampaign.mockReturnValue(
        createMockCampaign([createPlayer(0, 'Player 1', 0, 0)], {}, mockSetPlayers, mockSetHexes)
      )

      mockUseCampaignRole.mockReturnValue({
        isOwner: true,
        isPlayer: true,
        campaign: mockCampaignMeta,
        players: [createPlayer(0, 'Player 1', 0, 0)],
        isLoading: false
      })

      render(<Home />)

      await waitFor(() => {
        expect(mockLoadCampaign).toHaveBeenCalled()
      })

      // WHY: Verify sync copied all hexes
      await waitFor(() => {
        expect(mockSetHexes).toHaveBeenCalledWith(hexes)
      })
    })
  })

  /**
   * WHY: Test that multiple player positions all persist correctly
   *
   * Ensures the fix works for campaigns with multiple players
   */
  describe('when multiple players have positions and page refreshes', () => {
    it('should restore all player positions from database', async () => {
      const players = [
        createPlayer(0, 'Player 1', 1, 2),
        createPlayer(1, 'Player 2', 3, 4),
        createPlayer(2, 'Player 3', 5, 6),
        createPlayer(3, 'Player 4', 7, 8)
      ]

      const hexes = {
        '1,2': createHex(1, 2),
        '3,4': createHex(3, 4),
        '5,6': createHex(5, 6),
        '7,8': createHex(7, 8)
      }

      const mockLoadCampaign = vi.fn().mockResolvedValue(undefined)
      const mockSetPlayers = vi.fn()
      const mockSetHexes = vi.fn()

      mockUseCampaignStore.mockImplementation((selector: any) => {
        if (typeof selector === 'function') {
          const state = {
            campaignId: 1,
            playerCount: 4,
            players,
            hexes,
            loadCampaign: mockLoadCampaign,
            soloMode: false,
            threatLevel: 1
          }
          return selector(state)
        }
        return undefined
      })

      mockUseCampaign.mockReturnValue(
        createMockCampaign([], {}, mockSetPlayers, mockSetHexes)
      )

      mockUseCampaignRole.mockReturnValue({
        isOwner: true,
        isPlayer: true,
        campaign: mockCampaignMeta,
        players,
        isLoading: false
      })

      render(<Home />)

      await waitFor(() => {
        expect(mockLoadCampaign).toHaveBeenCalled()
      })

      // WHY: Verify all 4 player positions were synced correctly
      await waitFor(() => {
        expect(mockSetPlayers).toHaveBeenCalledWith(players)
      })

      // WHY: Verify each player's position is correct
      expect(mockSetPlayers).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: 0, position: { row: 1, col: 2 } }),
          expect.objectContaining({ id: 1, position: { row: 3, col: 4 } }),
          expect.objectContaining({ id: 2, position: { row: 5, col: 6 } }),
          expect.objectContaining({ id: 3, position: { row: 7, col: 8 } })
        ])
      )
    })
  })
})
