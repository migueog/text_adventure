'use client'

import { useEffect, useRef, useCallback } from 'react'
import * as Phaser from 'phaser'
import type { Hex, Player, MapConfig, HexPosition } from '@/types/campaign'
import HexMapScene from './PhaserHexMap/HexMapScene'

interface PhaserHexMapProps {
  hexes: Record<string, Hex>
  players: Player[]
  mapConfig: MapConfig | null
  selectedHex: string | null
  onHexClick: (hexId: string) => void // WHY: Type fixed - accepts hexId string (Phase 6)
  currentPlayerIndex: number
  regroupPath?: HexPosition[] | null // WHY: Path for REGROUP visualization (Issue #38)
  hexSelection?: {
    sourceHex: string | null
    targetHex: string | null
    selectedPlayerId: number | null
    menuPosition: { x: number; y: number } | null
  } | null // WHY: Dual-selection state for hex-based controls (Phase 6-7)
}

export default function PhaserHexMap({
  hexes,
  players,
  mapConfig,
  selectedHex,
  onHexClick,
  currentPlayerIndex,
  regroupPath,
  hexSelection
}: PhaserHexMapProps) {
  const gameRef = useRef<Phaser.Game | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const sceneRef = useRef<HexMapScene | null>(null)

  // WHY: Memoize the hex click handler - passes hexId string to parent (Phase 6)
  const handleHexClick = useCallback((hexId: string) => {
    if (onHexClick) {
      onHexClick(hexId)
    }
  }, [onHexClick])

  // Initialize Phaser game
  useEffect(() => {
    if (!containerRef.current || !mapConfig) return

    // WHY: Log device pixel ratio for debugging high-DPI rendering issues
    console.log('[PhaserHexMap] Device pixel ratio:', window.devicePixelRatio)

    const width = mapConfig.cols * 60 + 100
    const height = mapConfig.rows * 70 + 100

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      // WHY: Base canvas dimensions (will be scaled by ScaleManager, not CSS)
      width: Math.min(width, 800),
      height: Math.min(height, 600),
      backgroundColor: '#0a0a1a',
      scene: [HexMapScene],
      scale: {
        mode: Phaser.Scale.FIT, // WHY: Let Phaser handle scaling internally (not CSS)
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      // WHY: REMOVED invalid 'resolution' property - doesn't exist in Phaser 3 GameConfig
      // For high-DPI rendering, Phaser uses scale.zoom and canvas internal resolution automatically
      render: {
        pixelArt: false, // WHY: For image sprites, keep anti-aliasing for smooth scaling
        antialias: true, // WHY: Enable smoothing for better sprite quality
        roundPixels: true, // WHY: Force integer coordinates for crisp positioning (prevents sub-pixel blur)
      },
      // WHY: Disable audio to prevent AudioContext warning (game doesn't use sound)
      audio: {
        noAudio: true,
      },
    }

    gameRef.current = new Phaser.Game(config)

    // Wait for scene to be ready, then start it with initial data
    // WHY: Scene auto-starts on game creation, triggering init() → preload() → create()
    // The scene's create() will use the data passed to init() from this restart call
    gameRef.current.events.once('ready', () => {
      const scene = gameRef.current?.scene.getScene('HexMapScene') as HexMapScene
      if (scene) {
        sceneRef.current = scene
        scene.onHexClick = handleHexClick

        // WHY: Scene already went through first lifecycle, now restart with actual data
        // This ensures preload() loads textures first, then create() renders with data
        scene.scene.restart({
          hexes,
          players,
          mapConfig,
          selectedHex,
          currentPlayerIndex,
          onHexClick: handleHexClick,
          regroupPath,
        })
      }
    })

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true)
        gameRef.current = null
        sceneRef.current = null
      }
    }
  }, [mapConfig]) // Only recreate game when mapConfig changes

  // Update scene when data changes
  useEffect(() => {
    if (sceneRef.current && sceneRef.current.scene.isActive()) {
      sceneRef.current.onHexClick = handleHexClick
      sceneRef.current.updateData({
        hexes,
        players,
        currentPlayerIndex,
        selectedHex,
        regroupPath,
        hexSelection, // WHY: Pass dual-selection state to scene (Phase 6-7)
      })
    }
  }, [hexes, players, currentPlayerIndex, selectedHex, regroupPath, hexSelection, handleHexClick])

  if (!mapConfig) return null

  return (
    <div className="phaser-hex-map-container">
      <div ref={containerRef} className="phaser-canvas" />
      <div className="map-legend">
        <div className="legend-item">
          <span className="legend-color" style={{ background: '#4a90a4' }}></span>
          <span>Surface (Explored)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ background: '#2c5a6a' }}></span>
          <span>Surface (Unexplored)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ background: '#6b4a8a' }}></span>
          <span>Tomb (Explored)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ background: '#3d2a5a' }}></span>
          <span>Tomb (Unexplored)</span>
        </div>
        <div className="legend-item">
          <span style={{ color: '#2ecc71' }}>⌂</span>
          <span>Base</span>
        </div>
        <div className="legend-item">
          <span style={{ color: '#3498db' }}>⛺</span>
          <span>Camp</span>
        </div>
      </div>
    </div>
  )
}
