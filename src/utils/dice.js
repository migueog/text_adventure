// Dice rolling utilities for Kill Team campaign

export function rollD3() {
  return Math.floor(Math.random() * 3) + 1;
}

export function rollD6() {
  return Math.floor(Math.random() * 6) + 1;
}

export function rollD36() {
  // D36 = D3 for tens + D6 for units
  const tens = rollD3();
  const units = rollD6();
  return tens * 10 + units;
}

export function roll2D6() {
  return rollD6() + rollD6();
}

export function rollDice(notation) {
  // Parse dice notation like "D3", "D6", "2D6", "D3+1", etc.
  const match = notation.match(/^(\d*)D(\d+)([+-]\d+)?$/i);
  if (!match) return 0;

  const count = parseInt(match[1]) || 1;
  const sides = parseInt(match[2]);
  const modifier = parseInt(match[3]) || 0;

  let total = 0;
  for (let i = 0; i < count; i++) {
    total += Math.floor(Math.random() * sides) + 1;
  }
  return total + modifier;
}

export function parseValue(value) {
  // Parse a value that might be a number or dice notation
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    if (value.includes('D')) {
      return rollDice(value);
    }
    return parseInt(value) || 0;
  }
  return 0;
}

// Get the result breakdown for display
export function rollWithBreakdown(notation) {
  const match = notation.match(/^(\d*)D(\d+)([+-]\d+)?$/i);
  if (!match) return { total: 0, rolls: [], modifier: 0 };

  const count = parseInt(match[1]) || 1;
  const sides = parseInt(match[2]);
  const modifier = parseInt(match[3]) || 0;

  const rolls = [];
  let total = 0;
  for (let i = 0; i < count; i++) {
    const roll = Math.floor(Math.random() * sides) + 1;
    rolls.push(roll);
    total += roll;
  }

  return {
    total: total + modifier,
    rolls,
    modifier,
    notation
  };
}
