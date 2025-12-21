# Complete Exploration Data: All Locations and Conditions

## Description

The exploration system requires complete data for all 72 unique location and condition combinations:
- **36 Surface Locations** (18 unique + Ruin repeatable)
- **36 Tomb Locations** (18 unique + Ruin repeatable)
- **36 Surface Conditions** (18 unique + Clear repeatable)
- **36 Tomb Conditions** (18 unique + Clear repeatable)

Each location and condition has specific rules, search effects, camp benefits, and threat phase interactions.

**Current Implementation:**
- Basic location data exists ✅
- May not have all 72 entries with complete rules
- Special mechanics for complex locations may not be implemented

**What Needs to Be Implemented:**
- Complete data entry for all 36 surface locations (SL11-36)
- Complete data entry for all 36 tomb locations (TL11-36)
- Complete data entry for all 36 surface conditions (SC11-36)
- Complete data entry for all 36 tomb conditions (TC11-36)
- D36 rolling system (D3 + D6 combination)
- Re-roll logic for duplicate locations/conditions (except Ruin/Clear)
- All search rules, camp rules, and special effects

## Acceptance Criteria

- [ ] All 18 surface locations entered with complete rules
- [ ] All 18 tomb locations entered with complete rules
- [ ] All 18 surface conditions entered with complete rules
- [ ] All 18 tomb conditions entered with complete rules
- [ ] D36 rolling system implemented
- [ ] Re-roll logic for duplicates (excluding Ruin/Clear)
- [ ] Search rules correctly implemented for each location
- [ ] Camp rules correctly implemented for each location
- [ ] Special location effects functional (Beast Lair, Released Prisoner, etc.)
- [ ] Condition effects can be applied to Kill Team battles
- [ ] Data validation tests ensure all entries are complete
- [ ] Unit tests for D36 rolling and re-roll logic

## Technical Notes

**Files to Modify:**
- `src/data/campaignData.js` - Add all location and condition data
- `src/utils/dice.js` - Add D36 rolling function
- `src/hooks/useCampaign.js` - Exploration logic with re-rolls
- New file: `src/data/locations/surfaceLocations.js` (optional split)
- New file: `src/data/locations/tombLocations.js` (optional split)
- New file: `src/data/conditions/surfaceConditions.js` (optional split)
- New file: `src/data/conditions/tombConditions.js` (optional split)

**Implementation Considerations:**

- D36 rolling system:
```javascript
function rollD36() {
  const d3 = rollDice('D3');  // 1, 2, or 3
  const d6 = rollDice('D6');  // 1-6

  // Combine: D3 gives tens digit, D6 gives ones
  const result = (d3 * 10) + d6;
  // 1+1=11, 1+6=16, 2+1=21, 2+6=26, 3+1=31, 3+6=36

  return result;
}
```

- Location data structure:
```javascript
const SURFACE_LOCATIONS = {
  SL11: {
    id: "SL11",
    name: "Ruin",
    number: "11-16",  // Range for D36
    type: "surface",
    repeatable: true,  // Don't re-roll if duplicate
    description: "These deserted shells are ice-rimed and desolate...",
    searchRule: null,
    campRule: null,
    threatPhaseRule: null,
    specialRules: null
  },

  SL21: {
    id: "SL21",
    name: "Tectonic Fissure",
    number: "21",
    type: "surface",
    repeatable: false,
    description: "...huge crevasse that appears impossible to cross...",
    searchRule: null,
    campRule: null,
    threatPhaseRule: null,
    specialRules: {
      type: "becomes_blocked",
      effect: "This hex becomes blocked when explored"
    }
  },

  SL22: {
    id: "SL22",
    name: "Abandoned Camp",
    number: "22",
    type: "surface",
    repeatable: false,
    description: "...remnants of underground tunnels...",
    initialState: {
      type: "roll_sp",
      formula: "D6",
      description: "Roll D6 for initial SP when explored"
    },
    searchRule: {
      effect: "Gain D3 of this hex's Supply points",
      formula: "D3",
      depletes: true,
      description: "Hex SP reduces when searched"
    },
    campRule: null,
    threatPhaseRule: null
  },

  SL36: {
    id: "SL36",
    name: "Beast Lair",
    number: "36",
    type: "surface",
    repeatable: false,
    description: "...extreme life forms make their lairs...",
    searchRule: null,
    campRule: null,
    threatPhaseRule: {
      type: "beast_attack",
      range: 2,  // Within 2 surface hexes
      effect: "Players within 2 hexes may be attacked",
      // Complex rules - see issue #040
    },
    specialRules: {
      type: "encamp_restricted",
      demolishRequired: true,
      cannotDemolishSameRound: true
    }
  }
};
```

- Condition data structure:
```javascript
const SURFACE_CONDITIONS = {
  SC11: {
    id: "SC11",
    name: "Clear Conditions",
    number: "11-16",
    type: "surface",
    repeatable: true,
    description: "Freezing temperatures, toxic atmosphere...",
    battleEffect: null  // No special rules
  },

  SC21: {
    id: "SC21",
    name: "Dust Storms",
    number: "21",
    type: "surface",
    repeatable: false,
    description: "Swirling, silvery dust...",
    battleEffect: {
      type: "hit_modifier",
      modifier: -1,
      condition: "ranged_weapons",
      exceptions: [
        "heavy_terrain_in_control",
        "in_stronghold",
        "under_vantage"
      ]
    }
  }

  // ... all 18 surface conditions
};
```

- Exploration with re-roll logic:
```javascript
function exploreHex(hex, hexType) {
  let location, condition;
  const existingLocations = getExistingLocations(hexType);
  const existingConditions = getExistingConditions(hexType);

  // Roll for location
  do {
    const roll = rollD36();
    location = getLocationByRoll(roll, hexType);
  } while (
    !location.repeatable &&
    existingLocations.includes(location.id) &&
    location.id !== 'SL11' &&  // Ruin is repeatable
    location.id !== 'TL11'
  );

  // Roll for condition
  do {
    const roll = rollD36();
    condition = getConditionByRoll(roll, hexType);
  } while (
    !condition.repeatable &&
    existingConditions.includes(condition.id) &&
    condition.id !== 'SC11' &&  // Clear is repeatable
    condition.id !== 'TC11'
  );

  // Initialize location if needed
  if (location.initialState) {
    hex.locationState = initializeLocationState(location);
  }

  return { location, condition };
}
```

- D36 table lookup:
```javascript
function getLocationByRoll(roll, hexType) {
  const locations = hexType === 'surface'
    ? SURFACE_LOCATIONS
    : TOMB_LOCATIONS;

  // Find location by number range
  for (const loc of Object.values(locations)) {
    if (loc.number.includes('-')) {
      // Range like "11-16"
      const [min, max] = loc.number.split('-').map(Number);
      if (roll >= min && roll <= max) return loc;
    } else {
      // Single number like "21"
      if (roll === Number(loc.number)) return loc;
    }
  }

  throw new Error(`No location found for roll ${roll}`);
}
```

- Location categories needing special implementation:
  1. **Depleting resources**: Abandoned Camp, Resource Stockpile, Crashed Ship
  2. **Hex blocking**: Tectonic Fissure, Transtechnic Fulcrum
  3. **Base movement**: Forsaken Fortress
  4. **Complex entities**: Beast Lair, Released Prisoner (Hyperfractal Gaol)
  5. **Portal/teleport**: Transdimensional Portal, Dimension Matrix, Starsteles
  6. **Threat triggers**: Doomsday Vault, Power Cell Sanctum

**Related Issues:**
- Related to Hex Exploration (#006, #018)
- Related to Search Action (#026)
- Related to Encamp Action (#027)
- Related to Threat Phase Location Rules (#029)
- Related to Special Location Mechanics (#040)

## Data Entry Checklist

### Surface Locations (18 total)
- [ ] SL11-16: Ruin (repeatable)
- [ ] SL21: Tectonic Fissure (blocks hex)
- [ ] SL22: Abandoned Camp (D6 SP, depletes)
- [ ] SL23: Cryovolcanic Edifices (complex search)
- [ ] SL24: Asteroid Impact (tomb hex access)
- [ ] SL25: Landing Site (cheap camping)
- [ ] SL26: Observation Tower (enhanced scouting)
- [ ] SL31: Crashed Ship (intel system)
- [ ] SL32: Resource Stockpile (2D6 SP, depletes)
- [ ] SL33: Starsteles (teleport)
- [ ] SL34: Blackstone Obelisk (CP reward)
- [ ] SL35: Forsaken Fortress (base movement)
- [ ] SL36: Beast Lair (threat phase attacks)

### Tomb Locations (18 total)
- [ ] TL11-16: Ruin (repeatable, portal system)
- [ ] TL21: Transdimensional Portal (teleport)
- [ ] TL22: Transeptum Maze (movement penalty)
- [ ] TL23: Crucible of Whispers (CP cache)
- [ ] TL24: Power Cell Sanctum (demolish danger)
- [ ] TL25: Transtechnic Fulcrum (block hexes)
- [ ] TL26: Energy Hot Spot (camp benefits)
- [ ] TL31: Vivitrophic Terminal (SP to CP conversion)
- [ ] TL32: Hyperfractal Gaol (released prisoner)
- [ ] TL33: Revivification Crypt (free resupply)
- [ ] TL34: Astral Augury (search for CP)
- [ ] TL35: Doomsday Vault (D3 threat increase)
- [ ] TL36: Dimension Matrix (dimensional key)

### Surface Conditions (18 total)
- [ ] SC11-16: Clear Conditions (repeatable)
- [ ] SC21: Dust Storms
- [ ] SC22: Radiation Field
- [ ] SC23: Blighted Land
- [ ] SC24: Missile Strike
- [ ] SC25: Minefield
- [ ] SC26: Skull Mounds
- [ ] SC31: Subterranean Tremors
- [ ] SC32: Exotic Particle Field
- [ ] SC33: Metallic Infused Vegetation
- [ ] SC34: Gyromantic Shards
- [ ] SC35: Cryoflux Blizzard
- [ ] SC36: Gravitic Anomaly

### Tomb Conditions (18 total)
- [ ] TC11-16: Clear Conditions (repeatable)
- [ ] TC21: Darkness
- [ ] TC22: Scarab Swarm
- [ ] TC23: Tesla Rupture
- [ ] TC24: Automated System Error
- [ ] TC25: Weakened Structure
- [ ] TC26: Crypt Fatigue
- [ ] TC31: Temporal Diffusement
- [ ] TC32: Hyperspatial Breach
- [ ] TC33: Xenoviral Demise
- [ ] TC34: Collapsing Tomb
- [ ] TC35: Nanoweave Web Traps
- [ ] TC36: Neurotechnic Haunting

## Labels

`data`, `enhancement`, `hex-map`
