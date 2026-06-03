'use client';

import React from 'react';
import { useOrdersDeliveryData } from '../hooks/useOrdersDeliveryData';
import { OrdersDeliveryView } from '../views/OrdersDeliveryView';

interface ContainerProps {
  // Props podem ser adicionadas aqui no futuro se necessário
}

export const OrdersDeliveryContainer = ({}: ContainerProps) => {
  const {
    activeOrders,
    readyItems,
    activeTab,
    setActiveTab,
    isLoading,
    error,
    refetch,
    markDelivered,
  } = useOrdersDeliveryData();

  // Tratamento de erro isolado do componente visual principal
  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200">
        Erro ao carregar os pedidos. Por favor, tente novamente.
      </div>
    );
  }

  // Orquestra e injeta as propriedades na View Pura
  return (
    <OrdersDeliveryView
      activeOrders={activeOrders}
      readyItems={readyItems}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      isLoading={isLoading}
      refetch={refetch}
      markDelivered={markDelivered}
    />
  );
};

export default OrdersDeliveryContainer;
