'use client'

import { useEffect, useRef, useCallback } from 'react'
import * as Phaser from 'phaser'
import type { Hex, Player, MapConfig } from '@/types/campaign'
import HexMapScene from './PhaserHexMap/HexMapScene'

interface PhaserHexMapProps {
  hexes: Record<string, Hex>
  players: Player[]
  mapConfig: MapConfig | null
  selectedHex: string | null
  onHexClick: (hex: Hex) => void
  currentPlayerIndex: number
}

export default function PhaserHexMap({
  hexes,
  players,
  mapConfig,
  selectedHex,
  onHexClick,
  currentPlayerIndex
}: PhaserHexMapProps) {
  const gameRef = useRef<Phaser.Game | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const sceneRef = useRef<HexMapScene | null>(null)

  // Memoize the hex click handler
  const handleHexClick = useCallback((hexId: string) => {
    if (onHexClick && hexes[hexId]) {
      onHexClick(hexes[hexId])
    }
  }, [onHexClick, hexes])

  // Initialize Phaser game
  useEffect(() => {
    if (!containerRef.current || !mapConfig) return

    const width = mapConfig.cols * 60 + 100
    const height = mapConfig.rows * 70 + 100

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: Math.min(width, 800),
      height: Math.min(height, 600),
      backgroundColor: '#0a0a1a',
      scene: [HexMapScene],
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    }

    gameRef.current = new Phaser.Game(config)

    // Wait for scene to be ready, then initialize
    gameRef.current.events.once('ready', () => {
      const scene = gameRef.current?.scene.getScene('HexMapScene') as HexMapScene
      if (scene) {
        sceneRef.current = scene
        scene.onHexClick = handleHexClick
        scene.scene.restart({
          hexes,
          players,
          mapConfig,
          selectedHex,
          currentPlayerIndex,
          onHexClick: handleHexClick,
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
      })
    }
  }, [hexes, players, currentPlayerIndex, selectedHex, handleHexClick])

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
      <div className="map-controls">
        <small>Scroll to zoom | Click hexes to select</small>
      </div>
    </div>
  )
}
