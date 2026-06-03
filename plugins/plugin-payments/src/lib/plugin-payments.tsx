'use client';

import React, { useState, useEffect } from 'react';
import {
  FeaturePlugin,
  ExtensionContribution,
  ServicePlugin,
  pluginLoader,
} from '@temp-workspace/plugin-loader';
import { useUI } from '@temp-workspace/ui-registry';
import { ComponentePix } from './ComponentePix';
import { CheckoutButton } from './CheckoutButton';

// ============================================================================
// Service API
// ============================================================================

export interface PaymentsAPI {
  calculateTotal(orderId: string): Promise<{ total: number; items: unknown[] }>;
  registerPayment(
    orderId: string,
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
  async registerPayment(orderId: string, amount: number, method: string) {
    const res = await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, amount, method }),
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

  // Dados fixos para teste do PIX - em produção, isso viria de uma configuração ou API
  const pixConfig = {
    chave: 'suachave@email.com', // Chave PIX do estabelecimento
    beneficiario: 'Fulano de Tal', // Nome do beneficiário
    cidade: 'Sao Paulo' // Cidade do beneficiário
  };

  useEffect(() => {
    fetch('/api/orders')
      .then((r) => r.json())
      .then((data) => setOrders(data || []));
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

  const submitPayment = async () => {
    if (!selectedOrder || !paymentAmount) return;

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

    await paymentsAPI.registerPayment(
      selectedOrder,
      Number(paymentAmount),
      paymentMethod,
    );
    setPaymentAmount('');
    selectOrder(selectedOrder);
  };

  const total = orderDetail
    ? (orderDetail.items || []).reduce((sum: number, item: any) => {
        const price = item.selectedPrice ? Number(item.selectedPrice.value) : 0;
        return sum + price * item.quantity;
      }, 0)
    : 0;
  const paid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const remaining = total - paid;

  // Tela de PIX
  if (showPixScreen && pixData) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
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

  return (
    <div className="max-w-[800px]">
      <Card title="Pagamentos" padding="lg">
        {!selectedOrder ? (
          <>
            <h4 className="text-foreground">Pedidos Abertos</h4>
            {orders.filter(
              (o) => o.status === 'OPEN' || o.status === 'AWAITING_PAYMENT',
            ).length === 0 ? (
              <p className="text-muted-foreground">Nenhum pedido aberto.</p>
            ) : (
              <ul className="list-none p-0">
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
                          py-3 border-b border-border cursor-pointer
                          flex justify-between items-center
                          hover:bg-secondary transition-colors rounded px-2 -mx-2
                        "
                        onClick={() => selectOrder(o.id)}
                      >
                        <span className="text-foreground">
                          <strong>Mesa {o.tableNumber}</strong> — {o.status}
                        </span>
                        <span className="font-semibold text-brand">
                          R$ {orderTotal.toFixed(2)}
                        </span>
                      </li>
                    );
                  })}
              </ul>
            )}
          </>
        ) : (
          <>
            <button
              onClick={() => setSelectedOrder(null)}
              className="mb-4 border-none bg-transparent cursor-pointer text-muted-foreground text-sm hover:text-foreground transition-colors"
            >
              ← Voltar
            </button>

            <Card title={`Mesa ${orderDetail?.tableNumber}`} padding="md">
              {/* Items */}
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
