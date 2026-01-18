import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Phase, Player } from '@/types/campaign'

// WHY: Mock Next.js router used by UserMenu component
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// WHY: Mock auth store used by UserMenu component
vi.mock('@/lib/stores/auth', () => ({
  useAuthStore: () => ({
    user: null,
    logout: vi.fn(),
  }),
}))

import EnhancedHeader from './EnhancedHeader'

describe('EnhancedHeader', () => {
  // WHY: Define test data fixtures to reduce duplication
  const mockPlayer: Player = {
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
  }

  describe('when rendering basic information', () => {
    it('should display the campaign title', () => {
      render(
        <EnhancedHeader
          phase="Movement"
          currentPlayer={mockPlayer}
          round={3}
          threatLevel={4}
          targetThreat={7}
          isOwner={false}
          isSoloMode={false}
        />
      )

      expect(screen.getByText('Ctesiphus Expedition')).toBeInTheDocument()
    })

    it('should display the round number', () => {
      render(
        <EnhancedHeader
          phase="Movement"
          currentPlayer={mockPlayer}
          round={5}
          threatLevel={2}
          targetThreat={7}
          isOwner={false}
          isSoloMode={false}
        />
      )

      expect(screen.getByText(/Round 5/i)).toBeInTheDocument()
    })

    it('should display threat level in X/Y format', () => {
      render(
        <EnhancedHeader
          phase="Movement"
          currentPlayer={mockPlayer}
          round={1}
          threatLevel={3}
          targetThreat={8}
          isOwner={false}
          isSoloMode={false}
        />
      )

      expect(screen.getByText(/Threat: 3\/8/i)).toBeInTheDocument()
    })
  })

  describe('when rendering phase badge', () => {
    it('should display Movement phase with blue styling', () => {
      render(
        <EnhancedHeader
          phase="Movement"
          currentPlayer={mockPlayer}
          round={1}
          threatLevel={1}
          targetThreat={7}
          isOwner={false}
          isSoloMode={false}
        />
      )

      const phaseBadge = screen.getByText('Movement')
      expect(phaseBadge).toBeInTheDocument()
      expect(phaseBadge).toHaveClass('phase-badge')
      expect(phaseBadge).toHaveClass('phase-movement')
    })

    it('should display Battle phase with red styling', () => {
      render(
        <EnhancedHeader
          phase="Battle"
          currentPlayer={mockPlayer}
          round={1}
          threatLevel={1}
          targetThreat={7}
          isOwner={false}
          isSoloMode={false}
        />
      )

      const phaseBadge = screen.getByText('Battle')
      expect(phaseBadge).toHaveClass('phase-badge')
      expect(phaseBadge).toHaveClass('phase-battle')
    })

    it('should display Action phase with green styling', () => {
      render(
        <EnhancedHeader
          phase="Action"
          currentPlayer={mockPlayer}
          round={1}
          threatLevel={1}
          targetThreat={7}
          isOwner={false}
          isSoloMode={false}
        />
      )

      const phaseBadge = screen.getByText('Action')
      expect(phaseBadge).toHaveClass('phase-badge')
      expect(phaseBadge).toHaveClass('phase-action')
    })

    it('should display Threat phase with purple styling', () => {
      render(
        <EnhancedHeader
          phase="Threat"
          currentPlayer={mockPlayer}
          round={1}
          threatLevel={1}
          targetThreat={7}
          isOwner={false}
          isSoloMode={false}
        />
      )

      const phaseBadge = screen.getByText('Threat')
      expect(phaseBadge).toHaveClass('phase-badge')
      expect(phaseBadge).toHaveClass('phase-threat')
    })
  })

  describe('when rendering current player', () => {
    it('should display current player name', () => {
      render(
        <EnhancedHeader
          phase="Movement"
          currentPlayer={mockPlayer}
          round={1}
          threatLevel={1}
          targetThreat={7}
          isOwner={false}
          isSoloMode={false}
        />
      )

      expect(screen.getByText(/Alice/i)).toBeInTheDocument()
    })

    it('should display player color indicator', () => {
      render(
        <EnhancedHeader
          phase="Movement"
          currentPlayer={mockPlayer}
          round={1}
          threatLevel={1}
          targetThreat={7}
          isOwner={false}
          isSoloMode={false}
        />
      )

      const playerIndicator = screen.getByTestId('current-player-indicator')
      expect(playerIndicator).toHaveStyle({ borderColor: '#FF0000' })
    })

    it('should handle null current player gracefully', () => {
      render(
        <EnhancedHeader
          phase="Movement"
          currentPlayer={null}
          round={1}
          threatLevel={1}
          targetThreat={7}
          isOwner={false}
          isSoloMode={false}
        />
      )

      // WHY: Should show placeholder when no current player
      expect(screen.queryByTestId('current-player-indicator')).not.toBeInTheDocument()
    })
  })

  describe('when rendering settings button', () => {
    it('should display settings button when user is owner', () => {
      render(
        <EnhancedHeader
          phase="Movement"
          currentPlayer={mockPlayer}
          round={1}
          threatLevel={1}
          targetThreat={7}
          isOwner={true}
          isSoloMode={false}
        />
      )

      expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument()
    })

    it('should NOT display settings button when user is not owner', () => {
      render(
        <EnhancedHeader
          phase="Movement"
          currentPlayer={mockPlayer}
          round={1}
          threatLevel={1}
          targetThreat={7}
          isOwner={false}
          isSoloMode={false}
        />
      )

      expect(screen.queryByRole('button', { name: /settings/i })).not.toBeInTheDocument()
    })

    it('should call onSettingsClick when settings button clicked', async () => {
      const user = userEvent.setup()
      const onSettingsClick = vi.fn()

      render(
        <EnhancedHeader
          phase="Movement"
          currentPlayer={mockPlayer}
          round={1}
          threatLevel={1}
          targetThreat={7}
          isOwner={true}
          isSoloMode={false}
          onSettingsClick={onSettingsClick}
        />
      )

      const settingsButton = screen.getByRole('button', { name: /settings/i })
      await user.click(settingsButton)

      expect(onSettingsClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('when rendering user menu', () => {
    it('should display user menu component', () => {
      const { container } = render(
        <EnhancedHeader
          phase="Movement"
          currentPlayer={mockPlayer}
          round={1}
          threatLevel={1}
          targetThreat={7}
          isOwner={false}
          isSoloMode={false}
        />
      )

      // WHY: UserMenu is rendered in header-right section
      expect(container.querySelector('.header-right')).toBeInTheDocument()
    })
  })

  describe('when in solo mode', () => {
    it('should display campaign points in header', () => {
      render(
        <EnhancedHeader
          phase="Movement"
          currentPlayer={mockPlayer}
          round={1}
          threatLevel={3}
          targetThreat={10}
          isOwner={true}
          isSoloMode={true}
          campaignPoints={8}
        />
      )

      // WHY: Solo mode shows CP progress toward 10+ victory goal
      expect(screen.getByText(/8 CP/i)).toBeInTheDocument()
    })

    it('should not display campaign points when not in solo mode', () => {
      render(
        <EnhancedHeader
          phase="Movement"
          currentPlayer={mockPlayer}
          round={1}
          threatLevel={3}
          targetThreat={7}
          isOwner={true}
          isSoloMode={false}
        />
      )

      expect(screen.queryByText(/CP/i)).not.toBeInTheDocument()
    })
  })
})
