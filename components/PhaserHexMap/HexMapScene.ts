import * as Phaser from 'phaser'
import type { Hex, Player, MapConfig, HexPosition } from '@/types/campaign'
import { hexId } from '@/lib/utils/hexUtils'
import { SURFACE_LOCATIONS, TOMB_LOCATIONS, SURFACE_CONDITIONS, TOMB_CONDITIONS } from '@/lib/data/campaignData'

const HEX_SIZE = 40
const HEX_HEIGHT = Math.sqrt(3) * HEX_SIZE
const HEX_WIDTH = HEX_SIZE * 2

// Colors
const COLORS = {
  surfaceExplored: 0x4a90a4,
  surfaceUnexplored: 0x2c5a6a,
  tombExplored: 0x6b4a8a,
  tombUnexplored: 0x3d2a5a,
  blocked: 0x333333,
  selected: 0xf1c40f,
  hover: 0xffffff,
  baseBorder: 0x2ecc71,
  campBorder: 0x3498db,
  regroupPath: 0x2ecc71, // WHY: Green color for REGROUP path (Issue #38)
  text: 0xffffff,
  textMuted: 0x808080,
}

interface SceneData {
  hexes?: Record<string, Hex>
  players?: Player[]
  currentPlayerIndex?: number
  mapConfig?: MapConfig
  selectedHex?: string | null
  onHexClick?: (hexId: string) => void
  regroupPath?: HexPosition[] | null // WHY: Path for REGROUP visualization (Issue #38)
}

interface HexGraphicsObject {
  graphics: Phaser.GameObjects.Graphics
  zone: Phaser.GameObjects.Zone
}

export default class HexMapScene extends Phaser.Scene {
  hexGraphics: Record<string, HexGraphicsObject>
  playerTokens: Record<number, Phaser.GameObjects.Graphics>
  selectedHex: string | null
  hoveredHex: string | null // WHY: Track currently hovered hex for visual feedback
  hoverHighlight: Phaser.GameObjects.Graphics | null // WHY: Separate graphics for hover overlay
  onHexClick: ((hexId: string) => void) | null
  hexData: Record<string, Hex>
  players: Player[]
  currentPlayerIndex: number
  mapConfig: MapConfig
  regroupPath: HexPosition[] | null // WHY: Path for REGROUP visualization (Issue #38)
  regroupPathGraphics: Phaser.GameObjects.Graphics | null
  texturesReady: boolean

  constructor() {
    super({ key: 'HexMapScene' })
    this.hexGraphics = {}
    this.playerTokens = {}
    this.selectedHex = null
    this.hoveredHex = null
    this.hoverHighlight = null
    this.onHexClick = null
    this.hexData = {}
    this.players = []
    this.currentPlayerIndex = 0
    this.mapConfig = { name: '', rows: 7, cols: 7, surfaceRows: 3, tombRows: 4 }
    this.regroupPath = null
    this.regroupPathGraphics = null
    this.texturesReady = false
  }

  // WHY: Load hex tile sprites before scene renders (Kenney.nl CC0 assets)
  preload() {
    // WHY: Only load textures when we have actual game data (second lifecycle after restart)
    if (Object.keys(this.hexData).length === 0) {
      console.log('[HexMapScene] Skipping preload - no data yet')
      return
    }

    const texturesLoaded = this.game.registry.get('hexTexturesLoaded')

    if (!texturesLoaded) {
      console.log('[HexMapScene] Loading hex textures...')
      this.game.registry.set('hexTexturesLoaded', true)

      this.load.image('surface-unexplored', '/assets/hexes/surface-unexplored.png')
      this.load.image('surface-explored', '/assets/hexes/surface-explored.png')
      this.load.image('tomb-unexplored', '/assets/hexes/tomb-unexplored.png')
      this.load.image('tomb-explored', '/assets/hexes/tomb-explored.png')

      // WHY: Set flag when load completes so create() knows textures are ready
      this.load.once('complete', () => {
        console.log('[HexMapScene] Textures loaded successfully')
        this.texturesReady = true
      })
    } else {
      // WHY: Textures already in cache, mark as ready
      this.texturesReady = true
    }
  }

  init(data: SceneData) {
    this.hexData = data.hexes || {}
    this.players = data.players || []
    this.currentPlayerIndex = data.currentPlayerIndex || 0
    this.mapConfig = data.mapConfig || { name: '', rows: 7, cols: 7, surfaceRows: 3, tombRows: 4 }
    this.selectedHex = data.selectedHex || null
    this.onHexClick = data.onHexClick || null
    this.regroupPath = data.regroupPath ?? null
  }

  create() {
    // WHY: Skip scene setup if we don't have game data yet (first lifecycle)
    if (Object.keys(this.hexData).length === 0) {
      console.log('[HexMapScene] Waiting for game data...')
      return
    }

    console.log('[HexMapScene] Scene initialized')
    console.log('[HexMapScene] Textures ready:', this.texturesReady)

    // WHY: If textures are still loading, defer scene setup by one frame
    // This ensures WebGL context has textures bound before creating sprites
    if (!this.texturesReady) {
      console.log('[HexMapScene] Deferring create() until textures ready...')
      this.time.delayedCall(16, () => this.initializeScene()) // 16ms = one frame at 60fps
      return
    }

    this.initializeScene()
  }

  // WHY: Extract scene initialization logic (keeps create() under 20 lines)
  initializeScene() {
    console.log('[HexMapScene] Initializing scene with textures ready')
    this.setupCamera()
    this.drawHexMap()
    this.drawPlayerTokens()
    this.centerCamera()
  }

  // WHY: Configure camera bounds and zoom for hex map interaction
  setupCamera() {
    this.cameras.main.setBounds(0, 0,
      this.mapConfig.cols * HEX_WIDTH * 0.75 + HEX_SIZE * 2,
      this.mapConfig.rows * HEX_HEIGHT + HEX_HEIGHT
    )

    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gameObjects: Phaser.GameObjects.GameObject[], _deltaX: number, deltaY: number) => {
      const zoom = this.cameras.main.zoom
      const newZoom = Phaser.Math.Clamp(zoom - deltaY * 0.001, 1.0, 2.5)
      this.cameras.main.setZoom(newZoom)
    })
  }

  // WHY: Center camera on middle of hex map
  centerCamera() {
    const centerX = (this.mapConfig.cols * HEX_WIDTH * 0.75) / 2
    const centerY = (this.mapConfig.rows * HEX_HEIGHT) / 2
    this.cameras.main.centerOn(centerX, centerY)
  }

  getHexPosition(row: number, col: number): { x: number; y: number } {
    // WHY: Account for device pixel ratio scaling - visual positions match internal coordinates
    const x = col * HEX_WIDTH * 0.75 + HEX_SIZE + 20
    const y = row * HEX_HEIGHT + (col % 2 === 1 ? HEX_HEIGHT / 2 : 0) + HEX_SIZE + 20
    return { x, y }
  }

  getHexPoints(centerX: number, centerY: number): Array<{ x: number; y: number }> {
    const points = []
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6
      points.push({
        x: centerX + HEX_SIZE * Math.cos(angle),
        y: centerY + HEX_SIZE * Math.sin(angle)
      })
    }
    return points
  }

  // WHY: Generate polygon points for hit area in zone's local coordinate system
  // Zone bounding box has (0,0) at top-left, so hex center is at (HEX_WIDTH/2, HEX_HEIGHT/2)
  getRelativeHexPoints(): Array<{ x: number; y: number }> {
    const points = []
    const centerX = HEX_WIDTH / 2  // WHY: Center of zone's bounding box
    const centerY = HEX_HEIGHT / 2
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6
      points.push({
        x: centerX + HEX_SIZE * Math.cos(angle),  // WHY: Relative to zone bounds, not origin
        y: centerY + HEX_SIZE * Math.sin(angle)
      })
    }
    return points
  }

  drawHexMap() {
    Object.values(this.hexData).forEach(hex => {
      this.drawHex(hex)
    })
  }

  drawHex(hex: Hex) {
    const { row, col, type, explored } = hex
    const { x, y } = this.getHexPosition(row, col)
    const currentHexId = hexId(row, col)

    // Check if any player has a base or camp here
    const hasBase = this.players.some(p => p.bases.some(b => b.row === row && b.col === col))
    const hasCamp = this.players.some(p => p.camps.some(c => c.row === row && c.col === col))

    // Get location and condition
    const location = explored && hex.location ? (type === 'surface' ? SURFACE_LOCATIONS[hex.location] : TOMB_LOCATIONS[hex.location]) : null
    const condition = explored && hex.condition ? (type === 'surface' ? SURFACE_CONDITIONS[hex.condition] : TOMB_CONDITIONS[hex.condition]) : null

    // WHY: Determine which sprite to use based on type and explored state
    let spriteKey: string
    if (type === 'surface') {
      spriteKey = explored ? 'surface-explored' : 'surface-unexplored'
    } else {
      spriteKey = explored ? 'tomb-explored' : 'tomb-unexplored'
    }

    // WHY: Use Image sprite for crisp rendering (replaces Graphics-based procedural drawing)
    const hexSprite = this.add.image(x, y, spriteKey)
      .setOrigin(0.5, 0.5) // WHY: Center sprite on hex position
      .setDisplaySize(HEX_WIDTH, HEX_HEIGHT) // WHY: Scale sprite to match hex dimensions
      .setDepth(1) // WHY: Base layer, overlays will be above

    // WHY: Use Graphics to create overlay graphics object for borders and selected state
    const graphics = this.add.graphics()
    graphics.setDepth(2) // WHY: Above hex sprite, below zones

    const points = this.getHexPoints(x, y)

    // WHY: Draw colored border overlay for selected hex, bases, and camps
    let borderColor: number | null = null
    let borderWidth = 0

    if (this.selectedHex === currentHexId) {
      borderColor = COLORS.selected
      borderWidth = 4
    } else if (hasBase) {
      borderColor = COLORS.baseBorder
      borderWidth = 4
    } else if (hasCamp) {
      borderColor = COLORS.campBorder
      borderWidth = 3
    }

    // WHY: Only draw border overlay if needed (selected, base, or camp)
    if (borderColor !== null) {
      graphics.lineStyle(borderWidth, borderColor, 1)
      graphics.beginPath()
      if (points[0]) {
        graphics.moveTo(points[0].x, points[0].y)
        for (let i = 1; i < 6; i++) {
          const point = points[i]
          if (point) {
            graphics.lineTo(point.x, point.y)
          }
        }
      }
      graphics.closePath()
      graphics.strokePath()
    }

    // Create hit area for interaction
    // WHY: Use relative points so Phaser can correctly offset them by the zone's position
    const hitArea = new Phaser.Geom.Polygon(this.getRelativeHexPoints())
    const zone = this.add.zone(x, y, HEX_WIDTH, HEX_HEIGHT)
      .setOrigin(0.5, 0.5)  // WHY: Explicitly center origin to match visual hex center
      .setDepth(10)          // WHY: Ensure zones are above other graphics for pointer events
      .setInteractive({
        hitArea,
        hitAreaCallback: Phaser.Geom.Polygon.Contains,
        useHandCursor: true  // WHY: Show pointer cursor on hover for better UX
      })
      .on('pointerover', () => this.onHexHover(currentHexId, true))
      .on('pointerout', () => this.onHexHover(currentHexId, false))
      .on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        // WHY: Log pointer position for debugging click offset issues
        console.log('[HexMapScene] Click at pointer:', pointer.x, pointer.y, 'Hex:', currentHexId, 'at', x, y)
        this.onHexClicked(currentHexId)
      })

    // Add coordinate text
    this.add.text(x, y - HEX_SIZE * 0.55, currentHexId, {
      fontSize: '10px',
      color: '#ffffff80',
    }).setOrigin(0.5)

    // Add location name if explored
    if (explored && location) {
      const name = location.name.length > 10 ? location.name.slice(0, 10) + '..' : location.name
      this.add.text(x, y - 5, name, {
        fontSize: '9px',
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0.5)
    }

    // Add condition if present and has effect
    if (explored && condition && condition.effect !== 'none') {
      this.add.text(x, y + 10, condition.name, {
        fontSize: '8px',
        color: '#ffd700',
      }).setOrigin(0.5)
    }

    // Add type label
    const typeLabel = type === 'surface' ? 'Surface' : 'Tomb'
    this.add.text(x, y + HEX_SIZE * 0.5, typeLabel, {
      fontSize: '8px',
      color: '#ffffff60',
    }).setOrigin(0.5)

    // Add base/camp icon
    if (hasBase) {
      this.add.text(x - HEX_SIZE * 0.5, y - 5, '⌂', {
        fontSize: '14px',
        color: '#2ecc71',
      }).setOrigin(0.5)
    } else if (hasCamp) {
      // WHY: Find which player owns this camp to use their color
      const campOwner = this.players.find(p =>
        p.camps.some(c => c.row === row && c.col === col)
      )
      const campColor = campOwner?.color || '#3498db'

      // WHY: Use player color with stroke for better visibility
      const campMarker = this.add.text(x - HEX_SIZE * 0.5, y - 5, '⛺', {
        fontSize: '12px',
        color: campColor,
      })
      campMarker.setOrigin(0.5)
      campMarker.setStroke('#000000', 2)
    }

    // Store reference
    this.hexGraphics[currentHexId] = { graphics, zone }
  }

  drawPlayerTokens() {
    this.players.forEach((player, idx) => {
      this.drawPlayerToken(player, idx)
    })
  }

  drawPlayerToken(player: Player, playerIndex: number) {
    // WHY: Skip players who haven't been placed on the map yet
    if (!player.position) return

    const currentHexId = hexId(player.position.row, player.position.col)
    const hex = this.hexData[currentHexId]
    if (!hex) return

    const { x, y } = this.getHexPosition(hex.row, hex.col)

    // Offset for multiple players on same hex
    const playersOnHex = this.players.filter(p => {
      if (!p.position) return false
      const pHexId = hexId(p.position.row, p.position.col)
      return pHexId === currentHexId
    })
    const indexOnHex = playersOnHex.findIndex(p => p.id === player.id)
    const offsetX = (indexOnHex % 2) * 20 - 10
    const offsetY = Math.floor(indexOnHex / 2) * 15 + 20

    const tokenX = x + offsetX
    const tokenY = y + offsetY

    // Draw token circle
    const graphics = this.add.graphics()
    const color = Phaser.Display.Color.HexStringToColor(player.color).color

    graphics.fillStyle(color, 1)
    graphics.fillCircle(tokenX, tokenY, 10)
    graphics.lineStyle(2, 0xffffff, 1)
    graphics.strokeCircle(tokenX, tokenY, 10)

    // Add player number
    this.add.text(tokenX, tokenY, `${player.id + 1}`, {
      fontSize: '10px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    // Highlight current player
    if (playerIndex === this.currentPlayerIndex) {
      graphics.lineStyle(2, COLORS.selected, 1)
      graphics.strokeCircle(tokenX, tokenY, 14)
    }

    this.playerTokens[player.id] = graphics
  }

  onHexHover(hexId: string, isOver: boolean) {
    // WHY: Update cursor and draw visual hover highlight overlay
    if (isOver) {
      this.input.setDefaultCursor('pointer')

      // WHY: Only update if hovering over a new hex
      if (this.hoveredHex !== hexId) {
        this.hoveredHex = hexId

        // Clear old hover highlight
        if (this.hoverHighlight) {
          this.hoverHighlight.destroy()
          this.hoverHighlight = null
        }

        // Draw new hover highlight overlay
        const hex = this.hexData[hexId]
        if (hex) {
          const { x, y } = this.getHexPosition(hex.row, hex.col)
          const points = this.getHexPoints(x, y)

          this.hoverHighlight = this.add.graphics()
          this.hoverHighlight.lineStyle(3, COLORS.hover, 0.8) // WHY: Semi-transparent white border
          this.hoverHighlight.setDepth(15) // WHY: Above hexes but below UI

          this.hoverHighlight.beginPath()
          if (points[0]) {
            this.hoverHighlight.moveTo(points[0].x, points[0].y)
            for (let i = 1; i < 6; i++) {
              const point = points[i]
              if (point) {
                this.hoverHighlight.lineTo(point.x, point.y)
              }
            }
          }
          this.hoverHighlight.closePath()
          this.hoverHighlight.strokePath()

          console.log('[HexMapScene] Hovering over:', hexId)
        }
      }
    } else {
      this.input.setDefaultCursor('default')

      // WHY: Remove highlight when mouse leaves
      if (this.hoveredHex === hexId) {
        this.hoveredHex = null

        if (this.hoverHighlight) {
          this.hoverHighlight.destroy()
          this.hoverHighlight = null
        }

        console.log('[HexMapScene] Hover out:', hexId)
      }
    }
  }

  onHexClicked(hexId: string) {
    console.log('[HexMapScene] Hex clicked:', hexId)
    if (this.onHexClick) {
      this.onHexClick(hexId)
    }
  }

  // WHY: Draw green path for REGROUP movement (Issue #38)
  drawRegroupPath(): void {
    // Clear existing path
    if (this.regroupPathGraphics) {
      this.regroupPathGraphics.destroy()
      this.regroupPathGraphics = null
    }

    if (!this.regroupPath || this.regroupPath.length < 2) return

    this.regroupPathGraphics = this.add.graphics()
    this.regroupPathGraphics.lineStyle(4, COLORS.regroupPath, 1)
    this.regroupPathGraphics.setDepth(5)

    // WHY: Draw dashed line between hexes
    for (let i = 0; i < this.regroupPath.length - 1; i++) {
      const from = this.regroupPath[i]
      const to = this.regroupPath[i + 1]
      if (!from || !to) continue

      const fromPixel = this.getHexPosition(from.row, from.col)
      const toPixel = this.getHexPosition(to.row, to.col)

      // Draw dashed line
      const dx = toPixel.x - fromPixel.x
      const dy = toPixel.y - fromPixel.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      const dashLength = 10
      const gapLength = 5
      let currentDistance = 0

      while (currentDistance < distance) {
        const startRatio = currentDistance / distance
        const endRatio = Math.min((currentDistance + dashLength) / distance, 1)

        this.regroupPathGraphics.lineBetween(
          fromPixel.x + dx * startRatio,
          fromPixel.y + dy * startRatio,
          fromPixel.x + dx * endRatio,
          fromPixel.y + dy * endRatio
        )

        currentDistance += dashLength + gapLength
      }
    }
  }

  // WHY: Update REGROUP path from external caller (Issue #38)
  updateRegroupPath(path: HexPosition[] | null): void {
    this.regroupPath = path
    this.drawRegroupPath()
  }

  // Called from React to update the scene
  updateData(data: Partial<SceneData>) {
    this.hexData = data.hexes || this.hexData
    this.players = data.players || this.players
    this.currentPlayerIndex = data.currentPlayerIndex ?? this.currentPlayerIndex
    this.selectedHex = data.selectedHex ?? this.selectedHex

    // WHY: Update regroup path if provided (Issue #38)
    if (data.regroupPath !== undefined) {
      this.regroupPath = data.regroupPath
    }

    // Clear and redraw
    this.children.removeAll()
    this.hexGraphics = {}
    this.playerTokens = {}

    this.drawHexMap()
    this.drawPlayerTokens()
    this.drawRegroupPath()
  }
}
