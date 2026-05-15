Perfeito. Unificar **Pedidos** e **Entregas** faz total sentido do ponto de vista de UX Mobile-First, pois o garçom utiliza a mesma interface para anotar o pedido e para acompanhar o que já pode ser levado à mesa.

Aqui está a **SPEC atualizada e modularizada**, com a unificação solicitada:

---

### 1. Módulo Core (Orquestrador & SSE)

O alicerce do sistema. Gerencia a persistência global e a distribuição de eventos em tempo real.

* **Domínio:** Prisma Client, Migrations, Event Bus.
* **SSE Manager:** Gerencia o stream `/api/events`. Expõe o método `publish(event_type, payload)` para os outros plugins.

---

### 2. Módulo de Cardápio (Menu Plugin)

Responsável pelo catálogo de produtos que alimenta o fluxo de pedidos.

* **Responsabilidades:** CRUD de produtos, categorias, preços e fotos.
* **Data Structure:** Fornece a lista de `products` para o seletor do Garçom.

---

### 3. Módulo de Gestão de Pedidos (Orders & Delivery Plugin)

**Unificado.** Este é o plugin principal do garçom. Ele gerencia todo o ciclo de vida do item, desde a anotação até o momento em que ele toca a mesa.

* **Responsabilidades:**
* **Criação (Ordering):** Seleção de produtos, adição de observações e envio para a cozinha.
* **Acompanhamento (Tracking):** Escuta o SSE para saber quando a cozinha mudou o status para `READY`.
* **Confirmação (Delivery):** Interface para o garçom marcar o item como `DELIVERED` (entregue).


* **Interface UI:**
* **Aba "Carrinho":** Itens sendo anotados.
* **Aba "Ativos":** Itens em preparo.
* **Aba "Para Entregar":** Filtro dinâmico que destaca itens com status `READY` (alerta visual/vibrar).


* **Eventos:** `ORDER_CREATED`, `ITEM_SENT`, `ITEM_DELIVERED`.

---

### 4. Módulo de Produção (KDS Plugin)

O espelho da cozinha. Recebe o que o plugin de Pedidos envia.

* **Responsabilidades:**
* Exibir fila de produção (`PENDING` -> `PREPARING`).
* Sinalizar conclusão (`READY`).


* **Gatilho SSE:** Ao clicar em "Pronto", dispara o evento que o módulo de **Pedidos** está escutando para notificar o garçom.

---

### 5. Módulo Financeiro (Payments Plugin)

Responsável pelo encerramento da jornada do cliente.

* **Responsabilidades:**
* Cálculo de conta e taxas.
* **Checkout Parcial:** Registro de múltiplos pagamentos para o mesmo `orderId`.
* **Encerramento:** Bloqueia o módulo de Pedidos para novas adições quando o status é `AWAITING_PAYMENT` ou `PAID`.


* **Eventos:** `PARTIAL_PAYMENT_ACCEPTED`, `ORDER_CLOSED`.

---

### 6. Módulo de Auditoria (Audit Plugin)

Plugin de "background" para governança.

* **Responsabilidades:**
* Capturar logs de todos os plugins.
* Gerenciar permissões de cancelamento (ex: só permite cancelar um item `READY` se houver autorização via código).

---