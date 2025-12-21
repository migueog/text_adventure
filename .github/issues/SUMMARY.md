# Kill Team Ctesiphus Expedition - GitHub Issues Summary

This document summarizes all 40 GitHub issues created from the campaign rules PDF.

## Overview

**Total Issues Created**: 40
**Sections Covered**: 9
**Status**: All Draft (ready for review and GitHub creation)

## Issues by Category

### Campaign Setup & Core Systems (9 issues)
- #001 Campaign Setup & Map Configuration
- #002 Objectives System
- #003 Narrative System
- #004 Map Management & Responsibilities
- #005 Non-Campaign Opponent Mode
- #006 Hex Types and Exploration Mechanics
- #007 Base Hex Placement Rules
- #008 Priority Establishment System
- #009 Campaign Log and Player Tracking

### Campaign Flow & Phases (7 issues)
- #011 Phase Flow and Validation
- #012 Round Counter and Tracking
- #013 Campaign End Condition and Victory Processing
- #014 Phase-Specific UI and Guidance
- #015 Battle Phase Integration and Result Recording
- #021 Battle Phase Condition Rules and Killzone Integration
- #022 Battle Phase Rewards and Special Cases

### Movement Phase (5 issues)
- #016 Movement Action Types (Regroup, Manoeuvre, Hold)
- #017 Movement Validation and Restrictions
- #018 Auto-Exploration on Movement
- #019 Regroup: Nearest Base/Camp Logic
- #020 Priority-Based Movement Order

### Action Phase (6 issues)
- #023 Action Phase Turn Order (Winners, Draws, Losses)
- #024 Scout Action Implementation
- #025 Resupply Action with Location-Based Rewards
- #026 Search Action Implementation
- #027 Encamp Action and Camp Management
- #028 Demolish Action with Prerequisites

### Threat & Victory (6 issues)
- #010 Threat Level Meter Visual Enhancement
- #029 Threat Phase Location Rules Resolution
- #030 Threat Level Increase Mechanics
- #031 Victory Categories Tracking and Calculation
- #032 Victory Tie-Breaking System
- #033 Headhunter Operative Kill Tracking

### Solo/Cooperative Campaign (5 issues)
- #034 Solo/Cooperative Mode Setup and Configuration
- #035 Solo/Co-op Dynamic Threat Level Mechanics
- #036 Solo Victory Condition (10+ CP Goal)
- #037 Solo Performance Categories and Tracking
- #038 Campaign Continuation and Legacy System

### Exploration Data (2 issues)
- #039 Complete Exploration Data: All Locations and Conditions
- #040 Special Location Mechanics Implementation

## Labels Distribution

**Standard Labels:**
- `enhancement`: 38 issues (all)
- `bug`: 0 issues
- `documentation`: 0 issues

**Game-Specific Labels (by frequency):**
- `ui`: 25 issues
- `gameplay`: 20 issues
- `phase-system`: 17 issues
- `hex-map`: 9 issues
- `threat`: 7 issues
- `actions`: 7 issues
- `combat`: 6 issues
- `resources`: 5 issues
- `data`: 5 issues
- `narrative`: 3 issues
- `testing`: 0 issues (to be added during implementation)
- `accessibility`: 1 issue

## Implementation Priority Recommendations

### Phase 1: Core Foundation (High Priority)
Essential for basic campaign functionality:
- #001 Campaign Setup & Map Configuration
- #006 Hex Types and Exploration Mechanics
- #007 Base Hex Placement Rules
- #009 Campaign Log and Player Tracking
- #011 Phase Flow and Validation
- #010 Threat Level Meter Visual

### Phase 2: Movement & Exploration (High Priority)
Critical gameplay mechanics:
- #016 Movement Action Types
- #017 Movement Validation and Restrictions
- #018 Auto-Exploration on Movement
- #008 Priority Establishment System
- #020 Priority-Based Movement Order

### Phase 3: Battle & Actions (High Priority)
Core phase functionality:
- #015 Battle Phase Integration
- #021 Battle Phase Condition Rules
- #022 Battle Rewards and Special Cases
- #023 Action Phase Turn Order
- #024 Scout Action
- #025 Resupply Action
- #026 Search Action
- #027 Encamp Action
- #028 Demolish Action

### Phase 4: Threat & Victory (Medium Priority)
Campaign progression and end conditions:
- #029 Threat Phase Location Rules
- #030 Threat Level Increase Mechanics
- #013 Campaign End Condition
- #031 Victory Categories Tracking
- #032 Victory Tie-Breaking
- #033 Headhunter Tracking

### Phase 5: Enhanced Features (Medium Priority)
Quality of life and polish:
- #012 Round Counter and Tracking
- #014 Phase-Specific UI and Guidance
- #019 Regroup Logic
- #002 Objectives System
- #003 Narrative System
- #004 Map Management

### Phase 6: Solo Mode (Lower Priority)
Complete solo/co-op implementation:
- #034 Solo Mode Setup
- #035 Solo Dynamic Threat
- #036 Solo Victory Condition
- #037 Solo Performance Categories
- #038 Campaign Continuation/Legacy

### Phase 7: Advanced Features (Future)
Nice-to-have enhancements:
- #005 Non-Campaign Opponent Mode
- Testing infrastructure
- Save/Load functionality (mentioned but not issued)
- Multiplayer/async features (future)

## Key Files Affected

Based on issue analysis, these files will see the most changes:

**Core Logic:**
- `src/hooks/useCampaign.js` - 30+ issues reference this file
- `src/data/campaignData.js` - 15+ issues reference this file

**UI Components:**
- `src/components/PhaseTracker.jsx` - 20+ issues
- `src/components/PlayerPanel.jsx` - 10+ issues
- `src/components/VictoryScreen.jsx` - 8+ issues
- `src/components/GameSetup.jsx` - 8+ issues

**Map System:**
- `src/components/PhaserHexMap/HexMapScene.js` - 12+ issues
- `src/utils/hexUtils.js` - 8+ issues

**New Components Needed:**
- 15+ new components suggested across all issues

## Testing Requirements

Each issue includes test requirements:
- **Unit tests**: All 38 issues require unit test coverage
- **Integration tests**: 35+ issues require integration tests
- **Visual regression tests**: 2 issues specifically mention
- **Accessibility tests**: 1 issue specifically mentions

**Recommended Test Coverage Target**: 85-90% (per user's CLAUDE.md standards)

## Next Steps

1. **Review Issues**: Go through all 38 issues and adjust as needed
2. **Create Labels**: Run label creation commands from README
3. **Create GitHub Issues**: Use `gh` CLI to create all issues
4. **Prioritize**: Assign priorities and milestones
5. **Begin Implementation**: Start with Phase 1 (Core Foundation)

## Notes

- All issues follow TDD requirements (tests first)
- TypeScript migration should happen alongside implementation
- Each issue includes detailed acceptance criteria
- Technical implementation notes provided for all issues
- Related issues cross-referenced throughout

## Files Created

- 38 issue markdown files (001-038)
- README.md (tracking and index)
- SUMMARY.md (this file)

All files are in `.github/issues/` directory and ready for GitHub issue creation.
