import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LeftMenuTabs from './LeftMenuTabs'
import type { Player, Hex, Event } from '@/types/campaign'

describe('LeftMenuTabs', () => {
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
    }
  ]

  const mockHex: Hex = {
    id: '2,3',
    row: 2,
    col: 3,
    type: 'surface',
    location: 15,
    condition: 20,
    explored: true,
    exploredBy: [1]
  }

  const mockEvents: Event[] = [
    {
      type: 'movement',
      icon: '→',
      message: 'Alice moved to hex 2,3',
      round: 1,
      phase: 'Movement',
      timestamp: '2024-01-01T00:00:00Z'
    }
  ]

  const mockStandings = {
    warlord: { playerId: 1, points: 5, label: 'Most Battles Won' },
    explorer: { playerId: 1, points: 3, label: 'Most Hexes Explored' },
    headhunter: { playerId: 1, points: 10, label: 'Most Operatives Killed' },
    pioneer: { playerId: 1, points: 15, label: 'Most SP Spent' },
    trooper: { playerId: 1, points: 8, label: 'Most Battles Played' }
  }

  describe('when rendering tab navigation', () => {
    it('should display all 4 tabs in multi-player mode', () => {
      render(
        <LeftMenuTabs
          players={mockPlayers}
          selectedHex={null}
          eventLog={mockEvents}
          standings={mockStandings}
          isSoloMode={false}
        />
      )

      expect(screen.getByRole('tab', { name: /players/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /hex info/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /event log/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /standings/i })).toBeInTheDocument()
    })

    it('should hide Standings tab in solo mode', () => {
      render(
        <LeftMenuTabs
          players={mockPlayers}
          selectedHex={null}
          eventLog={mockEvents}
          standings={mockStandings}
          isSoloMode={true}
        />
      )

      expect(screen.getByRole('tab', { name: /players/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /hex info/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /event log/i })).toBeInTheDocument()
      expect(screen.queryByRole('tab', { name: /standings/i })).not.toBeInTheDocument()
    })

    it('should show Players tab as active by default', () => {
      render(
        <LeftMenuTabs
          players={mockPlayers}
          selectedHex={null}
          eventLog={mockEvents}
          standings={mockStandings}
          isSoloMode={false}
        />
      )

      const playersTab = screen.getByRole('tab', { name: /players/i })
      expect(playersTab).toHaveAttribute('aria-selected', 'true')
    })
  })

  describe('when switching tabs', () => {
    it('should switch to Hex Info tab when clicked', async () => {
      const user = userEvent.setup()
      render(
        <LeftMenuTabs
          players={mockPlayers}
          selectedHex={null}
          eventLog={mockEvents}
          standings={mockStandings}
          isSoloMode={false}
        />
      )

      const hexInfoTab = screen.getByRole('tab', { name: /hex info/i })
      await user.click(hexInfoTab)

      expect(hexInfoTab).toHaveAttribute('aria-selected', 'true')
    })

    it('should switch to Event Log tab when clicked', async () => {
      const user = userEvent.setup()
      render(
        <LeftMenuTabs
          players={mockPlayers}
          selectedHex={null}
          eventLog={mockEvents}
          standings={mockStandings}
          isSoloMode={false}
        />
      )

      const eventLogTab = screen.getByRole('tab', { name: /event log/i })
      await user.click(eventLogTab)

      expect(eventLogTab).toHaveAttribute('aria-selected', 'true')
    })

    it('should switch to Standings tab when clicked', async () => {
      const user = userEvent.setup()
      render(
        <LeftMenuTabs
          players={mockPlayers}
          selectedHex={null}
          eventLog={mockEvents}
          standings={mockStandings}
          isSoloMode={false}
        />
      )

      const standingsTab = screen.getByRole('tab', { name: /standings/i })
      await user.click(standingsTab)

      expect(standingsTab).toHaveAttribute('aria-selected', 'true')
    })

    it('should deactivate previous tab when switching', async () => {
      const user = userEvent.setup()
      render(
        <LeftMenuTabs
          players={mockPlayers}
          selectedHex={null}
          eventLog={mockEvents}
          standings={mockStandings}
          isSoloMode={false}
        />
      )

      const playersTab = screen.getByRole('tab', { name: /players/i })
      const hexInfoTab = screen.getByRole('tab', { name: /hex info/i })

      // WHY: Verify initial state
      expect(playersTab).toHaveAttribute('aria-selected', 'true')

      // WHY: Switch tabs
      await user.click(hexInfoTab)

      // WHY: Verify players tab is no longer active
      expect(playersTab).toHaveAttribute('aria-selected', 'false')
      expect(hexInfoTab).toHaveAttribute('aria-selected', 'true')
    })
  })

  describe('when auto-switching to Hex Info tab', () => {
    it('should auto-switch to Hex Info when hex is selected', () => {
      const { rerender } = render(
        <LeftMenuTabs
          players={mockPlayers}
          selectedHex={null}
          eventLog={mockEvents}
          standings={mockStandings}
          isSoloMode={false}
        />
      )

      // WHY: Initially on Players tab
      const playersTab = screen.getByRole('tab', { name: /players/i })
      expect(playersTab).toHaveAttribute('aria-selected', 'true')

      // WHY: Rerender with selected hex
      rerender(
        <LeftMenuTabs
          players={mockPlayers}
          selectedHex={mockHex}
          eventLog={mockEvents}
          standings={mockStandings}
          isSoloMode={false}
        />
      )

      // WHY: Should auto-switch to Hex Info tab
      const hexInfoTab = screen.getByRole('tab', { name: /hex info/i })
      expect(hexInfoTab).toHaveAttribute('aria-selected', 'true')
    })

    it('should not auto-switch if already on Hex Info tab', () => {
      const { rerender } = render(
        <LeftMenuTabs
          players={mockPlayers}
          selectedHex={mockHex}
          eventLog={mockEvents}
          standings={mockStandings}
          isSoloMode={false}
        />
      )

      // WHY: Should start on Hex Info tab
      const hexInfoTab = screen.getByRole('tab', { name: /hex info/i })
      expect(hexInfoTab).toHaveAttribute('aria-selected', 'true')

      // WHY: Rerender with same hex
      rerender(
        <LeftMenuTabs
          players={mockPlayers}
          selectedHex={mockHex}
          eventLog={mockEvents}
          standings={mockStandings}
          isSoloMode={false}
        />
      )

      // WHY: Should still be on Hex Info tab
      expect(hexInfoTab).toHaveAttribute('aria-selected', 'true')
    })
  })

  describe('when rendering tab content', () => {
    it('should display players panel content when Players tab is active', () => {
      render(
        <LeftMenuTabs
          players={mockPlayers}
          selectedHex={null}
          eventLog={mockEvents}
          standings={mockStandings}
          isSoloMode={false}
        />
      )

      // WHY: Should render player name
      expect(screen.getByText('Alice')).toBeInTheDocument()
    })

    it('should display hex info message when Hex Info tab is active but no hex selected', async () => {
      const user = userEvent.setup()
      render(
        <LeftMenuTabs
          players={mockPlayers}
          selectedHex={null}
          eventLog={mockEvents}
          standings={mockStandings}
          isSoloMode={false}
        />
      )

      const hexInfoTab = screen.getByRole('tab', { name: /hex info/i })
      await user.click(hexInfoTab)

      // WHY: Should show empty state message
      expect(screen.getByText(/select a hex/i)).toBeInTheDocument()
    })

    it('should display hex details when hex is selected', async () => {
      const user = userEvent.setup()
      render(
        <LeftMenuTabs
          players={mockPlayers}
          selectedHex={mockHex}
          eventLog={mockEvents}
          standings={mockStandings}
          isSoloMode={false}
        />
      )

      const hexInfoTab = screen.getByRole('tab', { name: /hex info/i })
      await user.click(hexInfoTab)

      // WHY: Should display "Hex Details" heading from HexDetails component
      expect(screen.getByText(/Hex Details/i)).toBeInTheDocument()
    })

    it('should display event log when Event Log tab is active', async () => {
      const user = userEvent.setup()
      render(
        <LeftMenuTabs
          players={mockPlayers}
          selectedHex={null}
          eventLog={mockEvents}
          standings={mockStandings}
          isSoloMode={false}
        />
      )

      const eventLogTab = screen.getByRole('tab', { name: /event log/i })
      await user.click(eventLogTab)

      // WHY: Should show event message
      expect(screen.getByText(/Alice moved to hex/)).toBeInTheDocument()
    })

    it('should display standings when Standings tab is active', async () => {
      const user = userEvent.setup()
      render(
        <LeftMenuTabs
          players={mockPlayers}
          selectedHex={null}
          eventLog={mockEvents}
          standings={mockStandings}
          isSoloMode={false}
        />
      )

      const standingsTab = screen.getByRole('tab', { name: /standings/i })
      await user.click(standingsTab)

      // WHY: Should show category name (e.g., "Warlord")
      expect(screen.getByText(/Warlord/i)).toBeInTheDocument()
    })
  })

  describe('when rendering tab icons', () => {
    it('should display icons for all tabs', () => {
      render(
        <LeftMenuTabs
          players={mockPlayers}
          selectedHex={null}
          eventLog={mockEvents}
          standings={mockStandings}
          isSoloMode={false}
        />
      )

      // WHY: Check for emoji icons in tab labels
      expect(screen.getByText(/👥/)).toBeInTheDocument()  // Players
      expect(screen.getByText(/🗺️/)).toBeInTheDocument()  // Hex Info
      expect(screen.getByText(/📜/)).toBeInTheDocument()  // Event Log
      expect(screen.getByText(/🏆/)).toBeInTheDocument()  // Standings
    })
  })
})
