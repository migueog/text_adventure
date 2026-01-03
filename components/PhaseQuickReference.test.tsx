import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PhaseQuickReference from './PhaseQuickReference'

/**
 * WHY: Tests for PhaseQuickReference component (Issue #33 - Phase 3)
 * Ensures collapsible help section renders correctly and shows phase-specific content
 */

describe('PhaseQuickReference', () => {
  describe('when initially rendered', () => {
    it('should render collapsed by default', () => {
      render(<PhaseQuickReference phase="Movement" />)

      const button = screen.getByRole('button')
      expect(button).toBeDefined()
      expect(button.getAttribute('aria-expanded')).toBe('false')
    })

    it('should show toggle button with phase title', () => {
      render(<PhaseQuickReference phase="Movement" />)

      expect(screen.getByText(/Quick Reference: Movement Phase/i)).toBeDefined()
    })

    it('should show collapsed icon when not expanded', () => {
      render(<PhaseQuickReference phase="Movement" />)

      expect(screen.getByText('▶')).toBeDefined()
    })

    it('should not render content when collapsed', () => {
      render(<PhaseQuickReference phase="Movement" />)

      expect(screen.queryByText('Available Actions')).toBeNull()
      expect(screen.queryByText('Key Rules')).toBeNull()
    })
  })

  describe('when expanding', () => {
    it('should expand when toggle button is clicked', async () => {
      const user = userEvent.setup()
      render(<PhaseQuickReference phase="Movement" />)

      const button = screen.getByRole('button')
      await user.click(button)

      expect(button.getAttribute('aria-expanded')).toBe('true')
    })

    it('should show expanded icon when expanded', async () => {
      const user = userEvent.setup()
      render(<PhaseQuickReference phase="Movement" />)

      const button = screen.getByRole('button')
      await user.click(button)

      expect(screen.getByText('▼')).toBeDefined()
    })

    it('should render content sections when expanded', async () => {
      const user = userEvent.setup()
      render(<PhaseQuickReference phase="Movement" />)

      const button = screen.getByRole('button')
      await user.click(button)

      expect(screen.getByText('Available Actions')).toBeDefined()
      expect(screen.getByText('Key Rules')).toBeDefined()
    })
  })

  describe('when collapsing', () => {
    it('should collapse when toggle button is clicked twice', async () => {
      const user = userEvent.setup()
      render(<PhaseQuickReference phase="Movement" />)

      const button = screen.getByRole('button')

      // Expand
      await user.click(button)
      expect(button.getAttribute('aria-expanded')).toBe('true')

      // Collapse
      await user.click(button)
      expect(button.getAttribute('aria-expanded')).toBe('false')
    })

    it('should hide content when collapsed', async () => {
      const user = userEvent.setup()
      render(<PhaseQuickReference phase="Movement" />)

      const button = screen.getByRole('button')

      // Expand
      await user.click(button)
      expect(screen.getByText('Available Actions')).toBeDefined()

      // Collapse
      await user.click(button)
      expect(screen.queryByText('Available Actions')).toBeNull()
    })
  })

  describe('for Movement phase', () => {
    it('should render Movement phase content', async () => {
      const user = userEvent.setup()
      render(<PhaseQuickReference phase="Movement" />)

      const button = screen.getByRole('button')
      await user.click(button)

      expect(screen.getByText(/Click a hex to move/i)).toBeDefined()
      expect(screen.getByText(/Maximum movement: 3 hexes/i)).toBeDefined()
    })
  })

  describe('for Battle phase', () => {
    it('should render Battle phase content', async () => {
      const user = userEvent.setup()
      render(<PhaseQuickReference phase="Battle" />)

      const button = screen.getByRole('button')
      await user.click(button)

      expect(screen.getByText(/Record battle result/i)).toBeDefined()
      expect(screen.getByText(/Must record result to advance/i)).toBeDefined()
    })

    it('should show Battle Phase in title', () => {
      render(<PhaseQuickReference phase="Battle" />)

      expect(screen.getByText(/Quick Reference: Battle Phase/i)).toBeDefined()
    })
  })

  describe('for Action phase', () => {
    it('should render Action phase content', async () => {
      const user = userEvent.setup()
      render(<PhaseQuickReference phase="Action" />)

      const button = screen.getByRole('button')
      await user.click(button)

      expect(screen.getByText(/Resupply - gain SP/i)).toBeDefined()
      expect(screen.getByText(/Can only perform ONE action/i)).toBeDefined()
    })

    it('should show Action Phase in title', () => {
      render(<PhaseQuickReference phase="Action" />)

      expect(screen.getByText(/Quick Reference: Action Phase/i)).toBeDefined()
    })
  })

  describe('for Threat phase', () => {
    it('should render Threat phase content', async () => {
      const user = userEvent.setup()
      render(<PhaseQuickReference phase="Threat" />)

      const button = screen.getByRole('button')
      await user.click(button)

      expect(screen.getByText(/Threat always increases by \+1/i)).toBeDefined()
    })

    it('should show Threat Phase in title', () => {
      render(<PhaseQuickReference phase="Threat" />)

      expect(screen.getByText(/Quick Reference: Threat Phase/i)).toBeDefined()
    })
  })

  describe('content structure', () => {
    it('should render all available actions as list items', async () => {
      const user = userEvent.setup()
      render(<PhaseQuickReference phase="Movement" />)

      const button = screen.getByRole('button')
      await user.click(button)

      // Movement phase has 3 available actions
      expect(screen.getByText(/Click a hex to move/i)).toBeDefined()
      expect(screen.getByText(/Hold Position/i)).toBeDefined()
      expect(screen.getByText(/Regroup to Base/i)).toBeDefined()
    })

    it('should render all key rules as list items', async () => {
      const user = userEvent.setup()
      render(<PhaseQuickReference phase="Movement" />)

      const button = screen.getByRole('button')
      await user.click(button)

      // Movement phase has 4 key rules
      expect(screen.getByText(/Maximum movement: 3 hexes/i)).toBeDefined()
      expect(screen.getByText(/Cost: 1 SP per hex/i)).toBeDefined()
      expect(screen.getByText(/Max 2 players per hex/i)).toBeDefined()
      expect(screen.getByText(/Cannot move to blocked hexes/i)).toBeDefined()
    })
  })
})
