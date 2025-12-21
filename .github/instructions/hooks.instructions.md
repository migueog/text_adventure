---
applyTo: "src/hooks/**/*.{ts,tsx,js,jsx}"
description: "Custom hooks patterns"
---

# Custom Hooks Standards

## Hook Size Limits
- **Maximum 50 lines per hook**
- If larger, split into multiple hooks
- Extract pure utility functions

## Hook Naming
- Always start with `use` prefix
- Be descriptive: `useCampaignState`, not `useCS`

## Hook Structure
```typescript
export function useCustomHook(params: Params): ReturnType {
  // 1. State declarations
  const [state, setState] = useState<Type>(initial)

  // 2. Refs (if needed)
  const ref = useRef<Type>(null)

  // 3. Computed values
  const derived = useMemo(() => compute(state), [state])

  // 4. Callbacks
  const handler = useCallback(() => {
    // implementation
  }, [dependencies])

  // 5. Effects
  useEffect(() => {
    // side effects
    return () => cleanup()
  }, [dependencies])

  // 6. Return value
  return { state, derived, handler }
}
```

## Testing Hooks
- Use @testing-library/react-hooks
- Test return values and state changes
- Test with different inputs
