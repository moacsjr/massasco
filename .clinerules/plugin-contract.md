## Brief overview
This rule file specifies the mandatory checklist for creating and registering plugins in the monorepo. Every plugin must be properly configured to be built independently, consumed by other projects, registered in the application plugin registry, and resolved correctly by TypeScript, Nx, Rollup, and Next.js.

## Required Files

Every plugin must contain:

* `package.json`
* `project.json`
* `tsconfig.json`
* `tsconfig.lib.json`
* `rollup.config.cjs`
* `src/index.ts`

A plugin is not considered complete if any of these files are missing.

---

## Package Identity

`package.json` must contain:

```json
{
  "name": "@temp-workspace/plugin-my-feature"
}
```

Validation:

* `package.json` name matches import alias
* `package.json` name matches tsconfig path mapping

---

## Nx Project Registration

`project.json` must contain:

```json
{
  "name": "plugin-my-feature",
  "sourceRoot": "plugins/plugin-my-feature/src",
  "projectType": "library"
}
```

---

## TypeScript Configuration

`tsconfig.json` must:

```json
{
  "extends": "../../tsconfig.base.json"
}
```

`tsconfig.lib.json` must:

* define `outDir`
* exclude tests
* contain React typings when applicable

---

## Rollup Configuration

`rollup.config.cjs` must:

* define `src/index.ts` as entry point
* define the correct output directory
* declare required externals

---

## Public Entry Point

`src/index.ts` must expose the plugin.

Application code must never import directly from `lib/`.

Always import from:

```ts
@temp-workspace/plugin-my-feature
```

---

## Build Validation

```bash
nx build plugin-my-feature
nx build app
```

Both builds must succeed.

---

## Module Resolution Failure Procedure

For:

```text
Cannot resolve '@temp-workspace/plugin-*'
```

investigate in this order:

1. tsconfig path mapping
2. package.json name
3. project.json name
4. src/index.ts export
5. plugin folder name
6. plugin build
7. application build