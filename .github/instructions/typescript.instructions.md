---
applyTo: "**/*.{ts,tsx}"
description: "TypeScript coding standards"
---

# TypeScript Standards

## Type Safety
- Enable strict mode in tsconfig.json
- No `any` types - use proper types or `unknown`
- Define interfaces for all data structures
- Use type guards for runtime checks

## Naming Conventions
- camelCase: variables, functions
- PascalCase: classes, interfaces, types, components
- UPPER_CASE: constants
- Prefix interfaces with `I` only if needed for clarity

## Type Definitions
- Export types alongside components
- Use `type` for unions/intersections
- Use `interface` for object shapes
- Prefer `readonly` for immutable data

## Function Signatures
```typescript
// Always include return type
function processData(input: string): ProcessedResult {
  // implementation
}

// For React components
interface ComponentProps {
  name: string;
  onAction: (id: number) => void;
}

export const Component: React.FC<ComponentProps> = ({ name, onAction }) => {
  // implementation
}
```
