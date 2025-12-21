import { useState, useCallback } from 'react';
import { MAP_CONFIGS, SURFACE_LOCATIONS, TOMB_LOCATIONS, SURFACE_CONDITIONS, TOMB_CONDITIONS, PLAYER_COLORS, PHASES } from '../data/campaignData';
import { rollD36, parseValue } from '../utils/dice';
import { hexId, hexDistance } from '../utils/hexUtils';

const createInitialHexGrid = (config) => {
  const hexes = {};
  for (let row = 0; row < config.rows; row++) {
    for (let col = 0; col < config.cols; col++) {
      const id = hexId(row, col);
      const isSurface = row < config.surfaceRows;
      hexes[id] = {
        id,
        row,
        col,
        type: isSurface ? 'surface' : 'tomb',
        explored: false,
        location: null,
        condition: null,
        hasBase: false,
        hasCamp: false,
        baseOwner: null,
        campOwner: null,
        blocked: false
      };
    }
  }
  return hexes;
};

const createPlayer = (id, name, color, startHex) => ({
  id,
  name,
  color,
  killTeamName: `Kill Team ${id + 1}`,
  position: startHex,
  supplyPoints: 10,
  campaignPoints: 0,
  hexesExplored: 0,
  operativesKilled: 0,
  gamesPlayed: 0,
  gamesWon: 0,
  bases: [startHex],
  camps: [],
  canDemolish: false // Set to true after winning a battle
});

export function useCampaign() {
  const [gameStarted, setGameStarted] = useState(false);
  const [playerCount, setPlayerCount] = useState(4);
  const [players, setPlayers] = useState([]);
  const [hexes, setHexes] = useState({});
  const [currentRound, setCurrentRound] = useState(1);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [threatLevel, setThreatLevel] = useState(1);
  const [targetThreatLevel, setTargetThreatLevel] = useState(7);
  const [eventLog, setEventLog] = useState([]);
  const [soloMode, setSoloMode] = useState(false);
  const [mapConfig, setMapConfig] = useState(null);
  const [selectedHex, setSelectedHex] = useState(null);
  const [gameEnded, setGameEnded] = useState(false);

  const addEvent = useCallback((message, type = 'info') => {
    const event = {
      id: Date.now(),
      round: currentRound,
      phase: PHASES[currentPhase],
      message,
      type,
      timestamp: new Date().toLocaleTimeString()
    };
    setEventLog(prev => [event, ...prev]);
  }, [currentRound, currentPhase]);

  const startGame = useCallback((numPlayers, isSolo = false) => {
    const config = MAP_CONFIGS[numPlayers] || MAP_CONFIGS[4];
    setMapConfig(config);
    setSoloMode(isSolo);

    const initialHexes = createInitialHexGrid(config);

    // Set up starting positions (spread across top row for surface)
    const startPositions = [];
    const spacing = Math.floor(config.cols / numPlayers);
    for (let i = 0; i < numPlayers; i++) {
      const col = Math.min(Math.floor(spacing * i + spacing / 2), config.cols - 1);
      startPositions.push(hexId(0, col));
    }

    // Mark starting hexes as bases and explored
    startPositions.forEach((pos, idx) => {
      if (initialHexes[pos]) {
        initialHexes[pos].explored = true;
        initialHexes[pos].hasBase = true;
        initialHexes[pos].baseOwner = idx;
        initialHexes[pos].location = { name: 'Base Camp', description: 'Your starting location.', effect: 'base' };
        initialHexes[pos].condition = { name: 'Clear', description: 'No adverse conditions.', effect: 'none' };
      }
    });

    // Create players
    const newPlayers = [];
    for (let i = 0; i < numPlayers; i++) {
      newPlayers.push(createPlayer(i, `Player ${i + 1}`, PLAYER_COLORS[i], startPositions[i]));
    }

    setHexes(initialHexes);
    setPlayers(newPlayers);
    setCurrentRound(1);
    setCurrentPhase(0);
    setCurrentPlayerIndex(0);
    setThreatLevel(1);
    setGameStarted(true);
    setGameEnded(false);
    setEventLog([]);
    addEvent(`Campaign started with ${numPlayers} players. Target threat level: ${targetThreatLevel}.`, 'system');
  }, [targetThreatLevel, addEvent]);

  const exploreHex = useCallback((hexKey) => {
    setHexes(prev => {
      const hex = prev[hexKey];
      if (!hex || hex.explored) return prev;

      const locations = hex.type === 'surface' ? SURFACE_LOCATIONS : TOMB_LOCATIONS;
      const conditions = hex.type === 'surface' ? SURFACE_CONDITIONS : TOMB_CONDITIONS;

      const locationRoll = rollD36();
      const conditionRoll = rollD36();

      const location = locations[locationRoll] || { name: 'Unknown', description: 'Nothing notable.', effect: 'none' };
      const condition = conditions[conditionRoll] || { name: 'Clear', description: 'No adverse conditions.', effect: 'none' };

      addEvent(`Explored hex ${hexKey}: ${location.name} (${condition.name})`, 'exploration');

      // Handle immediate exploration effects
      let spGain = 0;
      let cpGain = 0;

      if (location.effect === 'gainSP' && location.value) {
        spGain = parseValue(location.value);
      }
      if (location.effect === 'gainCP' && location.value) {
        cpGain = parseValue(location.value);
      }

      if (spGain > 0 || cpGain > 0) {
        setPlayers(prevPlayers => {
          const updated = [...prevPlayers];
          updated[currentPlayerIndex] = {
            ...updated[currentPlayerIndex],
            supplyPoints: updated[currentPlayerIndex].supplyPoints + spGain,
            campaignPoints: updated[currentPlayerIndex].campaignPoints + cpGain,
            hexesExplored: updated[currentPlayerIndex].hexesExplored + 1
          };
          if (spGain > 0) addEvent(`Gained ${spGain} SP from ${location.name}`, 'reward');
          if (cpGain > 0) addEvent(`Gained ${cpGain} CP from ${location.name}`, 'reward');
          return updated;
        });
      } else {
        setPlayers(prevPlayers => {
          const updated = [...prevPlayers];
          updated[currentPlayerIndex] = {
            ...updated[currentPlayerIndex],
            hexesExplored: updated[currentPlayerIndex].hexesExplored + 1
          };
          return updated;
        });
      }

      // Handle threat increase from tomb exploration in solo mode
      if (soloMode && hex.type === 'tomb' && condition.effect === 'threatIncrease') {
        const threatInc = condition.value || 1;
        setThreatLevel(prev => Math.min(prev + threatInc, 10));
        addEvent(`Threat level increased by ${threatInc}!`, 'warning');
      }

      return {
        ...prev,
        [hexKey]: {
          ...hex,
          explored: true,
          location,
          condition
        }
      };
    });
  }, [currentPlayerIndex, soloMode, addEvent]);

  const movePlayer = useCallback((playerIndex, targetHex, cost) => {
    setPlayers(prev => {
      const updated = [...prev];
      const player = updated[playerIndex];

      if (player.supplyPoints < cost) {
        addEvent(`${player.name} doesn't have enough SP to move!`, 'error');
        return prev;
      }

      updated[playerIndex] = {
        ...player,
        position: targetHex,
        supplyPoints: player.supplyPoints - cost
      };

      addEvent(`${player.name} moved to ${targetHex} (cost: ${cost} SP)`, 'movement');
      return updated;
    });

    // Check if hex needs exploration
    if (hexes[targetHex] && !hexes[targetHex].explored) {
      exploreHex(targetHex);
    }
  }, [hexes, exploreHex, addEvent]);

  const performAction = useCallback((action, params = {}) => {
    const player = players[currentPlayerIndex];

    switch (action) {
      case 'RESUPPLY': {
        const hex = hexes[player.position];
        let spGain = 1;

        if (hex?.hasBase && hex.baseOwner === currentPlayerIndex) {
          spGain = 10;
        } else if (hex?.hasCamp && hex.campOwner === currentPlayerIndex) {
          spGain = Math.floor(Math.random() * 3) + 4; // D3+3
        }

        // Apply condition modifiers
        if (hex?.condition?.effect === 'bonusResupply') spGain += 1;
        if (hex?.condition?.effect === 'reducedResupply') spGain -= 1;

        spGain = Math.max(0, Math.min(spGain, 10 - player.supplyPoints));

        setPlayers(prev => {
          const updated = [...prev];
          updated[currentPlayerIndex] = {
            ...updated[currentPlayerIndex],
            supplyPoints: Math.min(10, updated[currentPlayerIndex].supplyPoints + spGain)
          };
          return updated;
        });

        addEvent(`${player.name} resupplied: +${spGain} SP`, 'action');
        break;
      }

      case 'SCOUT': {
        const { targetHex, distance } = params;
        const cost = distance;

        if (player.supplyPoints < cost) {
          addEvent(`Not enough SP to scout (need ${cost})`, 'error');
          return;
        }

        setPlayers(prev => {
          const updated = [...prev];
          updated[currentPlayerIndex] = {
            ...updated[currentPlayerIndex],
            supplyPoints: updated[currentPlayerIndex].supplyPoints - cost
          };
          return updated;
        });

        exploreHex(targetHex);
        addEvent(`${player.name} scouted ${targetHex} (cost: ${cost} SP)`, 'action');
        break;
      }

      case 'SEARCH': {
        const hex = hexes[player.position];
        let reward = null;

        if (hex?.location?.effect === 'searchSP') {
          const spGain = parseValue(hex.location.value || 'D3');
          setPlayers(prev => {
            const updated = [...prev];
            updated[currentPlayerIndex] = {
              ...updated[currentPlayerIndex],
              supplyPoints: Math.min(10, updated[currentPlayerIndex].supplyPoints + spGain)
            };
            return updated;
          });
          reward = `+${spGain} SP`;
        } else if (hex?.location?.effect === 'searchCP') {
          const cpGain = parseValue(hex.location.value || 1);
          setPlayers(prev => {
            const updated = [...prev];
            updated[currentPlayerIndex] = {
              ...updated[currentPlayerIndex],
              campaignPoints: updated[currentPlayerIndex].campaignPoints + cpGain
            };
            return updated;
          });
          reward = `+${cpGain} CP`;
        }

        if (reward) {
          addEvent(`${player.name} searched and found: ${reward}`, 'action');
        } else {
          addEvent(`${player.name} searched but found nothing`, 'action');
        }
        break;
      }

      case 'ENCAMP': {
        const { cost } = params;
        const hex = hexes[player.position];

        if (hex?.hasCamp || hex?.hasBase) {
          addEvent(`Cannot build camp here - already occupied`, 'error');
          return;
        }

        if (player.supplyPoints < cost) {
          addEvent(`Not enough SP to encamp (need ${cost})`, 'error');
          return;
        }

        // Apply location modifier
        let actualCost = cost;
        if (hex?.location?.effect === 'freeEncamp') actualCost = 0;
        if (hex?.condition?.effect === 'cheapEncamp') actualCost = Math.max(0, actualCost - 1);

        setPlayers(prev => {
          const updated = [...prev];
          updated[currentPlayerIndex] = {
            ...updated[currentPlayerIndex],
            supplyPoints: updated[currentPlayerIndex].supplyPoints - actualCost,
            camps: [...updated[currentPlayerIndex].camps, player.position]
          };
          return updated;
        });

        setHexes(prev => ({
          ...prev,
          [player.position]: {
            ...prev[player.position],
            hasCamp: true,
            campOwner: currentPlayerIndex
          }
        }));

        addEvent(`${player.name} built a camp (cost: ${actualCost} SP)`, 'action');
        break;
      }

      case 'DEMOLISH': {
        const hex = hexes[player.position];

        if (!player.canDemolish) {
          addEvent(`Must win a battle before demolishing`, 'error');
          return;
        }

        if (hex?.hasCamp && hex.campOwner !== currentPlayerIndex) {
          const ownerIndex = hex.campOwner;
          setHexes(prev => ({
            ...prev,
            [player.position]: {
              ...prev[player.position],
              hasCamp: false,
              campOwner: null
            }
          }));

          setPlayers(prev => {
            const updated = [...prev];
            updated[ownerIndex] = {
              ...updated[ownerIndex],
              camps: updated[ownerIndex].camps.filter(c => c !== player.position)
            };
            updated[currentPlayerIndex] = {
              ...updated[currentPlayerIndex],
              canDemolish: false
            };
            return updated;
          });

          addEvent(`${player.name} demolished ${players[ownerIndex].name}'s camp!`, 'action');
        }
        break;
      }
    }
  }, [players, hexes, currentPlayerIndex, exploreHex, addEvent]);

  const recordBattle = useCallback((result, opponentIndex = null, operativesKilled = 0) => {
    setPlayers(prev => {
      const updated = [...prev];
      const player = updated[currentPlayerIndex];

      updated[currentPlayerIndex] = {
        ...player,
        supplyPoints: Math.min(10, player.supplyPoints + result.spGain),
        campaignPoints: player.campaignPoints + result.cpGain,
        gamesPlayed: player.gamesPlayed + 1,
        gamesWon: result.name === 'Victory' ? player.gamesWon + 1 : player.gamesWon,
        operativesKilled: player.operativesKilled + operativesKilled,
        canDemolish: result.name === 'Victory'
      };

      return updated;
    });

    addEvent(`${players[currentPlayerIndex].name}: ${result.name} (+${result.cpGain} CP, +${result.spGain} SP)`, 'battle');
  }, [players, currentPlayerIndex, addEvent]);

  const nextPhase = useCallback(() => {
    if (currentPhase < PHASES.length - 1) {
      setCurrentPhase(prev => prev + 1);
      addEvent(`Phase changed to ${PHASES[currentPhase + 1]}`, 'system');
    } else {
      // Move to next player or next round
      if (currentPlayerIndex < players.length - 1) {
        setCurrentPlayerIndex(prev => prev + 1);
        setCurrentPhase(0);
        addEvent(`${players[currentPlayerIndex + 1].name}'s turn`, 'system');
      } else {
        // End of round - increase threat
        const newThreat = threatLevel + 1;
        setThreatLevel(newThreat);
        setCurrentRound(prev => prev + 1);
        setCurrentPlayerIndex(0);
        setCurrentPhase(0);

        if (newThreat >= targetThreatLevel) {
          setGameEnded(true);
          addEvent(`Campaign ended! Final threat level: ${newThreat}`, 'system');
        } else {
          addEvent(`Round ${currentRound + 1} begins. Threat level: ${newThreat}`, 'system');
        }
      }
    }
  }, [currentPhase, currentPlayerIndex, players, threatLevel, targetThreatLevel, currentRound, addEvent]);

  const updatePlayer = useCallback((playerIndex, updates) => {
    setPlayers(prev => {
      const updated = [...prev];
      updated[playerIndex] = { ...updated[playerIndex], ...updates };
      return updated;
    });
  }, []);

  const toggleHexBlocked = useCallback((hexKey) => {
    setHexes(prev => ({
      ...prev,
      [hexKey]: {
        ...prev[hexKey],
        blocked: !prev[hexKey].blocked
      }
    }));
  }, []);

  const calculateEncampCost = useCallback((playerIndex) => {
    const player = players[playerIndex];
    if (!player) return 999;

    // Find nearest base or camp
    let minDist = 999;
    const playerPos = player.position;
    const [pRow, pCol] = playerPos.split(',').map(Number);

    player.bases.forEach(baseHex => {
      const [bRow, bCol] = baseHex.split(',').map(Number);
      const dist = hexDistance(pRow, pCol, bRow, bCol);
      if (dist < minDist) minDist = dist;
    });

    player.camps.forEach(campHex => {
      const [cRow, cCol] = campHex.split(',').map(Number);
      const dist = hexDistance(pRow, pCol, cRow, cCol);
      if (dist < minDist) minDist = dist;
    });

    return minDist;
  }, [players]);

  return {
    // State
    gameStarted,
    playerCount,
    players,
    hexes,
    currentRound,
    currentPhase,
    currentPlayerIndex,
    threatLevel,
    targetThreatLevel,
    eventLog,
    soloMode,
    mapConfig,
    selectedHex,
    gameEnded,

    // Setters
    setPlayerCount,
    setTargetThreatLevel,
    setSelectedHex,

    // Actions
    startGame,
    movePlayer,
    exploreHex,
    performAction,
    recordBattle,
    nextPhase,
    updatePlayer,
    toggleHexBlocked,
    calculateEncampCost,
    addEvent
  };
}
