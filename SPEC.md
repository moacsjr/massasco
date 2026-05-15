# DevXP Portal — Reverse Engineering Specification

> Generated: 2026-05-14

## 1. Overview

**DevXP Portal** é um Developer Portal interno construído como **Nx monorepo** com **Next.js 16** (App Router). Usa arquitetura baseada em **plugins** (v2.2) — funcionalidades são entregues via feature plugins e service plugins pluggáveis, não via código monolítico.

- **Database**: PostgreSQL via Prisma ORM
- **UI**: React 19, Tailwind CSS 4, shadcn components, Lucide icons
- **Real-time**: SSE (Server-Sent Events) via in-memory pub/sub bus
- **State**: Client-side only (no SSR state sharing)
- **Testing**: Playwright E2E, Vitest unit

---

## 2. Workspace Architecture

```
devx-portal/                          # Nx monorepo root (@temp-workspace/source)
├── apps/
│   └── app/                          # Next.js 16 application (the portal itself)
│       ├── src/
│       │   ├── app/
│       │   │   ├── api/              # 18 REST API route handlers
│       │   │   ├── plugins/[...slug] # Dynamic plugin route dispatcher
│       │   │   ├── layout.tsx        # Root layout (plugin init + CSS token injection)
│       │   │   └── page.tsx          # Welcome / architecture docs
│       │   ├── components/           # shadcn UI primitives + ClientProviders
│       │   ├── lib/                  # prisma.ts, sse-bus.ts, utils.ts
│       │   └── plugins-registry.ts   # Static plugin registration
│       └── next.config.js
│
├── libs/
│   ├── core/
│   │   ├── plugin-loader/            # Plugin registry, extension points, error boundaries
│   │   ├── token-bridge/             # W3C Design Tokens → CSS variable injector
│   │   └── ui-registry/              # UI component resolution with Zod validation
│   └── ui-contracts/                 # Zod schemas for UI component contracts
│
├── plugins/                          # 10 plugins (6 feature + 5 service)
│   ├── plugin-auth/                  # User profile page
│   ├── plugin-menubar/               # Top menu bar
│   ├── plugin-user-service/          # Mock user CRUD service
│   ├── plugin-user-management/       # User management UI
│   ├── plugin-main-template/         # Full page layout (header, nav, content, footer)
│   ├── plugin-menu-nav-bar/          # Auto-generated navigation from plugin routes
│   ├── plugin-menu-catalog/          # Full CRUD for categories, products, prices, complements
│   ├── plugin-order-core/            # SSE event publishing (no-op)
│   ├── plugin-orders-delivery/       # Order management wizard + delivery tracking
│   ├── plugin-kds/                   # Kitchen Display System (real-time SSE)
│   ├── plugin-payments/              # Payment processing (service + UI)
│   └── plugin-audit/                 # Audit logging service
│
├── ui-project/                       # UI component implementations
│   └── src/lib/ui-project.tsx        # Button, Card, Input, Icon, Drawer, Tabs
│
├── prisma/
│   ├── schema.prisma                 # 8 models, 2 enums
│   └── migrations/                   # 5 migrations
│
├── docker/
│   └── docker-compose.yml            # PostgreSQL 15 + Adminer
│
└── e2e/                              # Playwright E2E tests
```

---

## 3. Plugin System Architecture

### 3.1 Plugin Types

| Type | Purpose | Example |
|---|---|---|
| **Feature Plugin** | Adds UI pages and routes. Rendered at `/plugins/<id>/<path>` | `orders-delivery`, `menu-catalog-ui` |
| **Service Plugin** | Provides backend APIs consumed by other plugins via `pluginLoader.getService<T>()` | `menu-catalog`, `payments`, `audit` |

### 3.2 Plugin Loader (`libs/core/plugin-loader/`)

- **`PluginLoaderStore`** — Singleton registry (`pluginLoader` exported instance)
- **`register(plugin)`** — Registers plugin with duplicate detection
- **`getService<T>(id)`** — Type-safe service resolution
- **`getExtensions<K>(extensionPointId)`** — Gets all contributions to an extension point
- **`resolveRoute(pluginId, path)`** — Matches URL path to plugin route (supports `:id` dynamic segments)

### 3.3 Extension Points

16 extension points for UI composition:

| Extension Point | Props | Defined By | Contributes To |
|---|---|---|---|
| `app:main-template` | `MainTemplateProps` | `main-template` | `layout.tsx` renders full portal layout |
| `main-template:header-menu` | `{}` | `main-template` | `menubarPlugin` renders top nav |
| `main-template:header-footer-left/center/right` | `{}` | `main-template` | (unused — reserved slots) |
| `main-template:left-menu` | `LeftMenuItemProps` {name, icon} | `main-template` | `menuNavBarPlugin` adds nav items |
| `main-template:right-menu` | `RightMenuItemProps` {tabName, tabIcon} | `main-template` | (unused — reserved slots) |
| `main-template:content-top/left/right/bottom` | `{}` | `main-template` | (unused — reserved slots) |
| `main-template:footer-left/center/right` | `{}` | `main-template` | (unused — reserved slots) |
| `menubar:items` | `{}` | `menubarPlugin` | `userManagementPlugin` adds menu links |

### 3.4 UI Resolution (`libs/core/ui-registry/`)

**Resolution order**: (1) Context-provided component → (2) Native fallback (hardcoded defaults)
- In dev mode, wraps with **Zod validation** (`withValidation()`) for contract enforcement
- **6 UI contracts**: Button, Card, Input, Icon, Drawer, Tabs (Zod schemas in `ui-contracts`)
- **Fallbacks**: plain HTML elements styled with minimal CSS

### 3.5 Token Bridge (`libs/core/token-bridge/`)

- Converts W3C Design Tokens (`ui-project/tokens/tokens.json`) to CSS custom properties
- `TokenInjector` renders `<style>` block in `<head>` with `:root { --devxp-* }` variables

### 3.6 Plugin Registration Flow

```
layout.tsx (server) → initializePlugins()
  └── registers all plugins from plugins-registry.ts
  └── TokenInjector injects CSS variables

ClientProviders (client) → initializePlugins() [duplicate — logs warning, skips re-register]
  └── UIProvider wraps app with ui-project components
  
plugins/[...slug]/page.tsx → resolves URL to plugin route → renders component
```

---

## 4. All Plugins Detail

### Feature Plugins

| # | ID | Name | Routes | Description |
|---|---|---|---|---|
| 1 | `auth` | Autenticação | `profile` | User profile card page |
| 2 | `menubar` | Menu Bar | (none) | Renders top menu bar via `main-template:header-menu`; provides `menubar:items` slot |
| 3 | `user-management` | Gestão de Usuários | `` | Lists users via `UserServiceAPI`; contributes link to menubar |
| 4 | `main-template` | Main Template | (none) | Full page layout: header, nav rail (left/right menus), content area (4 slots), footer (3 slots) |
| 5 | `menu-nav-bar` | Menu Navigation Bar | (none) | Auto-generates navigation entries from all registered feature plugin routes; contributes to `main-template:left-menu` |
| 6 | `menu-catalog-ui` | Menu Catalog | ``, `categories`, `categories/new`, `categories/:id`, `products`, `products/new`, `products/:id` | Full CRUD UI for categories, products, prices, and complements |
| 7 | `orders-delivery` | Orders & Delivery | ``, `new` | **Tab 1**: Active orders + items in preparation. **Tab 2**: Items ready for delivery. **FAB (+)**: Opens order creation wizard (3 steps: product list → product details → order summary) |
| 8 | `kds` | Kitchen Display System | `` | Two-column KDS board: Pending / Preparing. Real-time SSE updates. Action buttons: start preparing → mark ready |
| 9 | `payments-ui` | Payments | `` | Select open order → view items + total → register payment (cash/card/pix). Shows paid/remaining amounts |

### Service Plugins

| # | ID | API | Description |
|---|---|---|---|
| 1 | `user-service` | `UserServiceAPI`: `listUsers()`, `createUser()` | Mock user CRUD (in-memory) |
| 2 | `order-core` | `OrderCoreAPI`: `publish(eventType, payload)` | SSE event publishing (no-op — API routes use `sseBus` directly) |
| 3 | `menu-catalog` | `MenuCatalogAPI`: CRUD for categories, products, prices, complements | REST API wrapper calling `/api/*` endpoints |
| 4 | `payments` | `PaymentsAPI`: `calculateTotal()`, `registerPayment()` | Order total calculation + payment registration |
| 5 | `audit` | `AuditAPI`: `log()`, `getLogs()` | Audit logging via `/api/audit` |
| 6 | `ui-components` | `components` map | Bridges `ui-project` components to plugin system via ExtensionPoint |

---

## 5. API Routes

### Order Management

| Route | Methods | Description |
|---|---|---|
| `/api/orders` | GET, POST | GET: list orders (filter by `?status=`), includes items+payments. POST: create order with items (validates product IDs), publishes `ORDER_CREATED` SSE |
| `/api/orders/[id]` | GET, PATCH | GET: single order with items+payments. PATCH: update order status/notes, publishes `ORDER_UPDATED` SSE |
| `/api/order-items/[id]` | PATCH | Update item status/notes. Auto-sets `sentAt` on `READY`, `deliveredAt` on `DELIVERED`. Publishes `ITEM_UPDATED` SSE |
| `/api/payments` | GET, POST | GET: list payments (filter by `?orderId=`). POST: create payment, auto-checks full payment → sets `PAID` status. Publishes `ORDER_CLOSED` or `PARTIAL_PAYMENT_ACCEPTED` SSE |

### Menu Catalog

| Route | Methods | Description |
|---|---|---|
| `/api/categories` | GET, POST | GET: list categories (asc). POST: create category |
| `/api/categories/[id]` | GET, PUT, DELETE | CRUD for single category |
| `/api/products` | GET, POST | GET: list products (filter by `?categoryId=`), includes prices+complements. POST: create product with prices+complements (transaction) |
| `/api/products/[id]` | GET, PUT, DELETE | CRUD for single product (PUT replaces all prices+complements) |
| `/api/prices` | GET, POST | GET: list prices for product. POST: create price |
| `/api/prices/[id]` | GET, PUT, DELETE | CRUD for single price |
| `/api/complements` | GET, POST | GET: list complements for product. POST: create complement |
| `/api/complements/[id]` | GET, PUT, DELETE | CRUD for single complement |
| `/api/menu/categories` | GET, POST | Duplicate of `/api/categories` (simplified) |
| `/api/menu/products` | GET, POST | Duplicate of `/api/products` (simplified) |

### Infrastructure

| Route | Methods | Description |
|---|---|---|
| `/api/hello` | GET | Health check: returns "Hello, from API!" |
| `/api/events` | GET | SSE endpoint (`text/event-stream`). 30s heartbeat. Streams all SSEBus events |
| `/api/audit` | GET, POST | GET: list audit logs (filter by `?module=`, `?eventType=`, last 100). POST: create audit entry |
| `/api/test/reset` | POST | Deletes ALL data (payments → orderItems → orders → products → categories → auditLogs) |

---

## 6. Database Schema (Prisma)

### Enums
- **OrderStatus**: `OPEN`, `AWAITING_PAYMENT`, `PAID`, `CLOSED`
- **ItemStatus**: `PENDING`, `PREPARING`, `READY`, `DELIVERED`, `CANCELLED`

### Models

```
Category
├── id (uuid), name (string), description? (string), createdAt

Product
├── id (uuid), name (string), description? (string), categoryId (FK→Category), createdAt
├── hasMany → ProductPrice, ProductComplement, OrderItem

ProductPrice
├── id (uuid), productId (FK→Product), description (string), value (Decimal 10,2), createdAt
├── hasMany → OrderItem (as selectedPrice)

ProductComplement
├── id (uuid), productId (FK→Product), group (string), title (string), description?, value (Decimal 10,2, default 0), createdAt

Order
├── id (uuid), tableNumber (Int), status (OrderStatus), createdAt, updatedAt
├── hasMany → OrderItem, Payment

OrderItem
├── id (uuid), orderId (FK→Order), productId (FK→Product), quantity (Int, default 1)
├── notes? (string), status (ItemStatus, default PENDING)
├── selectedPriceId? (FK→ProductPrice), selectedComplements? (Json: [{id, title, value}])
├── sentAt?, deliveredAt?, createdAt

Payment
├── id (uuid), orderId (FK→Order), amount (Decimal 10,2), method (cash/card/pix), createdAt

AuditLog
├── id (uuid), module (string), eventType (string), payload (Json), createdAt
```

---

## 7. SSE Event Bus (`apps/app/src/lib/sse-bus.ts`)

**In-memory pub/sub** using `globalThis` to survive Next.js hot reload.

### Events Published
| Event | Triggered By | Payload |
|---|---|---|
| `ORDER_CREATED` | POST `/api/orders` | `{ orderId, tableNumber, items[] }` |
| `ORDER_UPDATED` | PATCH `/api/orders/[id]` | `{ orderId, updates }` |
| `ORDER_CLOSED` | POST `/api/payments` (fully paid) | `{ orderId, amount }` |
| `ITEM_UPDATED` | PATCH `/api/order-items/[id]` | `{ itemId, status, orderId }` |
| `PARTIAL_PAYMENT_ACCEPTED` | POST `/api/payments` (partial) | `{ orderId, amount, remaining }` |

### Consumers
- **KDS**: Listens to `ITEM_UPDATED` and `ORDER_CREATED` → refreshes board
- **Orders-Delivery**: Listens to `ITEM_UPDATED` and `ORDER_CREATED` → refreshes order list

---

## 8. Key Flows

### 8.1 Order Creation Wizard (orders-delivery)
```
OrdersDeliveryPage (/)
  └── FAB (+) → /plugins/orders-delivery/new
       └── Step 1: ProductListStep — search/filter products by category
            └── Click product → Step 2: ProductDetailsStep
                 └── Select price (required) + complements (optional) + notes
                      └── "Adicionar" → Step 3: OrderSummaryStep
                           └── Review items → "Enviar pedido" → POST /api/orders
                                └── SSE: ORDER_CREATED → KDS + Orders page update
```

### 8.2 Payment Processing
```
PaymentsPage (/plugins/payments-ui/)
  └── List open orders with totals
       └── Select order → view items + total/paid/remaining
            └── Enter amount + method → POST /api/payments
                 └── If fully paid → PATCH order status to PAID → SSE: ORDER_CLOSED
                 └── If partial → SSE: PARTIAL_PAYMENT_ACCEPTED
```

### 8.3 Kitchen Display
```
KDSPage (/plugins/kds/)
  └── Two columns: Pending | Preparing
       └── "Iniciar" → PATCH /api/order-items/[id] {status: PREPARING}
       └── "Pronto" → PATCH /api/order-items/[id] {status: READY}
            └── SSE: ITEM_UPDATED → Orders-Delivery "Para Entregar" tab updates
```

### 8.4 Menu Catalog Management
```
MenuCatalogUI (/plugins/menu-catalog-ui/)
  └── Categories CRUD → create/edit/delete categories
  └── Products CRUD → create products with prices + complements
       └── ProductPrice: multiple price variants per product
       └── ProductComplement: grouped add-ons with pricing
```

---

## 9. Known Issues & Technical Debt

| Issue | Location | Impact |
|---|---|---|
| Legacy stub pages | `/feature`, `/service`, `/domain` | Reference `/api/entities` which doesn't exist (removed in v2.2) |
| Broken seed script | `prisma/seed.ts` | References `prisma.entityType` — model removed from schema |
| Duplicate API routes | `/api/menu/*` | Simplified duplicates of `/api/categories`, `/api/products` |
| Plugin double-init | `layout.tsx` + `providers.tsx` | `initializePlugins()` called twice (second logs warning, harmless) |
| order-core service no-op | `plugin-order-core` | `publish()` only logs; real publishing via `sseBus` in API routes |
| `icon` on PluginRoute | plugin definitions | Not in `PluginRoute` type — TypeScript error (moved to plugin-level `icon`) |

---

## 10. Tech Stack Summary

| Category | Technology |
|---|---|
| Framework | Next.js ~16.1 (App Router) |
| Monorepo | Nx 22.7 |
| UI | React 19, Tailwind CSS 4.3, shadcn, Lucide React |
| Backend | NestJS ^11 (available, not heavily used), Next.js API Routes |
| ORM | Prisma ^5.22 |
| Database | PostgreSQL 15 |
| Validation | Zod ^4.4 |
| Real-time | SSE (Server-Sent Events) via in-memory bus |
| Linting | ESLint 9 (typescript-eslint) |
| Formatting | Prettier ~3.6 |
| Testing | Playwright ^1.6 (E2E), Vitest ~4.1 (unit) |
| Bundling | Webpack, Rollup (libs), SWC |
| Language | TypeScript 5.9 |
| Package Manager | pnpm |
