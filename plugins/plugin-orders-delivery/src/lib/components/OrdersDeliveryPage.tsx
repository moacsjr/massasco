'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUI } from '@temp-workspace/ui-registry';
import { pluginLoader } from '@temp-workspace/plugin-loader';
import { Fab } from '@temp-workspace/plugin-ui-components';
import { MenuCatalogAPI } from '@temp-workspace/plugin-menu-catalog';
import { OrderItemDTO } from '../types';

// ============================================================================
// Orders Delivery Page — Two-tab interface (Active + Deliver) with FAB
// ============================================================================

const OrdersDeliveryPage: React.FC = () => {
  const { resolve } = useUI();
  const Card = resolve('Card');
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'active' | 'deliver'>('active');
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [readyItems, setReadyItems] = useState<OrderItemDTO[]>([]);

  // Load active orders
  const loadActiveOrders = useCallback(async () => {
    const res = await fetch('/api/orders');
    const data = await res.json();
    setActiveOrders(data || []);
  }, []);

  React.useEffect(() => {
    loadActiveOrders();
  }, [loadActiveOrders]);

  // SSE listener for real-time updates
  React.useEffect(() => {
    const es = new EventSource('/api/events');
    es.addEventListener('ITEM_UPDATED', () => loadActiveOrders());
    es.addEventListener('ORDER_CREATED', () => loadActiveOrders());
    return () => es.close();
  }, [loadActiveOrders]);

  // Load ready items
  React.useEffect(() => {
    const ready: OrderItemDTO[] = [];
    for (const order of activeOrders) {
      for (const item of order.items || []) {
        if (item.status === 'READY') {
          ready.push(item);
        }
      }
    }
    setReadyItems(ready);
  }, [activeOrders]);

  // Delivery
  const markDelivered = async (itemId: string) => {
    await fetch(`/api/order-items/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'DELIVERED' }),
    });
    loadActiveOrders();
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      READY: 'bg-green-900/50 text-green-400',
      PREPARING: 'bg-yellow-900/50 text-yellow-400',
      PENDING: 'bg-secondary text-muted-foreground',
      DELIVERED: 'bg-green-900/50 text-green-400',
      CANCELLED: 'bg-red-900/50 text-red-400',
    };
    return styles[status] || 'bg-secondary text-muted-foreground';
  };

  return (
    <div className="max-w-[900px]">
      <Card title="Pedidos & Entregas" padding="lg">
        {/* Tabs */}
        <div className="flex gap-0 mb-5 border-b-2 border-border">
          {[
            { key: 'active' as const, label: '🔥 Pedidos Ativos' },
            {
              key: 'deliver' as const,
              label: `📦 Para Entregar${readyItems.length > 0 ? ` (${readyItems.length})` : ''}`,
            },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`
                px-5 py-2.5 border-b-2 font-medium cursor-pointer text-sm transition-colors
                ${
                  activeTab === tab.key
                    ? 'border-brand bg-secondary text-brand font-semibold'
                    : 'border-transparent bg-transparent text-muted-foreground hover:text-foreground'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Active Tab */}
        {activeTab === 'active' && (
          <div>
            <h4 className="mt-0 text-foreground">Itens em Preparo</h4>
            {activeOrders.length === 0 ||
            activeOrders.every((o) => (o.items || []).length === 0) ? (
              <p className="text-muted-foreground">Nenhum pedido ativo.</p>
            ) : (
              activeOrders.map((order) => (
                <div key={order.id} className="mb-3">
                  <Card title={`Mesa ${order.tableNumber}`} padding="md">
                    <ul className="list-none p-0">
                      {(order.items || []).map((item: OrderItemDTO) => {
                        const priceLabel = item.selectedPrice
                          ? `${item.selectedPrice.description} (R$ ${Number(item.selectedPrice.value).toFixed(2)})`
                          : '';
                        return (
                          <li
                            key={item.id}
                            className="py-1.5 border-b border-border flex justify-between"
                          >
                            <span>
                              {item.product?.name} × {item.quantity}
                              {priceLabel && (
                                <div className="text-xs text-muted-foreground">
                                  {priceLabel}
                                </div>
                              )}
                              {item.notes && (
                                <span className="text-sm text-muted-foreground">
                                  {' '}
                                  — {item.notes}
                                </span>
                              )}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${statusBadge(item.status)}`}
                            >
                              {item.status}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </Card>
                </div>
              ))
            )}
          </div>
        )}

        {/* Deliver Tab */}
        {activeTab === 'deliver' && (
          <div>
            <h4 className="mt-0 text-foreground">Itens Prontos para Entrega</h4>
            {readyItems.length === 0 ? (
              <p className="text-muted-foreground">Nenhum item pronto.</p>
            ) : (
              readyItems.map((item) => (
                <div key={item.id} className="mb-2 border-l-4 border-brand">
                  <Card padding="md">
                    <div className="flex justify-between items-center">
                      <div>
                        <strong className="text-foreground">
                          {item.product?.name} × {item.quantity}
                        </strong>
                        <div className="text-sm text-muted-foreground">
                          Mesa{' '}
                          {
                            activeOrders.find((o) => o.id === item.orderId)
                              ?.tableNumber
                          }
                        </div>
                      </div>
                      <button
                        onClick={() => markDelivered(item.id)}
                        className="
                          px-3.5 py-1.5 rounded-lg border-none
                          bg-brand text-black font-semibold cursor-pointer
                          hover:bg-yellow-400 transition-colors
                        "
                      >
                        ✅ Entregue
                      </button>
                    </div>
                  </Card>
                </div>
              ))
            )}
          </div>
        )}
      </Card>

      {/* Floating Action Button — yellow brand */}
      <Fab
        onClick={() => router.push('/plugins/orders-delivery/new')}
        title="Novo Pedido"
      >
        +
      </Fab>
    </div>
  );
};

export default OrdersDeliveryPage;
