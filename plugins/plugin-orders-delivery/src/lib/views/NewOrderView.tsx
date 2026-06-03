'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useUI } from '@temp-workspace/ui-registry';
import {
  ProductDTO,
  ProductPriceDTO,
  ProductComplementDTO,
  CategoryDTO,
} from '@temp-workspace/plugin-menu-catalog';
import { CartItem, WizardStep } from '../types';
import ProductListStep from '../components/ProductListStep';
import ProductDetailsStep from '../components/ProductDetailsStep';
import OrderSummaryStep from '../components/OrderSummaryStep';

export interface NewOrderViewProps {
  step: WizardStep;
  setStep: (step: WizardStep) => void;
  selectedProduct: ProductDTO | null;
  setSelectedProduct: (product: ProductDTO | null) => void;
  cart: CartItem[];
  setCart: (cart: CartItem[]) => void;
  tableNumber: number;
  setTableNumber: (num: number) => void;
  categories: CategoryDTO[];
  products: ProductDTO[];
  isLoading: boolean;
  refetch: () => void;
  handleSelectProduct: (product: ProductDTO) => void;
  handleAddToCart: (
    price: ProductPriceDTO,
    complements: ProductComplementDTO[],
    notes: string
  ) => void;
  handleSubmitOrder: () => Promise<void>;
  handleCancel: () => void;
  handleBackToList: () => void;
}

export const NewOrderView = ({
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
  refetch,
  handleSelectProduct,
  handleAddToCart,
  handleSubmitOrder,
  handleCancel,
  handleBackToList,
}: NewOrderViewProps) => {
  const { resolve } = useUI();
  const Card = resolve('Card');
  const router = useRouter();

  // Wrapper imutável: garante que a caixa externa nunca mude de tamanho ou estilo
  const cardWrapperClasses =
    'bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm';

  // RENDER ESTADO: SKELETON (Mapeamento 1:1 com o DOM real)
  if (isLoading) {
    return (
      <div className="max-w-[900px]">
        <Card title="Novo Pedido" padding="lg">
          {/* Skeleton - Table Number */}
          <div className="mb-4 flex items-center gap-2">
            <div className="font-semibold text-foreground">Mesa:</div>
            <div className="w-[60px] h-9 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>

          {/* Skeleton - Step indicator */}
          <div className="flex gap-2 mb-6 items-center">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
            ))}
          </div>

          {/* Skeleton - Product list */}
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  const stepLabels: Record<WizardStep, string> = {
    'product-list': 'Produtos',
    'product-details': 'Item',
    'order-summary': 'Resumo',
  };

  const stepKeys: WizardStep[] = [
    'product-list',
    'product-details',
    'order-summary',
  ];

  return (
    <div className="max-w-[900px]">
      <Card title="Novo Pedido" padding="lg">
        {/* Table number */}
        <div className="mb-4 flex items-center gap-2">
          <label className="font-semibold text-foreground">Mesa:</label>
          <input
            type="number"
            value={tableNumber}
            onChange={(e) => setTableNumber(Number(e.target.value))}
            min={1}
            className="
              w-[60px] px-2 py-1 border border-border rounded
              bg-card text-foreground text-sm
              focus:outline-none focus:ring-2 focus:ring-brand
            "
          />
        </div>

        {/* Step indicator */}
        <div className="flex gap-2 mb-6 items-center">
          {stepKeys.map((s, i, arr) => (
            <React.Fragment key={s}>
              <div
                className={`
                  px-3 py-1 rounded-full text-xs font-medium transition-colors
                  ${
                    step === s
                      ? 'bg-brand text-black font-semibold'
                      : 'bg-secondary text-muted-foreground'
                  }
                `}
              >
                {i + 1}. {stepLabels[s]}
              </div>
              {i < arr.length - 1 && <span className="text-border">→</span>}
            </React.Fragment>
          ))}
          {cart.length > 0 && step !== 'order-summary' && (
            <span className="ml-auto text-xs text-muted-foreground">
              🛒 {cart.length} {cart.length === 1 ? 'item' : 'itens'}
            </span>
          )}
        </div>

        {/* Step content */}
        {step === 'product-list' && (
          <ProductListStep
            products={products}
            categories={categories}
            onSelectProduct={handleSelectProduct}
          />
        )}

        {step === 'product-details' && selectedProduct && (
          <ProductDetailsStep
            product={selectedProduct}
            onBack={handleBackToList}
            onAdd={handleAddToCart}
          />
        )}

        {step === 'order-summary' && (
          <OrderSummaryStep
            cart={cart}
            tableNumber={tableNumber}
            onAddMore={() => setStep('product-list')}
            onCancel={handleCancel}
            onSubmit={handleSubmitOrder}
          />
        )}
      </Card>
    </div>
  );
};

export default NewOrderView;
