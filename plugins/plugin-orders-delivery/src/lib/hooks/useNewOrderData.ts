"use client";

import { useState, useEffect } from 'react';
import { pluginLoader } from '@temp-workspace/plugin-loader';
import {
  MenuCatalogAPI,
  ProductDTO,
  ProductPriceDTO,
  ProductComplementDTO,
  CategoryDTO,
} from '@temp-workspace/plugin-menu-catalog';
import { CartItem, WizardStep } from '../types';

export interface UseNewOrderDataReturn {
  step: WizardStep;
  setStep: (step: WizardStep) => void;
  selectedProduct: ProductDTO | null;
  setSelectedProduct: (product: ProductDTO | null) => void;
  cart: CartItem[];
  setCart: (cart: CartItem[]) => void;
  tableNumber: number;
  setTableNumber: (num: number) => void;
  tableSessionId: string | null;
  setTableSessionId: (id: string | null) => void;
  customerName: string;
  setCustomerName: (name: string) => void;
  categories: CategoryDTO[];
  products: ProductDTO[];
  isLoading: boolean;
  error: Error | null;
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

export const useNewOrderData = (): UseNewOrderDataReturn => {
  const [step, setStep] = useState<WizardStep>('product-list');
  const [selectedProduct, setSelectedProduct] = useState<ProductDTO | null>(
    null,
  );
  const [cart, setCart] = useState<CartItem[]>([]);
  const [tableNumber, setTableNumber] = useState(1);
  const [tableSessionId, setTableSessionId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('customerTableSession');
      if (stored) {
        const tableSession = JSON.parse(stored);
        return tableSession.id;
      }
    }
    return null;
  });
  const [customerName, setCustomerName] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('customerTableSession');
      if (stored) {
        const tableSession = JSON.parse(stored);
        return tableSession.customerName || '';
      }
      // Fallback to customerTable if tableSession not found
      const table = localStorage.getItem('customerTable');
      if (table) {
        return `Cliente Mesa ${table}`;
      }
    }
    return '';
  });
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const loadMenuData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const menuAPI = pluginLoader.getService<MenuCatalogAPI>('menu-catalog');
      await Promise.all([
        menuAPI.listCategories().then(setCategories),
        menuAPI.listProducts().then(setProducts),
      ]);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMenuData();
  }, []);

  const handleSelectProduct = (product: ProductDTO) => {
    setSelectedProduct(product);
    setStep('product-details');
  };

  const handleAddToCart = (
    price: ProductPriceDTO,
    complements: ProductComplementDTO[],
    notes: string,
  ) => {
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

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableSessionId,
          tableNumber,
          customerName,
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
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create order');
      }
      setCart([]);
      setStep('product-list');
    } catch (err) {
      setError(err as Error);
      throw err;
    }
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

  return {
    step,
    setStep,
    selectedProduct,
    setSelectedProduct,
    cart,
    setCart,
    tableNumber,
    setTableNumber,
    tableSessionId,
    setTableSessionId,
    customerName,
    setCustomerName,
    categories,
    products,
    isLoading,
    error,
    refetch: loadMenuData,
    handleSelectProduct,
    handleAddToCart,
    handleSubmitOrder,
    handleCancel,
    handleBackToList,
  };
};
