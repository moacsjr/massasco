'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FeaturePlugin,
  ExtensionContribution,
  ServicePlugin,
  pluginLoader,
} from '@temp-workspace/plugin-loader';
import { useUI } from '@temp-workspace/ui-registry';
import { ComponentePix } from './ComponentePix';
import { CheckoutButton } from './CheckoutButton';
// SSE Event handling - using EventSource directly

// ============================================================================
// Service API
// ============================================================================

export interface PaymentsAPI {
  calculateTotal(orderId: string): Promise<{ total: number; items: unknown[] }>;
  calculateCheckInTotal(checkInId: string): Promise<{ subTotal: number; totalPayments: number; totalDue: number }>;
  registerPayment(
    orderId: string,
    amount: number,
    method: string,
  ): Promise<unknown>;
  registerCheckInPayment(
    checkInId: string,
    amount: number,
    method: string,
  ): Promise<unknown>;
}

const paymentsAPI: PaymentsAPI = {
  async calculateTotal(orderId: string) {
    const res = await fetch(`/api/orders/${orderId}`);
    const order = await res.json();
    const total = (order.items || []).reduce((sum: number, item: any) => {
      const price = item.selectedPrice ? Number(item.selectedPrice.value) : 0;
      return sum + price * item.quantity;
    }, 0);
    return { total, items: order.items || [] };
  },
  async calculateCheckInTotal(checkInId: string) {
    const res = await fetch(`/api/checkins/${checkInId}`);
    const checkIn = await res.json();
    return checkIn.summary || { subTotal: 0, totalPayments: 0, totalDue: 0 };
  },
  async registerPayment(orderId: string, amount: number, method: string) {
    const res = await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, amount, method }),
    });
    return res.json();
  },
  async registerCheckInPayment(checkInId: string, amount: number, method: string) {
    const res = await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checkInId, amount, method }),
    });
    return res.json();
  },
};

// ============================================================================
// Feature — Payments Page
// ============================================================================

const PaymentsPage: React.FC = () => {
  const { resolve } = useUI();
  const Card = resolve('Card');
  const Button = resolve('Button');

  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [orderDetail, setOrderDetail] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [showPixScreen, setShowPixScreen] = useState<boolean>(false);
  const [pixData, setPixData] = useState<{ chave: string; beneficiario: string; cidade: string; valor: number } | null>(null);
  
  // Maquininha state
  const [showMaquininhaScreen, setShowMaquininhaScreen] = useState<boolean>(false);
  const [maquininhaOrderId, setMaquininhaOrderId] = useState<string | null>(null);
  const [maquininhaAmount, setMaquininhaAmount] = useState<number>(0);
  
  // Venda Concluída state
  const [showVendaConcluida, setShowVendaConcluida] = useState<boolean>(false);
  
  // Dados fixos para teste do PIX - em produção, isso viria de uma configuração ou API
  const pixConfig = {
    chave: '31991111108', // Chave PIX do estabelecimento
    beneficiario: 'Massas.CO', // Nome do beneficiário
    cidade: 'Belo Horizonte' // Cidade do beneficiário
  };
  
  // SSE listener for ORDER_CLOSED event
  useEffect(() => {
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

  // New state for CheckIn view
  const [checkIns, setCheckIns] = useState<any[]>([]);
  const [selectedCheckInId, setSelectedCheckInId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/orders')
      .then((r) => r.json())
      .then((data) => setOrders(data || []));
  }, []);

  // Fetch open check-ins periodically
  useEffect(() => {
    const fetchCheckIns = async () => {
      try {
        // Get all open check-ins by fetching orders with check-in details
        const res = await fetch('/api/orders?status=OPEN');
        const data = await res.json();

        // Group orders by checkInId to simulate check-ins
        const checkInMap: any = {};
        data.forEach((order: any) => {
          if (order.checkIn && !checkInMap[order.checkIn.id]) {
            checkInMap[order.checkIn.id] = {
              checkIn: order.checkIn,
              orders: [],
              payments: [],
            };
          }
          if (order.checkIn && checkInMap[order.checkIn.id]) {
            checkInMap[order.checkIn.id].orders.push(order);
            checkInMap[order.checkIn.id].payments.push(...order.payments);
          }
        });

        const checkInList = Object.entries(checkInMap).map(([id, data]: any) => ({
          id,
          ...data,
          tableNumber: data.checkIn.tableNumber,
        }));

        setCheckIns(checkInList);
      } catch (err) {
        console.error('Error fetching check-ins:', err);
      }
    };

    fetchCheckIns();
  }, []);

  const selectOrder = async (orderId: string) => {
    setSelectedOrder(orderId);
    const res = await fetch(`/api/orders/${orderId}`);
    const detail = await res.json();
    setOrderDetail(detail);
    const payRes = await fetch(`/api/payments?orderId=${orderId}`);
    const payData = await payRes.json();
    setPayments(payData || []);
    // Calculate remaining and pre-fill payment amount
    const orderTotal = (detail.items || []).reduce((sum: number, item: any) => {
      const price = item.selectedPrice ? Number(item.selectedPrice.value) : 0;
      return sum + price * item.quantity;
    }, 0);
    const paidAmount = payData.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
    const remainingAmount = orderTotal - paidAmount;
    setPaymentAmount(remainingAmount.toFixed(2));
  };

  const selectCheckIn = async (checkInId: string) => {
    setSelectedCheckInId(checkInId);
    setSelectedOrder(null);

    // Fetch full check-in with payment summary
    const res = await fetch(`/api/checkins/${checkInId}`);
    const data = await res.json();

    if (data) {
      setOrderDetail({ ...data, orders: data.orders || [] });

      // Get all payments for this check-in
      const payRes = await fetch(`/api/payments?checkInId=${checkInId}`);
      const payData = await payRes.json();
      setPayments(payData || []);

      // Pre-fill payment amount with total due
      if (data.summary?.totalDue) {
        setPaymentAmount(data.summary.totalDue.toFixed(2));
      }
    }
  };

  const submitPayment = async () => {
    if (!paymentAmount) return;

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
      setMaquininhaOrderId(selectedOrder);
      setMaquininhaAmount(Number(paymentAmount));
      setShowMaquininhaScreen(true);
      return;
    }

    // Determine if we're paying for an order or check-in
    let res;
    if (selectedCheckInId) {
      res = await paymentsAPI.registerCheckInPayment(
        selectedCheckInId,
        Number(paymentAmount),
        paymentMethod,
      );
    } else if (selectedOrder) {
      res = await paymentsAPI.registerPayment(
        selectedOrder,
        Number(paymentAmount),
        paymentMethod,
      );
    }

    setPaymentAmount('');
    if (selectedCheckInId) {
      selectCheckIn(selectedCheckInId);
    } else if (selectedOrder) {
      selectOrder(selectedOrder);
    }
  };

  // Handle maquininha payment completion
  const handleMaquininhaPaymentCompleted = async () => {
    if (maquininhaAmount === 0) return;

    // Determine if we're paying for an order or check-in
    if (selectedCheckInId) {
      await paymentsAPI.registerCheckInPayment(
        selectedCheckInId,
        maquininhaAmount,
        'maquininha',
      );
      setMaquininhaOrderId(null);
      setMaquininhaAmount(0);
      setShowMaquininhaScreen(false);
      selectCheckIn(selectedCheckInId);
    } else if (maquininhaOrderId) {
      await paymentsAPI.registerPayment(
        maquininhaOrderId,
        maquininhaAmount,
        'maquininha',
      );
      setMaquininhaOrderId(null);
      setMaquininhaAmount(0);
      setShowMaquininhaScreen(false);
      selectOrder(maquininhaOrderId);
    }
  };

  // Calculate totals based on current selection (order or check-in)
  const summary = orderDetail?.summary;
  const orderItems = orderDetail?.orders ? orderDetail.orders.flatMap((o: any) => o.items) : (orderDetail?.items || []);
  const total = summary?.subTotal ?? (orderItems.reduce((sum: number, item: any) => {
    const price = item.selectedPrice ? Number(item.selectedPrice.value) : 0;
    return sum + price * item.quantity;
  }, 0));
  const paid = summary?.totalPayments ?? payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const remaining = summary?.totalDue ?? (total - paid);

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
              setMaquininhaOrderId(null);
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
                  setSelectedOrder(null);
                  setOrders([]);
                  fetch('/api/orders').then((r) => r.json()).then((data) => setOrders(data || []));
                }}
              >
                Voltar para Pedidos
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[800px]">
      <Card title="Pagamentos" padding="lg">
        {!selectedOrder && !selectedCheckInId ? (
          <>
            <h4 className="text-foreground mb-4">Check-ins Ativos</h4>
            {checkIns.length === 0 ? (
              <p className="text-muted-foreground">Nenhum check-in ativo.</p>
            ) : (
              <ul className="list-none p-0 space-y-2">
                {checkIns.map((checkIn: any) => {
                  // Calculate total from all orders in check-in
                  const checkInTotal = checkIn.orders.reduce((sum: number, order: any) => {
                    return sum + order.items.reduce((orderSum: number, item: any) => {
                      const price = item.selectedPrice ? Number(item.selectedPrice.value) : 0;
                      return orderSum + price * item.quantity;
                    }, 0);
                  }, 0);

                  // Calculate total payments
                  const checkInPaid = checkIn.payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
                  const checkInRemaining = checkInTotal - checkInPaid;

                  return (
                    <li
                      key={checkIn.id}
                      className="
                        py-3 border border-border rounded cursor-pointer
                        hover:bg-secondary transition-colors
                      "
                      onClick={() => selectCheckIn(checkIn.id)}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-foreground">
                          <strong>Mesa {checkIn.tableNumber}</strong>
                          <span className="text-xs text-muted-foreground ml-2">
                            ({checkIn.orders.length} pedidos)
                          </span>
                        </span>
                        <div className="text-right">
                          <span className="font-semibold text-brand">
                            R$ {checkInRemaining.toFixed(2)}
                            <span className="text-xs text-muted-foreground ml-1">a pagar</span>
                          </span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {checkIns.length > 0 && (
              <div className="my-6 border-t border-border pt-6">
                <h4 className="text-foreground mb-4">ou Pedidos Individuais</h4>
              </div>
            )}

            <h4 className="text-foreground">Pedidos Abertos</h4>
            {orders.filter(
              (o) => o.status === 'OPEN' || o.status === 'AWAITING_PAYMENT',
            ).length === 0 ? (
              <p className="text-muted-foreground">Nenhum pedido aberto.</p>
            ) : (
              <ul className="list-none p-0 space-y-2">
                {orders
                  .filter(
                    (o) =>
                      o.status === 'OPEN' || o.status === 'AWAITING_PAYMENT',
                  )
                  .map((o) => {
                    const orderTotal = (o.items || []).reduce(
                      (sum: number, item: any) => {
                        const price = item.selectedPrice
                          ? Number(item.selectedPrice.value)
                          : 0;
                        return sum + price * item.quantity;
                      },
                      0,
                    );
                    return (
                      <li
                        key={o.id}
                        className="
                          py-3 border border-border rounded cursor-pointer
                          hover:bg-secondary transition-colors
                        "
                        onClick={() => selectOrder(o.id)}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-foreground">
                            <strong>Mesa {o.tableNumber}</strong> — {o.status}
                          </span>
                          <span className="font-semibold text-brand">
                            R$ {orderTotal.toFixed(2)}
                          </span>
                        </div>
                      </li>
                    );
                  })}
              </ul>
            )}
          </>
        ) : (
          <>
            <button
              onClick={() => {
                setSelectedOrder(null);
                setSelectedCheckInId(null);
              }}
              className="mb-4 border-none bg-transparent cursor-pointer text-muted-foreground text-sm hover:text-foreground transition-colors"
            >
              ← Voltar
            </button>

            <Card title={`Mesa ${orderDetail?.tableNumber || orderDetail?.checkIn?.tableNumber}`} padding="md">
              {/* Show summary if available (check-in view) */}
              {summary ? (
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase mb-3">
                      Resumo do Check-in
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">SubTotal:</span>
                        <span className="font-medium">R$ {summary.subTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-green-400">
                        <span>Pagamentos:</span>
                        <span>R$ {summary.totalPayments.toFixed(2)}</span>
                      </div>
                      {summary.totalDue > 0 && (
                        <div className="flex justify-between text-destructive font-bold">
                          <span>Total a pagar:</span>
                          <span>R$ {summary.totalDue.toFixed(2)}</span>
                        </div>
                      )}
                      {summary.totalDue <= 0 && (
                        <div className="flex justify-between text-green-400 font-bold">
                          <span>Pago:</span>
                          <span>R$ {summary.subTotal.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* All items from all orders */}
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase mb-3">
                      Itens do Pedido
                    </h4>
                    <ul className="space-y-2">
                      {(orderDetail.orders?.flatMap((order: any) => order.items) || []).map((item: any) => (
                        <li key={item.id} className="flex justify-between text-sm py-2 border-b border-border last:border-0">
                          <span className="text-foreground">{item.product.name} × {item.quantity}</span>
                          <span className="text-foreground">
                            R$ {((item.selectedPrice?.value || 0) * item.quantity).toFixed(2)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Payment history */}
                  {payments.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase mb-3">
                        Pagamentos
                      </h4>
                      <ul className="space-y-2">
                        {payments.map((payment: any) => (
                          <li key={payment.id} className="flex justify-between text-sm py-2 border-b border-border last:border-0">
                            <span className="text-green-400">
                              {payment.method === 'pix' && '📱 Pix'}
                              {payment.method === 'maquininha' && '💳 Maquininha'}
                              {payment.method === 'celular' && '📱 Celular'}
                            </span>
                            <span className="text-green-400">- R$ {Number(payment.amount).toFixed(2)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* Items for order-only view */}
                  <ul className="list-none p-0">
                    {(orderDetail?.items || []).map((item: any) => {
                      const price = item.selectedPrice
                        ? Number(item.selectedPrice.value)
                        : 0;
                      return (
                        <li
                          key={item.id}
                          className="py-1.5 flex justify-between text-foreground"
                        >
                          <span>
                            {item.product.name} × {item.quantity}
                          </span>
                          <span>R$ {(price * item.quantity).toFixed(2)}</span>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}

              <div className="flex justify-between font-bold mt-3 pt-3 border-t-2 border-border text-foreground">
                <span>Total:</span>
                <span>R$ {total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-green-400">
                <span>Pago:</span>
                <span>R$ {paid.toFixed(2)}</span>
              </div>
              {remaining > 0 && (
                <div className="flex justify-between text-destructive font-semibold">
                  <span>Restante:</span>
                  <span>R$ {remaining.toFixed(2)}</span>
                </div>
              )}

              {/* Payment form */}
              {remaining > 0 && (
                <div className="mt-4 flex gap-2 items-center">
                  <input
                    type="number"
                    placeholder="Valor"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    min={0.01}
                    step={0.01}
                    className="
                      px-2.5 py-1.5 border border-border rounded text-sm
                      bg-card text-foreground w-[100px]
                      focus:outline-none focus:ring-2 focus:ring-brand
                    "
                  />
                   <select
                     value={paymentMethod}
                     onChange={(e) => setPaymentMethod(e.target.value)}
                     className="
                       px-2.5 py-1.5 border border-border rounded text-sm
                       bg-card text-foreground
                       focus:outline-none focus:ring-2 focus:ring-brand
                     "
                   >
                     <option value="pix">📱 Pix</option>
                     <option value="maquininha">💳 Maquininha</option>
                     <option value="celular">📱 Pagar Pelo Celular</option>
                   </select>
                  <Button variant="primary" size="sm" onClick={submitPayment}>
                    Registrar Pagamento
                  </Button>
                </div>
              )}
              {remaining <= 0 && (
                <div className="mt-4 py-3 px-4 bg-green-900/30 rounded-lg text-center font-semibold text-green-400">
                  ✅ Pedido Pago
                </div>
              )}
            </Card>
          </>
        )}
      </Card>
    </div>
  );
};

// ============================================================================
// Plugin Registration
// ============================================================================

export const paymentsServicePlugin: ServicePlugin = {
  id: 'payments',
  name: 'Payments Service',
  type: 'service',
  api: paymentsAPI,
};

export const paymentsFeaturePlugin: FeaturePlugin = {
  id: 'payments-ui',
  name: 'Payments',
  type: 'feature',
  layout: 'admin',
  routes: [
    {
      path: '',
      component: PaymentsPage,
      label: 'Pagamentos',
      icon: 'CircleDollarSign',
      showInMenu: true,
    },
  ],
};
