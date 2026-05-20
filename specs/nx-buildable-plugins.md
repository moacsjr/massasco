# Nx Buildable Libraries — Plugin Architecture

**Status:** Draft  
**Created:** 2026-05-18  
**Author:** Moacir  
**Area:** Architecture / Build System

---

## Context

The DevXP Portal uses an Nx monorepo with plugins under `plugins/` and shared libraries under `libs/`. Currently, plugins are consumed **source-based** by the Next.js app via `@temp-workspace/*` path aliases — the app's dev server (Turbopack) transpiles everything on the fly.

Some plugins (e.g., `plugin-auth`) have Nx-generated `rollup.config.cjs` files that produce bundled outputs in `dist/`, but these builds were broken and the `dist/` artifacts are not consumed by the app at any point.

The goal is to make these plugin builds **functional** so they can serve two purposes:

1. **CI/CD optimization**: Nx `affected` caching can skip rebuilding unchanged plugins
2. **Future distribution**: Plugins can be published as standalone npm packages

**This does NOT change the dev flow.** Dev continues to consume plugins from source.

---

## Decision

**Dual-mode architecture:**

- **Dev mode**: Plugins consumed from source via `@temp-workspace/*` path aliases → `src/`
- **Build mode**: Plugins produce bundled outputs in `dist/` with correct type declarations, externalizing workspace dependencies

The rollup configs are **not** Nx scaffolding artifacts to be deleted — they are intentional build targets for CI and distribution.

---

## Scope

| In scope                                             | Out of scope                                               |
| ---------------------------------------------------- | ---------------------------------------------------------- |
| Fix rollup builds for all plugins                    | Migrate dev flow to consume dist/                          |
| Ensure correct `external` and `declaration` handling | Publish plugins to npm registry                            |
| Document the dependency graph for build ordering     | Migrate libs (`ui-registry`, `plugin-loader`) to buildable |
| Verify CI pipeline uses `nx affected` correctly      |                                                            |

---

## Current State

### Dependency graph

```
ui-contracts ──▶ ui-registry ──▶ plugins ──▶ app
              ──▶ plugin-loader ──┘
              ──▶ token-bridge ───┘
```

### What works

| Package          | Build status              | Type checking | Notes                                                                              |
| ---------------- | ------------------------- | ------------- | ---------------------------------------------------------------------------------- |
| `ui-contracts`   | ✅ Passes                 | ✅            | Pure TypeScript, no React                                                          |
| `plugin-loader`  | ✅ Passes                 | ✅            | Pure TypeScript, no React                                                          |
| `token-bridge`   | ✅ Passes                 | ✅            | Has JSX (`TokenInjector`), renamed to `.tsx`                                       |
| `ui-registry`    | ⚠️ Passes (warnings)      | ✅            | `'use client'` stripped warning; `@temp-workspace/ui-contracts` unresolved warning |
| `plugin-auth`    | ⚠️ Passes (legacy plugin) | ✅            | Uses `useLegacyTypescriptPlugin: true` workaround                                  |
| Other 11 plugins | ❌ No rollup config       | N/A           | Not configured for independent build                                               |

### What's broken

1. **`ui-registry`** has `@temp-workspace/ui-contracts` as an unresolved dependency in rollup — it's imported in source but not listed in `external`
2. **`plugin-auth`** uses `useLegacyTypescriptPlugin: true` (deprecated, removed in Nx 23) — technical debt
3. **No other plugins** have rollup configs, so `nx build` only covers `plugin-auth`

---

## Implementation Plan

### Phase 1: Fix existing plugin builds

#### 1.1 Fix `ui-registry` rollup config

**File:** `libs/core/ui-registry/rollup.config.cjs`

**Change:** Add `@temp-workspace/ui-contracts` to the `external` array.

```js
external: [
  'react',
  'react-dom',
  'react/jsx-runtime',
  '@temp-workspace/ui-contracts',   // ← add this
],
```

**Expected result:** No more "Unresolved dependencies" warning for `@temp-workspace/ui-contracts`.

#### 1.2 Fix `plugin-auth` — remove legacy TypeScript plugin

**File:** `plugins/plugin-auth/rollup.config.cjs`

**Current config:**

```js
compiler: 'swc',
skipTypeCheck: true,
useLegacyTypescriptPlugin: true,   // ← deprecated
```

**Change:** Remove `useLegacyTypescriptPlugin: true`. Keep `compiler: 'swc'` and `skipTypeCheck: true`.

**Rationale:** With `skipTypeCheck: true`, the TypeScript plugin only emits `.d.ts` files but doesn't type-check. Combined with `declaration: false` in `tsconfig.lib.json`, it emits nothing — so the legacy plugin is unnecessary.

**Verify:** `npx nx build plugin-auth` passes without using `rollup-plugin-typescript2`.

#### 1.3 Add rollup configs for all remaining plugins

**Plugins needing configs:**

| Plugin                   | Imports from `libs/`?                                          | Complexity |
| ------------------------ | -------------------------------------------------------------- | ---------- |
| `plugin-menubar`         | `@temp-workspace/ui-registry`                                  | Low        |
| `plugin-user-management` | `@temp-workspace/ui-registry`, `@temp-workspace/plugin-loader` | Low        |
| `plugin-user-service`    | `@temp-workspace/plugin-loader`                                | Low        |
| `plugin-main-template`   | `@temp-workspace/plugin-loader`, `@temp-workspace/ui-registry` | Low        |
| `plugin-menu-nav-bar`    | `@temp-workspace/ui-registry`, `@temp-workspace/plugin-loader` | Low        |
| `plugin-order-core`      | `@temp-workspace/plugin-loader`                                | Low        |
| `plugin-menu-catalog`    | `@temp-workspace/ui-registry`, `@temp-workspace/plugin-loader` | Low        |
| `plugin-orders-delivery` | `@temp-workspace/plugin-loader`                                | Low        |
| `plugin-kds`             | `@temp-workspace/plugin-loader`                                | Low        |
| `plugin-payments`        | `@temp-workspace/plugin-loader`                                | Low        |
| `plugin-audit`           | `@temp-workspace/plugin-loader`                                | Low        |
| `plugin-ui-components`   | `@temp-workspace/ui-registry`, `@temp-workspace/ui-contracts`  | Low        |

**Template for all plugin rollup configs:**

```js
// plugins/<plugin-name>/rollup.config.cjs
const { withNx } = require('@nx/rollup/with-nx');

module.exports = withNx({
  main: './src/index.ts',
  outputPath: '../../dist/plugins/<plugin-name>',
  tsConfig: './tsconfig.lib.json',
  compiler: 'swc',
  skipTypeCheck: true,
  external: ['react', 'react-dom', 'react/jsx-runtime', '@temp-workspace/ui-contracts', '@temp-workspace/ui-registry', '@temp-workspace/plugin-loader', '@temp-workspace/token-bridge'],
  format: ['esm'],
  assets: [{ input: '.', output: '.', glob: 'README.md' }],
});
```

**Template for all plugin `tsconfig.lib.json`:**

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "../../dist/out-tsc",
    "declaration": false,
    "types": ["node", "@nx/react/typings/cssmodule.d.ts", "@nx/react/typings/image.d.ts"]
  },
  "exclude": ["jest.config.ts", "jest.config.cts", "src/**/*.spec.ts", "src/**/*.test.ts"],
  "include": ["src/**/*.js", "src/**/*.jsx", "src/**/*.ts", "src/**/*.tsx"]
}
```

**Note:** If a plugin doesn't import from a given `@temp-workspace/*` package, it's harmless to list it in `external` — it just won't be encountered.

### Phase 2: Verify full build chain

#### 2.1 Build all dependencies in order

```bash
npx nx reset
npx nx build ui-contracts
npx nx build plugin-loader
npx nx build token-bridge
npx nx build ui-registry
npx nx build plugin-auth        # single plugin
npx nx build all-plugins       # or all at once if project.json defines aggregation
npx nx build app               # depends on all above
```

#### 2.2 Verify `nx graph` shows correct dependencies

```bash
npx nx graph
```

Expected: `app` should depend on all plugins and libs, and each plugin should depend on the libs it imports from.

#### 2.3 Verify `nx affected` works

```bash
# Simulate: only plugin-auth changed
npx nx affected --target=build --base=main~1 --head=main
```

Expected: Only `plugin-auth` and `app` are rebuilt. Other plugins use cache.

### Phase 3: CI pipeline integration

#### 3.1 Update CI build command

**Before:**

```yaml
- run: npx nx build app
```

**After:**

```yaml
- run: npx nx affected --target=build --base=origin/main~1 --parallel=3
```

This builds only changed projects and their dependents, with parallelism.

#### 3.2 Verify Nx Cloud or local cache

If Nx Cloud is configured, the `affected` command will pull cached artifacts. If not, local `.nx/cache` provides cache between pipeline runs on the same machine.

---

## Risks and Mitigations

| Risk                                                                    | Impact | Mitigation                                                                                                                 |
| ----------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------- |
| `@rollup/plugin-typescript` deprecated in Nx 23                         | Medium | `skipTypeCheck: true` + `declaration: false` avoids needing any TS plugin for emit; type checking happens in Next.js build |
| A plugin adds a new `@temp-workspace/*` import that's not in `external` | Low    | Build fails with "unresolved dependency" warning — easy to catch and fix                                                   |
| Rollup bundling changes the public API surface                          | Low    | `index.ts` is the entry point; rollup preserves all exports                                                                |
| Build times increase in CI                                              | Medium | Nx `affected` + caching should offset this — only changed plugins rebuild                                                  |
| `useLegacyTypescriptPlugin` removal causes regressions                  | Low    | Already mitigated by `skipTypeCheck: true` + `declaration: false`                                                          |

---

## Acceptance Criteria

- [ ] `npx nx build app` succeeds with zero errors and zero warnings from rollup
- [ ] Every plugin under `plugins/` has a functional `rollup.config.cjs` and `tsconfig.lib.json`
- [ ] No plugin uses `useLegacyTypescriptPlugin: true`
- [ ] `npx nx graph` shows correct dependency edges from plugins to libs
- [ ] `npx nx affected --target=build` correctly identifies changed plugins
- [ ] All plugin builds output to `dist/plugins/<name>/` with `index.esm.js`

---

## Future Considerations (Not in this spec)

1. **Publish plugins to npm**: Requires adding `package.json` with correct `name`, `version`, and `exports` fields in the dist output
2. **Migrate dev to consume dist**: Would require changing `@temp-workspace/*` path aliases to point to `dist/` — only worth it if dev build times become a bottleneck
3. **Module federation**: Nx supports Webpack Module Federation for true runtime plugin loading — this would enable plugins to be deployed independently without rebuilding the app
4. **Remove rollup entirely**: If the team decides to stay source-based forever, rollup configs can be deleted and build targets removed from `project.json` files
