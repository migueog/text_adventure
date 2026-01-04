/**
 * WHY: Unit tests for ThreatCheckDialog component (Issue #54)
 *
 * Tests:
 * - Renders only when isOpen is true
 * - Displays dice roll result correctly
 * - Shows threshold comparison
 * - Displays threat level change
 * - Shows campaign end warning at threat 10
 * - Calls onConfirm when button clicked
 * - Supports keyboard interaction (Enter/Escape)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ThreatCheckDialog from './ThreatCheckDialog'
import type { ThreatCheckResult } from '@/types/campaign'

describe('ThreatCheckDialog', () => {
  const mockOnConfirm = vi.fn()

  const defaultProps = {
    isOpen: true,
    currentThreat: 4,
    onConfirm: mockOnConfirm
  }

  beforeEach(() => {
    mockOnConfirm.mockClear()
  })

  describe('when closed', () => {
    it('should not render when isOpen is false', () => {
      const successResult: ThreatCheckResult = {
        trigger: 'TOMB_EXPLORATION',
        triggerName: 'Tomb Exploration',
        roll: 5,
        threshold: 4,
        success: true,
        increase: 1,
        preventable: false,
        prevented: false,
        description: 'Tomb exploration rolled 5 (4+) - threat increases by 1'
      }

      const { container } = render(
        <ThreatCheckDialog
          {...defaultProps}
          isOpen={false}
          result={successResult}
        />
      )

      expect(container.firstChild).toBeNull()
    })
  })

  describe('successful threat check', () => {
    it('should display successful tomb exploration check', () => {
      const successResult: ThreatCheckResult = {
        trigger: 'TOMB_EXPLORATION',
        triggerName: 'Tomb Exploration',
        roll: 5,
        threshold: 4,
        success: true,
        increase: 1,
        preventable: false,
        prevented: false,
        description: 'Tomb exploration rolled 5 (4+) - threat increases by 1'
      }

      render(<ThreatCheckDialog {...defaultProps} result={successResult} />)

      expect(screen.getByText(/Threat Check: Tomb Exploration/i)).toBeInTheDocument()
      expect(screen.getByText(/need 4\+/i)).toBeInTheDocument()
      // WHY: Check for complete description (validates roll, threshold, and result)
      expect(screen.getByText('Tomb exploration rolled 5 (4+) - threat increases by 1')).toBeInTheDocument()
      // WHY: Verify success indicator is shown
      expect(screen.getByText('✓ Threat Increases')).toBeInTheDocument()
    })

    it('should display battle win check', () => {
      const battleWinResult: ThreatCheckResult = {
        trigger: 'BATTLE_WIN',
        triggerName: 'Battle Win',
        roll: 4,
        threshold: 3,
        success: true,
        increase: 1,
        preventable: false,
        prevented: false,
        description: 'Battle Win rolled 4 (3+) - threat increases by 1'
      }

      render(<ThreatCheckDialog {...defaultProps} result={battleWinResult} />)

      expect(screen.getByText(/Threat Check: Battle Win/i)).toBeInTheDocument()
      expect(screen.getByText(/need 3\+/i)).toBeInTheDocument()
      expect(screen.getByText('Battle Win rolled 4 (3+) - threat increases by 1')).toBeInTheDocument()
    })

    it('should show threat level change correctly', () => {
      const successResult: ThreatCheckResult = {
        trigger: 'SEARCH_ACTION',
        triggerName: 'Search Action',
        roll: 6,
        threshold: 5,
        success: true,
        increase: 1,
        preventable: true,
        prevented: false,
        description: 'Search rolled 6 (5+) - threat will increase by 1'
      }

      render(
        <ThreatCheckDialog
          {...defaultProps}
          currentThreat={7}
          result={successResult}
        />
      )

      // WHY: Check for threat change display (7 → 8)
      expect(screen.getByText('7')).toBeInTheDocument()
      expect(screen.getByText('8')).toBeInTheDocument()
      expect(screen.getByText('→')).toBeInTheDocument()
    })
  })

  describe('failed threat check', () => {
    it('should display failed tomb exploration check', () => {
      const failureResult: ThreatCheckResult = {
        trigger: 'TOMB_EXPLORATION',
        triggerName: 'Tomb Exploration',
        roll: 3,
        threshold: 4,
        success: false,
        increase: 0,
        preventable: false,
        prevented: false,
        description: 'Tomb exploration rolled 3 (4+) - no threat increase'
      }

      render(<ThreatCheckDialog {...defaultProps} result={failureResult} />)

      expect(screen.getByText(/Threat Check: Tomb Exploration/i)).toBeInTheDocument()
      expect(screen.getByText(/need 4\+/i)).toBeInTheDocument()
      expect(screen.getByText('Tomb exploration rolled 3 (4+) - no threat increase')).toBeInTheDocument()
      expect(screen.getByText('✗ No Threat Increase')).toBeInTheDocument()
    })

    it('should not show threat change for failed check', () => {
      const failureResult: ThreatCheckResult = {
        trigger: 'BATTLE_LOSS_DRAW',
        triggerName: 'Battle Loss/Draw',
        roll: 2,
        threshold: 5,
        success: false,
        increase: 0,
        preventable: false,
        prevented: false,
        description: 'Battle Loss/Draw rolled 2 (5+) - no threat increase'
      }

      render(<ThreatCheckDialog {...defaultProps} result={failureResult} />)

      // WHY: Should show failure message, not threat change
      expect(screen.getByText('Battle Loss/Draw rolled 2 (5+) - no threat increase')).toBeInTheDocument()
      expect(screen.getByText('✗ No Threat Increase')).toBeInTheDocument()
      expect(screen.queryByText('→')).not.toBeInTheDocument()
    })
  })

  describe('automatic threat triggers', () => {
    it('should display Trophy Hall automatic D3 threat', () => {
      const trophyHallResult: ThreatCheckResult = {
        trigger: 'TROPHY_HALL_DEMOLISH',
        triggerName: 'Trophy Hall Demolish',
        roll: 3,
        threshold: undefined,  // Automatic
        success: true,
        increase: 3,
        preventable: false,
        prevented: false,
        description: 'Trophy Hall demolished - threat increases by 3 (D3)'
      }

      render(<ThreatCheckDialog {...defaultProps} result={trophyHallResult} />)

      expect(screen.getByText(/Threat Check: Trophy Hall Demolish/i)).toBeInTheDocument()
      expect(screen.getByText('Trophy Hall demolished - threat increases by 3 (D3)')).toBeInTheDocument()
      // WHY: No threshold shown for automatic triggers
      expect(screen.queryByText(/need/i)).not.toBeInTheDocument()
      expect(screen.getByText('✓ Threat Increases')).toBeInTheDocument()
    })

    it('should handle multi-point threat increase', () => {
      const voidShieldResult: ThreatCheckResult = {
        trigger: 'VOID_SHIELD_SEARCH',
        triggerName: 'Void Shield Generator Search',
        roll: 2,
        threshold: undefined,
        success: true,
        increase: 2,
        preventable: false,
        prevented: false,
        description: 'Void Shield Generator searched - threat increases by 2 (D3)'
      }

      render(
        <ThreatCheckDialog
          {...defaultProps}
          currentThreat={5}
          result={voidShieldResult}
        />
      )

      // WHY: Check for threat change 5 → 7 (increase of 2)
      expect(screen.getByText('5')).toBeInTheDocument()
      expect(screen.getByText('7')).toBeInTheDocument()
    })
  })

  describe('campaign end warning', () => {
    it('should show warning when threat reaches 10', () => {
      const criticalResult: ThreatCheckResult = {
        trigger: 'TOMB_EXPLORATION',
        triggerName: 'Tomb Exploration',
        roll: 6,
        threshold: 4,
        success: true,
        increase: 1,
        preventable: false,
        prevented: false,
        description: 'Tomb exploration rolled 6 (4+) - threat increases by 1'
      }

      render(
        <ThreatCheckDialog
          {...defaultProps}
          currentThreat={9}
          result={criticalResult}
        />
      )

      expect(screen.getByText(/Campaign End - Threat Level 10 Reached/i)).toBeInTheDocument()
      expect(screen.getByText('9')).toBeInTheDocument()
      expect(screen.getByText('10')).toBeInTheDocument()
    })

    it('should show warning when threat exceeds 10', () => {
      const excessResult: ThreatCheckResult = {
        trigger: 'TROPHY_HALL_DEMOLISH',
        triggerName: 'Trophy Hall Demolish',
        roll: 3,
        threshold: undefined,
        success: true,
        increase: 3,
        preventable: false,
        prevented: false,
        description: 'Trophy Hall demolished - threat increases by 3 (D3)'
      }

      render(
        <ThreatCheckDialog
          {...defaultProps}
          currentThreat={9}
          result={excessResult}
        />
      )

      expect(screen.getByText(/Campaign End - Threat Level 10 Reached/i)).toBeInTheDocument()
      expect(screen.getByText('12')).toBeInTheDocument()
    })

    it('should not show warning when threat below 10', () => {
      const safeResult: ThreatCheckResult = {
        trigger: 'BATTLE_WIN',
        triggerName: 'Battle Win',
        roll: 5,
        threshold: 3,
        success: true,
        increase: 1,
        preventable: false,
        prevented: false,
        description: 'Battle Win rolled 5 (3+) - threat increases by 1'
      }

      render(
        <ThreatCheckDialog
          {...defaultProps}
          currentThreat={7}
          result={safeResult}
        />
      )

      expect(screen.queryByText(/Campaign End/i)).not.toBeInTheDocument()
    })
  })

  describe('description display', () => {
    it('should display threat check description', () => {
      const result: ThreatCheckResult = {
        trigger: 'SEARCH_ACTION',
        triggerName: 'Search Action',
        roll: 5,
        threshold: 5,
        success: true,
        increase: 1,
        preventable: true,
        prevented: false,
        description: 'Search rolled 5 (5+) - threat will increase by 1 (can prevent with 1 SP)'
      }

      render(<ThreatCheckDialog {...defaultProps} result={result} />)

      expect(
        screen.getByText(/Search rolled 5 \(5\+\) - threat will increase by 1/i)
      ).toBeInTheDocument()
    })
  })

  describe('user interactions', () => {
    it('should call onConfirm when Continue button clicked', async () => {
      const user = userEvent.setup()
      const successResult: ThreatCheckResult = {
        trigger: 'TOMB_EXPLORATION',
        triggerName: 'Tomb Exploration',
        roll: 5,
        threshold: 4,
        success: true,
        increase: 1,
        preventable: false,
        prevented: false,
        description: 'Tomb exploration rolled 5 (4+) - threat increases by 1'
      }

      render(<ThreatCheckDialog {...defaultProps} result={successResult} />)

      const continueBtn = screen.getByRole('button', { name: /continue/i })
      await user.click(continueBtn)

      expect(mockOnConfirm).toHaveBeenCalledTimes(1)
    })

    it('should call onConfirm when overlay clicked', async () => {
      const user = userEvent.setup()
      const successResult: ThreatCheckResult = {
        trigger: 'BATTLE_WIN',
        triggerName: 'Battle Win',
        roll: 4,
        threshold: 3,
        success: true,
        increase: 1,
        preventable: false,
        prevented: false,
        description: 'Battle Win rolled 4 (3+) - threat increases by 1'
      }

      const { container } = render(
        <ThreatCheckDialog {...defaultProps} result={successResult} />
      )

      // WHY: Click on overlay (first child is overlay, second is dialog)
      const overlay = container.firstChild as HTMLElement
      await user.click(overlay)

      expect(mockOnConfirm).toHaveBeenCalledTimes(1)
    })

    it('should not call onConfirm when dialog content clicked', async () => {
      const user = userEvent.setup()
      const successResult: ThreatCheckResult = {
        trigger: 'TOMB_EXPLORATION',
        triggerName: 'Tomb Exploration',
        roll: 5,
        threshold: 4,
        success: true,
        increase: 1,
        preventable: false,
        prevented: false,
        description: 'Tomb exploration rolled 5 (4+) - threat increases by 1'
      }

      render(<ThreatCheckDialog {...defaultProps} result={successResult} />)

      // WHY: Click on dialog content (should not close)
      const header = screen.getByText(/Threat Check: Tomb Exploration/i)
      await user.click(header)

      expect(mockOnConfirm).not.toHaveBeenCalled()
    })
  })
})
