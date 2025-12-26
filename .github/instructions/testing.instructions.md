---
applyTo: "**/*.test.{ts,tsx,js,jsx}"
description: "Testing standards and patterns"
---

# Testing Guidelines

## TDD Workflow
1. Write test FIRST
2. See it fail (red)
3. Write minimal code to pass (green)
4. Refactor (refactor)
5. Repeat

## Test Structure
```typescript
describe('ComponentName or functionName', () => {
  describe('when condition', () => {
    it('should expected behavior', () => {
      // Arrange
      const input = ...

      // Act
      const result = functionUnderTest(input)

      // Assert
      expect(result).toBe(expected)
    })
  })
})
```

## Testing Patterns
- Use React Testing Library for components
- Use userEvent for interactions, not fireEvent
- Query by accessible roles, not test IDs
- Mock external dependencies only
- Test user-facing behavior, not implementation details

## Coverage Requirements
- Business logic: 85-90%
- Components: Focus on user interactions
- Utilities: 100% coverage expected
