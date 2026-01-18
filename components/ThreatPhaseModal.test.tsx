import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ThreatPhaseModal from './ThreatPhaseModal'
import type { Player, ThreatWarningLevel, ActiveThreatPhaseRule } from '@/types/campaign'

describe('ThreatPhaseModal', () => {
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

  const mockActiveThreatRules: ActiveThreatPhaseRule[] = [
    {
      player: mockPlayers[0]!,
      hexId: '0,0',
      location: { id: 15, name: 'Beast Lair' },
      rule: { description: 'Threat +1', threatIncrease: 1 }
    }
  ]

  const mockOnNextPhase = vi.fn()
  const mockOnClose = vi.fn()
  const mockOnResolveThreatRules = vi.fn()
  const mockOnResolveThreatAttacks = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('when modal is open', () => {
    it('should render modal with threat phase content', () => {
      render(
        <ThreatPhaseModal
          isOpen={true}
          currentPlayer={mockPlayers[0]!}
          players={mockPlayers}
          threatLevel={3}
          targetThreatLevel={7}
          threatWarning="none"
          soloMode={false}
          onNextPhase={mockOnNextPhase}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText(/Threat Phase/i)).toBeInTheDocument()
    })

    it('should render modal heading for competitive mode', () => {
      render(
        <ThreatPhaseModal
          isOpen={true}
          currentPlayer={mockPlayers[0]!}
          players={mockPlayers}
          threatLevel={3}
          targetThreatLevel={7}
          threatWarning="none"
          soloMode={false}
          onNextPhase={mockOnNextPhase}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText(/⚠️ Threat Phase/i)).toBeInTheDocument()
    })

    it('should render modal heading for solo mode', () => {
      render(
        <ThreatPhaseModal
          isOpen={true}
          currentPlayer={mockPlayers[0]!}
          players={mockPlayers}
          threatLevel={3}
          targetThreatLevel={7}
          threatWarning="none"
          soloMode={true}
          onNextPhase={mockOnNextPhase}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText(/🎯 Threat Phase \(Solo\)/i)).toBeInTheDocument()
    })

    it('should display current threat level', () => {
      render(
        <ThreatPhaseModal
          isOpen={true}
          currentPlayer={mockPlayers[0]!}
          players={mockPlayers}
          threatLevel={3}
          targetThreatLevel={7}
          threatWarning="none"
          soloMode={false}
          onNextPhase={mockOnNextPhase}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText(/Current Threat Level:/i)).toBeInTheDocument()
      expect(screen.getByText(/3/)).toBeInTheDocument()
    })

    it('should display solo mode instructions', () => {
      render(
        <ThreatPhaseModal
          isOpen={true}
          currentPlayer={mockPlayers[0]!}
          players={mockPlayers}
          threatLevel={3}
          targetThreatLevel={7}
          threatWarning="none"
          soloMode={true}
          onNextPhase={mockOnNextPhase}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText(/Dynamic Threat/i)).toBeInTheDocument()
      expect(screen.getByText(/Campaign ends if threat reaches 10/i)).toBeInTheDocument()
    })

    it('should display competitive mode instructions', () => {
      render(
        <ThreatPhaseModal
          isOpen={true}
          currentPlayer={mockPlayers[0]!}
          players={mockPlayers}
          threatLevel={3}
          targetThreatLevel={7}
          threatWarning="none"
          soloMode={false}
          onNextPhase={mockOnNextPhase}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText(/Threat level increases by 1/i)).toBeInTheDocument()
    })
  })

  describe('when modal is closed', () => {
    it('should not render modal', () => {
      render(
        <ThreatPhaseModal
          isOpen={false}
          currentPlayer={mockPlayers[0]!}
          players={mockPlayers}
          threatLevel={3}
          targetThreatLevel={7}
          threatWarning="none"
          soloMode={false}
          onNextPhase={mockOnNextPhase}
          onClose={mockOnClose}
        />
      )

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  describe('when location rules are active', () => {
    it('should display location rules section', () => {
      render(
        <ThreatPhaseModal
          isOpen={true}
          currentPlayer={mockPlayers[0]!}
          players={mockPlayers}
          threatLevel={3}
          targetThreatLevel={7}
          threatWarning="none"
          soloMode={false}
          onNextPhase={mockOnNextPhase}
          onClose={mockOnClose}
          activeThreatRules={mockActiveThreatRules}
          threatRulesResolved={false}
          onResolveThreatRules={mockOnResolveThreatRules}
        />
      )

      expect(screen.getByText(/Location Rules Resolving/i)).toBeInTheDocument()
      expect(screen.getByText(/Beast Lair/i)).toBeInTheDocument()
      expect(screen.getByText(/Threat \+1/i)).toBeInTheDocument()
    })

    it('should render resolve button for location rules', () => {
      render(
        <ThreatPhaseModal
          isOpen={true}
          currentPlayer={mockPlayers[0]!}
          players={mockPlayers}
          threatLevel={3}
          targetThreatLevel={7}
          threatWarning="none"
          soloMode={false}
          onNextPhase={mockOnNextPhase}
          onClose={mockOnClose}
          activeThreatRules={mockActiveThreatRules}
          threatRulesResolved={false}
          onResolveThreatRules={mockOnResolveThreatRules}
        />
      )

      expect(screen.getByText(/Resolve Location Rules/i)).toBeInTheDocument()
    })

    it('should call onResolveThreatRules when button clicked', async () => {
      const user = userEvent.setup()
      render(
        <ThreatPhaseModal
          isOpen={true}
          currentPlayer={mockPlayers[0]!}
          players={mockPlayers}
          threatLevel={3}
          targetThreatLevel={7}
          threatWarning="none"
          soloMode={false}
          onNextPhase={mockOnNextPhase}
          onClose={mockOnClose}
          activeThreatRules={mockActiveThreatRules}
          threatRulesResolved={false}
          onResolveThreatRules={mockOnResolveThreatRules}
        />
      )

      const resolveButton = screen.getByText(/Resolve Location Rules/i)
      await user.click(resolveButton)

      expect(mockOnResolveThreatRules).toHaveBeenCalled()
    })

    it('should hide location rules when resolved', () => {
      render(
        <ThreatPhaseModal
          isOpen={true}
          currentPlayer={mockPlayers[0]!}
          players={mockPlayers}
          threatLevel={3}
          targetThreatLevel={7}
          threatWarning="none"
          soloMode={false}
          onNextPhase={mockOnNextPhase}
          onClose={mockOnClose}
          activeThreatRules={mockActiveThreatRules}
          threatRulesResolved={true}
          onResolveThreatRules={mockOnResolveThreatRules}
        />
      )

      expect(screen.queryByText(/Location Rules Resolving/i)).not.toBeInTheDocument()
    })
  })

  describe('when threat attacks are active', () => {
    it('should display threat attacks section', () => {
      render(
        <ThreatPhaseModal
          isOpen={true}
          currentPlayer={mockPlayers[0]!}
          players={mockPlayers}
          threatLevel={3}
          targetThreatLevel={7}
          threatWarning="none"
          soloMode={false}
          onNextPhase={mockOnNextPhase}
          onClose={mockOnClose}
          hasActiveThreatAttacks={true}
          onResolveThreatAttacks={mockOnResolveThreatAttacks}
        />
      )

      expect(screen.getByText(/Threat Phase Attacks/i)).toBeInTheDocument()
      expect(screen.getByText(/Beast Lairs and Released Prisoners/i)).toBeInTheDocument()
    })

    it('should call onResolveThreatAttacks when button clicked', async () => {
      const user = userEvent.setup()
      render(
        <ThreatPhaseModal
          isOpen={true}
          currentPlayer={mockPlayers[0]!}
          players={mockPlayers}
          threatLevel={3}
          targetThreatLevel={7}
          threatWarning="none"
          soloMode={false}
          onNextPhase={mockOnNextPhase}
          onClose={mockOnClose}
          hasActiveThreatAttacks={true}
          onResolveThreatAttacks={mockOnResolveThreatAttacks}
        />
      )

      const resolveButton = screen.getByText(/Resolve Threat Attacks/i)
      await user.click(resolveButton)

      expect(mockOnResolveThreatAttacks).toHaveBeenCalled()
    })
  })

  describe('when showing threat warnings', () => {
    it('should display critical warning', () => {
      render(
        <ThreatPhaseModal
          isOpen={true}
          currentPlayer={mockPlayers[0]!}
          players={mockPlayers}
          threatLevel={9}
          targetThreatLevel={10}
          threatWarning="critical"
          soloMode={false}
          onNextPhase={mockOnNextPhase}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText(/CRITICAL: Campaign ending next round/i)).toBeInTheDocument()
    })

    it('should display warning', () => {
      render(
        <ThreatPhaseModal
          isOpen={true}
          currentPlayer={mockPlayers[0]!}
          players={mockPlayers}
          threatLevel={8}
          targetThreatLevel={10}
          threatWarning="warning"
          soloMode={false}
          onNextPhase={mockOnNextPhase}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText(/WARNING: Approaching campaign end/i)).toBeInTheDocument()
    })

    it('should not display warning when none', () => {
      render(
        <ThreatPhaseModal
          isOpen={true}
          currentPlayer={mockPlayers[0]!}
          players={mockPlayers}
          threatLevel={3}
          targetThreatLevel={10}
          threatWarning="none"
          soloMode={false}
          onNextPhase={mockOnNextPhase}
          onClose={mockOnClose}
        />
      )

      expect(screen.queryByText(/CRITICAL/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/WARNING/i)).not.toBeInTheDocument()
    })
  })

  describe('when ending turn', () => {
    it('should render End Turn button', () => {
      render(
        <ThreatPhaseModal
          isOpen={true}
          currentPlayer={mockPlayers[0]!}
          players={mockPlayers}
          threatLevel={3}
          targetThreatLevel={7}
          threatWarning="none"
          soloMode={false}
          onNextPhase={mockOnNextPhase}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText(/End Turn/i)).toBeInTheDocument()
    })

    it('should call onNextPhase when End Turn clicked', async () => {
      const user = userEvent.setup()
      render(
        <ThreatPhaseModal
          isOpen={true}
          currentPlayer={mockPlayers[0]!}
          players={mockPlayers}
          threatLevel={3}
          targetThreatLevel={7}
          threatWarning="none"
          soloMode={false}
          onNextPhase={mockOnNextPhase}
          onClose={mockOnClose}
        />
      )

      const endTurnButton = screen.getByText(/End Turn/i)
      await user.click(endTurnButton)

      expect(mockOnNextPhase).toHaveBeenCalled()
    })

    it('should hide End Turn button when location rules active', () => {
      render(
        <ThreatPhaseModal
          isOpen={true}
          currentPlayer={mockPlayers[0]!}
          players={mockPlayers}
          threatLevel={3}
          targetThreatLevel={7}
          threatWarning="none"
          soloMode={false}
          onNextPhase={mockOnNextPhase}
          onClose={mockOnClose}
          activeThreatRules={mockActiveThreatRules}
          threatRulesResolved={false}
          onResolveThreatRules={mockOnResolveThreatRules}
        />
      )

      expect(screen.queryByText(/End Turn/i)).not.toBeInTheDocument()
    })

    it('should hide End Turn button when threat attacks active', () => {
      render(
        <ThreatPhaseModal
          isOpen={true}
          currentPlayer={mockPlayers[0]!}
          players={mockPlayers}
          threatLevel={3}
          targetThreatLevel={7}
          threatWarning="none"
          soloMode={false}
          onNextPhase={mockOnNextPhase}
          onClose={mockOnClose}
          hasActiveThreatAttacks={true}
          onResolveThreatAttacks={mockOnResolveThreatAttacks}
        />
      )

      expect(screen.queryByText(/End Turn/i)).not.toBeInTheDocument()
    })
  })

  describe('when closing modal', () => {
    it('should call onClose when close button clicked', async () => {
      const user = userEvent.setup()
      render(
        <ThreatPhaseModal
          isOpen={true}
          currentPlayer={mockPlayers[0]!}
          players={mockPlayers}
          threatLevel={3}
          targetThreatLevel={7}
          threatWarning="none"
          soloMode={false}
          onNextPhase={mockOnNextPhase}
          onClose={mockOnClose}
        />
      )

      const closeButton = screen.getByRole('button', { name: /close/i })
      await user.click(closeButton)

      expect(mockOnClose).toHaveBeenCalled()
    })
  })
})
