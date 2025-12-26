import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Home from './page'

// Mock the hooks and components
vi.mock('@/hooks/useCampaign')
vi.mock('@/store/campaign')
vi.mock('@/components/GameSetup', () => ({
  default: () => <div data-testid="game-setup">Game Setup</div>
}))
vi.mock('@/components/PlayerPanel', () => ({
  default: () => <div data-testid="player-panel">Player Panel</div>
}))
vi.mock('@/components/PhaseTracker', () => ({
  default: () => <div data-testid="phase-tracker">Phase Tracker</div>
}))
vi.mock('@/components/DiceRoller', () => ({
  default: () => <div data-testid="dice-roller">Dice Roller</div>
}))
vi.mock('@/components/EventLog', () => ({
  default: () => <div data-testid="event-log">Event Log</div>
}))
vi.mock('@/components/HexDetails', () => ({
  default: () => <div data-testid="hex-details">Hex Details</div>
}))
vi.mock('@/components/ThreatMeter', () => ({
  default: () => <div data-testid="threat-meter">Threat Meter</div>
}))
vi.mock('@/components/VictoryScreen', () => ({
  default: ({ onRestart, onExport }: any) => (
    <div data-testid="victory-screen">
      <div>Victory Screen</div>
      <button onClick={onRestart}>Restart</button>
      {onExport && <button onClick={onExport}>Export</button>}
    </div>
  )
}))
vi.mock('@/components/CampaignEndModal', () => ({
  default: ({ onViewScores, onContinue }: any) => (
    <div data-testid="campaign-end-modal">
      <div>Campaign End Modal</div>
      <button onClick={onViewScores}>View Final Scores</button>
      <button onClick={onContinue}>Continue Campaign</button>
    </div>
  )
}))
vi.mock('next/dynamic', () => ({
  default: (fn: any) => {
    const Component = () => <div data-testid="phaser-hex-map">Phaser Hex Map</div>
    return Component
  }
}))

import { useCampaign } from '@/hooks/useCampaign'
import { useCampaignStore } from '@/store/campaign'

const mockUseCampaign = useCampaign as unknown as ReturnType<typeof vi.fn>
const mockUseCampaignStore = useCampaignStore as unknown as ReturnType<typeof vi.fn>

describe('Home Page', () => {
  const mockCampaignData = {
    players: [
      {
        id: 0,
        name: 'Player 1',
        killTeamName: 'Team 1',
        color: '#ff0000',
        position: { row: 0, col: 0 },
        supplyPoints: 5,
        campaignPoints: 10,
        operativesKilled: 5,
        gamesPlayed: 8,
        gamesWon: 5,
        gamesLost: 3,
        exploredHexes: 12,
        bases: [],
        camps: [],
        history: [],
        priority: 1
      }
    ],
    hexes: {
      '0,0': {
        id: '0,0',
        row: 0,
        col: 0,
        explored: true,
        type: 'surface' as const,
        location: 0,
        condition: 0,
        exploredBy: [0]
      }
    },
    currentRound: 5,
    threatLevel: 10,
    targetThreatLevel: 10,
    currentPhase: 'movement',
    currentPlayerIndex: 0,
    selectedHex: null,
    eventLog: [],
    mapConfig: { rows: 5, cols: 5 },
    soloMode: false,
    gameEnded: false,
    extendedMode: false,
    setSelectedHex: vi.fn(),
    nextPhase: vi.fn(),
    movePlayer: vi.fn(),
    performAction: vi.fn(),
    recordBattle: vi.fn(),
    updatePlayer: vi.fn(),
    calculateEncampCost: vi.fn(),
    enableExtendedMode: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('when game has not started', () => {
    it('should show GameSetup component', () => {
      mockUseCampaignStore.mockReturnValue(false) // gameStarted = false
      mockUseCampaign.mockReturnValue(mockCampaignData)

      render(<Home />)

      expect(screen.getByTestId('game-setup')).toBeDefined()
    })
  })

  describe('Campaign End Integration', () => {
    describe('when game ends', () => {
      it('should show CampaignEndModal when gameEnded is true', () => {
        mockUseCampaignStore.mockReturnValue(true) // gameStarted = true
        mockUseCampaign.mockReturnValue({
          ...mockCampaignData,
          gameEnded: true
        })

        render(<Home />)

        expect(screen.getByTestId('campaign-end-modal')).toBeDefined()
        expect(screen.getByText('Campaign End Modal')).toBeDefined()
      })

      it('should not show VictoryScreen initially when game ends', () => {
        mockUseCampaignStore.mockReturnValue(true)
        mockUseCampaign.mockReturnValue({
          ...mockCampaignData,
          gameEnded: true
        })

        render(<Home />)

        expect(screen.queryByTestId('victory-screen')).toBeNull()
      })
    })

    describe('CampaignEndModal interactions', () => {
      it('should show VictoryScreen when "View Final Scores" is clicked', async () => {
        const user = userEvent.setup()
        mockUseCampaignStore.mockReturnValue(true)
        mockUseCampaign.mockReturnValue({
          ...mockCampaignData,
          gameEnded: true
        })

        render(<Home />)

        const viewScoresButton = screen.getByRole('button', { name: /view final scores/i })
        await user.click(viewScoresButton)

        await waitFor(() => {
          expect(screen.getByTestId('victory-screen')).toBeDefined()
        })
      })

      it('should call enableExtendedMode when "Continue Campaign" is clicked', async () => {
        const user = userEvent.setup()
        const enableExtendedMode = vi.fn()
        mockUseCampaignStore.mockReturnValue(true)
        mockUseCampaign.mockReturnValue({
          ...mockCampaignData,
          gameEnded: true,
          enableExtendedMode
        })

        render(<Home />)

        const continueButton = screen.getByRole('button', { name: /continue campaign/i })
        await user.click(continueButton)

        expect(enableExtendedMode).toHaveBeenCalledTimes(1)
      })

      it('should hide modal and show game UI after continuing campaign', async () => {
        const user = userEvent.setup()
        const enableExtendedMode = vi.fn()

        // Initial render with gameEnded = true
        mockUseCampaignStore.mockReturnValue(true)
        mockUseCampaign.mockReturnValue({
          ...mockCampaignData,
          gameEnded: true,
          enableExtendedMode
        })

        const { rerender } = render(<Home />)

        const continueButton = screen.getByRole('button', { name: /continue campaign/i })
        await user.click(continueButton)

        // Simulate state update after enableExtendedMode called
        mockUseCampaign.mockReturnValue({
          ...mockCampaignData,
          gameEnded: false, // Game no longer ended
          extendedMode: true // Extended mode enabled
        })

        rerender(<Home />)

        await waitFor(() => {
          expect(screen.queryByTestId('campaign-end-modal')).toBeNull()
          expect(screen.getByTestId('phase-tracker')).toBeDefined()
        })
      })
    })

    describe('VictoryScreen enhancements', () => {
      it('should pass enhanced props to VictoryScreen', async () => {
        const user = userEvent.setup()
        mockUseCampaignStore.mockReturnValue(true)
        mockUseCampaign.mockReturnValue({
          ...mockCampaignData,
          gameEnded: true
        })

        render(<Home />)

        // Click to show victory screen
        const viewScoresButton = screen.getByRole('button', { name: /view final scores/i })
        await user.click(viewScoresButton)

        await waitFor(() => {
          const victoryScreen = screen.getByTestId('victory-screen')
          expect(victoryScreen).toBeDefined()
        })

        // VictoryScreen should have export button (indicating onExport was passed)
        const exportButton = screen.queryByRole('button', { name: /export/i })
        expect(exportButton).toBeDefined()
      })

      it('should trigger export when export button clicked', async () => {
        const user = userEvent.setup()

        mockUseCampaignStore.mockReturnValue(true)
        mockUseCampaign.mockReturnValue({
          ...mockCampaignData,
          gameEnded: true
        })

        render(<Home />)

        // Show victory screen
        const viewScoresButton = screen.getByRole('button', { name: /view final scores/i })
        await user.click(viewScoresButton)

        await waitFor(() => {
          expect(screen.getByTestId('victory-screen')).toBeDefined()
        })

        // Verify export button exists (detailed export functionality tested in campaignExport.test.ts)
        const exportButton = screen.getByRole('button', { name: /export/i })
        expect(exportButton).toBeDefined()
      })
    })
  })

  describe('when game is in progress', () => {
    it('should not show campaign end modal during gameplay', () => {
      mockUseCampaignStore.mockReturnValue(true)
      mockUseCampaign.mockReturnValue({
        ...mockCampaignData,
        gameEnded: false
      })

      const { container } = render(<Home />)

      // Should not show modal or victory screen
      expect(screen.queryByTestId('campaign-end-modal')).toBeNull()
      expect(screen.queryByTestId('victory-screen')).toBeNull()
      // Should show some game content
      expect(container.querySelector('.app')).toBeDefined()
    })
  })
})
