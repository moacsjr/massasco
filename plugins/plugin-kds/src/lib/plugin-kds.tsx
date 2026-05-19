'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FeaturePlugin, ExtensionContribution } from '@temp-workspace/plugin-loader';
import { useUI } from '@temp-workspace/ui-registry';

interface KDSItem {
  id: string;
  orderId: string;
  productName: string;
  quantity: number;
  notes: string | null;
  status: 'PENDING' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED';
  tableNumber: number;
}

const KDSBoard: React.FC = () => {
  const { resolve } = useUI();
  const Card = resolve('Card');
  const [items, setItems] = useState<KDSItem[]>([]);

  const loadItems = useCallback(async () => {
    const res = await fetch('/api/orders');
    const orders = await res.json();
    const allItems: KDSItem[] = [];
    for (const order of orders || []) {
      for (const item of order.items || []) {
        if (item.status !== 'DELIVERED' && item.status !== 'CANCELLED') {
          allItems.push({
            id: item.id,
            orderId: item.orderId,
            productName: item.product.name,
            quantity: item.quantity,
            notes: item.notes,
            status: item.status,
            tableNumber: order.tableNumber,
          });
        }
      }
    }
    setItems(allItems);
  }, []);

  useEffect(() => {
    loadItems();
    const es = new EventSource('/api/events');
    es.addEventListener('ITEM_UPDATED', () => loadItems());
    es.addEventListener('ORDER_CREATED', () => loadItems());
    return () => es.close();
  }, [loadItems]);

  const updateItemStatus = async (itemId: string, status: string) => {
    await fetch(`/api/order-items/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    loadItems();
  };

  const pending = items.filter((i) => i.status === 'PENDING');
  const preparing = items.filter((i) => i.status === 'PREPARING');

  const renderCard = (item: KDSItem) => (
    <div
      key={item.id}
      className="
        p-3 mb-2 rounded-lg border border-border bg-surface-elevated
      "
    >
      <div className="flex justify-between mb-1">
        <strong className="text-sm text-foreground">{item.productName}</strong>
        <span className="text-xs text-muted-foreground">× {item.quantity}</span>
      </div>
      <div className="text-xs text-muted-foreground mb-2">Mesa {item.tableNumber}</div>
      {item.notes && (
        <div className="text-xs text-destructive bg-destructive/10 px-2 py-1 rounded mb-2">
          ⚠️ {item.notes}
        </div>
      )}
      <div className="flex gap-2">
        {item.status === 'PENDING' && (
          <button
            onClick={() => updateItemStatus(item.id, 'PREPARING')}
            className="
              flex-1 px-2 py-1.5 border-none rounded-md
              bg-brand text-black font-semibold text-xs
              cursor-pointer hover:bg-yellow-400 transition-colors
            "
          >
            ▶ Iniciar Preparo
          </button>
        )}
        {item.status === 'PREPARING' && (
          <button
            onClick={() => updateItemStatus(item.id, 'READY')}
            className="
              flex-1 px-2 py-1.5 border-none rounded-md
              bg-green-600 text-white font-semibold text-xs
              cursor-pointer hover:bg-green-500 transition-colors
            "
          >
            ✅ Pronto
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-[1000px]">
      <Card title="Cozinha — KDS" padding="lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Pending column */}
          <div>
            <h3 className="mt-0 text-muted-foreground text-xs uppercase tracking-wide">
              Pendentes ({pending.length})
            </h3>
            {pending.length === 0 ? (
              <p className="text-muted-foreground/50 text-sm">Nenhum item pendente.</p>
            ) : (
              pending.map(renderCard)
            )}
          </div>

          {/* Preparing column */}
          <div>
            <h3 className="mt-0 text-yellow-500 text-xs uppercase tracking-wide">
              Em Preparo ({preparing.length})
            </h3>
            {preparing.length === 0 ? (
              <p className="text-muted-foreground/50 text-sm">Nenhum item em preparo.</p>
            ) : (
              preparing.map(renderCard)
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export const kdsPlugin: FeaturePlugin = {
  id: 'kds',
  name: 'Kitchen Display System',
  type: 'feature',
  routes: [
    {
      path: '',
      component: KDSBoard,
      label: 'Cozinha',
      icon: 'ChefHat',
      showInMenu: true
    }
  ]
};
