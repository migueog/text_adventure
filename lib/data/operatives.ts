import type { Operative, OperativeDatabase } from '@/types/campaign'
import { calculateOperativeWoundValue } from '@/lib/utils/operativeKills'

/**
 * WHY: Issue #52 - Pre-defined Kill Team operative database for quick-select UI
 *
 * Contains 30 common Kill Team operatives with accurate wound characteristics.
 * Wound values are pre-calculated using the HEADHUNTER rules:
 * - ≤5 wounds = 0 points
 * - 6-10 wounds = 1 point
 * - 11+ wounds = 2 points
 */

// WHY: Helper to create operative entry with auto-calculated wound value
function createOperative(
  id: string,
  name: string,
  faction: string,
  wounds: number,
  category?: string
): Operative {
  return {
    id,
    name,
    faction,
    wounds,
    woundValue: calculateOperativeWoundValue(wounds),
    category
  }
}

export const OPERATIVE_DATABASE: OperativeDatabase = {
  // 0 points (≤5 wounds) - Very rare in Kill Team
  'gretchin': createOperative('gretchin', 'Gretchin', 'Orks', 4, 'Troops'),

  // 1 point (6-10 wounds) - Most common operatives
  // T'au Empire
  'fire-warrior': createOperative('fire-warrior', 'Fire Warrior', 'T\'au Empire', 7, 'Troops'),
  'pathfinder': createOperative('pathfinder', 'Pathfinder', 'T\'au Empire', 7, 'Troops'),
  'stealth-suit': createOperative('stealth-suit', 'Stealth Suit', 'T\'au Empire', 10, 'Elite'),

  // Space Marines
  'tactical-marine': createOperative('tactical-marine', 'Tactical Marine', 'Space Marines', 8, 'Troops'),
  'scout-marine': createOperative('scout-marine', 'Scout Marine', 'Space Marines', 8, 'Troops'),
  'assault-marine': createOperative('assault-marine', 'Assault Marine', 'Space Marines', 8, 'Troops'),
  'intercessor': createOperative('intercessor', 'Intercessor', 'Space Marines', 9, 'Troops'),

  // Orks
  'ork-boy': createOperative('ork-boy', 'Ork Boy', 'Orks', 8, 'Troops'),
  'ork-kommando': createOperative('ork-kommando', 'Kommando', 'Orks', 8, 'Troops'),

  // Necrons
  'necron-warrior': createOperative('necron-warrior', 'Necron Warrior', 'Necrons', 9, 'Troops'),
  'immortal': createOperative('immortal', 'Immortal', 'Necrons', 9, 'Troops'),
  'deathmark': createOperative('deathmark', 'Deathmark', 'Necrons', 9, 'Elite'),

  // Astra Militarum
  'guardsman': createOperative('guardsman', 'Guardsman', 'Astra Militarum', 7, 'Troops'),
  'tempestus-scion': createOperative('tempestus-scion', 'Tempestus Scion', 'Astra Militarum', 7, 'Troops'),

  // Chaos Space Marines
  'cultist': createOperative('cultist', 'Cultist', 'Chaos Space Marines', 7, 'Troops'),
  'chaos-marine': createOperative('chaos-marine', 'Chaos Space Marine', 'Chaos Space Marines', 8, 'Troops'),
  'plague-marine': createOperative('plague-marine', 'Plague Marine', 'Chaos Space Marines', 10, 'Troops'),

  // Tyranids
  'termagant': createOperative('termagant', 'Termagant', 'Tyranids', 7, 'Troops'),
  'hormagaunt': createOperative('hormagaunt', 'Hormagaunt', 'Tyranids', 7, 'Troops'),
  'genestealer': createOperative('genestealer', 'Genestealer', 'Tyranids', 8, 'Elite'),

  // 2 points (11+ wounds) - Elite/Leader operatives
  // T'au Empire
  'crisis-suit': createOperative('crisis-suit', 'Crisis Battlesuit', 'T\'au Empire', 12, 'Elite'),

  // Space Marines
  'intercessor-sergeant': createOperative('intercessor-sergeant', 'Intercessor Sergeant', 'Space Marines', 11, 'Leader'),
  'assault-sergeant': createOperative('assault-sergeant', 'Assault Sergeant', 'Space Marines', 11, 'Leader'),
  'terminator': createOperative('terminator', 'Terminator', 'Space Marines', 12, 'Elite'),

  // Orks
  'ork-nob': createOperative('ork-nob', 'Ork Nob', 'Orks', 12, 'Leader'),

  // Chaos Space Marines
  'rubric-marine': createOperative('rubric-marine', 'Rubric Marine', 'Thousand Sons', 11, 'Troops'),
  'aspiring-champion': createOperative('aspiring-champion', 'Aspiring Champion', 'Chaos Space Marines', 11, 'Leader'),

  // Tyranids
  'tyranid-warrior': createOperative('tyranid-warrior', 'Tyranid Warrior', 'Tyranids', 12, 'Elite'),

  // Necrons
  'lychguard': createOperative('lychguard', 'Lychguard', 'Necrons', 11, 'Elite')
}

// WHY: Faction grouping for filtering operatives by faction in UI
export const FACTIONS: Record<string, string[]> = {
  'tau': ['fire-warrior', 'pathfinder', 'stealth-suit', 'crisis-suit'],
  'space-marines': [
    'tactical-marine', 'scout-marine', 'assault-marine', 'intercessor',
    'intercessor-sergeant', 'assault-sergeant', 'terminator'
  ],
  'orks': ['ork-boy', 'ork-kommando', 'gretchin', 'ork-nob'],
  'necrons': ['necron-warrior', 'immortal', 'deathmark', 'lychguard'],
  'astra-militarum': ['guardsman', 'tempestus-scion'],
  'chaos': ['cultist', 'chaos-marine', 'plague-marine', 'aspiring-champion'],
  'thousand-sons': ['rubric-marine'],
  'tyranids': ['termagant', 'hormagaunt', 'genestealer', 'tyranid-warrior']
}

// WHY: Retrieve operative by ID for quick-select processing
export function getOperativeById(id: string): Operative | undefined {
  return OPERATIVE_DATABASE[id]
}

// WHY: Filter operatives by faction for faction-based UI grouping
export function getOperativesByFaction(faction: string): Operative[] {
  const ids = FACTIONS[faction] || []
  return ids.map(id => OPERATIVE_DATABASE[id]).filter((op): op is Operative => op !== undefined)
}

// WHY: Return 8 most common operatives for quick-select dropdown
export function getCommonOperatives(): Operative[] {
  return [
    'fire-warrior',
    'tactical-marine',
    'intercessor',
    'ork-boy',
    'necron-warrior',
    'guardsman',
    'intercessor-sergeant',
    'ork-nob'
  ].map(id => OPERATIVE_DATABASE[id]).filter((op): op is Operative => op !== undefined)
}

// WHY: Get all faction keys for faction selection UI
export function getAllFactions(): string[] {
  return Object.keys(FACTIONS).sort()
}
