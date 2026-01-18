import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PhaseTracker from './PhaseTracker'
import type { Player, MapConfig } from '@/types/campaign'

/**
 * WHY: Component tests for PhaseTracker Battle Phase UI enhancements (Issue #47, Phase 3)
 * Tests opponent selection and challenge status features
 */

const mockMapConfig: MapConfig = {
  name: 'Test Map',
  rows: 5,
  cols: 5,
  surfaceRows: 3,
  tombRows: 2
}

const createMockPlayer = (id: number, name: string): Player => ({
  id,
  name,
  killTeamName: `Team ${name}`,
  color: '#000000',
  supplyPoints: 5,
  campaignPoints: 0,
  position: { row: 0, col: 0 },
  bases: [{ row: 0, col: 0 }],
  camps: [],
  exploredHexes: 0,
  gamesPlayed: 0,
  gamesWon: 0,
  gamesLost: 0,
  operativesKilled: 0,
  history: [],
  battleResult: null,
  searchedHexes: [],
  battleHistory: []
})

describe('PhaseTracker - Battle Phase UI', () => {
  const defaultProps = {
    currentRound: 1,
    currentPhase: 'Battle' as const,
    currentPlayer: createMockPlayer(1, 'Player 1'),
    players: [
      createMockPlayer(1, 'Player 1'),
      createMockPlayer(2, 'Player 2'),
      createMockPlayer(3, 'Player 3')
    ],
    hexes: {},
    threatLevel: 1,
    targetThreatLevel: 5,
    threatWarning: 'none' as const,
    battleCompleted: false,
    movementOrder: [0, 1, 2],
    movementIndex: 0,
    actionOrder: null,
    actionIndex: 0,
    onMove: vi.fn(),
    onBattle: vi.fn(),
    onAction: vi.fn(),
    onNextPhase: vi.fn(),
    calculateEncampCost: vi.fn(() => 2),
    validateDemolish: vi.fn(() => ({ valid: false, reason: 'No reason', cost: 3 }))
  }

  describe('Opponent Selection Dropdown', () => {
    it('should render opponent dropdown when battle result is not BYE', async () => {
      render(<PhaseTracker {...defaultProps} />)

      // WHY: Default is WIN, so opponent label and dropdown should be visible
      const opponentLabel = screen.getByText(/Opponent:/)
      expect(opponentLabel).toBeDefined()

      // WHY: Find the opponent dropdown by looking for the required select with opponent options
      const allSelects = screen.getAllByRole('combobox')
      const opponentDropdown = allSelects.find(select =>
        select.getAttribute('required') !== null
      )
      expect(opponentDropdown).toBeDefined()
    })

    it('should hide opponent dropdown when BYE is selected', async () => {
      const user = userEvent.setup()
      render(<PhaseTracker {...defaultProps} />)

      // WHY: Find battle result dropdown (first combobox)
      const battleResultDropdown = screen.getAllByRole('combobox')[0]
      await user.selectOptions(battleResultDropdown!, 'BYE')

      // WHY: Opponent label and dropdown should not be visible
      const opponentLabel = screen.queryByText(/Opponent:/)
      expect(opponentLabel).toBeNull()
    })

    it('should populate dropdown with all opponents except current player', () => {
      render(<PhaseTracker {...defaultProps} />)

      // WHY: Find opponent dropdown (required select)
      const allSelects = screen.getAllByRole('combobox')
      const opponentDropdown = allSelects.find(select =>
        select.getAttribute('required') !== null
      )!
      const options = Array.from(opponentDropdown.querySelectorAll('option'))

      // WHY: Should have placeholder + 2 opponents (not current player)
      expect(options).toHaveLength(3)
      expect(options[0]?.textContent).toBe('-- Select Opponent --')
      expect(options[1]?.textContent).toBe('Player 2')
      expect(options[2]?.textContent).toBe('Player 3')

      // WHY: Current player (Player 1) should not be in the list
      const player1Option = options.find(opt => opt.textContent === 'Player 1')
      expect(player1Option).toBeUndefined()
    })
  })

  describe('Challenge Checkbox', () => {
    it('should show "Challenged but Refused" checkbox when opponent is selected', async () => {
      const user = userEvent.setup()
      render(<PhaseTracker {...defaultProps} />)

      // WHY: Initially, checkbox should not be visible (no opponent selected)
      let challengeCheckbox = screen.queryByText(/Game challenged but didn't happen/)
      expect(challengeCheckbox).toBeNull()

      // WHY: Select an opponent
      const allSelects = screen.getAllByRole('combobox')
      const opponentDropdown = allSelects.find(select =>
        select.getAttribute('required') !== null
      )!
      await user.selectOptions(opponentDropdown, '1') // Player 2 (index 1)

      // WHY: Now checkbox should be visible
      challengeCheckbox = screen.getByText(/Game challenged but didn't happen/)
      expect(challengeCheckbox).toBeDefined()
    })
  })

  describe('Record Battle Button', () => {
    it('should disable Record Battle button when no opponent is selected for non-BYE battles', () => {
      render(<PhaseTracker {...defaultProps} />)

      const recordButton = screen.getByRole('button', { name: /Record Battle/i })

      // WHY: Button should be disabled when no opponent selected
      expect(recordButton).toBeDisabled()
    })

    it('should enable Record Battle button when opponent is selected', async () => {
      const user = userEvent.setup()
      render(<PhaseTracker {...defaultProps} />)

      const recordButton = screen.getByRole('button', { name: /Record Battle/i })

      // WHY: Initially disabled
      expect(recordButton).toBeDisabled()

      // WHY: Select an opponent
      const allSelects = screen.getAllByRole('combobox')
      const opponentDropdown = allSelects.find(select =>
        select.getAttribute('required') !== null
      )!
      await user.selectOptions(opponentDropdown, '1') // Player 2 (index 1)

      // WHY: Now button should be enabled
      expect(recordButton).not.toBeDisabled()
    })

    it('should show validation message when no opponent is selected', () => {
      render(<PhaseTracker {...defaultProps} />)

      // WHY: Validation message should be visible when no opponent selected
      const validationMessage = screen.getByText(/Please select an opponent to record the battle/i)
      expect(validationMessage).toBeDefined()
    })
  })

  describe('Battle Recording', () => {
    it('should call onBattle with selected opponent ID and challenge status', async () => {
      const user = userEvent.setup()
      const onBattle = vi.fn()
      render(<PhaseTracker {...defaultProps} onBattle={onBattle} />)

      // WHY: Select opponent
      const allSelects = screen.getAllByRole('combobox')
      const opponentDropdown = allSelects.find(select =>
        select.getAttribute('required') !== null
      )!
      await user.selectOptions(opponentDropdown, '1') // Player 2 (index 1)

      // WHY: Click Record Battle
      const recordButton = screen.getByRole('button', { name: /Record Battle/i })
      await user.click(recordButton)

      // WHY: onBattle should be called with opponent index 1 and 'completed' status
      expect(onBattle).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Victory' }),
        1, // opponent index
        0, // operatives killed
        'completed' // challenge status
      )
    })

    it('should pass "challenged-refused" status when checkbox is checked', async () => {
      const user = userEvent.setup()
      const onBattle = vi.fn()
      render(<PhaseTracker {...defaultProps} onBattle={onBattle} />)

      // WHY: Select opponent
      const allSelects = screen.getAllByRole('combobox')
      const opponentDropdown = allSelects.find(select =>
        select.getAttribute('required') !== null
      )!
      await user.selectOptions(opponentDropdown, '1') // Player 2 (index 1)

      // WHY: Check the challenge checkbox
      const challengeCheckbox = screen.getByRole('checkbox')
      await user.click(challengeCheckbox)

      // WHY: Click Record Battle
      const recordButton = screen.getByRole('button', { name: /Record Battle/i })
      await user.click(recordButton)

      // WHY: onBattle should be called with 'challenged-refused' status
      expect(onBattle).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Victory' }),
        1, // opponent index
        0, // operatives killed
        'challenged-refused' // challenge status
      )
    })
  })

  describe('Demolish UI', () => {
    it('should show error when SP < 3', () => {
      const validateDemolish = vi.fn(() => ({
        valid: false,
        reason: 'Insufficient SP (requires 3 SP)',
        cost: 3
      }))

      const props = {
        ...defaultProps,
        currentPhase: 'Action' as const,
        validateDemolish
      }

      render(<PhaseTracker {...props} />)

      // WHY: Should show error message
      const errorMessage = screen.getByText(/Insufficient SP/)
      expect(errorMessage).toBeDefined()

      // WHY: Should show cost in description
      const costDisplay = screen.getByText(/Cost: 3 SP/)
      expect(costDisplay).toBeDefined()
    })

    it('should show error when no opponent camps at position', () => {
      const validateDemolish = vi.fn(() => ({
        valid: false,
        reason: 'no opponent camps at your position',
        cost: 3
      }))

      const props = {
        ...defaultProps,
        currentPhase: 'Action' as const,
        validateDemolish
      }

      render(<PhaseTracker {...props} />)

      // WHY: Should show error message
      const errorMessage = screen.getByText(/no opponent camps at your position/)
      expect(errorMessage).toBeDefined()
    })

    it('should show error when prerequisites not met', () => {
      const validateDemolish = vi.fn(() => ({
        valid: false,
        reason: 'Demolish prerequisite not met (must win battle or challenge against camp owner this round)',
        cost: 3
      }))

      const props = {
        ...defaultProps,
        currentPhase: 'Action' as const,
        validateDemolish
      }

      render(<PhaseTracker {...props} />)

      // WHY: Should show prerequisite error
      const errorMessage = screen.getByText(/Demolish prerequisite not met/)
      expect(errorMessage).toBeDefined()
    })

    it('should show valid targets with green checkmark box', () => {
      const validateDemolish = vi.fn(() => ({
        valid: true,
        targets: [{ playerId: 2, playerName: 'Player 2' }],
        cost: 3
      }))

      const props = {
        ...defaultProps,
        currentPhase: 'Action' as const,
        validateDemolish
      }

      render(<PhaseTracker {...props} />)

      // WHY: Should show success message with checkmark
      const successMessage = screen.getByText(/✓ You can demolish the following camps/)
      expect(successMessage).toBeDefined()

      // WHY: Should show demolish button for target
      const demolishButton = screen.getByRole('button', { name: /Demolish Player 2's Camp/ })
      expect(demolishButton).toBeDefined()
    })

    it('should show multiple targets when multiple valid camps', () => {
      const validateDemolish = vi.fn(() => ({
        valid: true,
        targets: [
          { playerId: 2, playerName: 'Player 2' },
          { playerId: 3, playerName: 'Player 3' }
        ],
        cost: 3
      }))

      const props = {
        ...defaultProps,
        currentPhase: 'Action' as const,
        validateDemolish
      }

      render(<PhaseTracker {...props} />)

      // WHY: Should show buttons for both targets
      const demolishButton1 = screen.getByRole('button', { name: /Demolish Player 2's Camp/ })
      const demolishButton2 = screen.getByRole('button', { name: /Demolish Player 3's Camp/ })
      expect(demolishButton1).toBeDefined()
      expect(demolishButton2).toBeDefined()
    })

    it('should display cost prominently (3 SP)', () => {
      const validateDemolish = vi.fn(() => ({
        valid: true,
        targets: [{ playerId: 2, playerName: 'Player 2' }],
        cost: 3
      }))

      const props = {
        ...defaultProps,
        currentPhase: 'Action' as const,
        validateDemolish
      }

      render(<PhaseTracker {...props} />)

      // WHY: Cost should be in description
      const descCost = screen.getByText(/Cost: 3 SP/)
      expect(descCost).toBeDefined()

      // WHY: Cost should be on button
      const button = screen.getByRole('button', { name: /Demolish Player 2's Camp \(3 SP\)/ })
      expect(button).toBeDefined()
    })

    it('should render modal with correct camp details', async () => {
      const user = userEvent.setup()
      const validateDemolish = vi.fn(() => ({
        valid: true,
        targets: [{ playerId: 2, playerName: 'Player 2' }],
        cost: 3
      }))

      const props = {
        ...defaultProps,
        currentPhase: 'Action' as const,
        validateDemolish
      }

      render(<PhaseTracker {...props} />)

      // WHY: Click demolish button to open modal
      const demolishButton = screen.getByRole('button', { name: /Demolish Player 2's Camp/ })
      await user.click(demolishButton)

      // WHY: Modal should show "Target Player:" label
      const targetLabel = screen.getByText(/Target Player:/)
      expect(targetLabel).toBeDefined()

      // WHY: Modal should show camp location label
      const locationLabel = screen.getByText(/Camp Location:/)
      expect(locationLabel).toBeDefined()

      // WHY: Modal should have confirm button
      const confirmButton = screen.getByRole('button', { name: /Confirm Demolish/ })
      expect(confirmButton).toBeDefined()
    })

    it('should show cost and warning in modal', async () => {
      const user = userEvent.setup()
      const validateDemolish = vi.fn(() => ({
        valid: true,
        targets: [{ playerId: 2, playerName: 'Player 2' }],
        cost: 3
      }))

      const props = {
        ...defaultProps,
        currentPhase: 'Action' as const,
        validateDemolish
      }

      render(<PhaseTracker {...props} />)

      // WHY: Open modal
      const demolishButton = screen.getByRole('button', { name: /Demolish Player 2's Camp/ })
      await user.click(demolishButton)

      // WHY: Modal should show modal header
      const modalHeader = screen.getByText(/⚠️ Confirm Demolish Action/)
      expect(modalHeader).toBeDefined()

      // WHY: Modal should show warning
      const warning = screen.getByText(/cannot be undone/)
      expect(warning).toBeDefined()
    })

    it('should call onAction when modal confirmed', async () => {
      const user = userEvent.setup()
      const onAction = vi.fn()
      const validateDemolish = vi.fn(() => ({
        valid: true,
        targets: [{ playerId: 2, playerName: 'Player 2' }],
        cost: 3
      }))

      const props = {
        ...defaultProps,
        currentPhase: 'Action' as const,
        validateDemolish,
        onAction
      }

      render(<PhaseTracker {...props} />)

      // WHY: Open modal
      const demolishButton = screen.getByRole('button', { name: /Demolish Player 2's Camp/ })
      await user.click(demolishButton)

      // WHY: Click confirm
      const confirmButton = screen.getByRole('button', { name: /Confirm Demolish/ })
      await user.click(confirmButton)

      // WHY: onAction should be called with DEMOLISH and targetPlayerId
      expect(onAction).toHaveBeenCalledWith('DEMOLISH', { targetPlayerId: 2 })
    })

    it('should close modal when cancelled', async () => {
      const user = userEvent.setup()
      const validateDemolish = vi.fn(() => ({
        valid: true,
        targets: [{ playerId: 2, playerName: 'Player 2' }],
        cost: 3
      }))

      const props = {
        ...defaultProps,
        currentPhase: 'Action' as const,
        validateDemolish
      }

      render(<PhaseTracker {...props} />)

      // WHY: Open modal
      const demolishButton = screen.getByRole('button', { name: /Demolish Player 2's Camp/ })
      await user.click(demolishButton)

      // WHY: Confirm modal is open
      let confirmButton = screen.getByRole('button', { name: /Confirm Demolish/ })
      expect(confirmButton).toBeDefined()

      // WHY: Click cancel
      const cancelButton = screen.getByRole('button', { name: /Cancel/ })
      await user.click(cancelButton)

      // WHY: Modal should be closed
      confirmButton = screen.queryByRole('button', { name: /Confirm Demolish/ })
      expect(confirmButton).toBeNull()
    })
  })
})
