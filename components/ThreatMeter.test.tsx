import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import ThreatMeter from './ThreatMeter'

// WHY: Import THREAT_LEVELS to verify component uses correct labels
import { THREAT_LEVELS } from '@/lib/data/campaignData'

describe('ThreatMeter Component (Issue #29)', () => {

  describe('Rendering', () => {
    it('should render correct number of threat level segments', () => {
      // WHY: Meter should display segments from 1 to targetThreat (or 10, whichever is larger)
      const { container } = render(
        <ThreatMeter currentThreat={3} targetThreat={7} soloMode={false} />
      )

      const threatLevels = container.querySelectorAll('.threat-level')
      expect(threatLevels.length).toBe(10) // Max of target=7 and default display=10
    })

    it('should display current threat level with active styling', () => {
      // WHY: All levels <= currentThreat should have 'active' class
      const { container } = render(
        <ThreatMeter currentThreat={3} targetThreat={7} soloMode={false} />
      )

      const activeLevels = container.querySelectorAll('.threat-level.active')
      expect(activeLevels.length).toBe(3) // Levels 1, 2, 3 should be active
    })

    it('should show target marker on target level', () => {
      // WHY: Target level should display 🎯 emoji marker
      const { container } = render(
        <ThreatMeter currentThreat={3} targetThreat={7} soloMode={false} />
      )

      const targetMarkers = container.querySelectorAll('.target-marker')
      expect(targetMarkers.length).toBe(1)
      expect(targetMarkers[0]?.textContent).toBe('🎯')

      // Verify it's on the correct level (7th)
      const targetLevel = container.querySelector('.threat-level.target')
      expect(targetLevel).toBeTruthy()
      expect(targetLevel?.querySelector('.threat-level-number')?.textContent).toBe('7')
    })

    it('should display solo mode badge when soloMode is true', () => {
      // WHY: Solo/Co-op mode should show distinctive badge
      render(<ThreatMeter currentThreat={3} targetThreat={7} soloMode={true} />)

      const soloBadge = screen.getByText('Solo/Co-op Mode')
      expect(soloBadge).toBeInTheDocument()
      expect(soloBadge.className).toContain('solo-badge')
    })

    it('should hide solo badge when soloMode is false', () => {
      // WHY: Multiplayer mode should not show solo badge
      render(<ThreatMeter currentThreat={3} targetThreat={7} soloMode={false} />)

      const soloBadge = screen.queryByText('Solo/Co-op Mode')
      expect(soloBadge).not.toBeInTheDocument()
    })

    it('should display correct threat label from THREAT_LEVELS', () => {
      // WHY: Current threat level should display descriptive label
      render(<ThreatMeter currentThreat={5} targetThreat={7} soloMode={false} />)

      const threatLabel = screen.getByText('Hostile')
      expect(threatLabel).toBeInTheDocument()
      expect(threatLabel.className).toContain('threat-label')
    })

    it('should show progress as "current / target"', () => {
      // WHY: Progress indicator shows current vs target
      render(<ThreatMeter currentThreat={3} targetThreat={7} soloMode={false} />)

      const progress = screen.getByText('3 / 7')
      expect(progress).toBeInTheDocument()
      expect(progress.className).toContain('threat-progress')
    })

    it('should display meter header with title', () => {
      // WHY: Component should have clear title
      render(<ThreatMeter currentThreat={3} targetThreat={7} soloMode={false} />)

      const header = screen.getByText('Threat Level')
      expect(header).toBeInTheDocument()
      expect(header.tagName).toBe('H3')
    })
  })

  describe('Visual Feedback', () => {
    it('should apply active class to all levels <= currentThreat', () => {
      // WHY: Visual progression shows filled levels
      const { container } = render(
        <ThreatMeter currentThreat={4} targetThreat={7} soloMode={false} />
      )

      const allLevels = container.querySelectorAll('.threat-level')
      const activeLevels = container.querySelectorAll('.threat-level.active')

      expect(activeLevels.length).toBe(4) // Levels 1-4 active

      // Verify first 4 are active, rest are not
      for (let i = 0; i < 4; i++) {
        expect(allLevels[i]?.className).toContain('active')
      }
      for (let i = 4; i < allLevels.length; i++) {
        expect(allLevels[i]?.className).not.toContain('active')
      }
    })

    it('should apply current class only to currentThreat level', () => {
      // WHY: Current level should be distinctly marked
      const { container } = render(
        <ThreatMeter currentThreat={5} targetThreat={7} soloMode={false} />
      )

      const currentLevels = container.querySelectorAll('.threat-level.current')
      expect(currentLevels.length).toBe(1)

      const currentNumber = currentLevels[0]?.querySelector('.threat-level-number')
      expect(currentNumber?.textContent).toBe('5')
    })

    it('should apply target class only to targetThreat level', () => {
      // WHY: Target level should be distinctly marked
      const { container } = render(
        <ThreatMeter currentThreat={3} targetThreat={8} soloMode={false} />
      )

      const targetLevels = container.querySelectorAll('.threat-level.target')
      expect(targetLevels.length).toBe(1)

      const targetNumber = targetLevels[0]?.querySelector('.threat-level-number')
      expect(targetNumber?.textContent).toBe('8')
    })

    it('should show current pulse element on current level', () => {
      // WHY: Current level has pulse animation element
      const { container } = render(
        <ThreatMeter currentThreat={5} targetThreat={7} soloMode={false} />
      )

      const currentPulse = container.querySelector('.current-pulse')
      expect(currentPulse).toBeInTheDocument()

      // Verify it's inside the current level
      const currentLevel = container.querySelector('.threat-level.current')
      expect(currentLevel?.contains(currentPulse!)).toBe(true)
    })

    it('should trigger pulse animation when threat increases', () => {
      // WHY: Visual feedback on threat increase
      // Note: This test verifies the animation is triggered on currentThreat change
      // The useEffect hook always triggers on mount and currentThreat changes

      const { container, rerender } = render(
        <ThreatMeter currentThreat={3} targetThreat={7} soloMode={false} />
      )

      // Initial render triggers the animation (useEffect runs on mount with currentThreat)
      let currentLevel = container.querySelector('.threat-level.current')
      expect(currentLevel?.className).toContain('increased')

      // Increase threat - this should trigger animation again
      rerender(<ThreatMeter currentThreat={4} targetThreat={7} soloMode={false} />)

      // Should have increased class after change
      currentLevel = container.querySelector('.threat-level.current')
      expect(currentLevel?.className).toContain('increased')

      // Verify the animation is controlled by recentlyIncreased state
      // (The timeout removes it after 2s, but we don't need to test setTimeout)
    })

    it('should display tooltip on hover with level name', () => {
      // WHY: Accessibility - show level name on hover
      const { container } = render(
        <ThreatMeter currentThreat={3} targetThreat={7} soloMode={false} />
      )

      const level5 = Array.from(container.querySelectorAll('.threat-level'))[4] // 5th level
      expect(level5?.getAttribute('title')).toBe('Level 5: Hostile')
    })
  })

  describe('Warning System', () => {
    it('should display critical warning with correct styling', () => {
      // WHY: Critical warning when 1 level from target
      render(
        <ThreatMeter
          currentThreat={6}
          targetThreat={7}
          soloMode={false}
          warningLevel="critical"
        />
      )

      const warning = screen.getByText(/CRITICAL - Campaign Ending Soon!/i)
      expect(warning).toBeInTheDocument()
      expect(warning.className).toContain('threat-warning')
      expect(warning.className).toContain('critical')
    })

    it('should display moderate warning with correct styling', () => {
      // WHY: Moderate warning when 2 levels from target
      render(
        <ThreatMeter
          currentThreat={5}
          targetThreat={7}
          soloMode={false}
          warningLevel="moderate"
        />
      )

      const warning = screen.getByText(/Approaching Target Threat/i)
      expect(warning).toBeInTheDocument()
      expect(warning.className).toContain('threat-warning')
      expect(warning.className).toContain('moderate')
    })

    it('should not display warning when level is none', () => {
      // WHY: No warning when far from target
      render(
        <ThreatMeter
          currentThreat={3}
          targetThreat={7}
          soloMode={false}
          warningLevel="none"
        />
      )

      const criticalWarning = screen.queryByText(/CRITICAL/i)
      const moderateWarning = screen.queryByText(/Approaching Target/i)

      expect(criticalWarning).not.toBeInTheDocument()
      expect(moderateWarning).not.toBeInTheDocument()
    })

    it('should not display warning when warningLevel is undefined', () => {
      // WHY: Handle undefined warning level gracefully
      render(
        <ThreatMeter currentThreat={3} targetThreat={7} soloMode={false} />
      )

      const criticalWarning = screen.queryByText(/CRITICAL/i)
      const moderateWarning = screen.queryByText(/Approaching Target/i)

      expect(criticalWarning).not.toBeInTheDocument()
      expect(moderateWarning).not.toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle minimum threat level (1)', () => {
      // WHY: Campaign start state
      const { container } = render(
        <ThreatMeter currentThreat={1} targetThreat={7} soloMode={false} />
      )

      const threatLabel = screen.getByText('Dormant')
      expect(threatLabel).toBeInTheDocument()

      const activeLevels = container.querySelectorAll('.threat-level.active')
      expect(activeLevels.length).toBe(1)

      const progress = screen.getByText('1 / 7')
      expect(progress).toBeInTheDocument()
    })

    it('should handle maximum threat level (10)', () => {
      // WHY: Extended campaign state
      const { container } = render(
        <ThreatMeter currentThreat={10} targetThreat={7} soloMode={false} />
      )

      const threatLabel = screen.getByText('Apocalyptic')
      expect(threatLabel).toBeInTheDocument()

      const activeLevels = container.querySelectorAll('.threat-level.active')
      expect(activeLevels.length).toBe(10)

      const progress = screen.getByText('10 / 7')
      expect(progress).toBeInTheDocument()
    })

    it('should extend display when target > 10', () => {
      // WHY: Support extended campaigns
      const { container } = render(
        <ThreatMeter currentThreat={8} targetThreat={12} soloMode={false} />
      )

      const threatLevels = container.querySelectorAll('.threat-level')
      expect(threatLevels.length).toBe(12) // Should display up to 12
    })

    it('should handle current === target (campaign end)', () => {
      // WHY: Campaign completion state
      const { container } = render(
        <ThreatMeter
          currentThreat={7}
          targetThreat={7}
          soloMode={false}
          warningLevel="critical"
        />
      )

      const progress = screen.getByText('7 / 7')
      expect(progress).toBeInTheDocument()

      const currentLevel = container.querySelector('.threat-level.current')
      const targetLevel = container.querySelector('.threat-level.target')

      // Current and target should be the same element
      expect(currentLevel).toBe(targetLevel)

      // Should show critical warning
      const warning = screen.getByText(/CRITICAL/i)
      expect(warning).toBeInTheDocument()
    })

    it('should handle target threat of 1', () => {
      // WHY: Minimal campaign length
      const { container } = render(
        <ThreatMeter currentThreat={1} targetThreat={1} soloMode={false} />
      )

      const progress = screen.getByText('1 / 1')
      expect(progress).toBeInTheDocument()

      const threatLevels = container.querySelectorAll('.threat-level')
      expect(threatLevels.length).toBe(10) // Still displays minimum 10
    })

    it('should display Unknown for invalid threat level', () => {
      // WHY: Graceful handling of out-of-range values
      const { container } = render(
        <ThreatMeter currentThreat={15} targetThreat={20} soloMode={false} />
      )

      // Should show "Unknown" since level 15 not in THREAT_LEVELS
      const unknownLabels = container.querySelectorAll('[title*="Unknown"]')
      expect(unknownLabels.length).toBeGreaterThan(0)
    })
  })

  describe('Component Structure', () => {
    it('should render with correct CSS classes', () => {
      // WHY: Verify component structure for styling
      const { container } = render(
        <ThreatMeter currentThreat={3} targetThreat={7} soloMode={false} />
      )

      expect(container.querySelector('.threat-meter')).toBeInTheDocument()
      expect(container.querySelector('.threat-meter-header')).toBeInTheDocument()
      expect(container.querySelector('.threat-meter-bar')).toBeInTheDocument()
      expect(container.querySelector('.threat-meter-footer')).toBeInTheDocument()
    })

    it('should render all threat level numbers correctly', () => {
      // WHY: Each segment should display its number
      const { container } = render(
        <ThreatMeter currentThreat={5} targetThreat={7} soloMode={false} />
      )

      const levelNumbers = container.querySelectorAll('.threat-level-number')
      expect(levelNumbers.length).toBe(10)

      // Verify numbers are sequential 1-10
      levelNumbers.forEach((el, index) => {
        expect(el.textContent).toBe(String(index + 1))
      })
    })
  })
})
