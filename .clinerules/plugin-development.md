## Brief overview
This rule file specifies the mandatory checklist for creating and registering plugins in the monorepo. Every plugin must be properly configured to be built independently, consumed by other projects, registered in the application plugin registry, and resolved correctly by TypeScript, Nx, Rollup, and Next.js.

## Project Structure
Every plugin must follow this exact directory structure:

```
plugins/
└── plugin-<name>/
    ├── src/
    │   ├── index.ts
    │   └── lib/
    ├── project.json
    ├── package.json
    └── tsconfig.json
```

Rule: Never create a plugin without this structure. The `src/index.ts` is the public entry point.

## Public Export Requirement
Verify the plugin exposes a public entry point before any registration:

```ts
export { myFeaturePlugin } from './lib/plugin-my-feature';
```

Rule: Never register a plugin before exporting it through `src/index.ts`. The export must match the import path used in the application.

## TypeScript Path Alias Registration (CRITICAL)
Immediately after creating a plugin, add its path mapping to `tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@temp-workspace/plugin-my-feature": [
        "plugins/plugin-my-feature/src/index.ts"
      ]
    }
  }
}
```

Rule: A plugin is NOT considered complete until its TypeScript path alias has been registered in `tsconfig.base.json`. For any `Module not found` error involving a monorepo plugin, first verify TypeScript path mappings before investigating Rollup, Turbopack, Next.js, or Nx internals.

## Naming Consistency
The following names must match exactly:

* Folder name (e.g., `plugin-my-feature`)
* package.json name (e.g., `@temp-workspace/plugin-my-feature`)
* tsconfig alias (e.g., `@temp-workspace/plugin-my-feature`)
* import path in consuming code

Rule: Inconsistency in naming causes resolution failures across all tooling.

## Nx Registration
Verify the plugin is registered as a valid Nx project:

```bash
nx show project plugin-my-feature
```

Rule: This command must succeed before proceeding. If it fails, check `project.json` configuration.

## Standalone Build Validation
Before adding the plugin to the application registry, verify it builds independently:

```bash
nx build plugin-my-feature
```

Rule: Never register a plugin that cannot build independently. Fix build errors before registration.

## Application Registration
Add the plugin import:

```ts
import { myFeaturePlugin } from '@temp-workspace/plugin-my-feature';
```

and register it in the application plugin registry (`apps/app/src/plugins-registry.ts`).

Rule: The import path must match the tsconfig alias exactly.

## Final Validation
Run both commands to confirm completion:

```bash
nx build plugin-my-feature
nx build app
```

Rule: A task is not complete until both commands succeed without errors.