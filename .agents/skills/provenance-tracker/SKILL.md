```markdown
# provenance-tracker Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill teaches the core development patterns and conventions used in the `provenance-tracker` TypeScript repository. You'll learn how to structure files, write imports and exports, follow commit message conventions, and run or write tests. This guide is ideal for contributors aiming for consistency and maintainability in this codebase.

## Coding Conventions

### File Naming
- Use **camelCase** for all file names.
  - Example: `provenanceTracker.ts`, `eventLogger.test.ts`

### Import Style
- Use **alias imports** where appropriate.
  - Example:
    ```typescript
    import { EventLogger as Logger } from './eventLogger';
    ```

### Export Style
- Use **named exports** for modules.
  - Example:
    ```typescript
    // eventLogger.ts
    export function logEvent(event: Event) { ... }
    export const EVENT_TYPE = 'TRACKED_EVENT';
    ```

### Commit Messages
- Follow the **Conventional Commits** specification.
- Use the `feat` prefix for new features.
- Keep commit message length around 58 characters.
  - Example:
    ```
    feat: add provenance tracking for user actions
    ```

## Workflows

### Add a New Feature
**Trigger:** When implementing a new feature or module  
**Command:** `/add-feature`

1. Create a new file using camelCase naming.
2. Use named exports for all functions and constants.
3. Use alias imports if importing from other modules.
4. Write or update corresponding test files (`*.test.ts`).
5. Commit changes with a `feat:` prefix and a concise message.

### Run Tests
**Trigger:** When verifying code correctness  
**Command:** `/run-tests`

1. Identify test files matching the `*.test.*` pattern.
2. Use the project's test runner (framework unknown; check project docs or `package.json` for details).
3. Run all tests and ensure they pass before committing.

### Write a Commit
**Trigger:** When committing any change  
**Command:** `/commit`

1. Stage your changes.
2. Write a commit message using the conventional format, e.g., `feat: <description>`.
3. Ensure the message is concise (around 58 characters).

## Testing Patterns

- Test files should follow the `*.test.*` naming convention, e.g., `provenanceTracker.test.ts`.
- The testing framework is not specified; check project documentation or configuration files for details.
- Place tests alongside or near the modules they test.

  Example test file:
  ```typescript
  // provenanceTracker.test.ts
  import { trackProvenance } from './provenanceTracker';

  describe('trackProvenance', () => {
    it('should add provenance data to an event', () => {
      // test implementation
    });
  });
  ```

## Commands
| Command       | Purpose                                    |
|---------------|--------------------------------------------|
| /add-feature  | Scaffold and implement a new feature/module|
| /run-tests    | Run all test files in the repository       |
| /commit       | Commit changes using conventional format   |
```