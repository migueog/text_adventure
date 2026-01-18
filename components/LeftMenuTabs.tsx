'use client'

import { useState, useEffect } from 'react'
import type { Player, Hex, Event } from '@/types/campaign'
import PlayerPanel from './PlayerPanel'
import HexDetails from './HexDetails'
import EventLog from './EventLog'
import CategoryStandings from './CategoryStandings'

type TabId = 'players' | 'hexInfo' | 'eventLog' | 'standings'

interface LeftMenuTabsProps {
  players: Player[]
  selectedHex: Hex | null
  eventLog: Event[]
  standings: any  // WHY: Placeholder for standings data structure
  isSoloMode: boolean
}

/**
 * WHY: Tabbed navigation for left menu content
 * Consolidates Players, Hex Info, Event Log, and Standings into one interface
 * Auto-switches to Hex Info when hex is selected
 */
export default function LeftMenuTabs({
  players,
  selectedHex,
  eventLog,
  standings,
  isSoloMode
}: LeftMenuTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('players')

  // WHY: Auto-switch to Hex Info when hex selected
  useEffect(() => {
    if (selectedHex !== null) {
      setActiveTab('hexInfo')
    }
  }, [selectedHex])

  return (
    <div className="left-menu-tabs">
      {/* WHY: Tab navigation buttons */}
      <div className="tab-navigation" role="tablist">
        <TabButton
          id="players"
          label="👥 Players"
          active={activeTab === 'players'}
          onClick={() => setActiveTab('players')}
        />
        <TabButton
          id="hexInfo"
          label="🗺️ Hex Info"
          active={activeTab === 'hexInfo'}
          onClick={() => setActiveTab('hexInfo')}
        />
        <TabButton
          id="eventLog"
          label="📜 Event Log"
          active={activeTab === 'eventLog'}
          onClick={() => setActiveTab('eventLog')}
        />
        {/* WHY: Hide Standings tab in solo mode */}
        {!isSoloMode && (
          <TabButton
            id="standings"
            label="🏆 Standings"
            active={activeTab === 'standings'}
            onClick={() => setActiveTab('standings')}
          />
        )}
      </div>

      {/* WHY: Tab content panels */}
      <div className="tab-content">
        {renderTabContent(activeTab, players, selectedHex, eventLog, isSoloMode)}
      </div>
    </div>
  )
}

/**
 * WHY: Extract tab button to keep main component clean
 * Uses ARIA attributes for accessibility
 */
function TabButton({
  id,
  label,
  active,
  onClick
}: {
  id: string
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      aria-controls={`${id}-panel`}
      className={`tab-button ${active ? 'active' : ''}`}
      onClick={onClick}
    >
      {label}
    </button>
  )
}

/**
 * WHY: Render appropriate content for each tab
 * Extracted to keep main component under 20 lines
 */
function renderTabContent(
  activeTab: TabId,
  players: Player[],
  selectedHex: Hex | null,
  eventLog: Event[],
  isSoloMode: boolean
): JSX.Element {
  if (activeTab === 'players') {
    return <PlayerPanel players={players} />
  }

  if (activeTab === 'hexInfo') {
    return renderHexInfoPanel(selectedHex, players)
  }

  if (activeTab === 'eventLog') {
    return <EventLog events={eventLog} />
  }

  if (activeTab === 'standings') {
    return <CategoryStandings players={players} />
  }

  return <div>Unknown tab</div>
}

/**
 * WHY: Render Hex Info panel with empty state handling
 * Shows message when no hex is selected
 */
function renderHexInfoPanel(
  selectedHex: Hex | null,
  players: Player[]
): JSX.Element {
  if (selectedHex === null) {
    return (
      <div className="hex-info-empty">
        <p>Select a hex on the map to view details</p>
      </div>
    )
  }

  return <HexDetails hex={selectedHex} players={players} />
}
