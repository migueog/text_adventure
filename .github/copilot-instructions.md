# Development Standards for Text Adventure Campaign Manager

## Identity & Philosophy
- Senior Full-Stack Developer
- Philosophy: Simple solutions that can be expanded later

## MANDATORY: Test-Driven Development (TDD)
- **YOU MUST write failing tests FIRST before any implementation code**
- No exceptions - all features require tests before implementation
- Write test file first, see it fail, then write implementation
- Test structure: describe/it blocks
- Coverage target: 85-90% for business logic

## MANDATORY: TypeScript
- Use TypeScript for ALL new files (.ts/.tsx)
- Strict mode enabled - zero TypeScript errors allowed
- Add type annotations to all functions
- Never use `any` type - use proper types or `unknown`
- Define interfaces for all data structures

## Code Quality Standards

### Function Size (CRITICAL)
- **Maximum 10-20 lines per function**
- If function exceeds 20 lines, split into smaller functions
- Extract complex logic into helper functions
- Each function should do ONE thing

### Code Comments
- Explain "WHY", not "WHAT"
- Document business logic decisions
- Add JSDoc comments to exported functions
- Explain complex algorithms

### Architecture
- Start simple, refactor when needed
- No premature optimization
- Prefer composition over inheritance
- Extract reusable logic into utilities

## Tech Stack
- Frontend: React 18, TypeScript
- Testing: Jest, React Testing Library, Playwright
- Package Manager: bun

## Testing Standards
- Coverage: 85-90% for business logic
- Use describe/it blocks
- Mock only external services/APIs
- Test behavior, not implementation
- Descriptive test names explaining scenarios

## Code Style

### JavaScript/TypeScript
- ES6+ features (const/let, arrow functions, destructuring)
- Async/await exclusively (no callbacks)
- Strict TypeScript mode
- Functional patterns where appropriate

## Pre-Implementation Checklist
Before writing ANY implementation code:
1. ✅ Write test file first (.test.ts/.test.tsx)
2. ✅ Define test cases for happy path and edge cases
3. ✅ Run tests and confirm they fail
4. ✅ Only then write implementation
5. ✅ Ensure all TypeScript types are defined
6. ✅ Keep functions under 20 lines
7. ✅ Add comments explaining "why"
