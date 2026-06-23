# Estratégia Técnica

**Abordagem Arquitetural**:
- Implementação como nova feature no monorepo Nx
- Backend: Novo endpoint NestJS para cálculo de divisão
- Frontend: Componente Modal React com integração via Next.js API routes
- Banco: Utilização do schema existente com consultas otimizadas
- Segurança: Validação JWT com restrição por role MANAGER

**Decisões-Chave**:
1. Cálculo no backend para garantir precisão no arredondamento
2. Validação de permissão no endpoint antes do processamento
3. Consulta única ao banco para obter dados necessários
4. Componente modal reutilizável com acessibilidade

**Matriz de Rastreabilidade**:

| Critério de Aceite | Componente Técnico |
|--------------------|-------------------|
| Divisão bem-sucedida com valores inteiros | Endpoint POST /api/tables/{id}/split-bill, SplitBillModal |
| Divisão com arredondamento bancário | Serviço SplitCalculatorService, função applyBankersRounding |
| Tentativa com conta não fechada | Validação OrderStatus.CLOSED, handler OrderNotClosedException |
| Tentativa sem participantes | Validação participantsCount > 0, handler NoActiveParticipantsException |

# Detalhamento da Implementação

## Backend
- **Novo Endpoint**:  
  `POST /api/tables/{tableId}/split-bill`  
  - Validações:  
    ```typescript
    // SplitBillRequestDto
    {
      tableId: string @PrimaryKey
    }
    ```
  - Fluxo:  
    1. Verificar role do usuário = MANAGER  
    2. Validar status da conta = FECHADA (OrderStatus.CLOSED)  
    3. Obter participantes ativos (checkins sem payment_id)  
    4. Calcular divisão com arredondamento bancário  
    5. Retornar:  
    ```typescript
    // SplitBillResponseDto
    {
      total: number,
      participantsCount: number,
      amountPerParticipant: number,
      amounts: number[] // Array com valores individuais
    }
    ```

- **Novo Serviço**: `SplitCalculatorService`  
  Método: `calculateSplit(total: number, count: number): number[]`  
  Implementa arredondamento bancário com precisão de centavos

- **Tratamento de Erros**:  
  - OrderNotClosedException (HTTP 400): "Divisão disponível apenas para contas fechadas"  
  - NoActiveParticipantsException (HTTP 400): "Não é possível dividir: nenhum participante ativo na mesa"  
  - InvalidTotalException (HTTP 400): "Conta com valor zerado – divisão não aplicável"

## Banco de Dados
- **Consulta Otimizada**:
  ```prisma
  const data = await prisma.$queryRaw`
    SELECT 
      o.total,
      COUNT(c.id)::int AS participants_count
    FROM orders o
    JOIN tables t ON o.table_id = t.id
    LEFT JOIN checkins c ON c.table_id = t.id AND c.payment_id IS NULL
    WHERE 
      t.id = ${tableId}
      AND o.status = 'CLOSED'
    GROUP BY o.total
  `;
  ```
- **Índice Adicional**:  
  `CREATE INDEX idx_checkins_active ON checkins (table_id) WHERE payment_id IS NULL;`

## Frontend
- **Novo Componente**: `SplitBillModal`  
  Local: `apps/frontend/components/orders/SplitBillModal.tsx`  
  Props:  
  ```typescript
  {
    tableId: string;
    orderTotal: number;
    onClose: () => void;
  }
  ```
  
- **Integração**:
  - Botão "Dividir Conta Igualmente" condicional:  
    `libs/shared/src/utils/checkPermission.ts` (valida role MANAGER)
  - Chamada API via `useSWRMutation('/api/split-bill')`
  
- **UI Especificações**:
  - Valor total em **negrito** (`<strong>`)
  - Ícone R$ com `lucide-react`
  - Tooltip de arredondamento com Radix `Tooltip`

## Infraestrutura
- **Nenhuma alteração necessária**
- Utilização da infra Docker existente
- Monitoramento via métricas existentes do NestJS

# Segurança e Conformidade

- **Controle de Acesso**:
  - Validação JWT em todas as requisições
  - RBAC: Restrição ao role MANAGER no endpoint
  - Frontend: Oculta botão para não-MANAGER via `checkPermission`

- **Proteção de Dados**:
  - Validação de ownership: Usuário deve ser hoster da mesa
  - Sanitização de inputs: Zod para validação de tableId

- **Conformidade Financeira**:
  - Implementação rigorosa do arredondamento bancário
  - Testes com valores limítrofes (0.005 arredonda para cima)

# Estratégia de Testes

## Testes Unitários
- **Serviço de Cálculo** (Jest):  
  ```typescript
  describe('SplitCalculatorService', () => {
    it('divide 200 por 4 participantes', () => {
      expect(service.calculateSplit(200, 4)).toEqual([50, 50, 50, 50]);
    });
    
    it('aplica arredondamento bancário em 100/3', () => {
      expect(service.calculateSplit(100, 3)).toEqual([33.33, 33.33, 33.34]);
    });
  });
  ```

- **Validações de Endpoint**:
  - Teste de permissão (role não-MANAGER retorna 403)
  - Teste de status da conta (ABERTA retorna 400)

## Testes de Integração
- **Cenário Completo** (NestJS TestingModule):
  ```typescript
  it('fluxo feliz com dados válidos', async () => {
    const response = await request(app)
      .post(`/tables/${tableId}/split-bill`)
      .set('Authorization', 'Bearer MANAGER_TOKEN');
    
    expect(response.status).toBe(200);
    expect(response.body.amounts).toHaveLength(3);
  });
  ```

## Testes E2E
- **Cenários Gherkin** (Playwright):
  ```typescript
  test('exibe valores com arredondamento', async ({ page }) => {
    await page.click('button:has-text("Dividir Conta Igualmente")');
    await expect(page.locator('text=R$33.33')).toHaveCount(2);
    await expect(page.locator('text=R$33.34')).toHaveCount(1);
  });
  
  test('bloqueia divisão para conta aberta', async ({ page }) => {
    await page.click('button:has-text("Dividir Conta Igualmente")');
    await expect(page.locator('text="Divisão disponível apenas para contas fechadas"')).toBeVisible();
  });
  ```

# Rollback e Monitoramento

**Plano de Rollback**:
1. Reversão imediata do deploy via rollback do container Docker
2. Remoção do endpoint `/api/tables/{id}/split-bill`
3. Reversão do componente frontend via feature flag

**Métricas Observadas**:
- `split_calculation_time` (histogram): Tempo de processamento
- `split_requests_total` (counter): Requisições por status
- `split_participants_count` (gauge): Média de participantes

**Alertas**:
- CRITICAL: `split_calculation_time > 2s` por mais de 5 minutos
- WARNING: Taxa de erro 4xx > 10% nas últimas 100 requisições
- CRITICAL: Disponibilidade do endpoint < 99% em 15 minutos