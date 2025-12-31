/**
 * Kill Team mission data for the mission randomizer (Issue #34)
 *
 * WHY: Provides predefined mission list for battle recording.
 * Categories match official Kill Team mission types.
 */

import type { Mission } from '@/types/battle'

/**
 * Standard Kill Team missions organized by category
 *
 * WHY: 16 missions (4 per category) covering the main Kill Team mission types.
 * Based on official Kill Team mission structure.
 */
export const KILL_TEAM_MISSIONS: Mission[] = [
  // Incursion missions - offensive focused
  { id: 'loot-salvage', name: 'Loot and Salvage', category: 'Incursion' },
  { id: 'seize-ground', name: 'Seize Ground', category: 'Incursion' },
  { id: 'secure-archeotech', name: 'Secure Archeotech', category: 'Incursion' },
  { id: 'consecration', name: 'Consecration', category: 'Incursion' },

  // Infiltrate missions - stealth and positioning
  { id: 'forward-push', name: 'Forward Push', category: 'Infiltrate' },
  { id: 'security-breach', name: 'Security Breach', category: 'Infiltrate' },
  { id: 'capture-operation', name: 'Capture Operation', category: 'Infiltrate' },
  { id: 'command-control', name: 'Command and Control', category: 'Infiltrate' },

  // Recon missions - information gathering
  { id: 'recover-intel', name: 'Recover Intel', category: 'Recon' },
  { id: 'plant-scanner', name: 'Plant Scanner', category: 'Recon' },
  { id: 'survey-area', name: 'Survey', category: 'Recon' },
  { id: 'awaken-sleeper', name: 'Awaken the Sleeper', category: 'Recon' },

  // Seek and Destroy missions - combat focused
  { id: 'elimination', name: 'Elimination', category: 'Seek and Destroy' },
  { id: 'take-hold', name: 'Take and Hold', category: 'Seek and Destroy' },
  { id: 'headhunt', name: 'Headhunt', category: 'Seek and Destroy' },
  { id: 'domination', name: 'Domination', category: 'Seek and Destroy' }
]

/**
 * Get a random mission from the full list
 *
 * WHY: Simple randomizer for mission selection per Issue #34
 */
export function getRandomMission(): Mission {
  const index = Math.floor(Math.random() * KILL_TEAM_MISSIONS.length)
  // WHY: Array is constant with 16 items, index is always valid
  return KILL_TEAM_MISSIONS[index] as Mission
}

/**
 * Get missions filtered by category
 *
 * WHY: Allow filtering for specific mission types if needed
 */
export function getMissionsByCategory(
  category: Mission['category']
): Mission[] {
  return KILL_TEAM_MISSIONS.filter(m => m.category === category)
}
