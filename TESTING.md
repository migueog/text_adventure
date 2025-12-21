# Testing Guide

This project uses Vitest with React Testing Library for testing.

## Running Tests

```bash
# Run tests in watch mode (recommended for development)
npm test

# Run tests once
npm run test:run

# Run tests with coverage report
npm run test:coverage

# Run tests with UI
npm run test:ui
```

## Writing Tests

### Test Structure

Follow the Arrange-Act-Assert pattern:

```javascript
import { describe, it, expect } from 'vitest';

describe('ComponentName or functionName', () => {
  describe('when specific condition', () => {
    it('should describe expected behavior', () => {
      // Arrange: Set up test data
      const input = 'test';

      // Act: Execute the code being tested
      const result = myFunction(input);

      // Assert: Verify the result
      expect(result).toBe('expected');
    });
  });
});
```

### Testing React Components

```javascript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('should render without crashing', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('should handle user interactions', async () => {
    const user = userEvent.setup();
    render(<MyComponent />);
    
    await user.click(screen.getByRole('button', { name: 'Click me' }));
    
    expect(screen.getByText('Clicked!')).toBeInTheDocument();
  });
});
```

### Testing Utilities

```javascript
import { describe, it, expect } from 'vitest';
import { myUtility } from './myUtility';

describe('myUtility', () => {
  it('should handle valid input', () => {
    expect(myUtility('valid')).toBe('expected');
  });

  it('should handle edge cases', () => {
    expect(myUtility('')).toBe('default');
    expect(myUtility(null)).toBe('default');
  });
});
```

## Test-Driven Development (TDD)

**ALWAYS write tests BEFORE implementation:**

1. **Write the test** - Define what you expect the code to do
2. **Run the test** - It should fail (RED)
3. **Write minimal code** - Make the test pass (GREEN)
4. **Refactor** - Improve code while keeping tests green (REFACTOR)
5. **Repeat** - Continue with next feature

### Example TDD Workflow

```javascript
// 1. Write failing test first
describe('calculateTotal', () => {
  it('should sum array of numbers', () => {
    expect(calculateTotal([1, 2, 3])).toBe(6);
  });
});

// 2. Run test - see it fail
// npm test

// 3. Write minimal implementation
export function calculateTotal(numbers) {
  return numbers.reduce((sum, num) => sum + num, 0);
}

// 4. Run test - see it pass
// 5. Refactor if needed
```

## Coverage Goals

- **Target**: 85-90% coverage for business logic
- **Focus on**: Critical paths, edge cases, user interactions
- **Don't test**: Third-party libraries, simple getters/setters
- **View coverage**: `npm run test:coverage` generates HTML report in `coverage/`

## Common Patterns

### Mocking Functions

```javascript
import { vi } from 'vitest';

const mockFn = vi.fn();
mockFn.mockReturnValue('mocked value');
```

### Mocking Modules

```javascript
import { vi } from 'vitest';

vi.mock('./myModule', () => ({
  myFunction: vi.fn(() => 'mocked'),
}));
```

### Testing Async Code

```javascript
it('should handle async operations', async () => {
  const result = await asyncFunction();
  expect(result).toBe('expected');
});
```

### Testing Hooks

```javascript
import { renderHook } from '@testing-library/react';
import { useCustomHook } from './useCustomHook';

it('should return expected value', () => {
  const { result } = renderHook(() => useCustomHook());
  expect(result.current.value).toBe('expected');
});
```

## Best Practices

1. **Test behavior, not implementation** - Focus on what users see/do
2. **Keep tests simple** - One assertion per test when possible
3. **Use descriptive test names** - Explain the scenario and expected result
4. **Avoid test interdependence** - Each test should run independently
5. **Mock external dependencies** - APIs, localStorage, etc.
6. **Test edge cases** - Empty arrays, null values, boundary conditions

## Troubleshooting

### Phaser/Canvas Issues

Phaser requires canvas which jsdom doesn't provide. Mock Phaser when testing:

```javascript
import { vi } from 'vitest';

vi.mock('phaser', () => ({
  default: {},
  Game: vi.fn(),
  AUTO: 'auto',
}));
```

### Async Issues

Use `waitFor` for async updates:

```javascript
import { waitFor } from '@testing-library/react';

await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)
