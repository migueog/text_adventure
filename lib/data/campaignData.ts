// D36 = D3 for tens digit + D6 for units digit (11-36)
import { Location, Condition, MapConfig, ThreatPhaseRule } from '@/types/campaign'

// WHY: Pre-defined threat phase rules for locations that have effects during Threat Phase
// Most locations have no threat phase rule - only dangerous or beneficial locations do
const THREAT_PHASE_RULES: Record<string, ThreatPhaseRule> = {
  // Tomb locations - dangerous, often increase threat
  stasisChamber: {
    type: 'threat_increase',
    amount: 1,
    target: 'player_in_hex',
    description: 'Necrons stir - threat increases by 1'
  },
  canoptekNest: {
    type: 'sp_penalty',
    amount: 1,
    target: 'all_in_hex',
    description: 'Scarabs drain resources - all players in hex lose 1 SP'
  },
  scarabSwarm: {
    type: 'sp_penalty',
    amount: 1,
    target: 'player_in_hex',
    description: 'Constant scarab damage - lose 1 SP'
  },
  // Surface locations - some provide shelter
  abandonedCamp: {
    type: 'sp_gain',
    amount: 1,
    target: 'player_in_hex',
    description: 'Shelter provides rest - gain 1 SP'
  },
  tombEntrance: {
    type: 'threat_increase',
    amount: 1,
    target: 'player_in_hex',
    description: 'Gateway stirs the tomb - threat increases by 1'
  }
}

// WHY: REPEATABLE entry for 11-16 (Issue #58) - can be found multiple times
// All D36 rolls of 11-16 reference this single entry to allow duplicate explorations
const SURFACE_RUIN: Location = {
  id: 'SL11-16',
  number: '11-16',
  type: 'REPEATABLE',
  repeatable: true,
  name: 'Unexplored Ruin',
  description: 'Ancient structures weathered by time. These ruins are scattered across the surface - many hexes contain similar sites.',
  effect: 'none',
  searchRule: { type: 'sp', amount: 1 },
  campRule: 'ALLOWED'
}

export const SURFACE_LOCATIONS: Record<number, Location> = {
  // WHY: 11-16 all reference the same repeatable entry (Issue #58)
  11: SURFACE_RUIN,
  12: SURFACE_RUIN,
  13: SURFACE_RUIN,
  14: SURFACE_RUIN,
  15: SURFACE_RUIN,
  16: SURFACE_RUIN,

  // WHY: UNIQUE entries 21-36 (Issue #58) - each can only be found once per campaign
  21: {
    id: 'SL21',
    number: 21,
    type: 'UNIQUE',
    repeatable: false,
    name: 'Barren Wastes',
    description: 'Nothing but ice and rock.',
    effect: 'none',
    searchRule: null,
    campRule: 'ALLOWED'
  },
  22: {
    id: 'SL22',
    number: 22,
    type: 'UNIQUE',
    repeatable: false,
    name: 'Ice Cavern',
    description: 'A natural cave system. Provides shelter but nothing else.',
    effect: 'none',
    searchRule: null,
    campRule: 'ALLOWED'
  },
  23: {
    id: 'SL23',
    number: 23,
    type: 'SPECIAL',
    repeatable: false,
    name: 'Beast Lair',
    description: 'A dangerous creature has made its den here. Camping forbidden - the beast will attack.',
    effect: 'none',
    searchRule: null,
    specialRules: ['BEAST_LAIR'],
    campRule: 'FORBIDDEN'
  },
  24: {
    id: 'SL24',
    number: 24,
    type: 'UNIQUE',
    repeatable: false,
    name: 'Relay Station',
    description: 'Communications equipment. Gain 1 CP when explored.',
    effect: 'gainCP',
    value: 1,
    searchRule: { type: 'cp', amount: 1 },
    campRule: 'ALLOWED'
  },
  25: {
    id: 'SL25',
    number: 25,
    type: 'SPECIAL',
    repeatable: false,
    name: 'Abandoned Camp',
    description: 'Previous explorers left in a hurry. Contains D6 supplies that can be looted.',
    effect: 'gainSP',
    value: 2,
    searchRule: { type: 'sp', amount: 2 },
    threatPhaseRule: THREAT_PHASE_RULES.abandonedCamp,
    initialState: { supplyCount: 0 }, // WHY: Roll D6 when hex explored to set initial supply
    specialRules: ['DEPLETING_SUPPLY'],
    campRule: 'ALLOWED'
  },
  26: {
    id: 'SL26',
    number: 26,
    type: 'UNIQUE',
    repeatable: false,
    name: 'Xenos Remains',
    description: 'Ancient alien corpses frozen in ice. Gain 1 CP for the discovery.',
    effect: 'gainCP',
    value: 1,
    searchRule: { type: 'cp', amount: 2 },
    campRule: 'ALLOWED'
  },
  31: {
    id: 'SL31',
    number: 31,
    type: 'SPECIAL',
    repeatable: false,
    name: 'Intelligence Cache',
    description: 'Encrypted data stores. First search grants free Scout action.',
    effect: 'none',
    searchRule: { type: 'cp', amount: 1 },
    initialState: { intelGained: 0 }, // WHY: Track if intel reward claimed
    specialRules: ['INTEL_CACHE'],
    campRule: 'ALLOWED'
  },
  32: {
    id: 'SL32',
    number: 32,
    type: 'UNIQUE',
    repeatable: false,
    name: 'Burial Mound',
    description: 'Strange markings hint at what lies beneath. Search to gain 1 CP.',
    effect: 'searchCP',
    searchRule: { type: 'cp', amount: 1 },
    campRule: 'ALLOWED'
  },
  33: {
    id: 'SL33',
    number: 33,
    type: 'SPECIAL',
    repeatable: false,
    name: 'Portal',
    description: 'A shimmering gateway. Can teleport to any other explored Portal hex.',
    effect: 'portal',
    searchRule: null,
    specialRules: ['PORTAL'],
    campRule: 'ALLOWED'
  },
  34: {
    id: 'SL34',
    number: 34,
    type: 'SPECIAL',
    repeatable: false,
    name: 'Released Prisoner',
    description: 'A survivor from a previous expedition. They will aid you if you free them.',
    effect: 'none',
    searchRule: { type: 'cp', amount: 1 },
    specialRules: ['ENTITY_ALLY'],
    campRule: 'ALLOWED'
  },
  35: {
    id: 'SL35',
    number: 35,
    type: 'UNIQUE',
    repeatable: false,
    name: 'Equipment Depot',
    description: 'Military supplies left behind. Gain D3+1 SP when first explored.',
    effect: 'gainSP',
    value: 'D3+1',
    searchRule: { type: 'sp', amount: 'd3' },
    campRule: 'ALLOWED'
  },
  36: {
    id: 'SL36',
    number: 36,
    type: 'SPECIAL',
    repeatable: false,
    name: 'Tomb Entrance',
    description: 'A passage leading down into darkness. This hex connects to the tomb.',
    effect: 'tombEntrance',
    searchRule: null,
    threatPhaseRule: THREAT_PHASE_RULES.tombEntrance,
    specialRules: ['TOMB_ENTRANCE'],
    campRule: 'DANGEROUS'
  }
}

// WHY: REPEATABLE entry for 11-16 (Issue #58) - tomb equivalent of surface ruins
const TOMB_EMPTY_CHAMBER: Location = {
  id: 'TL11-16',
  number: '11-16',
  type: 'REPEATABLE',
  repeatable: true,
  name: 'Empty Chamber',
  description: 'A featureless metal room. The tomb is vast and many chambers lie dormant and unused.',
  effect: 'none',
  searchRule: null,
  campRule: 'DANGEROUS'
}

export const TOMB_LOCATIONS: Record<number, Location> = {
  // WHY: 11-16 all reference the same repeatable entry (Issue #58)
  11: TOMB_EMPTY_CHAMBER,
  12: TOMB_EMPTY_CHAMBER,
  13: TOMB_EMPTY_CHAMBER,
  14: TOMB_EMPTY_CHAMBER,
  15: TOMB_EMPTY_CHAMBER,
  16: TOMB_EMPTY_CHAMBER,

  // WHY: UNIQUE entries 21-36 (Issue #58)
  21: {
    id: 'TL21',
    number: 21,
    type: 'UNIQUE',
    repeatable: false,
    name: 'Stasis Chamber',
    description: 'Rows of dormant Necrons. Disturbing them would be unwise. Nothing of value.',
    effect: 'none',
    searchRule: null,
    threatPhaseRule: THREAT_PHASE_RULES.stasisChamber,
    campRule: 'FORBIDDEN'
  },
  22: {
    id: 'TL22',
    number: 22,
    type: 'UNIQUE',
    repeatable: false,
    name: 'Data Repository',
    description: 'Banks of alien technology store unknown information. Gain 1 CP when explored.',
    effect: 'gainCP',
    value: 1,
    searchRule: { type: 'cp', amount: 2 },
    campRule: 'DANGEROUS'
  },
  23: {
    id: 'TL23',
    number: 23,
    type: 'SPECIAL',
    repeatable: false,
    name: 'Scarab Swarm',
    description: 'Tiny constructs cover every surface. Search at your peril.',
    effect: 'none',
    searchRule: null,
    threatPhaseRule: THREAT_PHASE_RULES.scarabSwarm,
    specialRules: ['SCARAB_DAMAGE'],
    campRule: 'FORBIDDEN'
  },
  24: {
    id: 'TL24',
    number: 24,
    type: 'UNIQUE',
    repeatable: false,
    name: 'Trophy Hall',
    description: 'Displays of conquered species. Disturbing but informative. Gain 1 CP.',
    effect: 'gainCP',
    value: 1,
    searchRule: { type: 'cp', amount: 2 },
    campRule: 'DANGEROUS'
  },
  25: {
    id: 'TL25',
    number: 25,
    type: 'UNIQUE',
    repeatable: false,
    name: 'Energy Cache',
    description: 'Stored power cells. Gain D3 SP when first explored.',
    effect: 'gainSP',
    value: 'D3',
    searchRule: { type: 'sp', amount: 'd3' },
    campRule: 'DANGEROUS'
  },
  26: {
    id: 'TL26',
    number: 26,
    type: 'SPECIAL',
    repeatable: false,
    name: 'Null Field',
    description: 'Technology fails here. No special effects apply in this hex.',
    effect: 'nullField',
    searchRule: null,
    threatPhaseRule: null,
    specialRules: ['NULL_FIELD'],
    campRule: 'ALLOWED'
  },
  31: {
    id: 'TL31',
    number: 31,
    type: 'UNIQUE',
    repeatable: false,
    name: 'Silent Hall',
    description: 'The darkness seems to absorb all sound.',
    effect: 'none',
    searchRule: null,
    campRule: 'DANGEROUS'
  },
  32: {
    id: 'TL32',
    number: 32,
    type: 'UNIQUE',
    repeatable: false,
    name: 'Cryptek Workshop',
    description: 'Tools of impossible science. Gain 2 CP when explored.',
    effect: 'gainCP',
    value: 2,
    searchRule: { type: 'both', sp: 'd3', cp: 2 },
    campRule: 'DANGEROUS'
  },
  33: {
    id: 'TL33',
    number: 33,
    type: 'SPECIAL',
    repeatable: false,
    name: 'Dimensional Rift',
    description: 'Space folds strangely here. Movement from this hex costs 0 SP.',
    effect: 'freeMovement',
    searchRule: null,
    specialRules: ['FREE_MOVEMENT'],
    campRule: 'DANGEROUS'
  },
  34: {
    id: 'TL34',
    number: 34,
    type: 'UNIQUE',
    repeatable: false,
    name: 'Ancient Archive',
    description: 'Records of eons past. Gain 1 CP when explored.',
    effect: 'gainCP',
    value: 1,
    searchRule: { type: 'cp', amount: 2 },
    campRule: 'DANGEROUS'
  },
  35: {
    id: 'TL35',
    number: 35,
    type: 'UNIQUE',
    repeatable: false,
    name: 'Void Shield Generator',
    description: 'Defensive systems still active. Gain 2 CP when explored.',
    effect: 'gainCP',
    value: 2,
    searchRule: { type: 'cp', amount: 1 },
    campRule: 'DANGEROUS'
  },
  36: {
    id: 'TL36',
    number: 36,
    type: 'SPECIAL',
    repeatable: false,
    name: 'Transdimensional Portal',
    description: 'A gateway to another part of the tomb. Can teleport to any other explored Portal hex.',
    effect: 'portal',
    searchRule: null,
    specialRules: ['PORTAL'],
    campRule: 'ALLOWED'
  }
}

// WHY: REPEATABLE condition for 11-16 (Issue #58)
const SURFACE_CLEAR: Condition = {
  id: 'SC11-16',
  number: '11-16',
  type: 'REPEATABLE',
  repeatable: true,
  name: 'Clear',
  description: 'No adverse conditions.',
  effect: 'none'
}

export const SURFACE_CONDITIONS: Record<number, Condition> = {
  // WHY: 11-16 all reference the same repeatable entry (Issue #58)
  11: SURFACE_CLEAR,
  12: SURFACE_CLEAR,
  13: SURFACE_CLEAR,
  14: SURFACE_CLEAR,
  15: SURFACE_CLEAR,
  16: SURFACE_CLEAR,

  // WHY: STANDARD conditions 21-36 (Issue #58)
  21: {
    id: 'SC21',
    number: 21,
    type: 'STANDARD',
    repeatable: false,
    name: 'Blizzard',
    description: 'Harsh winds reduce visibility.',
    effect: 'combat',
    modifier: -1,
    battleEffect: 'All operatives have Conceal. Reduce shooting ranges by 2 inches.'
  },
  22: {
    id: 'SC22',
    number: 22,
    type: 'STANDARD',
    repeatable: false,
    name: 'Ice Storm',
    description: 'Dangerous conditions. Movement into this hex costs +1 SP.',
    effect: 'movementCost',
    value: 1
  },
  23: {
    id: 'SC23',
    number: 23,
    type: 'STANDARD',
    repeatable: false,
    name: 'Sub-Zero',
    description: 'Extreme cold. Resupply provides 1 less SP here.',
    effect: 'reducedResupply'
  },
  24: {
    id: 'SC24',
    number: 24,
    type: 'STANDARD',
    repeatable: false,
    name: 'Aurora',
    description: 'Strange lights in the sky. Gain +1 CP for battles fought here.',
    effect: 'bonusBattleCP'
  },
  25: {
    id: 'SC25',
    number: 25,
    type: 'STANDARD',
    repeatable: false,
    name: 'Seismic Activity',
    description: 'Ground tremors. Random terrain shifts during battle.',
    effect: 'terrain',
    battleEffect: 'At the start of each Turning Point, move one piece of terrain D6 inches in a random direction.'
  },
  26: {
    id: 'SC26',
    number: 26,
    type: 'STANDARD',
    repeatable: false,
    name: 'Radiation Zone',
    description: 'Lingering energy. Lose 1 SP when entering this hex.',
    effect: 'enterCost',
    value: 1
  },
  31: {
    id: 'SC31',
    number: 31,
    type: 'STANDARD',
    repeatable: false,
    name: 'Whiteout',
    description: 'Cannot see anything. Scout actions cannot target this hex.',
    effect: 'noScout',
    battleEffect: 'All operatives have Conceal. Line of sight limited to 6 inches.'
  },
  32: {
    id: 'SC32',
    number: 32,
    type: 'STANDARD',
    repeatable: false,
    name: 'Frozen Ground',
    description: 'Treacherous footing.',
    effect: 'combat',
    battleEffect: 'Difficult terrain everywhere. Reduce Movement by 1 inch.'
  },
  33: {
    id: 'SC33',
    number: 33,
    type: 'STANDARD',
    repeatable: false,
    name: 'Fog Bank',
    description: 'Limited visibility. Engagement range reduced in battles.',
    effect: 'combat',
    battleEffect: 'Reduce engagement range to 1 inch. All operatives have Conceal.'
  },
  34: {
    id: 'SC34',
    number: 34,
    type: 'STANDARD',
    repeatable: false,
    name: 'Stable',
    description: 'Good conditions for establishing camp. Encamp costs -1 SP.',
    effect: 'cheapEncamp'
  },
  35: {
    id: 'SC35',
    number: 35,
    type: 'STANDARD',
    repeatable: false,
    name: 'Rich Deposits',
    description: 'Valuable resources. Search gains +1 SP or CP.',
    effect: 'bonusSearch'
  },
  36: {
    id: 'SC36',
    number: 36,
    type: 'STANDARD',
    repeatable: false,
    name: 'Necron Patrol',
    description: 'Active enemies. Must fight Necron NPCs if ending movement here.',
    effect: 'hostileNPC',
    specialRules: ['NECRON_PATROL']
  }
}

// WHY: REPEATABLE condition for 11-16 (Issue #58) - tomb equivalent of Clear
const TOMB_QUIET: Condition = {
  id: 'TC11-16',
  number: '11-16',
  type: 'REPEATABLE',
  repeatable: true,
  name: 'Quiet',
  description: 'The tomb rests. No adverse conditions.',
  effect: 'none'
}

export const TOMB_CONDITIONS: Record<number, Condition> = {
  // WHY: 11-16 all reference the same repeatable entry (Issue #58)
  11: TOMB_QUIET,
  12: TOMB_QUIET,
  13: TOMB_QUIET,
  14: TOMB_QUIET,
  15: TOMB_QUIET,
  16: TOMB_QUIET,

  // WHY: STANDARD conditions 21-36 (Issue #58)
  21: {
    id: 'TC21',
    number: 21,
    type: 'STANDARD',
    repeatable: false,
    name: 'Awakening',
    description: 'Systems activating. Threat increases by 1 when explored.',
    effect: 'threatIncrease',
    value: 1
  },
  22: {
    id: 'TC22',
    number: 22,
    type: 'STANDARD',
    repeatable: false,
    name: 'Power Surge',
    description: 'Energy fluctuations. Random effects during battle.',
    effect: 'combat',
    battleEffect: 'At the start of each Turning Point, roll D6. On 1-2, a random operative suffers D3 mortal wounds.'
  },
  23: {
    id: 'TC23',
    number: 23,
    type: 'STANDARD',
    repeatable: false,
    name: 'Repair Swarm',
    description: 'Scarabs everywhere. Lose 1 SP when entering.',
    effect: 'enterCost',
    value: 1
  },
  24: {
    id: 'TC24',
    number: 24,
    type: 'STANDARD',
    repeatable: false,
    name: 'Phase Field',
    description: 'Reality shifts. Movement costs doubled in this hex.',
    effect: 'movementCost',
    value: 2
  },
  25: {
    id: 'TC25',
    number: 25,
    type: 'STANDARD',
    repeatable: false,
    name: 'Stasis Leak',
    description: 'Time moves strangely. No actions can be taken here.',
    effect: 'noActions',
    battleEffect: 'Once per Turning Point, a random operative cannot activate.'
  },
  26: {
    id: 'TC26',
    number: 26,
    type: 'STANDARD',
    repeatable: false,
    name: 'Energy Nexus',
    description: 'Power concentration. Gain +1 SP when resupplying here.',
    effect: 'bonusResupply'
  },
  31: {
    id: 'TC31',
    number: 31,
    type: 'STANDARD',
    repeatable: false,
    name: 'Lockdown',
    description: 'Security protocols active. Cannot leave this hex next turn.',
    effect: 'lockdown',
    specialRules: ['LOCKDOWN']
  },
  32: {
    id: 'TC32',
    number: 32,
    type: 'STANDARD',
    repeatable: false,
    name: 'Darkness',
    description: 'Lights have failed.',
    effect: 'combat',
    modifier: -1,
    battleEffect: 'All operatives have Conceal. Reduce shooting ranges by 3 inches.'
  },
  33: {
    id: 'TC33',
    number: 33,
    type: 'STANDARD',
    repeatable: false,
    name: 'Guardian Protocols',
    description: 'Defenses active. Must fight Necron NPCs.',
    effect: 'hostileNPC',
    specialRules: ['NECRON_GUARDIANS']
  },
  34: {
    id: 'TC34',
    number: 34,
    type: 'STANDARD',
    repeatable: false,
    name: 'Stable Systems',
    description: 'Safe area. Encamp costs -1 SP.',
    effect: 'cheapEncamp'
  },
  35: {
    id: 'TC35',
    number: 35,
    type: 'STANDARD',
    repeatable: false,
    name: 'Data Fragment',
    description: 'Valuable information. Search gains +1 CP.',
    effect: 'bonusSearchCP'
  },
  36: {
    id: 'TC36',
    number: 36,
    type: 'STANDARD',
    repeatable: false,
    name: 'Overlord\'s Attention',
    description: 'You have been noticed. Threat increases by 2.',
    effect: 'threatIncrease',
    value: 2
  }
}

// Map size tiers based on official rules:
// 2-3 players: 5x5 (smaller map)
// 4-5 players: 6x6 (standard map)  
// 6 players: 7x7 (larger map)
export const MAP_CONFIGS: Record<number, MapConfig> = {
  2: { name: 'Small (2 Players)', rows: 5, cols: 5, surfaceRows: 2, tombRows: 3 },
  3: { name: 'Small (3 Players)', rows: 5, cols: 5, surfaceRows: 2, tombRows: 3 },
  4: { name: 'Standard (4 Players)', rows: 6, cols: 6, surfaceRows: 3, tombRows: 3 },
  5: { name: 'Standard (5 Players)', rows: 6, cols: 6, surfaceRows: 3, tombRows: 3 },
  6: { name: 'Large (6 Players)', rows: 7, cols: 7, surfaceRows: 3, tombRows: 4 }
}

export const PLAYER_COLORS: string[] = [
  '#e74c3c', // Red
  '#3498db', // Blue
  '#2ecc71', // Green
  '#f39c12', // Orange
  '#9b59b6', // Purple
  '#1abc9c', // Teal
]

export interface ActionInfo {
  name: string
  description: string
  costType: 'distance' | 'none'
}

export const ACTIONS: Record<string, ActionInfo> = {
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
}

export const PHASES: string[] = ['Movement', 'Battle', 'Action', 'Threat']

export interface BattleResultInfo {
  name: string
  cpGain: number
  spGain: number
}

export const BATTLE_RESULTS: Record<string, BattleResultInfo> = {
  WIN: { name: 'Victory', cpGain: 1, spGain: 0 },
  DRAW: { name: 'Draw', cpGain: 0, spGain: 1 },
  LOSS: { name: 'Defeat', cpGain: 0, spGain: 1 },
  BYE: { name: 'Bye (No Opponent)', cpGain: 0, spGain: 2 }
}

export const THREAT_LEVELS: Record<number, string> = {
  1: 'Dormant',
  2: 'Stirring',
  3: 'Alert',
  4: 'Active',
  5: 'Hostile',
  6: 'Aggressive',
  7: 'Awakened',
  8: 'Enraged',
  9: 'Cataclysmic',
  10: 'Apocalyptic'
}

export interface VictoryCategory {
  id: string
  name: string
  description: string
  stat: string
}

export const VICTORY_CATEGORIES: VictoryCategory[] = [
  { id: 'warlord', name: 'Warlord', description: 'Most Campaign Points', stat: 'campaignPoints' },
  { id: 'explorer', name: 'Explorer', description: 'Most Hexes Explored', stat: 'exploredHexes' },
  { id: 'headhunter', name: 'Headhunter', description: 'Most Operatives Killed', stat: 'operativesKilled' },
  { id: 'pioneer', name: 'Pioneer', description: 'Most Supply Points Remaining', stat: 'supplyPoints' },
  { id: 'trooper', name: 'Trooper', description: 'Most Games Played', stat: 'gamesPlayed' }
]
