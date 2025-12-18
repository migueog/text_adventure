import React, { useMemo } from 'react';
import { hexDistance } from '../utils/hexUtils';

const HEX_SIZE = 45;
const HEX_WIDTH = HEX_SIZE * 2;
const HEX_HEIGHT = Math.sqrt(3) * HEX_SIZE;

function Hex({ hex, players, isSelected, onClick, currentPlayerPosition }) {
  const { row, col, type, explored, location, condition, hasBase, hasCamp, baseOwner, campOwner, blocked } = hex;

  // Calculate position (offset coordinates, odd-r layout)
  const x = col * HEX_WIDTH * 0.75 + HEX_SIZE + 10;
  const y = row * HEX_HEIGHT + (col % 2 === 1 ? HEX_HEIGHT / 2 : 0) + HEX_SIZE + 10;

  // Determine fill color based on hex type and state
  let fillColor = type === 'surface' ? '#4a90a4' : '#6b4a8a';
  if (blocked) fillColor = '#333';
  if (!explored) fillColor = type === 'surface' ? '#2c5a6a' : '#3d2a5a';

  // Border color for bases/camps
  let strokeColor = '#1a1a2e';
  let strokeWidth = 2;
  if (hasBase) {
    strokeColor = '#2ecc71';
    strokeWidth = 4;
  } else if (hasCamp) {
    strokeColor = '#3498db';
    strokeWidth = 3;
  }
  if (isSelected) {
    strokeColor = '#f1c40f';
    strokeWidth = 4;
  }

  // Find players on this hex
  const playersHere = players.filter(p => p.position === hex.id);

  // Calculate distance from current player for movement display
  const [currentRow, currentCol] = currentPlayerPosition?.split(',').map(Number) || [0, 0];
  const distance = hexDistance(row, col, currentRow, currentCol);

  // Hexagon points (pointy-top)
  const points = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    points.push(`${x + HEX_SIZE * Math.cos(angle)},${y + HEX_SIZE * Math.sin(angle)}`);
  }

  return (
    <g onClick={() => onClick(hex)} style={{ cursor: 'pointer' }}>
      {/* Main hex */}
      <polygon
        points={points.join(' ')}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
      />

      {/* Hex coordinate label */}
      <text
        x={x}
        y={y - HEX_SIZE * 0.5}
        textAnchor="middle"
        fill="#ffffff80"
        fontSize="10"
      >
        {row},{col}
      </text>

      {/* Location name if explored */}
      {explored && location && (
        <text
          x={x}
          y={y - 5}
          textAnchor="middle"
          fill="#fff"
          fontSize="9"
          fontWeight="bold"
        >
          {location.name.length > 12 ? location.name.slice(0, 12) + '...' : location.name}
        </text>
      )}

      {/* Condition indicator */}
      {explored && condition && condition.effect !== 'none' && (
        <text
          x={x}
          y={y + 8}
          textAnchor="middle"
          fill="#ffd700"
          fontSize="8"
        >
          {condition.name}
        </text>
      )}

      {/* Type indicator */}
      <text
        x={x}
        y={y + HEX_SIZE * 0.55}
        textAnchor="middle"
        fill="#ffffff60"
        fontSize="8"
      >
        {blocked ? 'BLOCKED' : type === 'surface' ? 'Surface' : 'Tomb'}
      </text>

      {/* Distance indicator (for movement) */}
      {distance > 0 && distance <= 3 && !blocked && (
        <text
          x={x + HEX_SIZE * 0.6}
          y={y - HEX_SIZE * 0.4}
          textAnchor="middle"
          fill="#fff"
          fontSize="10"
          fontWeight="bold"
        >
          {distance}
        </text>
      )}

      {/* Player tokens */}
      {playersHere.map((player, idx) => {
        const tokenX = x - 15 + (idx % 2) * 20;
        const tokenY = y + 15 + Math.floor(idx / 2) * 15;
        return (
          <g key={player.id}>
            <circle
              cx={tokenX}
              cy={tokenY}
              r={8}
              fill={player.color}
              stroke="#fff"
              strokeWidth={1}
            />
            <text
              x={tokenX}
              y={tokenY + 3}
              textAnchor="middle"
              fill="#fff"
              fontSize="8"
              fontWeight="bold"
            >
              {player.id + 1}
            </text>
          </g>
        );
      })}

      {/* Base/Camp indicators */}
      {hasBase && (
        <text
          x={x - HEX_SIZE * 0.6}
          y={y}
          textAnchor="middle"
          fill="#2ecc71"
          fontSize="14"
        >
          ⌂
        </text>
      )}
      {hasCamp && (
        <text
          x={x - HEX_SIZE * 0.6}
          y={y}
          textAnchor="middle"
          fill="#3498db"
          fontSize="12"
        >
          ⛺
        </text>
      )}
    </g>
  );
}

export default function HexMap({
  hexes,
  players,
  mapConfig,
  selectedHex,
  onHexClick,
  currentPlayerIndex
}) {
  const hexArray = useMemo(() => Object.values(hexes), [hexes]);

  if (!mapConfig) return null;

  const svgWidth = mapConfig.cols * HEX_WIDTH * 0.75 + HEX_SIZE * 2 + 20;
  const svgHeight = mapConfig.rows * HEX_HEIGHT + HEX_HEIGHT / 2 + HEX_SIZE + 20;

  const currentPlayer = players[currentPlayerIndex];

  return (
    <div className="hex-map-container">
      <svg
        width={svgWidth}
        height={svgHeight}
        style={{ background: '#0a0a1a', borderRadius: '8px' }}
      >
        {/* Grid lines for visual separation between surface and tomb */}
        <line
          x1={0}
          y1={mapConfig.surfaceRows * HEX_HEIGHT}
          x2={svgWidth}
          y2={mapConfig.surfaceRows * HEX_HEIGHT}
          stroke="#ffffff30"
          strokeWidth={2}
          strokeDasharray="5,5"
        />

        {/* Labels */}
        <text x={10} y={20} fill="#4a90a4" fontSize="12" fontWeight="bold">
          SURFACE
        </text>
        <text
          x={10}
          y={mapConfig.surfaceRows * HEX_HEIGHT + 20}
          fill="#6b4a8a"
          fontSize="12"
          fontWeight="bold"
        >
          TOMB
        </text>

        {/* Render all hexes */}
        {hexArray.map(hex => (
          <Hex
            key={hex.id}
            hex={hex}
            players={players}
            isSelected={selectedHex === hex.id}
            onClick={onHexClick}
            currentPlayerPosition={currentPlayer?.position}
          />
        ))}
      </svg>

      {/* Legend */}
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
  );
}
