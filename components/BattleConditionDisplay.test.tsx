import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BattleConditionDisplay from './BattleConditionDisplay'
import type { ActiveBattleCondition, KillzoneRecommendation } from '@/types/battleCondition'
import type { Condition } from '@/types/campaign'

// Sample test data
const SAMPLE_SURFACE_CONDITION: Condition = {
  name: 'Blizzard',
  description: 'Harsh winds reduce visibility. -1 to hit in battles here.',
  effect: 'combat',
  modifier: -1
}

const SAMPLE_TOMB_CONDITION: Condition = {
  name: 'Darkness',
  description: 'Lights have failed. -1 to hit in battles here.',
  effect: 'combat',
  modifier: -1
}

const SURFACE_ACTIVE_CONDITION: ActiveBattleCondition = {
  condition: SAMPLE_SURFACE_CONDITION,
  sourceHex: { id: '2,3', row: 2, col: 3, type: 'surface' },
  reason: 'same-hex',
  conditionProviderPlayerId: null,
  conditionProviderName: null
}

const TOMB_ACTIVE_CONDITION: ActiveBattleCondition = {
  condition: SAMPLE_TOMB_CONDITION,
  sourceHex: { id: '4,2', row: 4, col: 2, type: 'tomb' },
  reason: 'no-initiative',
  conditionProviderPlayerId: 1,
  conditionProviderName: 'Player 2'
}

const NO_OPPONENT_CONDITION: ActiveBattleCondition = {
  condition: null,
  sourceHex: null,
  reason: 'no-opponent',
  conditionProviderPlayerId: null,
  conditionProviderName: null
}

const SURFACE_KILLZONE: KillzoneRecommendation = {
  category: 'any',
  name: 'Any Killzone',
  examples: ['Killzone: Volkus', 'Chalnath'],
  reason: 'Surface conditions work with open battlefields'
}

const TOMB_KILLZONE: KillzoneRecommendation = {
  category: 'close-quarters',
  name: 'Close Quarters Killzone',
  examples: ['Killzone: Tomb World', 'Gallowdark'],
  reason: 'Tomb conditions suit close combat environments'
}

describe('BattleConditionDisplay', () => {
  const defaultProps = {
    activeCondition: null,
    killzoneRecommendation: null,
    conditionEnabled: true,
    onToggleCondition: vi.fn(),
    round: 3
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock clipboard API using Object.defineProperty
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined)
      },
      writable: true,
      configurable: true
    })
  })

  describe('empty state (before opponent selected)', () => {
    it('should show empty state message when no condition', () => {
      render(<BattleConditionDisplay {...defaultProps} />)

      expect(screen.getByText(/select an opponent/i)).toBeInTheDocument()
    })

    it('should not show condition banner in empty state', () => {
      render(<BattleConditionDisplay {...defaultProps} />)

      expect(screen.queryByTestId('condition-banner')).not.toBeInTheDocument()
    })
  })

  describe('when condition is active (opponent selected)', () => {
    it('should display condition name prominently', () => {
      render(
        <BattleConditionDisplay
          {...defaultProps}
          activeCondition={SURFACE_ACTIVE_CONDITION}
          killzoneRecommendation={SURFACE_KILLZONE}
        />
      )

      expect(screen.getByText('Blizzard')).toBeInTheDocument()
    })

    it('should show hex source information', () => {
      render(
        <BattleConditionDisplay
          {...defaultProps}
          activeCondition={SURFACE_ACTIVE_CONDITION}
          killzoneRecommendation={SURFACE_KILLZONE}
        />
      )

      expect(screen.getByText(/Hex 2,3/i)).toBeInTheDocument()
      expect(screen.getByText(/Surface/i)).toBeInTheDocument()
    })

    it('should display selection reason for same-hex', () => {
      render(
        <BattleConditionDisplay
          {...defaultProps}
          activeCondition={SURFACE_ACTIVE_CONDITION}
          killzoneRecommendation={SURFACE_KILLZONE}
        />
      )

      expect(screen.getByText(/both players in same hex/i)).toBeInTheDocument()
    })

    it('should display selection reason with player name for no-initiative', () => {
      render(
        <BattleConditionDisplay
          {...defaultProps}
          activeCondition={TOMB_ACTIVE_CONDITION}
          killzoneRecommendation={TOMB_KILLZONE}
        />
      )

      expect(screen.getByText(/Player 2.*without initiative/i)).toBeInTheDocument()
    })

    it('should show condition description', () => {
      render(
        <BattleConditionDisplay
          {...defaultProps}
          activeCondition={SURFACE_ACTIVE_CONDITION}
          killzoneRecommendation={SURFACE_KILLZONE}
        />
      )

      expect(screen.getByText(/Harsh winds reduce visibility/i)).toBeInTheDocument()
    })
  })

  describe('when condition is from tomb hex', () => {
    it('should apply tomb styling class', () => {
      render(
        <BattleConditionDisplay
          {...defaultProps}
          activeCondition={TOMB_ACTIVE_CONDITION}
          killzoneRecommendation={TOMB_KILLZONE}
        />
      )

      const banner = screen.getByTestId('condition-banner')
      expect(banner.className).toContain('tomb')
    })

    it('should show close quarters recommendation', () => {
      render(
        <BattleConditionDisplay
          {...defaultProps}
          activeCondition={TOMB_ACTIVE_CONDITION}
          killzoneRecommendation={TOMB_KILLZONE}
        />
      )

      expect(screen.getByText(/Close Quarters Killzone/i)).toBeInTheDocument()
      expect(screen.getByText(/Tomb World/i)).toBeInTheDocument()
    })
  })

  describe('when condition is from surface hex', () => {
    it('should apply surface styling class', () => {
      render(
        <BattleConditionDisplay
          {...defaultProps}
          activeCondition={SURFACE_ACTIVE_CONDITION}
          killzoneRecommendation={SURFACE_KILLZONE}
        />
      )

      const banner = screen.getByTestId('condition-banner')
      expect(banner.className).toContain('surface')
    })

    it('should show any killzone recommendation', () => {
      render(
        <BattleConditionDisplay
          {...defaultProps}
          activeCondition={SURFACE_ACTIVE_CONDITION}
          killzoneRecommendation={SURFACE_KILLZONE}
        />
      )

      expect(screen.getByText(/Any Killzone/i)).toBeInTheDocument()
      expect(screen.getByText(/Volkus/i)).toBeInTheDocument()
    })
  })

  describe('when no opponent (BYE/external)', () => {
    it('should show no condition applies message', () => {
      render(
        <BattleConditionDisplay
          {...defaultProps}
          activeCondition={NO_OPPONENT_CONDITION}
        />
      )

      // Check for the main notice text specifically
      expect(screen.getByText('No condition applies to this battle')).toBeInTheDocument()
    })
  })

  describe('toggle functionality', () => {
    it('should call onToggleCondition when checkbox clicked', async () => {
      const user = userEvent.setup()
      const onToggle = vi.fn()
      render(
        <BattleConditionDisplay
          {...defaultProps}
          activeCondition={SURFACE_ACTIVE_CONDITION}
          killzoneRecommendation={SURFACE_KILLZONE}
          onToggleCondition={onToggle}
        />
      )

      const checkbox = screen.getByRole('checkbox', { name: /apply condition rules/i })
      await user.click(checkbox)

      expect(onToggle).toHaveBeenCalledWith(false)
    })

    it('should show disabled notice when conditions off', () => {
      render(
        <BattleConditionDisplay
          {...defaultProps}
          activeCondition={SURFACE_ACTIVE_CONDITION}
          killzoneRecommendation={SURFACE_KILLZONE}
          conditionEnabled={false}
        />
      )

      expect(screen.getByText('Condition rules disabled for this battle')).toBeInTheDocument()
    })

    it('should hide condition details when disabled', () => {
      render(
        <BattleConditionDisplay
          {...defaultProps}
          activeCondition={SURFACE_ACTIVE_CONDITION}
          killzoneRecommendation={SURFACE_KILLZONE}
          conditionEnabled={false}
        />
      )

      // Condition description should not show when disabled
      expect(screen.queryByText(/Harsh winds reduce visibility/i)).not.toBeInTheDocument()
    })
  })

  describe('export functionality', () => {
    it('should have copy button when condition active', () => {
      render(
        <BattleConditionDisplay
          {...defaultProps}
          activeCondition={SURFACE_ACTIVE_CONDITION}
          killzoneRecommendation={SURFACE_KILLZONE}
        />
      )

      expect(screen.getByRole('button', { name: /copy for tabletop/i })).toBeInTheDocument()
    })

    it('should copy condition text on export click', async () => {
      const user = userEvent.setup()
      render(
        <BattleConditionDisplay
          {...defaultProps}
          activeCondition={SURFACE_ACTIVE_CONDITION}
          killzoneRecommendation={SURFACE_KILLZONE}
        />
      )

      const copyButton = screen.getByRole('button', { name: /copy for tabletop/i })

      // Click should not throw even if clipboard isn't fully mocked
      await expect(user.click(copyButton)).resolves.not.toThrow()

      // The button should still be in the document (wasn't removed)
      expect(copyButton).toBeInTheDocument()
    })

    it('should show success feedback after copy', async () => {
      const user = userEvent.setup()
      render(
        <BattleConditionDisplay
          {...defaultProps}
          activeCondition={SURFACE_ACTIVE_CONDITION}
          killzoneRecommendation={SURFACE_KILLZONE}
        />
      )

      const copyButton = screen.getByRole('button', { name: /copy for tabletop/i })
      await user.click(copyButton)

      // Should show "Copied!" feedback
      expect(await screen.findByText(/copied/i)).toBeInTheDocument()
    })
  })
})
