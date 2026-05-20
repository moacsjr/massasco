# 📄 Product Requirements Document (PRD)
## DevXP Portal v2.1 – Plataforma de Developer Experience (Single-DS por Deployment)

---

### 1. Visão Geral

**Nome do Produto:** DevXP Portal
**Objetivo:** Fornecer uma fundação web extensível para que startups modeluem hierarquias organizacionais, integrem plugins e operem com **um único Design System por instância/deployment**, garantindo consistência visual, extensibilidade sem acoplamento ao núcleo e alto desempenho.
**Público-alvo:** Times de engenharia e arquitetos de plataforma que necessitam de um portal centralizador, com identidade visual própria e flexibilidade para estender funcionalidades sem modificar o core.

**Principais diferenciais:**
- **UI como Contrato:** Componentes resolvidos via registry tipado, com validação de props e fallbacks seguros.
- **Design Tokens W3C:** Abstração visual baseada na especificação DTCG, injetada como CSS Variables nativas.
- **Resolução em Build-Time:** O Design System do projeto é empacotado e injetado no boot da aplicação, eliminando complexidade de multi-tenant em runtime.
- **Extensibilidade Zero-Touch:** Plugins, entidades e DS são registrados via contratos, mantendo o núcleo estável e leve.
- **DX Empresarial:** Sandbox de preview, validação automática de contratos em CI e geração de boilerplate tipado.

---

### 2. Personas

| Persona | Descrição | Necessidades |
|---------|-----------|--------------|
| **Engenheiro de Plataforma (Admin)** | Configura a instância, modela entidades, gerencia permissões e integra plugins. | Ferramentas de registro, validação de contratos, documentação clara, deploy simplificado. |
| **Desenvolvedor de Times** | Usa o portal para visualizar sistemas, pipelines, clusters e métricas. | Navegação consistente, performance, UI alinhada ao padrão visual da startup. |
| **Tech Lead / Arquiteto** | Modela bounded contexts, relaciona domínios e infraestrutura. | Grafos hierárquicos, exportação, contratos estáveis, extensibilidade controlada. |
| **Engenheiro de UI/UX** | Integra o Design System próprio da startup ao portal. | Mapeamento de tokens, validação de props, isolamento de dependências, preview em tempo real. |
| **Desenvolvedor de Plugins** | Cria extensões (CI, Cloud, Auth, etc.) que rodam sobre o core. | APIs claras, acesso a `useUI()`, hot-reload, tipagem estrita, zero acoplamento visual. |

---

### 3. Requisitos Funcionais

#### 3.1. Gerenciamento de Entidades Genéricas
- **RF‑1:** Suporte à criação dinâmica de tipos de entidade pelo usuário (ex.: `Domain`, `Application`, `Cluster`, etc.).
- **RF‑2:** Campos base: `id`, `name`, `type`, `title`, `description`, `createdAt`, `createdBy`, `updatedAt`, `customFields` (JSONB), `metadata`.
- **RF‑3:** Schema JSON validável no backend para `customFields`, gerando formulários dinâmicos no frontend.
- **RF‑4:** Relacionamentos configuráveis (`parent_of`, `uses`, `deployed_in`) com direção e cardinalidade.
- **RF‑5:** Navegação hierárquica em árvore/grafo com visualização interativa.

#### 3.2. Rotas e APIs CRUD
- **RF‑6:** Endpoints REST padronizados: `GET/POST/PUT/DELETE /api/entity/:type[/:id]`.
- **RF‑7:** Validação automática contra schema registrado por tipo.
- **RF‑8:** `extraRoutes` por entidade montadas sob `/entity/:type/...`.
- **RF‑9:** Plugins declaram rotas frontend e endpoints backend, registrados automaticamente pelo core.

#### 3.3. Sistema de Plugins
- **RF‑10:** Plugins isolados em `/plugins`, carregados dinamicamente em dev e tree-shakeados em prod.
- **RF‑11:** Exportam: `id`, `name`, `routes`, `apiRoutes`, `navItems`, `entityTabs`, `entityCards`, `components`.
- **RF‑12:** Core integra contribuições ao roteador, API e registry sem necessidade de rebuild do núcleo.
- **RF‑13:** Plugins acessam UI via `useUI().resolve()`, nunca importam componentes visuais diretamente do core.

#### 3.4. UI como Contrato & Registry Único *(v2.1)*
- **RF‑14:** Core define `@devxp/ui-contracts` (schemas Zod/TypeScript) para componentes base obrigatórios (`Button`, `Card`, `Input`, `Modal`, `Badge`, `Table`).
- **RF‑15:** `UIProvider` recebe a implementação única do Design System do projeto (`components`, `tokens`, `theme`).
- **RF‑16:** Hook `useUI()` expõe `resolve(name)` e tokens. Em `development`, valida props contra contrato e exibe warnings claros no console.
- **RF‑17:** Resolução com fallback chain: `projeto DS → core fallback → HTML nativo`. Falha segura apenas se contrato crítico não for satisfeito.

#### 3.5. Design Tokens & Theming *(v2.1)*
- **RF‑18:** Tokens seguem **W3C Design Tokens Community Group (DTCG)**. Convertidos para CSS Variables globais: `--devxp-*`.
- **RF‑19:** `@devxp/token-bridge` processa tokens de qualquer stack (Figma, Style Dictionary, Tailwind config, Emotion) e injeta no `<head>` durante o bootstrap.
- **RF‑20:** Core e plugins usam **apenas CSS variables** em estilos. Zero dependência de CSS-in-JS, Sass ou Tailwind no núcleo.

#### 3.6. Geração de Código (Skills)
- **RF‑21:** `yarn skill:create-entity` → gera pasta tipada, schema JSON, rotas CRUD e UI skeleton usando `useUI()`.
- **RF‑22:** `yarn skill:create-plugin` → gera estrutura completa com `routes`, `apiRoutes`, `entityTabs` e contrato de componentes.
- **RF‑23:** `yarn skill:init-ds` → gera `ui-project/` com `tokens.json`, `contracts.ts`, `components/` e config de build pronta para integração.

#### 3.7. Autenticação e Autorização
- **RF‑24:** Autenticação via plugin. Sessão única por instância.
- **RF‑25:** Rotas/endpoints marcados como `public` ou `private`. Verificação de sessão obrigatória no core.
- **RF‑26:** Arquitetura preparada para RBAC granular (futuro).

---

### 4. Requisitos Não-Funcionais (RNFs)

| ID | Requisito | Métrica / Garantia |
|----|-----------|-------------------|
| **RNF‑1** | Performance de carregamento | Core < 2 MB (gzip). DS do projeto empacotado separadamente e carregado em paralelo no boot. |
| **RNF‑2** | Latência API | < 100ms (p95) em cenário de 100 entidades. |
| **RNF‑3** | Escala de entidades | Suporte a 50+ tipos customizados e milhares de registros sem degradação. |
| **RNF‑4** | Tipagem e validação | TypeScript strict mode. 100% de cobertura dos contratos de UI. >70% core coverage. |
| **RNF‑5** | Deploy | Helm chart básico. Compatível com qualquer cluster K8s. Uma instância = um deployment. |
| **RNF‑6** | Extensibilidade zero-touch | Nenhuma alteração no core para adicionar entidade, plugin ou trocar o DS do projeto. |
| **RNF‑7** | Padrão de tokens | Conformidade W3C DTCG. Compatibilidade nativa com Figma API, Style Dictionary, CSSOM. |
| **RNF‑8** | Resolução em Build-Time | DS do projeto é compilado junto com a app. Zero overhead de runtime para troca de tema ou componentes. |

---

### 5. Arquitetura Proposta

```
apps/
  app/               (Next.js/React, UIProvider, TokenInjector, PluginLoader)
  api/               (NestJS/Express, plugin router, entity CRUD)
libs/
  core/
    entity-engine/   (registro dinâmico, rotas, cliente API)
    ui-registry/     (ComponentResolver, useUI(), fallback chain, dev validation)
    token-bridge/    (W3C DTCG → CSS vars globais, bootstrap injection)
    plugin-loader/   (coleta dinâmica, registro de rotas, hot-reload dev)
  ui-contracts/      (schemas Zod para props mínimas, tipagem TS estrita)
  design-system-ref/ (apenas interfaces, zero implementação concreta)
ui-project/          (DS específico do projeto/deployment)
  tokens/            (W3C JSON)
  components/        (Button, Card, etc. implementando contratos)
  index.ts           (exporta { components, tokens, theme })
plugins/             (plugin-auth, plugin-ci, plugin-cloud, etc.)
skills/              (plopfile + templates v2.1)
tools/
  ui-validator-cli/  (valida contratos, tokens, acessibilidade em CI)
  sandbox/           (Storybook-like interno com DS do projeto + core)
```

**Stack Consolidada:**
- **Monorepo:** Nx + pnpm/Yarn Workspaces + strict workspace boundaries
- **Frontend:** React 18, React Router 6, Vite/Next.js
- **UI Contracts:** Zod + TypeScript strict
- **Tokens:** W3C DTCG JSON → CSS Variables nativas (`--devxp-*`)
- **Backend:** Node.js + NestJS/Express, PostgreSQL + JSONB, Prisma, AJV
- **Validação/CI:** `@devxp/ui-validator-cli` + axe-core + visual regression (Percy/Chromatic)
- **Geração:** Plop.js + Nx generators

---

### 6. Roadmap e Milestones

| Milestone | Descrição | Entregáveis |
|-----------|-----------|-------------|
| **M1 – Fundação & Contratos** | Setup monorepo, core libs, `ui-contracts`, `ui-registry` base. | `@devxp/core` funcional, registry com fallbacks, contratos Zod tipados. |
| **M2 – API CRUD Genérica** | Backend para entidades, relacionamentos, validação por schema. | Tabelas `entity`/`entity_relationship`, endpoints CRUD, validação AJV. |
| **M3 – Frontend Base + Token Bridge** | UI genérica (`EntityList`, `Form`, `Detail`), injeção de tokens W3C. | Componentes usando `useUI()`, `token-bridge` funcional, CSS vars globais. |
| **M4 – Plugins & DS Integration** | Carregador de plugins, integração do `ui-project/` no boot. | Plugin auth + home PoC, `UIProvider` configurado, zero colisão de deps. |
| **M5 – DX & Validação** | Sandbox, CLI de validação, visual regression, CI gates. | `ui-validator-cli`, sandbox integrado, baseline visual, PR checks. |
| **M6 – Skills v2.1** | Geradores para entidade, plugin e `ui-project/` completos. | Templates com contratos, tokens, `useUI()`, configuração Nx isolada. |
| **M7 – Demo Completo** | Instância funcional com DS customizado, documentação, guia de onboarding. | Deploy K8s funcional, runbook, arquitetura de referência. |

---

### 7. Critérios de Aceitação

**UI Registry & Contratos:**
- `useUI().resolve('Button')` retorna componente válido ou fallback seguro.
- Em `dev`, props inválidas geram warning claro com diff de contrato.
- CLI `npx @devxp/validate-ui` bloqueia merge se >3 contratos críticos falharem.

**Design Tokens & Theming:**
- Trocar `ui-project/tokens.json` reflete em todos os componentes core/plugins após rebuild.
- Variáveis CSS globais: `--devxp-primary`, `--devxp-spacing-md`, etc. Nenhuma sobreposição ou scoping complexo.
- Projeto pode usar MUI, Radix, Chakra ou componentes vanilla; todos mapeiam para os contratos.

**Plugins & Skills:**
- Adicionar plugin em `/plugins` registra rotas e tabs sem rebuild do core.
- `yarn skill:init-ds` gera `ui-project/` pronto, com `contracts.ts`, `tokens.json` e build config.
- Componente gerado usa `useUI().resolve()` e importa zero libs visuais do core.

**Performance & Segurança:**
- Core bundle < 2 MB gzip. DS do projeto carregado em paralelo no `<head>`/boot.
- RBAC preparado, sessão válida por instância, endpoints marcados `public/private`.

---

### 8. Considerações para Implementação / Agente de IA

1. **Contract-First:** Nunca implemente um componente core sem definir seu contrato primeiro. Use `ui-contracts` como fonte única de verdade.
2. **Token Standard:** Todos os estilos devem usar `var(--devxp-*)`. Evite hardcode de cores/espaçamentos.
3. **Strict Boundaries:** `@devxp/core` nunca importa `@mui`, `@radix`, `tailwind`, etc. Apenas interfaces e contratos.
4. **Validation in CI:** Integre `ui-validator-cli` no pipeline. Falha em contrato crítico = bloqueio de merge.
5. **DX over Magic:** Prefira scaffolding explícito (`skill:init-ds`) a injeção mágica em runtime. Transparência > automação obscura.
6. **Testes:** Unitários para registry/token-bridge. E2E para fluxo CRUD. Visual regression por release.

---

📎 **Anexo Técnico (Referência Rápida)**
```ts
// ui-project/index.ts (DS do projeto)
export const components = {
  Button: ProjectButton,
  Card: ProjectCard,
  Input: ProjectInput,
  // ... implementa contratos de @devxp/ui-contracts
};
export const tokens = { /* W3C DTCG */ };
export const theme = { mode: 'light', fontFamily: 'Inter' };

// Consumo seguro em qualquer plugin ou entidade
import { useUI } from '@devxp/core/ui-registry';

export const TenantDashboard = () => {
  const { resolve } = useUI();
  const Button = resolve('Button');
  const Card = resolve('Card');

  return (
    <Card>
      <Button variant="primary" onClick={handleClick}>Ação</Button>
    </Card>
  );
};
```
