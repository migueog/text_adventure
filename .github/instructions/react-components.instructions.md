---
applyTo: "src/components/**/*.{tsx,jsx}"
description: "React component patterns and standards"
---

# React Component Standards

## Component Size
- Maximum 20 lines per component
- Extract sub-components if larger
- One component per file

## Component Structure
1. Imports
2. Type definitions
3. Component definition
4. Helper functions (below component)
5. Exports

## Hooks Usage
- Custom hooks in `src/hooks/`
- Extract complex logic into custom hooks
- Keep hooks focused (single responsibility)
- Maximum 50 lines per hook

## Props
- Use TypeScript interfaces
- Destructure props in function signature
- Provide default values where appropriate

## State Management
- Use local state when possible
- Lift state only when needed
- Consider context for deeply nested props
