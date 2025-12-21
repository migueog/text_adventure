# Campaign Setup & Map Configuration

## Description

According to the campaign rules, a Ctesiphus Expedition requires different map sizes based on player count - smaller maps (fewer hexes) should be used with 2-3 players. The current implementation uses a fixed map size calculation and doesn't provide a setup wizard or configuration options for new campaigns.

**Current Implementation:**
- Map size is calculated in `useCampaign.js` based on player count but may not follow official rules
- No visual setup wizard or campaign creation flow
- No display of campaign rules or information during setup

**What Needs to Be Implemented:**
- Map size configuration that follows official rules (2-3 players = smaller map, 4-6 players = larger map)
- Campaign setup wizard with step-by-step configuration
- Display campaign overview and rules during setup
- Option to customize map dimensions for experienced players

## Acceptance Criteria

- [ ] Map size automatically adjusts based on player count according to official rules
- [ ] Setup wizard guides new players through campaign creation
- [ ] Campaign information and basic rules are displayed during setup
- [ ] Map configuration options are available (with recommended defaults)
- [ ] Unit tests validate map size calculations for different player counts
- [ ] Integration tests verify setup wizard flow

## Technical Notes

**Files to Modify:**
- `src/hooks/useCampaign.js` - Update map generation logic with proper size tiers
- `src/components/GameSetup.jsx` - Enhance with wizard UI and rule display
- `src/data/campaignData.js` - Add map size configuration constants

**Implementation Considerations:**
- Define map size tiers: 2-3 players (5x5), 4-5 players (6x6), 6 players (7x7 or 8x8)
- Consider adding "custom" mode for advanced users
- Setup wizard should be dismissible for quick start
- Store campaign configuration in state for future save/load feature

**Related Issues:**
- Will support future save/load functionality
- Related to Map Management & Responsibilities (#004)

## Labels

`enhancement`, `hex-map`, `ui`, `gameplay`
