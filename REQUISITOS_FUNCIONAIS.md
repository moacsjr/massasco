# DevXP Portal — Requisitos Funcionais

> Documento gerado em 2026-05-14 com base em engenharia reversa do código fonte.

---

## RF01 — Sistema de Plugins e Extensibilidade

**Descrição:** O portal deve suportar registro, carregamento e composição dinâmica de plugins (feature e service).

| # | Requisito | Detalhe |
|---|---|---|
| RF01.01 | Registrar plugins estaticamente | Plugins feature e service são registrados em `plugins-registry.ts` via `pluginLoader.register()` |
| RF01.02 | Roteamento dinâmico por plugin | URL `/plugins/<id>/<path>` resolve para o componente do plugin registrado, suportando segmentos dinâmicos (`:id`) |
| RF01.03 | Extension Points | Plugins definem slots de UI nomeados que outros plugins podem contribuir (ex: `main-template:left-menu`, `menubar:items`) |
| RF01.04 | Resolução de componentes UI via tokens | Componentes UI são resolvidos via `useUI().resolve('Card')` com fallbacks nativos se não houver implementação registrada |
| RF01.05 | Validação de contratos UI em dev | No modo desenvolvimento, componentes resolvidos são validados contra schemas Zod |
| RF01.06 | Injeção de Design Tokens | Tokens W3C (`ui-project/tokens/tokens.json`) são convertidos em variáveis CSS (`--devxp-*`) injetadas no `<head>` |
| RF01.07 | Isolamento de erros por plugin | Cada componente plugin é renderizado dentro de um ErrorBoundary com fallback visual |

---

## RF02 — Gestão de Cardápio (Menu Catalog)

**Descrição:** O sistema deve permitir criar, editar e excluir categorias, produtos, preços e complementos do cardápio.

### RF02.01 — Categorias

| # | Requisito | Detalhe |
|---|---|---|
| RF02.01.01 | Listar categorias | API `GET /api/categories` retorna categorias ordenadas alfabeticamente |
| RF02.01.02 | Criar categoria | API `POST /api/categories` com `name` (obrigatório) e `description` (opcional) |
| RF02.01.03 | Editar categoria | API `PUT /api/categories/[id]` atualiza todos os campos |
| RF02.01.04 | Excluir categoria | API `DELETE /api/categories/[id]` remove a categoria (cascade nos produtos) |
| RF02.01.05 | UI de listagem | Tela exibe cards de categoria com nome e descrição |
| RF02.01.06 | UI de criação/edição | Formulário com campos name e description |

### RF02.02 — Produtos

| # | Requisito | Detalhe |
|---|---|---|
| RF02.02.01 | Listar produtos | API `GET /api/products` retorna produtos, opcionalmente filtrados por `?categoryId=` |
| RF02.02.02 | Criar produto com preços e complementos | API `POST /api/products` aceita `prices[]` e `complements[]` em transação única |
| RF02.02.03 | Editar produto | API `PUT /api/products/[id]` substitui produto, preços e complementos |
| RF02.02.04 | Excluir produto | API `DELETE /api/products/[id]` remove o produto |
| RF02.02.05 | UI de listagem | Tabela de produtos com nome, categoria, preços |
| RF02.02.06 | UI de criação/edição | Formulário com name, description, categoryId + sub-formulários para preços e complementos |

### RF02.03 — Preços de Produto

| # | Requisito | Detalhe |
|---|---|---|
| RF02.03.01 | Múltiplos preços por produto | Um produto pode ter várias variantes de preço (ex: P, M, G) |
| RF02.03.02 | Cada preço tem descrição e valor | Campo `description` (ex: "Porção Individual") e `value` (Decimal 10,2) |
| RF02.03.03 | CRUD independente de preços | APIs `GET/POST /api/prices` e `GET/PUT/DELETE /api/prices/[id]` |

### RF02.04 — Complementos de Produto

| # | Requisito | Detalhe |
|---|---|---|
| RF02.04.01 | Complementos agrupados por grupo | Campo `group` permite agrupar complementos (ex: "Bebidas", "Molhos") |
| RF02.04.02 | Cada complemento tem título e valor | Campo `title`, `description?` (opcional), `value` (Decimal 10,2, default 0) |
| RF02.04.03 | CRUD independente de complementos | APIs `GET/POST /api/complements` e `GET/PUT/DELETE /api/complements/[id]` |

---

## RF03 — Gestão de Pedidos (Orders)

**Descrição:** O sistema deve permitir criar pedidos, acompanhar seu status e gerenciar itens individualmente.

### RF03.01 — Criação de Pedido (Wizard)

| # | Requisito | Detalhe |
|---|---|---|
| RF03.01.01 | Acessar wizard via FAB | Botão flutuante (+) na tela de pedidos navega para `/plugins/orders-delivery/new` |
| RF03.01.02 | Step 1 — Selecionar produto | Lista produtos com busca por texto e filtro por categoria |
| RF03.01.03 | Step 2 — Configurar item | Exibe nome, descrição do produto; seleção obrigatória de 1 preço; seleção opcional de múltiplos complementos; campo de observações |
| RF03.01.04 | Step 3 — Resumo do pedido | Lista todos os itens adicionados com nome, preço selecionado, complementos, observações e quantidade |
| RF03.01.05 | Adicionar mais produtos | No resumo, botão retorna ao Step 1 sem perder itens já adicionados |
| RF03.01.06 | Cancelar pedido | Descarta todos os itens do carrinho e retorna à tela inicial |
| RF03.01.07 | Enviar pedido | POST `/api/orders` com todos os itens, redireciona para tela de pedidos |
| RF03.01.08 | Número da mesa | Campo configurável no wizard, padrão = 1 |
| RF03.01.09 | Indicador de progresso | Wizard exibe step indicator (1. Produtos → 2. Configurar Item → 3. Resumo) |
| RF03.01.10 | Contador de itens no carrinho | Badge mostra quantidade de itens quando fora do resumo |

### RF03.02 — Visualização de Pedidos

| # | Requisito | Detalhe |
|---|---|---|
| RF03.02.01 | Aba Pedidos Ativos | Exibe todos os pedidos abertos com seus itens, nome do produto, quantidade, preço selecionado, status |
| RF03.02.02 | Aba Para Entregar | Exibe itens com status `READY`, agrupados, com botão "Entregue" |
| RF03.02.03 | Badges de status | Itens exibem badge colorido: PENDING (cinza), PREPARING (amarelo), READY (verde) |
| RF03.02.04 | Atualização em tempo real | Tela escuta SSE (`ITEM_UPDATED`, `ORDER_CREATED`) e atualiza automaticamente |

### RF03.03 — Status de Pedido

| # | Requisito | Detalhe |
|---|---|---|
| RF03.03.01 | Status do Order | `OPEN`, `AWAITING_PAYMENT`, `PAID`, `CLOSED` |
| RF03.03.02 | Status do OrderItem | `PENDING`, `PREPARING`, `READY`, `DELIVERED`, `CANCELLED` |
| RF03.03.03 | Transição automática de timestamps | `sentAt` definido ao mudar para `READY`; `deliveredAt` ao mudar para `DELIVERED` |

### RF03.04 — Atualização de Itens

| # | Requisito | Detalhe |
|---|---|---|
| RF03.04.01 | Atualizar status do item | API `PATCH /api/order-items/[id]` aceita `status` e `notes` |
| RF03.04.02 | Publicar evento SSE | Após atualização, evento `ITEM_UPDATED` é publicado com `{ itemId, status, orderId }` |

---

## RF04 — Kitchen Display System (KDS)

**Descrição:** Painel de cozinha em tempo real para acompanhamento de preparo de pedidos.

| # | Requisito | Detalhe |
|---|---|---|
| RF04.01 | Coluna Pending | Exibe todos os itens com status `PENDING` |
| RF04.02 | Coluna Preparing | Exibe todos os itens com status `PREPARING` |
| RF04.03 | Iniciar preparo | Botão "Iniciar" muda status para `PREPARING` via `PATCH /api/order-items/[id]` |
| RF04.04 | Marcar como pronto | Botão "Pronto" muda status para `READY` via `PATCH /api/order-items/[id]` |
| RF04.05 | Atualização em tempo real | Painel escuta SSE (`ITEM_UPDATED`, `ORDER_CREATED`) e atualiza colunas automaticamente |
| RF04.06 | Exibir número da mesa | Cada card de item mostra "Mesa X" |
| RF04.07 | Exibir notas do item | Notas do item são exibidas abaixo do nome |

---

## RF05 — Pagamentos

**Descrição:** O sistema deve permitir registrar pagamentos contra pedidos, suportando múltiplas formas de pagamento e pagamentos parciais.

| # | Requisito | Detalhe |
|---|---|---|
| RF05.01 | Listar pedidos abertos | Exibe pedidos com status `OPEN` ou `AWAITING_PAYMENT` com total calculado |
| RF05.02 | Cálculo do total | Total = soma de (preço selecionado + complementos) × quantidade para cada item |
| RF05.03 | Detalhamento do pedido | Ao selecionar pedido, exibe lista de itens com nome, quantidade e preço individual |
| RF05.04 | Exibir valores pago/restante | Mostra total, valor já pago e valor restante |
| RF05.05 | Formas de pagamento | Suporta: Dinheiro (💵), Cartão (💳), Pix (📱) |
| RF05.06 | Registrar pagamento | API `POST /api/payments` com `orderId`, `amount`, `method` |
| RF05.07 | Pagamento total automático | Se valor pago ≥ total, status do pedido muda para `PAID` automaticamente |
| RF05.08 | Pagamentos parciais | Permite múltiplos pagamentos parciais contra o mesmo pedido |
| RF05.09 | Indicador visual de pedido pago | Exibe badge verde "✅ Pedido Pago" quando `remaining <= 0` |
| RF05.10 | Evento SSE de fechamento | `ORDER_CLOSED` quando pago integralmente; `PARTIAL_PAYMENT_ACCEPTED` quando parcial |

---

## RF06 — Autenticação e Perfil

| # | Requisito | Detalhe |
|---|---|---|
| RF06.01 | Página de perfil | Rota `/plugins/auth/profile` exibe card com informações do usuário |

---

## RF07 — Gestão de Usuários

| # | Requisito | Detalhe |
|---|---|---|
| RF07.01 | Listar usuários | Tela `/plugins/user-management/` lista usuários via `UserServiceAPI` |
| RF07.02 | Link no menu | Contribui link "User Management" ao menubar via `menubar:items` |

---

## RF08 — Navegação e Layout

| # | Requisito | Detalhe |
|---|---|---|
| RF08.01 | Layout principal | Header (menubar), nav rail esquerda/direita, área de conteúdo (4 slots), footer (3 slots) |
| RF08.02 | Menu de navegação auto-gerado | Plugin `menu-nav-bar` varre todos os feature plugins e gera entradas de navegação automaticamente |
| RF08.03 | Menu drawer | Drawer deslizante pela esquerda com overlay, fecha com ESC ou clique fora |
| RF08.04 | Menubar superior | Barra de menu no header com slot para plugins contribuírem itens |

---

## RF09 — Auditoria (Audit Log)

| # | Requisito | Detalhe |
|---|---|---|
| RF09.01 | Registrar eventos de auditoria | API `POST /api/audit` com `module`, `eventType`, `payload` (Json) |
| RF09.02 | Listar logs de auditoria | API `GET /api/audit` com filtros `?module=`, `?eventType=`, limite de 100 registros |
| RF09.03 | Serviço de auditoria | Plugin `audit` fornece `AuditAPI.log()` e `AuditAPI.getLogs()` para outros plugins |

---

## RF10 — Eventos em Tempo Real (SSE)

| # | Requisito | Detalhe |
|---|---|---|
| RF10.01 | Endpoint SSE | `GET /api/events` serve stream `text/event-stream` com heartbeat de 30s |
| RF10.02 | Eventos publicados | `ORDER_CREATED`, `ORDER_UPDATED`, `ORDER_CLOSED`, `ITEM_UPDATED`, `PARTIAL_PAYMENT_ACCEPTED` |
| RF10.03 | Bus in-memory | SSEBus usa `globalThis` para sobreviver hot reload do Next.js |
| RF10.04 | Consumidores | KDS e Orders-Delivery escutam eventos e atualizam UI automaticamente |

---

## RF11 — UI Components e Design System

| # | Requisito | Detalhe |
|---|---|---|
| RF11.01 | Componentes base | Button (primary/secondary/outline, sm/md/lg), Card, Input, Icon, Drawer, Tabs |
| RF11.02 | Tokens de design | Cores (--devxp-color-primary, --devxp-color-secondary), espaçamento (--devxp-spacing-*), tipografia |
| RF11.03 | Fallbacks nativos | Se componente não estiver registrado, usa fallback HTML estilizado |
| RF11.04 | Ícones Lucide | Resolvidos por nome; fallback para emoji se não encontrado |

---

## RF12 — Reset de Dados (Testes)

| # | Requisito | Detalhe |
|---|---|---|
| RF12.01 | Endpoint de reset | `POST /api/test/reset` deleta todas as tabelas em ordem (payments → orderItems → orders → products → categories → auditLogs) |

---

## Regras de Negócio

| # | Regra | Detalhe |
|---|---|---|
| RN01 | Validação de produto na criação | Ao criar pedido, todos os `productId` devem existir no banco. Retorna 400 com `missingIds` se não existirem |
| RN02 | Preço obrigatório no item | No wizard, o usuário deve selecionar exatamente 1 preço antes de adicionar ao carrinho |
| RN03 | Complementos opcionais | Complementos são opcionais e podem ser múltiplos, de grupos diferentes |
| RN04 | Pagamento parcial permitido | Um pedido pode receber múltiplos pagamentos parciais até atingir o total |
| RN05 | Status PAID automático | Quando o total pago >= total do pedido, o status muda automaticamente para `PAID` |
| RN06 | Cascade na exclusão | Deletar uma categoria deleta todos os seus produtos (onDelete: Cascade) |
| RN07 | Cascade no cancelamento | Deletar um pedido deleta todos os seus itens e pagamentos (onDelete: Cascade) |
| RN08 | Timestamps automáticos | `sentAt` é preenchido automaticamente quando item muda para `READY`; `deliveredAt` quando muda para `DELIVERED` |

---

## Modelos de Dados

### Category
```
id: uuid (PK)
name: string
description?: string
createdAt: datetime
```

### Product
```
id: uuid (PK)
name: string
description?: string
categoryId: uuid (FK → Category)
createdAt: datetime
```

### ProductPrice
```
id: uuid (PK)
productId: uuid (FK → Product)
description: string
value: Decimal(10,2)
createdAt: datetime
```

### ProductComplement
```
id: uuid (PK)
productId: uuid (FK → Product)
group: string
title: string
description?: string
value: Decimal(10,2) [default: 0]
createdAt: datetime
```

### Order
```
id: uuid (PK)
tableNumber: int
status: enum(OPEN, AWAITING_PAYMENT, PAID, CLOSED)
createdAt: datetime
updatedAt: datetime
```

### OrderItem
```
id: uuid (PK)
orderId: uuid (FK → Order)
productId: uuid (FK → Product)
quantity: int [default: 1]
notes?: string
status: enum(PENDING, PREPARING, READY, DELIVERED, CANCELLED)
selectedPriceId?: uuid (FK → ProductPrice)
selectedComplements?: Json [{id, title, value}]
sentAt?: datetime
deliveredAt?: datetime
createdAt: datetime
```

### Payment
```
id: uuid (PK)
orderId: uuid (FK → Order)
amount: Decimal(10,2)
method: enum(cash, card, pix)
createdAt: datetime
```

### AuditLog
```
id: uuid (PK)
module: string
eventType: string
payload: Json
createdAt: datetime
```
