```markdown
# provenance-tracker Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill teaches the core development patterns and conventions used in the `provenance-tracker` TypeScript codebase. You'll learn about file naming, import/export styles, commit message conventions, and how to write and run tests. These guidelines help ensure consistency and maintainability in the project.

## Coding Conventions

### File Naming
- Use **camelCase** for file names.
  - Example: `provenanceTracker.ts`, `dataModel.test.ts`

### Imports
- Use **alias imports** to reference modules.
  - Example:
    ```typescript
    import { Tracker as ProvenanceTracker } from './provenanceTracker';
    ```

### Exports
- Use a **mixed export style** (both named and default exports are present).
  - Example:
    ```typescript
    // Named export
    export function createTracker() { ... }

    // Default export
    export default ProvenanceTracker;
    ```

### Commit Messages
- Follow **conventional commit** format.
- Use the `feat` prefix for new features.
  - Example:  
    ```
    feat: add support for tracking multiple sources in provenance
    ```

## Workflows

### Feature Development
**Trigger:** When adding a new feature  
**Command:** `/feature-dev`

1. Create a new branch for your feature.
2. Implement the feature using camelCase file naming and alias imports.
3. Export new modules using named or default exports as appropriate.
4. Write or update tests in files matching `*.test.*`.
5. Commit changes using the `feat` prefix and a clear description.
6. Open a pull request for review.

### Testing
**Trigger:** When verifying code correctness  
**Command:** `/run-tests`

1. Ensure your test files follow the `*.test.*` naming pattern.
2. Run the test suite using the project's test runner (framework unknown; check project scripts).
3. Review test results and fix any failing tests.

## Testing Patterns

- Test files are named using the `*.test.*` pattern (e.g., `provenanceTracker.test.ts`).
- The testing framework is not specified; check `package.json` or project documentation for details.
- Place tests alongside the code they test or in a dedicated `tests` directory.

  Example test file:
  ```typescript
  import { createTracker } from './provenanceTracker';

  describe('createTracker', () => {
    it('should initialize with default values', () => {
      const tracker = createTracker();
      expect(tracker).toBeDefined();
    });
  });
  ```

## Commands
| Command         | Purpose                                      |
|-----------------|----------------------------------------------|
| /feature-dev    | Start feature development workflow           |
| /run-tests      | Run the test suite                           |
```
