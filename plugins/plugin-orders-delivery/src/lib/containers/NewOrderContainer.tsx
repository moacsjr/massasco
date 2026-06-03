'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useNewOrderData } from '../hooks/useNewOrderData';
import { NewOrderView } from '../views/NewOrderView';

interface ContainerProps {
  // Props podem ser adicionadas aqui no futuro se necessário
}

export const NewOrderContainer = ({}: ContainerProps) => {
  const router = useRouter();
  const {
    step,
    setStep,
    selectedProduct,
    setSelectedProduct,
    cart,
    setCart,
    tableNumber,
    setTableNumber,
    categories,
    products,
    isLoading,
    error,
    refetch,
    handleSelectProduct,
    handleAddToCart,
    handleSubmitOrder,
    handleCancel,
    handleBackToList,
  } = useNewOrderData();

  // Tratamento de erro isolado do componente visual principal
  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200">
        Erro ao carregar o cardápio. Por favor, tente novamente.
      </div>
    );
  }

  // Orquestra e injeta as propriedades na View Pura
  return (
    <NewOrderView
      step={step}
      setStep={setStep}
      selectedProduct={selectedProduct}
      setSelectedProduct={setSelectedProduct}
      cart={cart}
      setCart={setCart}
      tableNumber={tableNumber}
      setTableNumber={setTableNumber}
      categories={categories}
      products={products}
      isLoading={isLoading}
      refetch={refetch}
      handleSelectProduct={handleSelectProduct}
      handleAddToCart={handleAddToCart}
      handleSubmitOrder={handleSubmitOrder}
      handleCancel={handleCancel}
      handleBackToList={handleBackToList}
    />
  );
};

export default NewOrderContainer;
