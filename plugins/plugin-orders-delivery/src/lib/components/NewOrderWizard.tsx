'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUI } from '@temp-workspace/ui-registry';
import { pluginLoader } from '@temp-workspace/plugin-loader';
import { MenuCatalogAPI, ProductDTO, ProductPriceDTO, ProductComplementDTO, CategoryDTO } from '@temp-workspace/plugin-menu-catalog';
import { CartItem, WizardStep } from '../types';
import ProductListStep from './ProductListStep';
import ProductDetailsStep from './ProductDetailsStep';
import OrderSummaryStep from './OrderSummaryStep';

// ============================================================================
// New Order Wizard — Multi-step order creation
// ============================================================================

const NewOrderWizard: React.FC = () => {
  const { resolve } = useUI();
  const Card = resolve('Card');
  const router = useRouter();

  // Wizard state
  const [step, setStep] = useState<WizardStep>('product-list');
  const [selectedProduct, setSelectedProduct] = useState<ProductDTO | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [tableNumber, setTableNumber] = useState(1);

  // Menu data
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [products, setProducts] = useState<ProductDTO[]>([]);

  useEffect(() => {
    const menuAPI = pluginLoader.getService<MenuCatalogAPI>('menu-catalog');
    menuAPI.listCategories().then(setCategories);
    menuAPI.listProducts().then(setProducts);
  }, []);

  const handleSelectProduct = (product: ProductDTO) => {
    setSelectedProduct(product);
    setStep('product-details');
  };

  const handleAddToCart = (price: ProductPriceDTO, complements: ProductComplementDTO[], notes: string) => {
    if (!selectedProduct) return;
    setCart((prev) => [
      ...prev,
      {
        product: selectedProduct,
        selectedPrice: price,
        selectedComplements: complements,
        quantity: 1,
        notes,
      },
    ]);
    setSelectedProduct(null);
    setStep('order-summary');
  };

  const handleSubmitOrder = async () => {
    if (cart.length === 0) return;

    await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tableNumber,
        items: cart.map((c) => ({
          productId: c.product.id,
          quantity: c.quantity,
          notes: c.notes,
          selectedPriceId: c.selectedPrice.id,
          selectedComplements: c.selectedComplements.map((comp) => ({
            id: comp.id,
            title: comp.title,
            value: comp.value,
          })),
        })),
      }),
    });

    setCart([]);
    router.push('/plugins/orders-delivery/');
  };

  const handleCancel = () => {
    setCart([]);
    setSelectedProduct(null);
    setStep('product-list');
  };

  const handleBackToList = () => {
    setSelectedProduct(null);
    setStep('product-list');
  };

  const stepLabels: Record<WizardStep, string> = {
    'product-list': 'Produtos',
    'product-details': 'Item',
    'order-summary': 'Resumo',
  };

  const stepKeys: WizardStep[] = ['product-list', 'product-details', 'order-summary'];

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
                  ${step === s
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

export default NewOrderWizard;
