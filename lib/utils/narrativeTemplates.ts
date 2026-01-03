import type { Event } from '@/types/campaign'

/**
 * WHY: Generate varied narrative text for exploration events (Issue #22)
 * Uses random selection for replayability and immersion
 */
export function narrateExploration(
  playerName: string,
  locationName: string,
  locationType: 'surface' | 'tomb'
): string {
  const templates = {
    surface: [
      `${playerName}'s scouts discovered ${locationName} amid the frozen wastes.`,
      `${playerName} investigated ${locationName}, finding it abandoned but intact.`,
      `${playerName}'s kill team secured ${locationName} after a careful approach.`,
      `Moving across the ice fields, ${playerName} stumbled upon ${locationName}.`,
      `${playerName}'s expedition uncovered ${locationName} in the desolate terrain.`
    ],
    tomb: [
      `${playerName} descended into ${locationName}, their lights piercing the darkness.`,
      `${playerName}'s team breached ${locationName}, the ancient tomb awakening to their presence.`,
      `${playerName} entered ${locationName}, ancient machinery stirring around them.`,
      `Deep beneath the surface, ${playerName} discovered ${locationName}.`,
      `${playerName} ventured into ${locationName}, the air growing cold and still.`
    ]
  }

  const options = templates[locationType]
  return options[Math.floor(Math.random() * options.length)]!
}

/**
 * WHY: Generate narrative for battle results (Issue #22)
 * Adapts flavor based on victory/defeat/draw outcome
 */
export function narrateBattle(
  playerName: string,
  result: 'Victory' | 'Defeat' | 'Draw',
  opponentName?: string
): string {
  const opponent = opponentName || 'the enemy'
  const templates = {
    Victory: [
      `${playerName} emerged victorious against ${opponent}.`,
      `${playerName}'s tactics proved superior, defeating ${opponent}.`,
      `After fierce combat, ${playerName} overwhelmed ${opponent}.`,
      `${playerName} outmaneuvered ${opponent}, claiming victory.`
    ],
    Defeat: [
      `${playerName} was forced to withdraw from ${opponent}.`,
      `${playerName} fell back after fierce resistance from ${opponent}.`,
      `${opponent} drove ${playerName} from the field.`,
      `${playerName} retreated, unable to overcome ${opponent}.`
    ],
    Draw: [
      `${playerName} fought ${opponent} to a standstill.`,
      `Neither ${playerName} nor ${opponent} could gain the upper hand.`,
      `The battle between ${playerName} and ${opponent} ended inconclusively.`,
      `${playerName} and ${opponent} battled to a stalemate.`
    ]
  }

  const options = templates[result]
  return options[Math.floor(Math.random() * options.length)]!
}

/**
 * WHY: Generate narrative for movement/tactical actions (Issue #22)
 * Provides context for player positioning decisions
 */
export function narrateMovement(
  playerName: string,
  action: 'move' | 'regroup' | 'hold',
  hexId: string
): string {
  const templates = {
    move: `${playerName} advanced to position ${hexId}.`,
    regroup: `${playerName} regrouped at base position ${hexId}.`,
    hold: `${playerName} held position at ${hexId}, fortifying defenses.`
  }

  return templates[action]
}

/**
 * WHY: Generate narrative for threat escalation (Issue #22)
 * Adds tension and atmosphere to mechanical threat increases
 */
export function narrateThreat(
  reason: string,
  level: number
): string {
  const templates = [
    `Necron activity intensified: ${reason}. Threat level: ${level}.`,
    `The tomb stirred more violently. ${reason}. Alert status: ${level}.`,
    `Ancient defenses awakened further. ${reason}. Danger level: ${level}.`,
    `The expedition's presence did not go unnoticed. ${reason}. Threat: ${level}.`
  ]

  return templates[Math.floor(Math.random() * templates.length)]!
}

/**
 * WHY: Helper to add narrative enrichment to existing events (Issue #22)
 * Allows easy conversion of mechanical events to narrative-enhanced events
 */
export function enrichEvent(
  event: Event,
  narrativeFlavor: string,
  category: NonNullable<Event['narrative']>['category'],
  context?: { locationName?: string; playerNames?: string[] }
): Event {
  return {
    ...event,
    narrative: {
      flavor: narrativeFlavor,
      category,
      isCustom: false,
      locationName: context?.locationName,
      playerNames: context?.playerNames
    }
  }
}
