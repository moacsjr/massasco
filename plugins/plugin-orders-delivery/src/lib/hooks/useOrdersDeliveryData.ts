"use client";

import { useState, useEffect, useCallback } from 'react';
import { OrderItemDTO, OrderDTO } from '../types';

export interface UseOrdersDeliveryDataReturn {
  activeOrders: OrderDTO[] | null;
  readyItems: OrderItemDTO[] | null;
  activeTab: 'active' | 'deliver';
  setActiveTab: (tab: 'active' | 'deliver') => void;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  markDelivered: (itemId: string) => Promise<void>;
}

export const useOrdersDeliveryData = (): UseOrdersDeliveryDataReturn => {
  const [activeOrders, setActiveOrders] = useState<OrderDTO[] | null>(null);
  const [readyItems, setReadyItems] = useState<OrderItemDTO[] | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'deliver'>('active');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const loadActiveOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/orders');
      if (!res.ok) {
        throw new Error('Failed to fetch orders');
      }
      const data = await res.json();
      setActiveOrders(data || []);

      // Calcular itens prontos para entrega
      const items: OrderItemDTO[] = [];
      if (data) {
        for (const order of data) {
          if (order.items) {
            for (const item of order.items) {
              if (item.status === 'READY') {
                items.push(item);
              }
            }
          }
        }
      }
      setReadyItems(items);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadActiveOrders();
  }, [loadActiveOrders]);

  // SSE listener for real-time updates
  useEffect(() => {
    const es = new EventSource('/api/events');
    es.addEventListener('ITEM_UPDATED', loadActiveOrders);
    es.addEventListener('ORDER_CREATED', loadActiveOrders);

    return () => {
      es.close();
    };
  }, [loadActiveOrders]);

  const markDelivered = async (itemId: string): Promise<void> => {
    try {
      const res = await fetch(`/api/order-items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DELIVERED' }),
      });
      if (!res.ok) {
        throw new Error('Failed to mark item as delivered');
      }
      loadActiveOrders();
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  return {
    activeOrders,
    readyItems,
    activeTab,
    setActiveTab,
    isLoading,
    error,
    refetch: loadActiveOrders,
    markDelivered,
  };
};
