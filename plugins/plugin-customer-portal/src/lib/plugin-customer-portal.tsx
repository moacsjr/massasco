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
import { NewOrderContainer } from '@temp-workspace/plugin-orders-delivery';
import { PaymentsAPI, CheckoutButton, ComponentePix } from '@temp-workspace/plugin-payments';
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
  status: 'OPEN' | 'AWAITING_PAYMENT' | 'PAID' | 'CLOSED' | 'DELIVERED';
  items: OrderItemDTO[];
  createdAt: string;
}

interface CheckInDTO {
  id: string;
  tableNumber: number;
  customerName: string;
  status: 'OPEN' | 'CLOSED';
  createdAt: string;
  closedAt?: string;
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

export const useCustomerCheckIn = () => {
  const [checkIn, setCheckInState] = React.useState<CheckInDTO | null>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('customerCheckIn');
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  });

  const setCheckIn = (checkInData: CheckInDTO) => {
    setCheckInState(checkInData);
    localStorage.setItem('customerCheckIn', JSON.stringify(checkInData));
  };

  const clearCheckIn = () => {
    setCheckInState(null);
    localStorage.removeItem('customerCheckIn');
  };

  return { checkIn, setCheckIn, clearCheckIn };
};

// Hook to listen for CHECKIN_CLOSED SSE event
export const useCheckInSSE = (onCheckInClosed?: (tableNumber: number) => void) => {
  React.useEffect(() => {
    const eventSource = new EventSource('/api/events');
    
    eventSource.addEventListener('CHECKIN_CLOSED', (event) => {
      const data = JSON.parse(event.data);
      console.log('CHECKIN_CLOSED event received:', data);
      if (onCheckInClosed) {
        onCheckInClosed(data.tableNumber);
      }
    });
    
    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [onCheckInClosed]);
};

export const useCustomerOrders = (checkInId: string) => {
  const [orders, setOrders] = React.useState<OrderDTO[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (!checkInId) return;

    const fetchOrders = async () => {
      try {
        const res = await fetch(`/api/orders?checkInId=${checkInId}`);
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
  }, [checkInId]);

  return { orders, isLoading };
};

// ============================================================================
// Components
// ============================================================================

// --- CheckInStep ---
interface CheckInStepProps {
  params?: Promise<{ tableNumber?: string }>;
}

const CheckInStep: React.FC<CheckInStepProps> = ({ params }) => {
  const { resolve } = useUI();
  const Card = resolve('Card');
  const Button = resolve('Button');
  const [customerName, setCustomerName] = React.useState('');
  const [error, setError] = React.useState('');
  const router = useRouter();
  
  // Extract tableNumber from params (passed by Next.js)
  const tableNumber = params ? (typeof params === 'object' && !Array.isArray(params) ? parseInt((params as any).tableNumber, 10) : 1) : 1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!customerName.trim()) {
      setError('Por favor, informe seu nome');
      return;
    }

    try {
      const res = await fetch('/api/checkins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableNumber,
          customerName: customerName.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 400) {
          setError(data.error || 'Erro ao fazer check-in');
          return;
        }
        throw new Error(data.error || 'Erro ao fazer check-in');
      }

      // Save check-in to localStorage
      localStorage.setItem('customerCheckIn', JSON.stringify(data));
      localStorage.setItem('customerTable', tableNumber.toString());

      // Redirect to menu
      window.location.href = '/plugins/customer-portal/menu';
    } catch (err) {
      console.error('Error creating check-in:', err);
      setError('Erro ao criar check-in. Tente novamente.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card title="Check-in da Mesa" padding="lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Número da Mesa
            </label>
            <div className="w-full px-4 py-3 border border-border rounded-lg bg-card text-foreground opacity-70">
              {tableNumber}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Seu Nome
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-4 py-3 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
              placeholder="Ex: João"
              required
            />
            {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
          </div>
          <Button variant="primary" size="md" type="submit">
            Entrar
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Faça check-in para acessar o cardápio digital
        </p>
      </Card>
    </div>
  );
};

// --- SelectTableStep ---
const SelectTableStep: React.FC = () => {
  const { resolve } = useUI();
  const Card = resolve('Card');
  const Button = resolve('Button');
  const [tableNumber, setTableNumber] = React.useState(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('customerTable', tableNumber.toString());
    window.location.href = `/plugins/customer-portal/checkin/${tableNumber}`;
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
      <NewOrderContainer />
    </div>
  );
};

// --- OrdersPage ---
const OrdersPage: React.FC = () => {
  const { checkIn } = useCustomerCheckIn();
  const { resolve } = useUI();
  const Card = resolve('Card');
  const Button = resolve('Button');

  if (!checkIn) {
    return (
      <div className="p-4">
        <Card padding="lg">
          <p className="text-muted-foreground">Nenhum check-in ativo.</p>
          <Button
            variant="primary"
            size="md"
            onClick={() => (window.location.href = '/plugins/customer-portal/')}
          >
            Fazer Check-in
          </Button>
        </Card>
      </div>
    );
  }

  const { orders: customerOrders, isLoading } = useCustomerOrders(checkIn.id);

  if (isLoading) {
    return <div className="p-4 text-foreground">Carregando pedidos...</div>;
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Meus Pedidos</h2>
        <span className="text-sm text-muted-foreground">
          Mesa {checkIn.tableNumber}
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
  const { checkIn } = useCustomerCheckIn();
  const { resolve } = useUI();
  const Card = resolve('Card');
  const Button = resolve('Button');
  const router = useRouter();

  if (!checkIn) {
    return (
      <div className="p-4">
        <Card padding="lg">
          <p className="text-muted-foreground">Nenhum check-in ativo.</p>
          <Button
            variant="primary"
            size="md"
            onClick={() => (window.location.href = '/plugins/customer-portal/')}
          >
            Fazer Check-in
          </Button>
        </Card>
      </div>
    );
  }

  const { orders: customerOrders, isLoading } = useCustomerOrders(checkIn.id);
  // Filter only delivered orders for checkout (orders where all items are delivered)
  const deliveredOrders = React.useMemo(() => {
    return (customerOrders || []).filter((order) => {
      // Order status is DELIVERED or all items have DELIVERED status
      if (order.status === 'DELIVERED') return true;
      if (order.status === 'CLOSED' && order.items.length > 0) {
        return order.items.every((item) => item.status === 'DELIVERED');
      }
      return false;
    });
  }, [customerOrders]);
  const [selectedOrderIds, setSelectedOrderIds] = React.useState<string[]>([]);
  const [paymentAmount, setPaymentAmount] = React.useState('');
  const [paymentMethod, setPaymentMethod] = React.useState('pix');
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [showPixScreen, setShowPixScreen] = React.useState<boolean>(false);
  const [pixData, setPixData] = React.useState<{ chave: string; beneficiario: string; cidade: string; valor: number } | null>(null);
  
  // Maquininha state
  const [showMaquininhaScreen, setShowMaquininhaScreen] = React.useState<boolean>(false);
  const [maquininhaOrderIds, setMaquininhaOrderIds] = React.useState<string[]>([]);
  const [maquininhaAmount, setMaquininhaAmount] = React.useState<number>(0);
  
  // Venda Concluída state
  const [showVendaConcluida, setShowVendaConcluida] = React.useState<boolean>(false);
  
  // SSE listener for ORDER_CLOSED event
  React.useEffect(() => {
    const es = new EventSource('/api/events');
    es.addEventListener('ORDER_CLOSED', (event) => {
      const data = JSON.parse(event.data);
      console.log('ORDER_CLOSED event received:', data);
      setShowVendaConcluida(true);
    });
    
    return () => {
      es.close();
    };
  }, []);

  const handleToggleAllOrders = () => {
    if (selectedOrderIds.length === deliveredOrders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(deliveredOrders.map((order) => order.id));
    }
  };

  const totalToPay = deliveredOrders.reduce((sum, order) => {
    if (selectedOrderIds.includes(order.id)) {
      return sum + order.items.reduce((orderSum, item) => {
        const price = item.selectedPrice ? item.selectedPrice.value : 0;
        return orderSum + price * item.quantity;
      }, 0);
    }
    return sum;
  }, 0);

  // Pre-fill payment amount with total to pay when orders are selected
  React.useEffect(() => {
    if (selectedOrderIds.length > 0) {
      setPaymentAmount(totalToPay.toFixed(2));
    } else {
      setPaymentAmount('');
    }
  }, [selectedOrderIds, totalToPay]);

  const handleToggleOrder = (orderId: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };

  // Dados fixos para teste do PIX - em produção, isso viria de uma configuração ou API
  const pixConfig = {
    chave: 'suachave@email.com', // Chave PIX do estabelecimento
    beneficiario: 'Fulano de Tal', // Nome do beneficiário
    cidade: 'Sao Paulo' // Cidade do beneficiário
  };

  const handleCheckout = async () => {
    if (selectedOrderIds.length === 0 || !paymentAmount) return;

    // Se for Pix, mostra a tela de PIX em vez de registrar imediatamente
    if (paymentMethod === 'pix') {
      setPixData({
        chave: pixConfig.chave,
        beneficiario: pixConfig.beneficiario,
        cidade: pixConfig.cidade,
        valor: Number(paymentAmount)
      });
      setShowPixScreen(true);
      return;
    }

    // Se for Maquininha, mostra a tela de Aguardando Pagamento
    if (paymentMethod === 'maquininha') {
      setMaquininhaOrderIds(selectedOrderIds);
      setMaquininhaAmount(Number(paymentAmount));
      setShowMaquininhaScreen(true);
      return;
    }

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

  // Handle maquininha payment completion
  const handleMaquininhaPaymentCompleted = async () => {
    if (maquininhaOrderIds.length === 0 || maquininhaAmount === 0) return;

    setIsProcessing(true);
    try {
      const payments = await Promise.all(
        maquininhaOrderIds.map((orderId) =>
          fetch('/api/payments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId,
              amount: maquininhaAmount / maquininhaOrderIds.length,
              method: 'maquininha',
            }),
          }).then((r) => r.json())
        )
      );

      // Redirecionar para página de agradecimento
      window.location.href = '/plugins/customer-portal/thank-you';
    } catch (err) {
      console.error('Error processing maquininha payment:', err);
      alert('Erro ao processar pagamento');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayWithPix = async () => {
    if (!pixData || selectedOrderIds.length === 0) return;

    setIsProcessing(true);
    try {
      const payments = await Promise.all(
        selectedOrderIds.map((orderId) =>
          fetch('/api/payments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId,
              amount: Number(pixData.valor) / selectedOrderIds.length,
              method: 'pix',
            }),
          }).then((r) => r.json())
        )
      );

      // Redirecionar para página de agradecimento
      window.location.href = '/plugins/customer-portal/thank-you';
    } catch (err) {
      console.error('Error processing PIX payment:', err);
      alert('Erro ao processar pagamento PIX');
    } finally {
      setIsProcessing(false);
    }
  };

  // Tela de PIX
  if (showPixScreen && pixData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <button
            onClick={() => {
              setShowPixScreen(false);
              setPixData(null);
            }}
            className="mb-4 flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
            Voltar
          </button>
          <ComponentePix
            chave={pixData.chave}
            beneficiario={pixData.beneficiario}
            cidade={pixData.cidade}
            valor={pixData.valor}
          />
          <div className="mt-6 space-y-4">
            <Button
              variant="primary"
              size="md"
              onClick={handlePayWithPix}
              isLoading={isProcessing}
              className="w-full"
            >
              Pagar com PIX
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Tela de Aguardando Pagamento (Maquininha)
  if (showMaquininhaScreen) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <button
            onClick={() => {
              setShowMaquininhaScreen(false);
              setMaquininhaOrderIds([]);
              setMaquininhaAmount(0);
            }}
            className="mb-4 flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
            Cancelar
          </button>
          <Card title="Aguardando Pagamento" padding="lg">
            <div className="flex flex-col items-center justify-center py-8">
              <div className="mb-6 animate-spin text-brand">
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <p className="text-foreground text-center mb-6">
                Procure o atendente e realize o pagamento na maquinha de cartão.
              </p>
              <Button 
                variant="primary" 
                size="md"
                onClick={handleMaquininhaPaymentCompleted}
                isLoading={isProcessing}
                className="w-full"
              >
                Pagamento Realizado
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Tela de Venda Concluída
  if (showVendaConcluida) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card title="Venda Concluída" padding="lg">
            <div className="flex flex-col items-center justify-center py-8">
              <div className="mb-6 text-green-500">
                <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <p className="text-foreground text-center mb-6 text-lg">
                Obrigado! Seu pagamento foi confirmado.
              </p>
              <Button 
                variant="primary" 
                size="md"
                onClick={() => {
                  setShowVendaConcluida(false);
                  window.location.href = '/plugins/customer-portal/';
                }}
                className="w-full"
              >
                Voltar para o Início
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-2xl font-bold text-foreground">Checkout</h2>

      <Card padding="lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            Selecione os pedidos para pagar
          </h3>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleToggleAllOrders}
          >
            {selectedOrderIds.length === deliveredOrders.length && deliveredOrders.length > 0
              ? 'Desmarcar todos'
              : 'Pagar todos'}
          </Button>
        </div>

        {deliveredOrders.length === 0 ? (
          <p className="text-muted-foreground">Nenhum pedido entregue para pagar.</p>
        ) : (
          <div className="space-y-3">
            {deliveredOrders.map((order) => {
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
                <option value="pix">Pix</option>
                <option value="maquininha">Maquininha</option>
                <option value="celular">Pagar Pelo Celular</option>
              </select>
            </div>

            {/* Se for Pix, mostrar botão de Pagar com PIX */}
            {paymentMethod === 'pix' ? (
              <Button
                variant="primary"
                size="md"
                onClick={handleCheckout}
                isLoading={isProcessing}
                className="w-full"
              >
                Pagar com PIX
              </Button>
            ) : paymentMethod === 'celular' ? (
              <div className="space-y-4">
                <CheckoutButton
                  orderId={selectedOrderIds[0]}
                  variant="primary"
                  size="md"
                  className="w-full"
                />
                {selectedOrderIds.length > 1 && (
                  <p className="text-xs text-muted-foreground text-center">
                    Nota: O pagamento via Stripe será processado para o primeiro pedido selecionado.
                    Para outros pedidos, por favor realize pagamentos separados.
                  </p>
                )}
              </div>
            ) : (
              <Button
                variant="primary"
                size="md"
                onClick={handleCheckout}
                isLoading={isProcessing}
              >
                Confirmar Pagamento
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

// --- ThankYouPage ---
const ThankYouPage: React.FC = () => {
  const { checkIn } = useCustomerCheckIn();
  const { resolve } = useUI();
  const Card = resolve('Card');
  const Button = resolve('Button');
  const router = useRouter();

  if (!checkIn) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card padding="lg">
          <p className="text-muted-foreground">Nenhum check-in ativo.</p>
          <Button
            variant="primary"
            size="md"
            onClick={() => (window.location.href = '/plugins/customer-portal/')}
          >
            Fazer Check-in
          </Button>
        </Card>
      </div>
    );
  }

  const { orders: customerOrders, isLoading } = useCustomerOrders(checkIn.id);

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
    localStorage.removeItem('customerCheckIn');
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
            <span className="text-foreground font-medium">{checkIn.tableNumber}</span>
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
  layout: 'portal',
  routes: [
    {
      path: '',
      component: SelectTableStep,
      label: 'Portal do Cliente',
      showInMenu: false,
    },
    {
      path: 'checkin/:tableNumber',
      component: CheckInStep,
      label: 'Check-in',
      showInMenu: false,
    },
    {
      path: 'menu',
      component: MenuPage,
      label: 'Cardápio',
      showInMenu: true,
      icon: 'ShoppingCart',
    },
    {
      path: 'orders',
      component: OrdersPage,
      label: 'Pedidos',
      showInMenu: true,
      icon: 'List',
    },
    {
      path: 'checkout',
      component: CheckoutPage,
      label: 'Checkout',
      showInMenu: true,
      icon: 'CreditCard',
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
    getCustomerCheckIn: () => {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('customerCheckIn');
        return stored ? JSON.parse(stored) : null;
      }
      return null;
    },
  },
};
export { SelectTableStep }
export { CheckInStep }
export { MenuPage }
export { OrdersPage }
export { CheckoutPage }
export { ThankYouPage }