import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CollapsibleMenu from './CollapsibleMenu'

// WHY: Mock localStorage for persistence testing
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    }
  }
})()

// WHY: Setup localStorage mock before tests
beforeEach(() => {
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true
  })
  localStorageMock.clear()
})

describe('CollapsibleMenu', () => {
  describe('when rendering with default props', () => {
    it('should render children content', () => {
      render(
        <CollapsibleMenu>
          <div data-testid="test-content">Menu Content</div>
        </CollapsibleMenu>
      )

      expect(screen.getByTestId('test-content')).toBeInTheDocument()
    })

    it('should be open by default', () => {
      const { container } = render(
        <CollapsibleMenu>
          <div>Menu Content</div>
        </CollapsibleMenu>
      )

      const menu = container.querySelector('.collapsible-menu')
      expect(menu).toHaveClass('open')
    })

    it('should render hamburger toggle button', () => {
      render(
        <CollapsibleMenu>
          <div>Menu Content</div>
        </CollapsibleMenu>
      )

      expect(screen.getByRole('button', { name: /toggle menu/i })).toBeInTheDocument()
    })
  })

  describe('when using defaultOpen prop', () => {
    it('should start collapsed when defaultOpen is false', () => {
      const { container } = render(
        <CollapsibleMenu defaultOpen={false}>
          <div>Menu Content</div>
        </CollapsibleMenu>
      )

      const menu = container.querySelector('.collapsible-menu')
      expect(menu).toHaveClass('collapsed')
    })

    it('should start open when defaultOpen is true', () => {
      const { container } = render(
        <CollapsibleMenu defaultOpen={true}>
          <div>Menu Content</div>
        </CollapsibleMenu>
      )

      const menu = container.querySelector('.collapsible-menu')
      expect(menu).toHaveClass('open')
    })
  })

  describe('when toggling menu state', () => {
    it('should toggle from open to collapsed when button clicked', async () => {
      const user = userEvent.setup()
      const { container } = render(
        <CollapsibleMenu>
          <div>Menu Content</div>
        </CollapsibleMenu>
      )

      const toggleButton = screen.getByRole('button', { name: /toggle menu/i })
      const menu = container.querySelector('.collapsible-menu')

      // WHY: Verify initial state
      expect(menu).toHaveClass('open')

      // WHY: Click toggle button
      await user.click(toggleButton)

      // WHY: Verify collapsed state
      expect(menu).toHaveClass('collapsed')
    })

    it('should toggle from collapsed to open when button clicked', async () => {
      const user = userEvent.setup()
      const { container } = render(
        <CollapsibleMenu defaultOpen={false}>
          <div>Menu Content</div>
        </CollapsibleMenu>
      )

      const toggleButton = screen.getByRole('button', { name: /toggle menu/i })
      const menu = container.querySelector('.collapsible-menu')

      // WHY: Verify initial collapsed state
      expect(menu).toHaveClass('collapsed')

      // WHY: Click toggle button
      await user.click(toggleButton)

      // WHY: Verify open state
      expect(menu).toHaveClass('open')
    })

    it('should toggle multiple times correctly', async () => {
      const user = userEvent.setup()
      const { container } = render(
        <CollapsibleMenu>
          <div>Menu Content</div>
        </CollapsibleMenu>
      )

      const toggleButton = screen.getByRole('button', { name: /toggle menu/i })
      const menu = container.querySelector('.collapsible-menu')

      expect(menu).toHaveClass('open')
      await user.click(toggleButton)
      expect(menu).toHaveClass('collapsed')
      await user.click(toggleButton)
      expect(menu).toHaveClass('open')
      await user.click(toggleButton)
      expect(menu).toHaveClass('collapsed')
    })
  })

  describe('when persisting state to localStorage', () => {
    it('should save open state to localStorage when toggled', async () => {
      const user = userEvent.setup()
      render(
        <CollapsibleMenu>
          <div>Menu Content</div>
        </CollapsibleMenu>
      )

      const toggleButton = screen.getByRole('button', { name: /toggle menu/i })

      // WHY: Click to collapse
      await user.click(toggleButton)

      // WHY: Verify localStorage was updated
      expect(localStorage.getItem('collapsible-menu-open')).toBe('false')
    })

    it('should save collapsed state to localStorage when toggled', async () => {
      const user = userEvent.setup()
      render(
        <CollapsibleMenu defaultOpen={false}>
          <div>Menu Content</div>
        </CollapsibleMenu>
      )

      const toggleButton = screen.getByRole('button', { name: /toggle menu/i })

      // WHY: Click to open
      await user.click(toggleButton)

      // WHY: Verify localStorage was updated
      expect(localStorage.getItem('collapsible-menu-open')).toBe('true')
    })

    it('should restore state from localStorage on mount', () => {
      // WHY: Set localStorage to collapsed state
      localStorage.setItem('collapsible-menu-open', 'false')

      const { container } = render(
        <CollapsibleMenu>
          <div>Menu Content</div>
        </CollapsibleMenu>
      )

      const menu = container.querySelector('.collapsible-menu')
      expect(menu).toHaveClass('collapsed')
    })

    it('should prioritize localStorage over defaultOpen prop', () => {
      // WHY: Set localStorage to open state
      localStorage.setItem('collapsible-menu-open', 'true')

      const { container } = render(
        <CollapsibleMenu defaultOpen={false}>
          <div>Menu Content</div>
        </CollapsibleMenu>
      )

      // WHY: Should use localStorage value (true) instead of defaultOpen (false)
      const menu = container.querySelector('.collapsible-menu')
      expect(menu).toHaveClass('open')
    })
  })

  describe('when rendering toggle button tooltip', () => {
    it('should show "Collapse Menu" tooltip when menu is open', () => {
      render(
        <CollapsibleMenu>
          <div>Menu Content</div>
        </CollapsibleMenu>
      )

      const toggleButton = screen.getByRole('button', { name: /toggle menu/i })
      expect(toggleButton).toHaveAttribute('title', 'Collapse Menu')
    })

    it('should show "Expand Menu" tooltip when menu is collapsed', () => {
      render(
        <CollapsibleMenu defaultOpen={false}>
          <div>Menu Content</div>
        </CollapsibleMenu>
      )

      const toggleButton = screen.getByRole('button', { name: /toggle menu/i })
      expect(toggleButton).toHaveAttribute('title', 'Expand Menu')
    })

    it('should update tooltip when toggled', async () => {
      const user = userEvent.setup()
      render(
        <CollapsibleMenu>
          <div>Menu Content</div>
        </CollapsibleMenu>
      )

      const toggleButton = screen.getByRole('button', { name: /toggle menu/i })

      // WHY: Initial tooltip
      expect(toggleButton).toHaveAttribute('title', 'Collapse Menu')

      // WHY: Toggle to collapsed
      await user.click(toggleButton)
      expect(toggleButton).toHaveAttribute('title', 'Expand Menu')

      // WHY: Toggle back to open
      await user.click(toggleButton)
      expect(toggleButton).toHaveAttribute('title', 'Collapse Menu')
    })
  })
})
