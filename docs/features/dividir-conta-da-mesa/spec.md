# Visão Geral
- **Objetivo**: Permitir que o hoster de uma mesa divida o valor total da conta igualmente entre os participantes, exibindo o valor individual a ser pago por cada um.
- **Personas**:  
  - Hoster da Mesa: Usuário responsável por gerenciar a mesa, com permissão para acionar a divisão da conta.
- **Critérios de Sucesso**:  
  - 100% dos hosters conseguem localizar e acionar a função de divisão igualitária.  
  - O cálculo do valor por participante é realizado em até 2 segundos.  
  - Redução em 30% do tempo manual gasto para divisões de conta.

# Regras de Negócio
1. A divisão só pode ser iniciada pelo hoster da mesa.  
2. Todos os participantes ativos na mesa são incluídos no cálculo.  
3. O valor total da conta é dividido igualmente pelo número de participantes.  
4. Caso a divisão resulte em fração de centavo:  
   - Valores são arredondados para 2 casas decimais seguindo padrão bancário (0.005+ arredonda para cima).  
5. A conta deve estar no status **FECHADA** para permitir divisão.  
6. [TODO: requer esclarecimento do PO] Como lidar com participantes removidos após fechamento da conta?  

# Fluxos
## Fluxo Principal (Happy Path)
1. Hoster acessa detalhes da conta fechada.  
2. Clica em "Dividir Conta Igualmente".  
3. Sistema valida: conta fechada + participantes ≥ 1.  
4. Calcula: `Valor por participante = Valor total da conta / Nº de participantes`.  
5. Exibe modal com:  
   - Valor total da conta.  
   - Número de participantes.  
   - Valor individual para cada participante.  

## Fluxos Alternativos
- **Divisão com arredondamento**:  
  Se `Valor total = R$100,00` e `Participantes = 3` → `R$33,33` para dois participantes e `R$33,34` para um.  

## Cenários de Erro
- **Conta não fechada**:  
  Exibe alerta: "Divisão disponível apenas para contas fechadas."  
- **Zero participantes**:  
  Exibe alerta: "Não é possível dividir: nenhum participante ativo na mesa."  
- **Valor total zero**:  
  Exibe alerta: "Conta com valor zerado – divisão não aplicável."  

# Critérios de Aceite
```gherkin
Funcionalidade: Divisão Igualitária de Conta
  Cenário: Divisão bem-sucedida com valores inteiros
    Dado que a conta fechada tem valor total R$200,00
    E existem 4 participantes ativos na mesa
    Quando o hoster aciona "Dividir Conta Igualmente"
    Então o sistema exibe "Valor por participante: R$50,00"

  Cenário: Divisão com arredondamento bancário
    Dado que a conta fechada tem valor total R$100,00
    E existem 3 participantes ativos
    Quando o hoster aciona "Dividir Conta Igualmente"
    Então o sistema exibe dois participantes com "R$33,33" e um com "R$33,34"

  Cenário: Tentativa com conta não fechada
    Dado que a conta está com status "ABERTA"
    Quando o hoster tenta acionar "Dividir Conta Igualmente"
    Então o sistema exibe alerta "Divisão disponível apenas para contas fechadas."

  Cenário: Tentativa sem participantes
    Dado que a conta fechada tem valor total R$150,00
    E não há participantes ativos na mesa
    Quando o hoster tenta acionar a divisão
    Então o sistema exibe alerta "Não é possível dividir: nenhum participante ativo na mesa."
```

# Dependências
### Internas
- Módulo de Gestão de Mesas: Fornece dados dos participantes ativos.  
- Módulo de Contas: Disponibiliza status e valor total da conta fechada.  
### Externas
- Nenhuma identificada.

# Requisitos Não-Funcionais
### Performance
- Cálculo e exibição dos valores em < 2 segundos sob carga de 500 solicitações simultâneas.  
### Segurança
- Acesso restrito ao hoster da mesa (validação de permissão no backend).  
### Usabilidade
- Exibição clara dos valores no modal:  
  - Valor total em **negrito**.  
  - Valor individual por participante com ícone de "R$".  
  - Tooltip explicando arredondamento bancário ao passar o mouse sobre valores decimais.