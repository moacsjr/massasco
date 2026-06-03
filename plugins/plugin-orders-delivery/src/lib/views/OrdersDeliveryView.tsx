'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useUI } from '@temp-workspace/ui-registry';
import { Fab } from '@temp-workspace/plugin-ui-components';
import { OrderItemDTO, OrderDTO } from '../types';

export interface OrdersDeliveryViewProps {
  activeOrders?: OrderDTO[] | null;
  readyItems?: OrderItemDTO[] | null;
  activeTab: 'active' | 'deliver';
  setActiveTab: (tab: 'active' | 'deliver') => void;
  isLoading?: boolean;
  refetch?: () => void;
  markDelivered?: (itemId: string) => Promise<void>;
}

export const OrdersDeliveryView = ({
  activeOrders = [],
  readyItems = [],
  activeTab,
  setActiveTab,
  isLoading = false,
  refetch,
  markDelivered,
}: OrdersDeliveryViewProps) => {
  const { resolve } = useUI();
  const Card = resolve('Card');
  const router = useRouter();

  // Wrapper imutável: garante que a caixa externa nunca mude de tamanho ou estilo
  const cardWrapperClasses =
    'bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm';

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

  const orderStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      OPEN: 'bg-blue-900/50 text-blue-400',
      AWAITING_PAYMENT: 'bg-purple-900/50 text-purple-400',
      PAID: 'bg-green-900/50 text-green-400',
      CLOSED: 'bg-gray-900/50 text-gray-400',
      DELIVERED: 'bg-green-900/50 text-green-400',
    };
    return styles[status] || 'bg-secondary text-muted-foreground';
  };

  const orderStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      OPEN: 'Em aberto',
      AWAITING_PAYMENT: 'Aguardando pagamento',
      PAID: 'Pago',
      CLOSED: 'Fechado',
      DELIVERED: 'Entregue',
    };
    return labels[status] || status;
  };

  // RENDER ESTADO: SKELETON (Mapeamento 1:1 com o DOM real)
  if (isLoading) {
    return (
      <div className="max-w-[900px]">
        <Card title="Pedidos & Entregas" padding="lg">
          {/* Tabs Skeleton */}
          <div className="flex gap-0 mb-5 border-b-2 border-border animate-pulse">
            <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded mr-2" />
            <div className="h-8 w-28 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>

          {/* Active Tab Skeleton */}
          <div className="space-y-4">
            <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2" />
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* FAB Skeleton */}
        <div className="fixed bottom-20 md:bottom-6 right-6 w-14 h-14 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
      </div>
    );
  }

  const handleDeliver = async (itemId: string) => {
    if (markDelivered) {
      await markDelivered(itemId);
    }
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
                  <Card
                    title={
                      <div className="flex items-center gap-2">
                        <span>Mesa {order.tableNumber}</span>
                        <span
                          className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${orderStatusBadge(order.status)}`}
                        >
                          {orderStatusLabel(order.status)}
                        </span>
                      </div>
                    }
                    padding="md"
                  >
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
                        onClick={() => handleDeliver(item.id)}
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

export default OrdersDeliveryView;
