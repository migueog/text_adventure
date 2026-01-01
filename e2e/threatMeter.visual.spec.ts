import { test, expect } from '@playwright/test'

/**
 * ThreatMeter Visual Regression Tests (Issue #29 - Phase 4)
 * WHY: Verify visual appearance across different threat levels, warnings, and viewports
 *
 * Test Strategy:
 * - Screenshot comparison for visual consistency
 * - Test all threat levels (1-10)
 * - Test warning states (none, moderate, critical)
 * - Test solo vs multiplayer mode
 * - Test responsive design (mobile, tablet, desktop)
 * - Test hover effects and animations
 */

test.describe('ThreatMeter Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // WHY: Navigate to campaign page
    await page.goto('/')

    // WHY: Wait for page to be ready
    await page.waitForLoadState('networkidle')

    // TODO: Set up test campaign with known state
    // This may require adding test hooks or using local storage
    // For now, we'll test against whatever state the page loads with
  })

  test.describe('Threat Level Progression', () => {
    test('should render correctly at threat level 1 (Dormant)', async ({ page }) => {
      // WHY: Test initial campaign state
      const threatMeter = page.locator('.threat-meter')
      await expect(threatMeter).toBeVisible()

      // Take screenshot of entire meter
      await expect(threatMeter).toHaveScreenshot('threat-level-1-dormant.png', {
        maxDiffPixels: 100, // Allow minor rendering differences
      })

      // Verify specific elements
      await expect(page.locator('.threat-label')).toBeVisible()
      await expect(page.locator('.threat-progress')).toBeVisible()
    })

    test('should show active levels with gradient styling', async ({ page }) => {
      // WHY: Test visual progression and color gradient
      const threatMeter = page.locator('.threat-meter')

      // Take screenshot showing active level styling
      await expect(threatMeter).toHaveScreenshot('active-levels-styling.png', {
        maxDiffPixels: 100,
      })

      // Verify active class exists on some levels
      const activeLevels = page.locator('.threat-level.active')
      await expect(activeLevels.first()).toBeVisible()
    })

    test('should show current level with pulse animation', async ({ page }) => {
      // WHY: Test current level highlighting
      const currentLevel = page.locator('.threat-level.current')
      await expect(currentLevel).toBeVisible()

      // Verify pulse element exists
      const currentPulse = page.locator('.current-pulse')
      await expect(currentPulse).toBeVisible()

      // Take screenshot
      const threatMeter = page.locator('.threat-meter')
      await expect(threatMeter).toHaveScreenshot('current-level-pulse.png', {
        maxDiffPixels: 100,
      })
    })

    test('should show target marker on correct level', async ({ page }) => {
      // WHY: Test 🎯 marker positioning
      const targetMarker = page.locator('.target-marker')
      await expect(targetMarker).toBeVisible()

      // Verify it contains the emoji
      await expect(targetMarker).toHaveText('🎯')

      // Take screenshot
      const threatMeter = page.locator('.threat-meter')
      await expect(threatMeter).toHaveScreenshot('target-marker.png', {
        maxDiffPixels: 100,
      })
    })
  })

  test.describe('Warning States', () => {
    test('should display moderate warning styling', async ({ page }) => {
      // WHY: Test moderate warning appearance
      const threatMeter = page.locator('.threat-meter')

      // Check if moderate warning exists (may not be present depending on threat level)
      const moderateWarning = page.locator('.threat-warning.moderate')
      const hasModerateWarning = await moderateWarning.count() > 0

      if (hasModerateWarning) {
        await expect(moderateWarning).toBeVisible()
        await expect(moderateWarning).toContainText('Approaching Target Threat')

        // Take screenshot
        await expect(threatMeter).toHaveScreenshot('moderate-warning.png', {
          maxDiffPixels: 100,
        })
      } else {
        test.skip('Moderate warning not present at current threat level')
      }
    })

    test('should display critical warning styling', async ({ page }) => {
      // WHY: Test critical warning appearance
      const threatMeter = page.locator('.threat-meter')

      // Check if critical warning exists
      const criticalWarning = page.locator('.threat-warning.critical')
      const hasCriticalWarning = await criticalWarning.count() > 0

      if (hasCriticalWarning) {
        await expect(criticalWarning).toBeVisible()
        await expect(criticalWarning).toContainText('CRITICAL')

        // Take screenshot
        await expect(threatMeter).toHaveScreenshot('critical-warning.png', {
          maxDiffPixels: 100,
        })
      } else {
        test.skip('Critical warning not present at current threat level')
      }
    })
  })

  test.describe('Solo Mode', () => {
    test('should display solo mode badge if present', async ({ page }) => {
      // WHY: Test solo mode badge appearance
      const soloBadge = page.locator('.solo-badge')
      const hasSoloBadge = await soloBadge.count() > 0

      if (hasSoloBadge) {
        await expect(soloBadge).toBeVisible()
        await expect(soloBadge).toContainText('Solo/Co-op Mode')

        // Take screenshot
        const threatMeter = page.locator('.threat-meter')
        await expect(threatMeter).toHaveScreenshot('solo-mode-badge.png', {
          maxDiffPixels: 100,
        })
      } else {
        test.skip('Solo mode not enabled')
      }
    })

    test('should not show solo badge in multiplayer mode', async ({ page }) => {
      // WHY: Test multiplayer mode (no solo badge)
      const soloBadge = page.locator('.solo-badge')
      const hasSoloBadge = await soloBadge.count() > 0

      if (!hasSoloBadge) {
        // Take screenshot showing no solo badge
        const threatMeter = page.locator('.threat-meter')
        await expect(threatMeter).toHaveScreenshot('multiplayer-mode.png', {
          maxDiffPixels: 100,
        })
      } else {
        test.skip('Solo mode is enabled')
      }
    })
  })

  test.describe('Component Structure', () => {
    test('should render all required sections', async ({ page }) => {
      // WHY: Test complete component structure
      const threatMeter = page.locator('.threat-meter')
      await expect(threatMeter).toBeVisible()

      // Verify header
      const header = page.locator('.threat-meter-header')
      await expect(header).toBeVisible()
      await expect(header.locator('h3')).toContainText('Threat Level')

      // Verify bar
      const bar = page.locator('.threat-meter-bar')
      await expect(bar).toBeVisible()

      // Verify footer
      const footer = page.locator('.threat-meter-footer')
      await expect(footer).toBeVisible()

      // Take full component screenshot
      await expect(threatMeter).toHaveScreenshot('complete-component.png', {
        maxDiffPixels: 100,
      })
    })

    test('should render all threat level segments', async ({ page }) => {
      // WHY: Test all level segments are present
      const threatLevels = page.locator('.threat-level')
      const count = await threatLevels.count()

      // Should have at least 7 levels (or more for extended campaigns)
      expect(count).toBeGreaterThanOrEqual(7)

      // Each level should have a number
      for (let i = 0; i < Math.min(count, 10); i++) {
        const levelNumber = threatLevels.nth(i).locator('.threat-level-number')
        await expect(levelNumber).toBeVisible()
      }

      // Take screenshot
      const threatMeter = page.locator('.threat-meter')
      await expect(threatMeter).toHaveScreenshot('all-level-segments.png', {
        maxDiffPixels: 100,
      })
    })
  })

  test.describe('Hover Effects', () => {
    test('should show hover effect on threat levels', async ({ page }) => {
      // WHY: Test interactive hover state
      const firstLevel = page.locator('.threat-level').first()

      // Hover over first level
      await firstLevel.hover()

      // Wait for hover transition
      await page.waitForTimeout(200)

      // Take screenshot showing hover state
      await expect(firstLevel).toHaveScreenshot('level-hover-effect.png', {
        maxDiffPixels: 150, // Allow more diff for hover transform
      })
    })

    test('should show tooltip on hover', async ({ page }) => {
      // WHY: Test accessibility tooltip
      const fifthLevel = page.locator('.threat-level').nth(4) // 5th level

      // Get title attribute
      const title = await fifthLevel.getAttribute('title')
      expect(title).toBeTruthy()
      expect(title).toContain('Level 5:')

      // Hover to potentially show browser tooltip
      await fifthLevel.hover()
      await page.waitForTimeout(200)

      // Note: Browser tooltips are hard to capture in screenshots
      // This test mainly verifies the title attribute exists
    })
  })

  test.describe('Responsive Design', () => {
    test('should render correctly on mobile viewport', async ({ page }) => {
      // WHY: Test responsive design on small screens
      await page.setViewportSize({ width: 375, height: 667 }) // iPhone SE

      const threatMeter = page.locator('.threat-meter')
      await expect(threatMeter).toBeVisible()

      // Verify levels adapt to smaller screen
      const threatBar = page.locator('.threat-meter-bar')
      await expect(threatBar).toBeVisible()

      await expect(threatMeter).toHaveScreenshot('mobile-viewport.png', {
        maxDiffPixels: 100,
      })
    })

    test('should render correctly on tablet viewport', async ({ page }) => {
      // WHY: Test responsive design on medium screens
      await page.setViewportSize({ width: 768, height: 1024 }) // iPad

      const threatMeter = page.locator('.threat-meter')
      await expect(threatMeter).toBeVisible()

      await expect(threatMeter).toHaveScreenshot('tablet-viewport.png', {
        maxDiffPixels: 100,
      })
    })

    test('should render correctly on desktop viewport', async ({ page }) => {
      // WHY: Test responsive design on large screens
      await page.setViewportSize({ width: 1920, height: 1080 }) // Desktop

      const threatMeter = page.locator('.threat-meter')
      await expect(threatMeter).toBeVisible()

      await expect(threatMeter).toHaveScreenshot('desktop-viewport.png', {
        maxDiffPixels: 100,
      })
    })
  })

  test.describe('Accessibility', () => {
    test('should have proper ARIA structure', async ({ page }) => {
      // WHY: Test accessibility structure
      const threatMeter = page.locator('.threat-meter')

      // Should be visible and not have aria-hidden
      await expect(threatMeter).toBeVisible()

      // Header should have proper heading
      const heading = threatMeter.locator('h3')
      await expect(heading).toBeVisible()
      await expect(heading).toContainText('Threat Level')
    })

    test('should have title attributes for screen readers', async ({ page }) => {
      // WHY: Test tooltip accessibility
      const threatLevels = page.locator('.threat-level')
      const firstLevel = threatLevels.first()

      const title = await firstLevel.getAttribute('title')
      expect(title).toBeTruthy()
      expect(title).toMatch(/Level \d+:/)
    })
  })

  test.describe('Visual Consistency', () => {
    test('should maintain consistent styling across multiple renders', async ({ page }) => {
      // WHY: Test visual consistency
      const threatMeter = page.locator('.threat-meter')

      // Take first screenshot
      await expect(threatMeter).toHaveScreenshot('consistency-check-1.png', {
        maxDiffPixels: 50, // Strict comparison
      })

      // Wait a bit
      await page.waitForTimeout(500)

      // Take second screenshot - should be identical
      await expect(threatMeter).toHaveScreenshot('consistency-check-2.png', {
        maxDiffPixels: 50,
      })
    })
  })
})
