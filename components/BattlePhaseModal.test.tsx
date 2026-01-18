import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BattlePhaseModal from './BattlePhaseModal'
import type { Player } from '@/types/campaign'
import type { ActiveBattleCondition, KillzoneRecommendation } from '@/types/battleCondition'
import type { ExtendedBattleRecord } from '@/types/battle'

// WHY: Mock child components to isolate BattlePhaseModal tests
vi.mock('./BattleForm', () => ({
  default: ({ onRecordBattle }: { onRecordBattle: (record: any) => void }) => (
    <div data-testid="battle-form">
      <button onClick={() => onRecordBattle({
        player1Id: 1,
        player2Id: 2,
        locationId: 15,
        conditionId: 20,
        winnerId: 1
      })}>
        Record Battle
      </button>
    </div>
  )
}))

vi.mock('./BattleConditionDisplay', () => ({
  default: ({ activeCondition }: { activeCondition: ActiveBattleCondition | null }) => (
    <div data-testid="battle-condition-display">
      {activeCondition ? `Condition: ${activeCondition.condition.name}` : 'No condition'}
    </div>
  )
}))

vi.mock('./MissingPlayerModal', () => ({
  default: ({ isOpen, onConfirm }: { isOpen: boolean; onConfirm: (id: number) => void }) => (
    isOpen ? (
      <div data-testid="missing-player-modal">
        <button onClick={() => onConfirm(2)}>Confirm Missing</button>
      </div>
    ) : null
  )
}))

describe('BattlePhaseModal', () => {
  // WHY: Define test data fixtures
  const mockPlayers: Player[] = [
    {
      id: 1,
      name: 'Alice',
      killTeamName: 'Red Squadron',
      color: '#FF0000',
      supplyPoints: 5,
      campaignPoints: 10,
      position: { row: 0, col: 0 },
      bases: [{ row: 0, col: 0 }],
      camps: [],
      exploredHexes: 3,
      gamesPlayed: 2,
      gamesWon: 1,
      gamesLost: 1,
      operativesKilled: 5,
      history: [],
      battleResult: null,
      searchedHexes: [],
      battleHistory: []
    },
    {
      id: 2,
      name: 'Bob',
      killTeamName: 'Blue Team',
      color: '#0000FF',
      supplyPoints: 6,
      campaignPoints: 8,
      position: { row: 1, col: 1 },
      bases: [{ row: 1, col: 1 }],
      camps: [],
      exploredHexes: 2,
      gamesPlayed: 2,
      gamesWon: 1,
      gamesLost: 1,
      operativesKilled: 3,
      history: [],
      battleResult: null,
      searchedHexes: [],
      battleHistory: []
    }
  ]

  const mockBattleCondition: ActiveBattleCondition = {
    condition: { id: 20, name: 'Test Condition', threatModifier: 1 },
    active: true
  }

  const mockGetActiveBattleCondition = vi.fn(() => ({
    condition: mockBattleCondition,
    killzone: null as KillzoneRecommendation | null
  }))

  const mockOnBattle = vi.fn()
  const mockOnClose = vi.fn()
  const mockOnRecordMissingPlayer = vi.fn()
  const mockOnConditionEnabledChange = vi.fn()
  const mockOnOpponentSelect = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('when modal is open', () => {
    it('should render modal with battle form', () => {
      render(
        <BattlePhaseModal
          isOpen={true}
          currentPlayer={mockPlayers[0]!}
          players={mockPlayers}
          currentRound={1}
          battleCompleted={false}
          soloMode={false}
          conditionEnabled={true}
          selectedOpponentId={null}
          onConditionEnabledChange={mockOnConditionEnabledChange}
          onOpponentSelect={mockOnOpponentSelect}
          getActiveBattleCondition={mockGetActiveBattleCondition}
          onBattle={mockOnBattle}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByTestId('battle-form')).toBeInTheDocument()
    })

    it('should render modal heading', () => {
      render(
        <BattlePhaseModal
          isOpen={true}
          currentPlayer={mockPlayers[0]!}
          players={mockPlayers}
          currentRound={1}
          battleCompleted={false}
          soloMode={false}
          conditionEnabled={true}
          selectedOpponentId={null}
          onConditionEnabledChange={mockOnConditionEnabledChange}
          onOpponentSelect={mockOnOpponentSelect}
          getActiveBattleCondition={mockGetActiveBattleCondition}
          onBattle={mockOnBattle}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText(/Battle Phase/i)).toBeInTheDocument()
    })

    it('should render battle condition display', () => {
      render(
        <BattlePhaseModal
          isOpen={true}
          currentPlayer={mockPlayers[0]!}
          players={mockPlayers}
          currentRound={1}
          battleCompleted={false}
          soloMode={false}
          conditionEnabled={true}
          selectedOpponentId={2}
          onConditionEnabledChange={mockOnConditionEnabledChange}
          onOpponentSelect={mockOnOpponentSelect}
          getActiveBattleCondition={mockGetActiveBattleCondition}
          onBattle={mockOnBattle}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByTestId('battle-condition-display')).toBeInTheDocument()
      expect(screen.getByText(/Condition: Test Condition/i)).toBeInTheDocument()
    })

    it('should show warning when battle not completed', () => {
      render(
        <BattlePhaseModal
          isOpen={true}
          currentPlayer={mockPlayers[0]!}
          players={mockPlayers}
          currentRound={1}
          battleCompleted={false}
          soloMode={false}
          conditionEnabled={true}
          selectedOpponentId={null}
          onConditionEnabledChange={mockOnConditionEnabledChange}
          onOpponentSelect={mockOnOpponentSelect}
          getActiveBattleCondition={mockGetActiveBattleCondition}
          onBattle={mockOnBattle}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText(/Required:/i)).toBeInTheDocument()
      expect(screen.getByText(/must record a battle/i)).toBeInTheDocument()
    })

    it('should show success when battle completed', () => {
      render(
        <BattlePhaseModal
          isOpen={true}
          currentPlayer={mockPlayers[0]!}
          players={mockPlayers}
          currentRound={1}
          battleCompleted={true}
          soloMode={false}
          conditionEnabled={true}
          selectedOpponentId={null}
          onConditionEnabledChange={mockOnConditionEnabledChange}
          onOpponentSelect={mockOnOpponentSelect}
          getActiveBattleCondition={mockGetActiveBattleCondition}
          onBattle={mockOnBattle}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText(/Battle result recorded/i)).toBeInTheDocument()
      expect(screen.getByText(/may advance to the next phase/i)).toBeInTheDocument()
    })

    it('should render solo mode heading', () => {
      render(
        <BattlePhaseModal
          isOpen={true}
          currentPlayer={mockPlayers[0]!}
          players={mockPlayers}
          currentRound={1}
          battleCompleted={false}
          soloMode={true}
          conditionEnabled={true}
          selectedOpponentId={null}
          onConditionEnabledChange={mockOnConditionEnabledChange}
          onOpponentSelect={mockOnOpponentSelect}
          getActiveBattleCondition={mockGetActiveBattleCondition}
          onBattle={mockOnBattle}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText(/Solo Campaign/i)).toBeInTheDocument()
    })
  })

  describe('when modal is closed', () => {
    it('should not render modal', () => {
      render(
        <BattlePhaseModal
          isOpen={false}
          currentPlayer={mockPlayers[0]!}
          players={mockPlayers}
          currentRound={1}
          battleCompleted={false}
          soloMode={false}
          conditionEnabled={true}
          selectedOpponentId={null}
          onConditionEnabledChange={mockOnConditionEnabledChange}
          onOpponentSelect={mockOnOpponentSelect}
          getActiveBattleCondition={mockGetActiveBattleCondition}
          onBattle={mockOnBattle}
          onClose={mockOnClose}
        />
      )

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  describe('when recording battle', () => {
    it('should call onBattle with battle record', async () => {
      const user = userEvent.setup()
      render(
        <BattlePhaseModal
          isOpen={true}
          currentPlayer={mockPlayers[0]!}
          players={mockPlayers}
          currentRound={1}
          battleCompleted={false}
          soloMode={false}
          conditionEnabled={true}
          selectedOpponentId={null}
          onConditionEnabledChange={mockOnConditionEnabledChange}
          onOpponentSelect={mockOnOpponentSelect}
          getActiveBattleCondition={mockGetActiveBattleCondition}
          onBattle={mockOnBattle}
          onClose={mockOnClose}
        />
      )

      const recordButton = screen.getByText('Record Battle')
      await user.click(recordButton)

      expect(mockOnBattle).toHaveBeenCalledWith({
        player1Id: 1,
        player2Id: 2,
        locationId: 15,
        conditionId: 20,
        winnerId: 1
      })
    })
  })

  describe('when handling missing players', () => {
    it('should render missing player button when handler provided', () => {
      render(
        <BattlePhaseModal
          isOpen={true}
          currentPlayer={mockPlayers[0]!}
          players={mockPlayers}
          currentRound={1}
          battleCompleted={false}
          soloMode={false}
          conditionEnabled={true}
          selectedOpponentId={null}
          onConditionEnabledChange={mockOnConditionEnabledChange}
          onOpponentSelect={mockOnOpponentSelect}
          getActiveBattleCondition={mockGetActiveBattleCondition}
          onBattle={mockOnBattle}
          onClose={mockOnClose}
          onRecordMissingPlayer={mockOnRecordMissingPlayer}
        />
      )

      expect(screen.getByText(/Record Missing Opponent/i)).toBeInTheDocument()
    })

    it('should not render missing player button when handler not provided', () => {
      render(
        <BattlePhaseModal
          isOpen={true}
          currentPlayer={mockPlayers[0]!}
          players={mockPlayers}
          currentRound={1}
          battleCompleted={false}
          soloMode={false}
          conditionEnabled={true}
          selectedOpponentId={null}
          onConditionEnabledChange={mockOnConditionEnabledChange}
          onOpponentSelect={mockOnOpponentSelect}
          getActiveBattleCondition={mockGetActiveBattleCondition}
          onBattle={mockOnBattle}
          onClose={mockOnClose}
        />
      )

      expect(screen.queryByText(/Record Missing Opponent/i)).not.toBeInTheDocument()
    })

    it('should open missing player modal when button clicked', async () => {
      const user = userEvent.setup()
      render(
        <BattlePhaseModal
          isOpen={true}
          currentPlayer={mockPlayers[0]!}
          players={mockPlayers}
          currentRound={1}
          battleCompleted={false}
          soloMode={false}
          conditionEnabled={true}
          selectedOpponentId={null}
          onConditionEnabledChange={mockOnConditionEnabledChange}
          onOpponentSelect={mockOnOpponentSelect}
          getActiveBattleCondition={mockGetActiveBattleCondition}
          onBattle={mockOnBattle}
          onClose={mockOnClose}
          onRecordMissingPlayer={mockOnRecordMissingPlayer}
        />
      )

      const missingButton = screen.getByText(/Record Missing Opponent/i)
      await user.click(missingButton)

      expect(screen.getByTestId('missing-player-modal')).toBeInTheDocument()
    })

    it('should call onRecordMissingPlayer when confirmed', async () => {
      const user = userEvent.setup()
      render(
        <BattlePhaseModal
          isOpen={true}
          currentPlayer={mockPlayers[0]!}
          players={mockPlayers}
          currentRound={1}
          battleCompleted={false}
          soloMode={false}
          conditionEnabled={true}
          selectedOpponentId={null}
          onConditionEnabledChange={mockOnConditionEnabledChange}
          onOpponentSelect={mockOnOpponentSelect}
          getActiveBattleCondition={mockGetActiveBattleCondition}
          onBattle={mockOnBattle}
          onClose={mockOnClose}
          onRecordMissingPlayer={mockOnRecordMissingPlayer}
        />
      )

      // WHY: Open modal
      const missingButton = screen.getByText(/Record Missing Opponent/i)
      await user.click(missingButton)

      // WHY: Confirm missing player
      const confirmButton = screen.getByText('Confirm Missing')
      await user.click(confirmButton)

      expect(mockOnRecordMissingPlayer).toHaveBeenCalledWith(1, 2)
    })
  })

  describe('when closing modal', () => {
    it('should call onClose when close button clicked', async () => {
      const user = userEvent.setup()
      render(
        <BattlePhaseModal
          isOpen={true}
          currentPlayer={mockPlayers[0]!}
          players={mockPlayers}
          currentRound={1}
          battleCompleted={false}
          soloMode={false}
          conditionEnabled={true}
          selectedOpponentId={null}
          onConditionEnabledChange={mockOnConditionEnabledChange}
          onOpponentSelect={mockOnOpponentSelect}
          getActiveBattleCondition={mockGetActiveBattleCondition}
          onBattle={mockOnBattle}
          onClose={mockOnClose}
        />
      )

      const closeButton = screen.getByRole('button', { name: /close/i })
      await user.click(closeButton)

      expect(mockOnClose).toHaveBeenCalled()
    })
  })
})
