'use client';

import React from 'react';
import {
  FeaturePlugin,
  ExtensionContribution,
  ServicePlugin,
  pluginLoader,
  LeftMenuItemProps,
} from '@temp-workspace/plugin-loader';
import { useUI } from '@temp-workspace/ui-registry';
import { NewOrderWizard } from '@temp-workspace/plugin-orders-delivery';
import { PaymentsAPI } from '@temp-workspace/plugin-payments';
import { useRouter } from 'next/navigation';

// ============================================================================
// Types
// ============================================================================

interface OrderItemDTO {
  id: string;
  productId: string;
  product: {
    name: string;
    description?: string;
    imageUrl?: string;
  };
  quantity: number;
  notes: string | null;
  status: 'PENDING' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED';
  selectedPrice: {
    id: string;
    description: string;
    value: number;
  } | null;
  selectedComplements: {
    id: string;
    group: string;
    title: string;
    description?: string;
    value: number;
  }[];
}

interface OrderDTO {
  id: string;
  tableNumber: number;
  status: 'OPEN' | 'AWAITING_PAYMENT' | 'PAID' | 'CLOSED';
  items: OrderItemDTO[];
  createdAt: string;
}

// ============================================================================
// Hooks
// ============================================================================

export const useCustomerTable = () => {
  const [tableNumber, setTableNumber] = React.useState<number>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('customerTable');
      return stored ? parseInt(stored, 10) : 1;
    }
    return 1;
  });

  const setTable = (table: number) => {
    setTableNumber(table);
    localStorage.setItem('customerTable', table.toString());
  };

  const clearTable = () => {
    setTableNumber(1);
    localStorage.removeItem('customerTable');
  };

  return { tableNumber, setTable, clearTable };
};

export const useCustomerOrders = (tableNumber: number) => {
  const [orders, setOrders] = React.useState<OrderDTO[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (!tableNumber) return;

    const fetchOrders = async () => {
      try {
        const res = await fetch(`/api/orders?tableNumber=${tableNumber}`);
        const data = await res.json();
        setOrders(data || []);
      } catch (err) {
        console.error('Error fetching orders:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();

    // SSE subscription for real-time updates
    const eventSource = new EventSource('/api/events');
    eventSource.onmessage = () => {
      fetchOrders();
    };
    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [tableNumber]);

  return { orders, isLoading };
};

// ============================================================================
// Components
// ============================================================================

// --- SelectTableStep ---
const SelectTableStep: React.FC = () => {
  const { resolve } = useUI();
  const Card = resolve('Card');
  const Button = resolve('Button');
  const [tableNumber, setTableNumber] = React.useState(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('customerTable', tableNumber.toString());
    window.location.href = '/plugins/customer-portal/menu';
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card title="Bem-vindo ao Portal do Cliente" padding="lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Selecione o número da mesa
            </label>
            <input
              type="number"
              value={tableNumber}
              onChange={(e) => setTableNumber(Number(e.target.value))}
              min={1}
              className="w-full px-4 py-3 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
              placeholder="Ex: 1"
              required
            />
          </div>
          <Button variant="primary" size="md">
            Entrar
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Selecione uma mesa para começar seu pedido
        </p>
      </Card>
    </div>
  );
};

// --- MenuPage ---
const MenuPage: React.FC = () => {
  return (
    <div className="p-4">
      <NewOrderWizard />
    </div>
  );
};

// --- OrdersPage ---
const OrdersPage: React.FC = () => {
  const { tableNumber } = useCustomerTable();
  const { resolve } = useUI();
  const Card = resolve('Card');
  const Button = resolve('Button');

  const { orders: customerOrders, isLoading } = useCustomerOrders(tableNumber);

  if (isLoading) {
    return <div className="p-4 text-foreground">Carregando pedidos...</div>;
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Meus Pedidos</h2>
        <span className="text-sm text-muted-foreground">
          Mesa {tableNumber}
        </span>
      </div>

      {customerOrders.length === 0 ? (
        <Card padding="lg">
          <p className="text-muted-foreground">Nenhum pedido realizado.</p>
          <Button
            variant="primary"
            size="md"
            onClick={() => (window.location.href = '/plugins/customer-portal/menu')}
          >
            Fazer Pedido
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {customerOrders.map((order) => (
            <Card key={order.id} padding="lg">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-xs font-semibold uppercase text-muted-foreground">
                    Pedido #{order.id.slice(0, 8)}
                  </span>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.createdAt).toLocaleString('pt-BR')}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    order.status === 'OPEN'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : order.status === 'AWAITING_PAYMENT'
                      ? 'bg-blue-500/20 text-blue-400'
                      : order.status === 'PAID'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-gray-500/20 text-gray-400'
                  }`}
                >
                  {order.status === 'OPEN'
                    ? 'Em andamento'
                    : order.status === 'AWAITING_PAYMENT'
                    ? 'Aguardando pagamento'
                    : order.status === 'PAID'
                    ? 'Pago'
                    : order.status}
                </span>
              </div>

              <div className="space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-foreground">
                      {item.product.name} × {item.quantity}
                    </span>
                    <span className="text-foreground">
                      {item.selectedPrice
                        ? `R$ ${(item.selectedPrice.value * item.quantity).toFixed(2)}`
                        : 'R$ 0,00'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
                <span className="font-semibold text-foreground">Total:</span>
                <span className="font-bold text-foreground">
                  R$ {order.items.reduce((sum, item) => {
                    const price = item.selectedPrice ? item.selectedPrice.value : 0;
                    return sum + price * item.quantity;
                  }, 0).toFixed(2)}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// --- CheckoutPage ---
const CheckoutPage: React.FC = () => {
  const { tableNumber } = useCustomerTable();
  const { resolve } = useUI();
  const Card = resolve('Card');
  const Button = resolve('Button');
  const router = useRouter();

  const { orders: customerOrders, isLoading } = useCustomerOrders(tableNumber);
  const [selectedOrderIds, setSelectedOrderIds] = React.useState<string[]>([]);
  const [paymentAmount, setPaymentAmount] = React.useState('');
  const [paymentMethod, setPaymentMethod] = React.useState('cash');
  const [isProcessing, setIsProcessing] = React.useState(false);

  const totalToPay = customerOrders.reduce((sum, order) => {
    if (selectedOrderIds.includes(order.id)) {
      return sum + order.items.reduce((orderSum, item) => {
        const price = item.selectedPrice ? item.selectedPrice.value : 0;
        return orderSum + price * item.quantity;
      }, 0);
    }
    return sum;
  }, 0);

  const handleToggleOrder = (orderId: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleCheckout = async () => {
    if (selectedOrderIds.length === 0 || !paymentAmount) return;

    setIsProcessing(true);
    try {
      const payments = await Promise.all(
        selectedOrderIds.map((orderId) =>
          fetch('/api/payments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId,
              amount: Number(paymentAmount) / selectedOrderIds.length,
              method: paymentMethod,
            }),
          }).then((r) => r.json())
        )
      );

      // Redirecionar para página de agradecimento
      window.location.href = '/plugins/customer-portal/thank-you';
    } catch (err) {
      console.error('Error processing payment:', err);
      alert('Erro ao processar pagamento');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-2xl font-bold text-foreground">Checkout</h2>

      <Card padding="lg">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Selecione os pedidos para pagar
        </h3>

        {customerOrders.length === 0 ? (
          <p className="text-muted-foreground">Nenhum pedido para pagar.</p>
        ) : (
          <div className="space-y-3">
            {customerOrders.map((order) => {
              const orderTotal = order.items.reduce((sum, item) => {
                const price = item.selectedPrice ? item.selectedPrice.value : 0;
                return sum + price * item.quantity;
              }, 0);
              const isSelected = selectedOrderIds.includes(order.id);

              return (
                <div
                  key={order.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    isSelected
                      ? 'border-brand bg-brand/10'
                      : 'border-border hover:border-secondary'
                  }`}
                  onClick={() => handleToggleOrder(order.id)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-sm font-semibold text-foreground">
                        Pedido #{order.id.slice(0, 8)}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        {order.items.length} itens — {order.items.reduce((sum, item) => sum + item.quantity, 0)} total
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-foreground">
                        R$ {orderTotal.toFixed(2)}
                      </span>
                      <div className="text-xs text-muted-foreground">
                        {isSelected ? 'Selecionado' : 'Clique para selecionar'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {selectedOrderIds.length > 0 && (
        <Card padding="lg">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Pagamento
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Valor total a pagar
              </label>
              <div className="text-2xl font-bold text-foreground">
                R$ {totalToPay.toFixed(2)}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Valor a pagar
              </label>
              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                min={0.01}
                step={0.01}
                placeholder="Ex: 50.00"
                className="w-full px-4 py-3 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Forma de pagamento
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-4 py-3 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
              >
                <option value="cash">💵 Dinheiro</option>
                <option value="card">💳 Cartão</option>
                <option value="pix">📱 Pix</option>
              </select>
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={handleCheckout}
              isLoading={isProcessing}
            >
              Confirmar Pagamento
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

// --- ThankYouPage ---
const ThankYouPage: React.FC = () => {
  const { tableNumber } = useCustomerTable();
  const { resolve } = useUI();
  const Card = resolve('Card');
  const Button = resolve('Button');
  const router = useRouter();

  const { orders: customerOrders, isLoading } = useCustomerOrders(tableNumber);

  const totalSpent = customerOrders.reduce((sum, order) => {
    return sum + order.items.reduce((orderSum, item) => {
      const price = item.selectedPrice ? item.selectedPrice.value : 0;
      return orderSum + price * item.quantity;
    }, 0);
  }, 0);

  const totalPayments = customerOrders.reduce((sum, order) => {
    return sum + order.items.reduce((orderSum, item) => {
      const price = item.selectedPrice ? item.selectedPrice.value : 0;
      return orderSum + price * item.quantity;
    }, 0);
  }, 0);

  const handleFinish = () => {
    localStorage.removeItem('customerTable');
    window.location.href = '/plugins/customer-portal/';
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card padding="lg">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
            <span className="text-3xl">✅</span>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Obrigado pelo pagamento!
          </h2>
          <p className="text-muted-foreground">
            Seu pedido foi processado com sucesso.
          </p>
        </div>

        <div className="space-y-3 text-left mb-6">
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">Mesa:</span>
            <span className="text-foreground font-medium">{tableNumber}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">Itens consumidos:</span>
            <span className="text-foreground font-medium">
              {customerOrders.reduce((sum, order) => sum + order.items.length, 0)}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">Total gasto:</span>
            <span className="text-foreground font-medium">
              R$ {totalSpent.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">Pagamentos:</span>
            <span className="text-green-400 font-medium">
              R$ {totalPayments.toFixed(2)}
            </span>
          </div>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={handleFinish}
        >
          Finalizar
        </Button>
      </Card>
    </div>
  );
};

// ============================================================================
// Plugin Registration
// ============================================================================

const contributions: ExtensionContribution[] = [
  {
    point: 'main-template:left-menu' as const,
    component: () => {
      return (
        <div style={{ padding: '12px' }}>
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              color: '#6b7280',
              marginBottom: '6px',
              letterSpacing: '0.05em',
            }}
          >
            Portal do Cliente
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li style={{ marginBottom: '2px' }}>
              <a
                href="/plugins/customer-portal/menu"
                style={{
                  display: 'block',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  color: '#374151',
                  fontSize: '0.9rem',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor =
                    '#f3f4f6';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor =
                    'transparent';
                }}
              >
                🍽️ Cardápio
              </a>
            </li>
            <li style={{ marginBottom: '2px' }}>
              <a
                href="/plugins/customer-portal/orders"
                style={{
                  display: 'block',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  color: '#374151',
                  fontSize: '0.9rem',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor =
                    '#f3f4f6';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor =
                    'transparent';
                }}
              >
                🛒 Pedidos
              </a>
            </li>
            <li style={{ marginBottom: '2px' }}>
              <a
                href="/plugins/customer-portal/checkout"
                style={{
                  display: 'block',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  color: '#374151',
                  fontSize: '0.9rem',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor =
                    '#f3f4f6';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor =
                    'transparent';
                }}
              >
                💳 Checkout
              </a>
            </li>
            <li style={{ marginBottom: '2px' }}>
              <a
                href="/plugins/auth/profile"
                style={{
                  display: 'block',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  color: '#374151',
                  fontSize: '0.9rem',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor =
                    '#f3f4f6';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor =
                    'transparent';
                }}
              >
                👤 Profile
              </a>
            </li>
          </ul>
        </div>
      );
    },
    metadata: {
      name: 'Portal do Cliente',
      icon: '👤',
    },
  },
];

export const customerPortalPlugin: FeaturePlugin = {
  id: 'customer-portal',
  name: 'Portal do Cliente',
  type: 'feature',
  routes: [
    {
      path: '',
      component: SelectTableStep,
      label: 'Portal do Cliente',
      showInMenu: false,
    },
    {
      path: 'menu',
      component: MenuPage,
      label: 'Cardápio',
      showInMenu: false,
    },
    {
      path: 'orders',
      component: OrdersPage,
      label: 'Pedidos',
      showInMenu: false,
    },
    {
      path: 'checkout',
      component: CheckoutPage,
      label: 'Checkout',
      showInMenu: false,
    },
    {
      path: 'thank-you',
      component: ThankYouPage,
      label: 'Agradecimento',
      showInMenu: false,
    },
  ],
  contributions,
};

// Service plugin para API de pagamentos
export const customerPortalServicePlugin: ServicePlugin = {
  id: 'customer-portal-service',
  name: 'Customer Portal Service',
  type: 'service',
  api: {
    getCustomerTable: () => {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('customerTable');
        return stored ? parseInt(stored, 10) : null;
      }
      return null;
    },
  },
};