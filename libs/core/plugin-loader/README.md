# @temp-workspace/plugin-loader

Core library that implements the **plugin-driven architecture** for DevXP Portal. It provides type-safe Extension Points, plugin registration, and service discovery.

## Tipagem Segura por Ponto de Extensão

Este é o conceito central do sistema. O mecanismo transforma **nomes de strings soltas** (`"sidebar-menu"`) em **chaves tipadas** que carregam automaticamente o contrato de dados esperado, impedindo incompatibilidades entre host e plugins.

### 📐 Como funciona

**1. Mapa de contratos** (`contracts.ts`)

Declare quais pontos de extensão existem e quais props cada um exige:

```ts
export interface ExtensionPoints {
  'app:layout:header': {};
  'menubar:items': {};
  // 'sidebar-menu': { items: MenuItem[] };  // adicione novos aqui
}
```

**2. Generics vinculados**

`register()`, `ExtensionPoint<K>`, e `getExtensions<K>()` usam `K extends keyof ExtensionPoints` para forçar que o ponto e as props casem exatamente:

```ts
// Interface no plugin-loader
interface ExtensionContribution<K extends keyof ExtensionPoints> {
  point: K; // DEVE ser uma chave válida
  component: ComponentType<ExtensionPoints[K]>; // DEVE aceitar as props corretas
}
```

### ✅ Vantagens

| Benefício                 | Descrição                                         |
| ------------------------- | ------------------------------------------------- |
| **Compilação segura**     | Erro de props/nome é pego **antes** do build      |
| **Autocomplete**          | IDE sugere pontos válidos e shape exato das props |
| **Contrato vivo**         | A tipagem serve como documentação automática      |
| **Zero runtime overhead** | Toda validação acontece em TypeScript puro        |

### 💡 Em 1 frase

> Você troca strings genéricas por um índice tipado que obriga host e plugin a conversarem no formato exato esperado, com o TypeScript atuando como guardião do contrato.

## Architecture

### Plugin Types

| Type              | Purpose                                                   |
| ----------------- | --------------------------------------------------------- |
| **FeaturePlugin** | Adds visual UI, routes, and Extension Point contributions |
| **ServicePlugin** | Provides backend APIs that other plugins can consume      |

### Core Concepts

| Concept                    | Description                                                                                         |
| -------------------------- | --------------------------------------------------------------------------------------------------- |
| **Extension Point**        | A named slot in the host layout where plugins can contribute components (e.g., `app:layout:header`) |
| **Extension Contribution** | A component from a plugin that renders inside an Extension Point                                    |
| **Plugin Registration**    | Static registration in `apps/app/src/plugins-registry.ts`                                           |

### How It Works

```
┌─────────────────────────────────────────────────────┐
│  Host (RootLayout)                                  │
│                                                     │
│  <ExtensionPoint id="app:layout:header" />          │
│  ┌───────────────────────────────────┐              │
│  │ PluginA.HeaderComponent            │ ← rendered   │
│  │ PluginB.AnotherHeader              │ ← rendered   │
│  └───────────────────────────────────┘              │
│                                                     │
│  <ExtensionPoint id="menubar:items" />              │
│  ┌───────────────────────────────────┐              │
│  │ PluginC.MenuItem                   │ ← rendered   │
│  └───────────────────────────────────┘              │
└─────────────────────────────────────────────────────┘
```

## Usage

### Registering a Plugin

```ts
import { pluginLoader, FeaturePlugin, ExtensionContribution } from '@temp-workspace/plugin-loader';

const myPlugin: FeaturePlugin = {
  id: 'my-plugin',
  name: 'My Plugin',
  type: 'feature',
  routes: [{ path: 'dashboard', component: DashboardPage, label: 'Dashboard' }],
  contributions: [
    {
      point: 'app:layout:header', // ✅ Type-checked — must exist in ExtensionPoints
      component: MyHeader, // ✅ Must accept {} props (as declared)
    },
  ],
};

pluginLoader.register(myPlugin);
```

### Using an Extension Point in a Component

```tsx
import { ExtensionPoint } from '@temp-workspace/plugin-loader';

export function Layout() {
  return (
    <header>
      {/* id is type-checked — "app:layout:header" must exist in ExtensionPoints */}
      <ExtensionPoint id="app:layout:header" />
    </header>
  );
}
```

### Adding a New Extension Point

1. **Declare it** in `libs/core/plugin-loader/src/lib/contracts.ts`:

```ts
export interface ExtensionPoints {
  // ... existing
  'sidebar-menu': { items: Array<{ label: string; href: string }> };
}
```

2. **Contribute to it** from a plugin:

```ts
{
  point: 'sidebar-menu',
  component: MySidebar  // Must accept { items: ... } props
}
```

3. **Render it** in the host layout:

```tsx
<ExtensionPoint id="sidebar-menu" props={{ items: [...] }} />
```

### Accessing a Service Plugin

```ts
import { pluginLoader } from '@temp-workspace/plugin-loader';

const userService = pluginLoader.getService<UserServiceAPI>('user-service');
const users = await userService.listAll();
```

## Building

```bash
npx nx build plugin-loader
```

## Exports

| Export                        | Type                            | Description                                        |
| ----------------------------- | ------------------------------- | -------------------------------------------------- | -------------- |
| `pluginLoader`                | `PluginLoaderStore` (singleton) | Plugin registration and discovery                  |
| `ExtensionPoint`              | React Component                 | Renders contributions for a given point            |
| `ErrorBoundary`               | React Component                 | Catches plugin rendering errors                    |
| `ExtensionPoints`             | interface                       | Central type-safe registry of all extension points |
| `ExtensionContribution<K>`    | interface                       | Typed plugin contribution to an extension point    |
| `ExtensionPointDefinition<K>` | interface                       | Metadata describing an extension point             |
| `FeaturePlugin`               | interface                       | Plugin that adds UI and routes                     |
| `ServicePlugin`               | interface                       | Plugin that provides backend APIs                  |
| `DevXPPlugin`                 | union type                      | `FeaturePlugin                                     | ServicePlugin` |
