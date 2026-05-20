# DevXP Portal

## Project Overview

**DevXP Portal** is an internal Developer Portal built as an **Nx monorepo** with a **Next.js** frontend application. The project follows a **plugin-driven architecture** (v2.2), where functionality is delivered via pluggable features and services rather than a monolithic codebase.

### Architecture

The workspace is organized into two main areas:

```
apps/
  app/                    # Next.js application (the portal itself)
libs/
  core/
    plugin-loader/        # Plugin loading, extension points, error boundaries
    token-bridge/         # Token injection/management
    ui-registry/          # UI component registry (resolves UI tokens to components)
  ui-contracts/           # Shared UI type contracts
```

### Plugin Architecture

The portal uses a static plugin registry system (`apps/app/src/plugins-registry.ts`). Each plugin is registered at startup and can be one of two types:

- **Feature plugins** — add visual UI and routes (exposed via Extension Points)
- **Service plugins** — provide backend APIs that other plugins can consume

Currently registered plugins:

- `authPlugin` — Authentication
- `menubarPlugin` — Top menu bar
- `userServicePlugin` — User service APIs
- `userManagementPlugin` — User management UI

### Extension Points

UI composition happens through an **Extension Point** system (`@temp-workspace/plugin-loader`). Plugins contribute components to named slots (e.g., `app:layout:header`, `menubar:items`). The layout renders these at designated positions.

### Data Layer

- **Prisma** ORM with **PostgreSQL** (`devxp` database)
- Entity models have been removed in v2.2 — the schema is currently empty
- Database seeding via `npx jiti prisma/seed.ts`

## Tech Stack

| Category        | Technology                                                |
| --------------- | --------------------------------------------------------- |
| Framework       | **Next.js ~16.1** (App Router, `'use client'` directives) |
| Monorepo        | **Nx 22.7**                                               |
| UI              | **React 19**, CSS (no CSS-in-JS framework)                |
| Backend         | **NestJS ^11** (available, plugin services)               |
| ORM             | **Prisma ^5**                                             |
| Database        | **PostgreSQL**                                            |
| Validation      | **Zod ^4**                                                |
| Linting         | **ESLint 9** (typescript-eslint)                          |
| Formatting      | **Prettier ~3.6**                                         |
| Testing         | **Vitest ~4.1**, **Jest** (via Nx plugins)                |
| Bundling        | **Webpack**, **Rollup** (libs), **SWC**                   |
| Language        | **TypeScript 5.9**                                        |
| Package Manager | **pnpm**                                                  |

## Commands

### Development

```bash
# Start the Next.js dev server
npx nx dev app
```

### Building

```bash
# Build the app
npx nx build app
```

### Linting & Formatting

```bash
# Lint a specific project
npx nx lint app

# Format code
npx prettier --write .
```

### Testing

```bash
# Run tests for a project
npx nx test <project-name>
```

### Database

```bash
# Run Prisma migrations
npx prisma migrate dev

# Seed the database
npx jiti prisma/seed.ts

# Generate Prisma client
npx prisma generate
```

### Nx

```bash
# Visualize the project graph
npx nx graph

# Show all targets for a project
npx nx show project app --web

# List installed Nx plugins
npx nx list
```

## Key Conventions

- **React Server/Client Components**: The app uses Next.js App Router with `'use client'` directives for client-side interactivity (e.g., `page.tsx` uses `useUI()` hook)
- **Plugin Registration**: All plugins are statically registered in `apps/app/src/plugins-registry.ts` — new plugins must be added there
- **UI Resolution**: UI components are resolved through `@temp-workspace/ui-registry` via tokens (see `ui-project/tokens/tokens.json`)
- **Extension Points**: New extension points must be registered in the `ExtensionPoints` interface in `libs/core/plugin-loader/src/lib/contracts.ts`
- **Path aliases**: Packages use `@temp-workspace/*` naming convention (e.g., `@temp-workspace/plugin-loader`, `@temp-workspace/ui-registry`)

## Environment

The `.env` file configures the PostgreSQL connection:

```
DATABASE_URL="postgresql://postgres:password@localhost:5432/devxp?schema=public"
```

## Notes

- The project name in `package.json` is `@temp-workspace/source` — this is the Nx workspace root package name
- Entity/EntityEngine concepts were removed in v2.2 to simplify the core; only Plugins remain
- The `ui-project/` directory (external to this workspace) contains token definitions (`tokens.json`)
