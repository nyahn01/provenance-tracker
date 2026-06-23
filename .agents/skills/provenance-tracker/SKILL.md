```markdown
# provenance-tracker Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill provides guidance on contributing to the `provenance-tracker` TypeScript codebase. It covers established coding conventions, common workflows (such as refining globe rendering), and testing patterns. By following these patterns, contributors can ensure consistency and maintainability across the project.

## Coding Conventions

### File Naming
- Use **camelCase** for file names.
  - Example: `storiesApp.tsx`, `globeRenderer.ts`

### Import Style
- Use **alias imports** where appropriate.
  - Example:
    ```typescript
    import { Globe } from '@/components/Globe';
    ```

### Export Style
- Prefer **named exports**.
  - Example:
    ```typescript
    // In globeRenderer.ts
    export function renderGlobe() { ... }
    ```

### Commit Messages
- Follow **conventional commit** style.
  - Prefixes: `fix`, `feat`
  - Example:
    ```
    feat: improve ocean rendering on globe component
    fix: correct atmosphere color blending bug
    ```

## Workflows

### Refine Globe Rendering
**Trigger:** When you need to fix visual issues or update the rendering approach for the globe (e.g., ocean color, atmosphere effects).
**Command:** `/refine-globe`

1. **Identify** the rendering issue or desired visual change in the globe.
2. **Modify** the rendering logic or material properties in `src/components/StoriesApp.tsx`.
    - Example:
      ```typescript
      // Adjust ocean color
      globe.material.color.set('#1e90ff');
      // Tweak atmosphere effect
      globe.material.opacity = 0.7;
      ```
3. **Test** the globe's appearance in the UI to ensure changes have the intended effect.
4. **Commit** your changes with a detailed explanation of the visual changes and the rationale behind them.
    - Example commit message:
      ```
      fix: enhance ocean color and soften atmosphere gradient for improved realism
      ```

## Testing Patterns

- Test files use the pattern `*.test.*` (e.g., `globeRenderer.test.ts`).
- The testing framework is **unknown**; check existing test files for structure and conventions.
- Example test file:
  ```typescript
  // globeRenderer.test.ts
  import { renderGlobe } from './globeRenderer';

  test('renders globe with correct color', () => {
    const globe = renderGlobe();
    expect(globe.material.color.getHexString()).toBe('1e90ff');
  });
  ```

## Commands
| Command        | Purpose                                                      |
|----------------|--------------------------------------------------------------|
| /refine-globe  | Refine the visual rendering of the globe (oceans, atmosphere)|
```
