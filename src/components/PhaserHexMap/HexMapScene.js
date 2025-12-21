import Phaser from 'phaser';

const HEX_SIZE = 40;
const HEX_HEIGHT = Math.sqrt(3) * HEX_SIZE;
const HEX_WIDTH = HEX_SIZE * 2;

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
  text: 0xffffff,
  textMuted: 0x808080,
};

export default class HexMapScene extends Phaser.Scene {
  constructor() {
    super({ key: 'HexMapScene' });
    this.hexGraphics = {};
    this.playerTokens = {};
    this.selectedHex = null;
    this.onHexClick = null;
    this.hexData = {};
    this.players = [];
    this.currentPlayerIndex = 0;
  }

  init(data) {
    this.hexData = data.hexes || {};
    this.players = data.players || [];
    this.currentPlayerIndex = data.currentPlayerIndex || 0;
    this.mapConfig = data.mapConfig || { rows: 7, cols: 7, surfaceRows: 3 };
    this.selectedHex = data.selectedHex || null;
    this.onHexClick = data.onHexClick || (() => {});
  }

  create() {
    // Enable camera drag
    this.cameras.main.setBounds(0, 0,
      this.mapConfig.cols * HEX_WIDTH * 0.75 + HEX_SIZE * 2,
      this.mapConfig.rows * HEX_HEIGHT + HEX_HEIGHT
    );

    this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
      const zoom = this.cameras.main.zoom;
      const newZoom = Phaser.Math.Clamp(zoom - deltaY * 0.001, 0.5, 2);
      this.cameras.main.setZoom(newZoom);
    });

    // Draw all hexes
    this.drawHexMap();

    // Draw player tokens
    this.drawPlayerTokens();

    // Center camera on map
    const centerX = (this.mapConfig.cols * HEX_WIDTH * 0.75) / 2;
    const centerY = (this.mapConfig.rows * HEX_HEIGHT) / 2;
    this.cameras.main.centerOn(centerX, centerY);
  }

  getHexPosition(row, col) {
    const x = col * HEX_WIDTH * 0.75 + HEX_SIZE + 20;
    const y = row * HEX_HEIGHT + (col % 2 === 1 ? HEX_HEIGHT / 2 : 0) + HEX_SIZE + 20;
    return { x, y };
  }

  getHexPoints(centerX, centerY) {
    const points = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      points.push({
        x: centerX + HEX_SIZE * Math.cos(angle),
        y: centerY + HEX_SIZE * Math.sin(angle)
      });
    }
    return points;
  }

  drawHexMap() {
    Object.values(this.hexData).forEach(hex => {
      this.drawHex(hex);
    });
  }

  drawHex(hex) {
    const { row, col, type, explored, blocked, hasBase, hasCamp, location, condition } = hex;
    const { x, y } = this.getHexPosition(row, col);
    const hexId = hex.id;

    // Determine fill color
    let fillColor;
    if (blocked) {
      fillColor = COLORS.blocked;
    } else if (type === 'surface') {
      fillColor = explored ? COLORS.surfaceExplored : COLORS.surfaceUnexplored;
    } else {
      fillColor = explored ? COLORS.tombExplored : COLORS.tombUnexplored;
    }

    // Create hex graphics
    const graphics = this.add.graphics();
    const points = this.getHexPoints(x, y);

    // Draw filled hex
    graphics.fillStyle(fillColor, 1);
    graphics.beginPath();
    graphics.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < 6; i++) {
      graphics.lineTo(points[i].x, points[i].y);
    }
    graphics.closePath();
    graphics.fillPath();

    // Draw border
    let borderColor = 0x1a1a2e;
    let borderWidth = 2;

    if (this.selectedHex === hexId) {
      borderColor = COLORS.selected;
      borderWidth = 4;
    } else if (hasBase) {
      borderColor = COLORS.baseBorder;
      borderWidth = 4;
    } else if (hasCamp) {
      borderColor = COLORS.campBorder;
      borderWidth = 3;
    }

    graphics.lineStyle(borderWidth, borderColor, 1);
    graphics.beginPath();
    graphics.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < 6; i++) {
      graphics.lineTo(points[i].x, points[i].y);
    }
    graphics.closePath();
    graphics.strokePath();

    // Create hit area for interaction
    const hitArea = new Phaser.Geom.Polygon(points);
    const zone = this.add.zone(x, y, HEX_WIDTH, HEX_HEIGHT)
      .setInteractive({ hitArea, hitAreaCallback: Phaser.Geom.Polygon.Contains })
      .on('pointerover', () => this.onHexHover(hexId, true))
      .on('pointerout', () => this.onHexHover(hexId, false))
      .on('pointerdown', () => this.onHexClicked(hexId));

    // Add coordinate text
    this.add.text(x, y - HEX_SIZE * 0.55, `${row},${col}`, {
      fontSize: '10px',
      color: '#ffffff80',
    }).setOrigin(0.5);

    // Add location name if explored
    if (explored && location) {
      const name = location.name.length > 10 ? location.name.slice(0, 10) + '..' : location.name;
      this.add.text(x, y - 5, name, {
        fontSize: '9px',
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0.5);
    }

    // Add condition if present and has effect
    if (explored && condition && condition.effect !== 'none') {
      this.add.text(x, y + 10, condition.name, {
        fontSize: '8px',
        color: '#ffd700',
      }).setOrigin(0.5);
    }

    // Add type label
    const typeLabel = blocked ? 'BLOCKED' : (type === 'surface' ? 'Surface' : 'Tomb');
    this.add.text(x, y + HEX_SIZE * 0.5, typeLabel, {
      fontSize: '8px',
      color: '#ffffff60',
    }).setOrigin(0.5);

    // Add base/camp icon
    if (hasBase) {
      this.add.text(x - HEX_SIZE * 0.5, y - 5, '⌂', {
        fontSize: '14px',
        color: '#2ecc71',
      }).setOrigin(0.5);
    } else if (hasCamp) {
      this.add.text(x - HEX_SIZE * 0.5, y - 5, '⛺', {
        fontSize: '12px',
        color: '#3498db',
      }).setOrigin(0.5);
    }

    // Store reference
    this.hexGraphics[hexId] = { graphics, zone };
  }

  drawPlayerTokens() {
    this.players.forEach((player, idx) => {
      this.drawPlayerToken(player, idx);
    });
  }

  drawPlayerToken(player, playerIndex) {
    const hex = this.hexData[player.position];
    if (!hex) return;

    const { x, y } = this.getHexPosition(hex.row, hex.col);

    // Offset for multiple players on same hex
    const playersOnHex = this.players.filter(p => p.position === player.position);
    const indexOnHex = playersOnHex.findIndex(p => p.id === player.id);
    const offsetX = (indexOnHex % 2) * 20 - 10;
    const offsetY = Math.floor(indexOnHex / 2) * 15 + 20;

    const tokenX = x + offsetX;
    const tokenY = y + offsetY;

    // Draw token circle
    const graphics = this.add.graphics();
    const color = Phaser.Display.Color.HexStringToColor(player.color).color;

    graphics.fillStyle(color, 1);
    graphics.fillCircle(tokenX, tokenY, 10);
    graphics.lineStyle(2, 0xffffff, 1);
    graphics.strokeCircle(tokenX, tokenY, 10);

    // Add player number
    this.add.text(tokenX, tokenY, `${player.id + 1}`, {
      fontSize: '10px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Highlight current player
    if (playerIndex === this.currentPlayerIndex) {
      graphics.lineStyle(2, COLORS.selected, 1);
      graphics.strokeCircle(tokenX, tokenY, 14);
    }

    this.playerTokens[player.id] = graphics;
  }

  onHexHover(hexId, isOver) {
    const hexObj = this.hexGraphics[hexId];
    if (!hexObj) return;

    // Simple hover effect - could add highlight
    if (isOver) {
      this.input.setDefaultCursor('pointer');
    } else {
      this.input.setDefaultCursor('default');
    }
  }

  onHexClicked(hexId) {
    if (this.onHexClick) {
      this.onHexClick(hexId);
    }
  }

  // Called from React to update the scene
  updateData(data) {
    this.hexData = data.hexes || this.hexData;
    this.players = data.players || this.players;
    this.currentPlayerIndex = data.currentPlayerIndex ?? this.currentPlayerIndex;
    this.selectedHex = data.selectedHex ?? this.selectedHex;

    // Clear and redraw
    this.children.removeAll();
    this.hexGraphics = {};
    this.playerTokens = {};

    this.drawHexMap();
    this.drawPlayerTokens();
  }
}
