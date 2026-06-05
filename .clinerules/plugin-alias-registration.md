## Brief overview
This rule file specifies the mandatory requirement for registering plugin aliases in a monorepo with multiple TypeScript configuration files. In this workspace, adding a plugin alias to `tsconfig.base.json` is NOT sufficient - the consuming application maintains its own local path mappings.

## Required Registration Locations

Every new plugin alias must be registered in BOTH locations:

### Root Configuration

File: `tsconfig.base.json`

Example:
```json
"@temp-workspace/plugin-my-feature": [
  "./plugins/plugin-my-feature/src/index.ts"
]
```

### Consuming Application Configuration

File: `apps/app/tsconfig.json`

or any application-level tsconfig that defines its own `compilerOptions.paths`.

Example:
```json
"@temp-workspace/plugin-my-feature": [
  "../../plugins/plugin-my-feature/src/index.ts"
]
```

---

## Validation

After creating a plugin and registering its alias:

```bash
nx build plugin-my-feature
nx build app
```

Both commands must pass without errors.

---

## Troubleshooting

If:

```ts
import { myPlugin } from '@temp-workspace/plugin-my-feature';
```

fails with a "Module not found" error

but

```ts
import { myPlugin } from '../../../plugins/plugin-my-feature/src';
```

works,

then treat the issue as a path mapping configuration problem.

Do NOT investigate:

* plugin implementation
* React components
* Rollup
* Turbopack
* Next.js runtime

until application-level alias registration has been verified.

---

## Critical Rule

A plugin is not considered registered until ALL of the following conditions are met:

1. Root alias exists in `tsconfig.base.json`
2. Application alias exists in `apps/app/tsconfig.json` (or consuming app tsconfig)
3. Alias-based imports compile successfully
4. No relative-path imports are required to make the plugin work