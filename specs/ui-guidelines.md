
## 📝 SPEC V3: Guidelines de Implementação (Container, Skeletons e Custom Hooks)## 🎯 Objetivo
Instruir a IA a gerar componentes React (TypeScript + Tailwind CSS) altamente performáticos, utilizando a separação estrita de responsabilidades: Custom Hooks (gerenciamento de dados), Container Components (orquestração de estados) e Presentational Components (renderização visual estável com Skeletons animados integrados, garantindo CLS Zero).
------------------------------
## 🏗️ 1. A Tríade de Arquitetura (Fluxo de Trabalho da IA)
Para qualquer feature ou tela solicitada, a IA deve obrigatoriamente gerar três artefatos conectados:

[ Custom Hook ] ──(retorna data, isLoading, error)──> [ Container Component ] ──(injeta props)──> [ Presentational Component ]


   1. use[Feature]Data (Custom Hook): Único responsável por chamadas de API, cache, mutações e estados nativos de carregamento.
   2. [Feature]Container (Container Component): Componente lógico que consome o Hook. Ele decide se renderiza o estado de erro, se injeta os dados reais ou se ativa o modo isLoading. Ele não possui classes de estilo Tailwind (CSS).
   3. [Feature]View (Presentational Component): Componente visual puro. Recebe isLoading e os dados processados. Ele é o único responsável pelo layout Tailwind e por espelhar perfeitamente a estrutura dos Skeletons.

------------------------------
## 🛠️ 2. Diretrizes Técnicas para a IA## Regras do Custom Hook:

* Deve retornar um objeto contendo necessariamente { data, isLoading, error, refetch }.
* Deve ser fortemente tipado usando Generics ou Interfaces do TypeScript.
* Deve encapsular toda a lógica de tratamento de dados (ex: formatação de moedas ou datas) para que a View receba os dados prontos para exibição.

## Regras do Skeleton & CLS Zero (Apresentação):

* Identidade de Estrutura: A estrutura de divs, paddings (p-*), gaps (gap-*) e bordas deve ser idêntica no estado de esqueleto e no estado de dados.
* Animação: Aplicar animate-pulse junto com fundos neutros (bg-gray-200 dark:bg-gray-700).

------------------------------
## 💻 3. Código Padrão Esperado (Template de Referência para a IA)
Abaixo está o padrão exato de código que a IA deve replicar ao implementar uma feature (exemplo: OrderDetails).
## Passo 1: O Custom Hook (useOrderDetails.ts)

import { useState, useEffect } from 'react';
export interface OrderData {
  id: string;
  total: string;
  customerName: string;
}
// Hook isola a lógica de negócio e o estado de loading do ciclo de vida da UIexport const useOrderDetails = (orderId: string) => {
  const [data, setData] = useState<OrderData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setIsLoading(true);
    // Simulação de Fetching de API (Poderia ser substituído por Axios/React Query)
    const fetchData = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setData({ id: orderId, total: "R$ 350,00", customerName: "Carlos Silva" });
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [orderId]);

  return { data, isLoading, error };
};

## Passo 2: O Container Component (OrderDetailsContainer.tsx)

import React from 'react';import { useOrderDetails } from './useOrderDetails';import { OrderDetailsView } from './OrderDetailsView';
interface ContainerProps {
  orderId: string;
}
export const OrderDetailsContainer = ({ orderId }: ContainerProps) => {
  // Consome o hook customizado
  const { data, isLoading, error } = useOrderDetails(orderId);

  // Tratamento de erro isolado do componente visual principal
  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200">
        Erro ao carregar os detalhes do pedido. Por favor, tente novamente.
      </div>
    );
  }

  // Orquestra e injeta as propriedades na View Pura
  return (
    <OrderDetailsView 
      isLoading={isLoading} 
      orderId={data?.id} 
      total={data?.total} 
      customerName={data?.customerName} 
    />
  );
};

## Passo 3: O Presentational Component (OrderDetailsView.tsx)

import React from 'react';
interface OrderDetailsViewProps {
  isLoading?: boolean;
  orderId?: string;
  total?: string;
  customerName?: string;
}
export const OrderDetailsView = ({
  isLoading = false,
  orderId,
  total,
  customerName,
}: OrderDetailsViewProps) => {
  
  // Wrapper imutável: garante que a caixa externa nunca mude de tamanho ou estilo
  const cardWrapperClasses = "bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between h-48 w-full";

  // RENDER ESTADO: SKELETON (Mapeamento 1:1 com o DOM real)
  if (isLoading) {
    return (
      <div className={`${cardWrapperClasses} animate-pulse`}>
        <div className="space-y-3">
          {/* Esqueleto do ID do Pedido */}
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
          {/* Esqueleto do Nome do Cliente */}
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        </div>
        {/* Esqueleto do Preço Total */}
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 self-end" />
      </div>
    );
  }

  // RENDER ESTADO: PRONTO / SUCESSO
  return (
    <div className={cardWrapperClasses}>
      <div className="space-y-1">
        <span className="text-xs font-semibold text-gray-400 dark:text-gray-500">Pedido #{orderId}</span>
        <h3 className="text-lg font-bold text-gray-800 dark:text-white">{customerName}</h3>
      </div>
      <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 self-end">
        {total}
      </div>
    </div>
  );
};

------------------------------
## 🚨 4. Critérios de Rejeição de Código (Prompt Guard)
A IA terá falhado se:

   1. 🚫 Colocar lógica de fetch, useEffect ou useState de dados dentro do arquivo View.
   2. 🚫 Deixar de espelhar as classes estruturais de alinhamento de layout (ex: usar flex flex-col justify-between na View de sucesso e esquecer de pôr no esqueleto).
   3. 🚫 Criar um hook dentro do Container em vez de exportá-lo como um arquivo de Custom Hook limpo e testável.

