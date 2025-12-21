// D36 = D3 for tens digit + D6 for units digit (11-36)

export const SURFACE_LOCATIONS = {
  11: { name: 'Landing Site', description: 'A suitable area for establishing a forward base. Encamping here costs 0 SP.', effect: 'freeEncamp' },
  12: { name: 'Supply Cache', description: 'Abandoned supplies from a previous expedition. Gain D3 SP when first explored.', effect: 'gainSP', value: 'D3' },
  13: { name: 'Observation Post', description: 'High ground with excellent visibility. Scout action costs 1 less SP from here.', effect: 'cheapScout' },
  14: { name: 'Crashed Vessel', description: 'Wreckage that may contain useful salvage. Search to gain D3 SP.', effect: 'searchSP' },
  15: { name: 'Frozen Outpost', description: 'An ice-covered structure. Nothing of note.', effect: 'none' },
  16: { name: 'Sensor Array', description: 'Functional detection equipment. Gain 1 CP when explored.', effect: 'gainCP', value: 1 },
  21: { name: 'Barren Wastes', description: 'Nothing but ice and rock.', effect: 'none' },
  22: { name: 'Ice Cavern', description: 'A natural cave system. Provides shelter but nothing else.', effect: 'none' },
  23: { name: 'Thermal Vent', description: 'Geothermal activity warms this area. Resupply gains +1 SP here.', effect: 'bonusResupply' },
  24: { name: 'Relay Station', description: 'Communications equipment. Gain 1 CP when explored.', effect: 'gainCP', value: 1 },
  25: { name: 'Abandoned Camp', description: 'Previous explorers left in a hurry. Gain 2 SP when first explored.', effect: 'gainSP', value: 2 },
  26: { name: 'Xenos Remains', description: 'Ancient alien corpses frozen in ice. Gain 1 CP for the discovery.', effect: 'gainCP', value: 1 },
  31: { name: 'Empty Plains', description: 'Featureless terrain stretching to the horizon.', effect: 'none' },
  32: { name: 'Burial Mound', description: 'Strange markings hint at what lies beneath. Search to gain 1 CP.', effect: 'searchCP' },
  33: { name: 'Frozen Lake', description: 'Thick ice covers unknown depths.', effect: 'none' },
  34: { name: 'Ruined Structure', description: 'Ancient architecture barely visible. Gain 1 CP when explored.', effect: 'gainCP', value: 1 },
  35: { name: 'Equipment Depot', description: 'Military supplies left behind. Gain D3+1 SP when first explored.', effect: 'gainSP', value: 'D3+1' },
  36: { name: 'Tomb Entrance', description: 'A passage leading down into darkness. This hex connects to the tomb.', effect: 'tombEntrance' }
};

export const TOMB_LOCATIONS = {
  11: { name: 'Stasis Chamber', description: 'Rows of dormant Necrons. Disturbing them would be unwise. Nothing of value.', effect: 'none' },
  12: { name: 'Power Conduit', description: 'Glowing energy flows through crystalline tubes. Gain 1 CP when explored.', effect: 'gainCP', value: 1 },
  13: { name: 'Astral Augury', description: 'Strange devices project star maps. Gain 2 CP when explored.', effect: 'gainCP', value: 2 },
  14: { name: 'Canoptek Nest', description: 'Repair scarabs swarm here. Dangerous but nothing to salvage.', effect: 'none' },
  15: { name: 'Transtechnic Fulcrum', description: 'Reality bends around this device. Gain D3 CP when explored.', effect: 'gainCP', value: 'D3' },
  16: { name: 'Resurrection Orb', description: 'A glowing sphere of immense power. Gain 3 CP when explored.', effect: 'gainCP', value: 3 },
  21: { name: 'Empty Corridor', description: 'Featureless metal walls stretch endlessly.', effect: 'none' },
  22: { name: 'Data Repository', description: 'Banks of alien technology store unknown information. Gain 1 CP when explored.', effect: 'gainCP', value: 1 },
  23: { name: 'Scarab Swarm', description: 'Tiny constructs cover every surface. Search at your peril.', effect: 'none' },
  24: { name: 'Trophy Hall', description: 'Displays of conquered species. Disturbing but informative. Gain 1 CP.', effect: 'gainCP', value: 1 },
  25: { name: 'Energy Cache', description: 'Stored power cells. Gain D3 SP when first explored.', effect: 'gainSP', value: 'D3' },
  26: { name: 'Null Field', description: 'Technology fails here. No special effects apply in this hex.', effect: 'nullField' },
  31: { name: 'Silent Hall', description: 'The darkness seems to absorb all sound.', effect: 'none' },
  32: { name: 'Cryptek Workshop', description: 'Tools of impossible science. Gain 2 CP when explored.', effect: 'gainCP', value: 2 },
  33: { name: 'Dimensional Rift', description: 'Space folds strangely here. Movement from this hex costs 0 SP.', effect: 'freeMovement' },
  34: { name: 'Ancient Archive', description: 'Records of eons past. Gain 1 CP when explored.', effect: 'gainCP', value: 1 },
  35: { name: 'Void Shield Generator', description: 'Defensive systems still active. Gain 2 CP when explored.', effect: 'gainCP', value: 2 },
  36: { name: 'Transdimensional Portal', description: 'A gateway to another part of the tomb. Can teleport to any other Portal hex.', effect: 'portal' }
};

export const SURFACE_CONDITIONS = {
  11: { name: 'Clear', description: 'No adverse conditions.', effect: 'none' },
  12: { name: 'Clear', description: 'No adverse conditions.', effect: 'none' },
  13: { name: 'Blizzard', description: 'Harsh winds reduce visibility. -1 to hit in battles here.', effect: 'combat', modifier: -1 },
  14: { name: 'Ice Storm', description: 'Dangerous conditions. Movement into this hex costs +1 SP.', effect: 'movementCost', value: 1 },
  15: { name: 'Whiteout', description: 'Cannot see anything. Scout actions cannot target this hex.', effect: 'noScout' },
  16: { name: 'Frozen Ground', description: 'Treacherous footing. No special effect.', effect: 'none' },
  21: { name: 'Clear', description: 'No adverse conditions.', effect: 'none' },
  22: { name: 'Clear', description: 'No adverse conditions.', effect: 'none' },
  23: { name: 'Sub-Zero', description: 'Extreme cold. Resupply provides 1 less SP here.', effect: 'reducedResupply' },
  24: { name: 'Aurora', description: 'Strange lights in the sky. Gain +1 CP for battles fought here.', effect: 'bonusBattleCP' },
  25: { name: 'Seismic Activity', description: 'Ground tremors. Random terrain shifts during battle.', effect: 'terrain' },
  26: { name: 'Radiation Zone', description: 'Lingering energy. Lose 1 SP when entering this hex.', effect: 'enterCost', value: 1 },
  31: { name: 'Clear', description: 'No adverse conditions.', effect: 'none' },
  32: { name: 'Clear', description: 'No adverse conditions.', effect: 'none' },
  33: { name: 'Fog Bank', description: 'Limited visibility. Engagement range reduced in battles.', effect: 'combat' },
  34: { name: 'Stable', description: 'Good conditions for establishing camp. Encamp costs -1 SP.', effect: 'cheapEncamp' },
  35: { name: 'Rich Deposits', description: 'Valuable resources. Search gains +1 SP or CP.', effect: 'bonusSearch' },
  36: { name: 'Necron Patrol', description: 'Active enemies. Must fight Necron NPCs if ending movement here.', effect: 'hostileNPC' }
};

export const TOMB_CONDITIONS = {
  11: { name: 'Quiet', description: 'The tomb rests. No adverse conditions.', effect: 'none' },
  12: { name: 'Quiet', description: 'The tomb rests. No adverse conditions.', effect: 'none' },
  13: { name: 'Awakening', description: 'Systems activating. Threat increases by 1 when explored.', effect: 'threatIncrease', value: 1 },
  14: { name: 'Power Surge', description: 'Energy fluctuations. Random effects during battle.', effect: 'combat' },
  15: { name: 'Lockdown', description: 'Security protocols active. Cannot leave this hex next turn.', effect: 'lockdown' },
  16: { name: 'Darkness', description: 'Lights have failed. -1 to hit in battles here.', effect: 'combat', modifier: -1 },
  21: { name: 'Quiet', description: 'The tomb rests. No adverse conditions.', effect: 'none' },
  22: { name: 'Quiet', description: 'The tomb rests. No adverse conditions.', effect: 'none' },
  23: { name: 'Repair Swarm', description: 'Scarabs everywhere. Lose 1 SP when entering.', effect: 'enterCost', value: 1 },
  24: { name: 'Phase Field', description: 'Reality shifts. Movement costs doubled in this hex.', effect: 'movementCost', value: 2 },
  25: { name: 'Stasis Leak', description: 'Time moves strangely. No actions can be taken here.', effect: 'noActions' },
  26: { name: 'Energy Nexus', description: 'Power concentration. Gain +1 SP when resupplying here.', effect: 'bonusResupply' },
  31: { name: 'Quiet', description: 'The tomb rests. No adverse conditions.', effect: 'none' },
  32: { name: 'Quiet', description: 'The tomb rests. No adverse conditions.', effect: 'none' },
  33: { name: 'Guardian Protocols', description: 'Defenses active. Must fight Necron NPCs.', effect: 'hostileNPC' },
  34: { name: 'Stable Systems', description: 'Safe area. Encamp costs -1 SP.', effect: 'cheapEncamp' },
  35: { name: 'Data Fragment', description: 'Valuable information. Search gains +1 CP.', effect: 'bonusSearchCP' },
  36: { name: 'Overlord\'s Attention', description: 'You have been noticed. Threat increases by 2.', effect: 'threatIncrease', value: 2 }
};

export const MAP_CONFIGS = {
  2: { name: 'Small (2 Players)', rows: 5, cols: 5, surfaceRows: 2, tombRows: 3 },
  3: { name: 'Medium (3 Players)', rows: 6, cols: 6, surfaceRows: 3, tombRows: 3 },
  4: { name: 'Standard (4 Players)', rows: 7, cols: 7, surfaceRows: 3, tombRows: 4 },
  5: { name: 'Large (5 Players)', rows: 8, cols: 7, surfaceRows: 3, tombRows: 5 },
  6: { name: 'Extra Large (6 Players)', rows: 8, cols: 8, surfaceRows: 3, tombRows: 5 }
};

export const PLAYER_COLORS = [
  '#e74c3c', // Red
  '#3498db', // Blue
  '#2ecc71', // Green
  '#f39c12', // Orange
  '#9b59b6', // Purple
  '#1abc9c', // Teal
];

export const ACTIONS = {
  SCOUT: {
    name: 'Scout',
    description: 'Explore a hex within 3 hexes. Costs 1 SP per hex distance.',
    costType: 'distance'
  },
  RESUPPLY: {
    name: 'Resupply',
    description: 'Gain SP based on location: Base (10 SP), Camp (D3+3 SP), Other (1 SP).',
    costType: 'none'
  },
  SEARCH: {
    name: 'Search',
    description: 'Search the current hex for resources. Effect depends on location.',
    costType: 'none'
  },
  ENCAMP: {
    name: 'Encamp',
    description: 'Build a camp. Costs SP equal to distance to nearest base/camp.',
    costType: 'distance'
  },
  DEMOLISH: {
    name: 'Demolish',
    description: 'Destroy an opponent\'s base or camp. Requires winning a battle first.',
    costType: 'none'
  }
};

export const PHASES = ['Movement', 'Battle', 'Action', 'Threat'];

export const BATTLE_RESULTS = {
  WIN: { name: 'Victory', cpGain: 1, spGain: 0 },
  DRAW: { name: 'Draw', cpGain: 0, spGain: 1 },
  LOSS: { name: 'Defeat', cpGain: 0, spGain: 1 },
  BYE: { name: 'Bye (No Opponent)', cpGain: 0, spGain: 2 }
};

export const THREAT_LEVELS = {
  1: 'Dormant',
  2: 'Stirring',
  3: 'Alert',
  4: 'Active',
  5: 'Hostile',
  6: 'Aggressive',
  7: 'Awakened'
};

export const VICTORY_CATEGORIES = [
  { id: 'warlord', name: 'Warlord', description: 'Most Campaign Points', stat: 'campaignPoints' },
  { id: 'explorer', name: 'Explorer', description: 'Most Hexes Explored', stat: 'hexesExplored' },
  { id: 'headhunter', name: 'Headhunter', description: 'Most Operatives Killed', stat: 'operativesKilled' },
  { id: 'pioneer', name: 'Pioneer', description: 'Most Supply Points Remaining', stat: 'supplyPoints' },
  { id: 'trooper', name: 'Trooper', description: 'Most Games Played', stat: 'gamesPlayed' }
];
