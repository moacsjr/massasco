'use client';

import React from 'react';
import {
  FeaturePlugin,
} from '@temp-workspace/plugin-loader';
import { useUI } from '@temp-workspace/ui-registry';

// ============================================================================
// Types
// ============================================================================

interface Participant {
  id: string;
  tableSessionId: string;
  name: string;
  email?: string;
  phone?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  joinedAt?: string;
  approvedAt?: string;
  role: 'HOST' | 'GUEST';
  deviceSessions?: DeviceSession[];
}

interface DeviceSession {
  id: string;
  participantId: string;
  sessionId: string;
  deviceInfo?: any;
  ipaddress?: string;
  location?: any;
  expiresAt: string;
  createdAt: string;
  lastActive: string;
}

interface Order {
  id: string;
  checkInId: string;
  tableSessionId: string;
  tableNumber: number;
  customerName: string;
  status: 'OPEN' | 'AWAITING_PAYMENT' | 'PAID' | 'CLOSED';
  items: OrderItem[];
  payments: Payment[];
  createdAt: string;
  updatedAt: string;
}

interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  product: Product;
  quantity: number;
  notes?: string;
  status: 'PENDING' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED';
  selectedPriceId?: string;
  selectedPrice?: ProductPrice;
  selectedComplements?: any[];
  sentAt?: string;
  deliveredAt?: string;
  createdAt: string;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  categoryId: string;
  prices: ProductPrice[];
  complements: ProductComplement[];
  createdAt: string;
}

interface ProductPrice {
  id: string;
  productId: string;
  description: string;
  value: number;
  createdAt: string;
}

interface ProductComplement {
  id: string;
  productId: string;
  group: string;
  title: string;
  description?: string;
  value: number;
  createdAt: string;
}

interface Payment {
  id: string;
  orderId?: string;
  checkInId: string;
  amount: number;
  method: string;
  createdAt: string;
}

// ============================================================================
// ParticipantList Component
// ============================================================================

interface ParticipantListProps {
  tableSessionId: string;
  onBack: () => void;
}

const ParticipantList: React.FC<ParticipantListProps> = ({
  tableSessionId,
  onBack,
}) => {
  const { resolve } = useUI();
  const Card = resolve('Card');
  const Button = resolve('Button');
  const Icon = resolve('Icon');

  const [participants, setParticipants] = React.useState<Participant[]>([]);
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [expandedParticipant, setExpandedParticipant] = React.useState<string | null>(null);

  // Fetch participants and orders
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch participants
        const participantsRes = await fetch(`/api/participants?tableSessionId=${tableSessionId}`);
        if (!participantsRes.ok) throw new Error('Failed to fetch participants');
        const participantsData = await participantsRes.json();
        setParticipants(participantsData);

        // Fetch orders for this session
        const ordersRes = await fetch(`/api/orders?tableSessionId=${tableSessionId}`);
        if (!ordersRes.ok) throw new Error('Failed to fetch orders');
        const ordersData = await ordersRes.json();
        setOrders(ordersData);
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tableSessionId]);

  // Get orders for a participant
  const getParticipantOrders = (participantId: string) => {
    // Orders are linked by tableSessionId, not directly by participant
    // So we return all orders for the session
    return orders.filter((order) => order.tableSessionId === tableSessionId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'PENDING':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'REJECTED':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'EXPIRED':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getRoleBadge = (role: string) => {
    if (role === 'HOST') {
      return <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">HOST</span>;
    }
    return <span className="text-xs bg-gray-500/20 text-gray-400 px-2 py-0.5 rounded">GUEST</span>;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (loading) {
    return (
      <div className="max-w-[1200px]">
        <Card title="Participantes" padding="lg">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px]">
      <Card title="Participantes" padding="lg">
        {/* Back button */}
        <div className="mb-4">
          <Button variant="outline" size="sm" onClick={onBack}>
            <Icon name="ArrowLeft" size="sm" />
            <span className="ml-2">Voltar para Mesas</span>
          </Button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        {/* Header */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            Total de {participants.length} participante(s)
          </p>
        </div>

        {/* Empty state */}
        {participants.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum participante registrado.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {participants.map((participant) => (
              <div
                key={participant.id}
                className="
                  rounded-lg border
                  bg-card hover:bg-surface-elevated
                  transition-colors duration-150
                "
              >
                {/* Participant header */}
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => {
                    setExpandedParticipant(
                      expandedParticipant === participant.id ? null : participant.id
                    );
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                        {participant.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-semibold text-foreground">
                            {participant.name}
                          </h3>
                          {getRoleBadge(participant.role)}
                        </div>
                        {participant.email && (
                          <p className="text-sm text-muted-foreground">{participant.email}</p>
                        )}
                        {participant.phone && (
                          <p className="text-sm text-muted-foreground">{participant.phone}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`
                          px-2 py-1 rounded text-xs font-medium border
                          ${getStatusColor(participant.status)}
                        `}
                      >
                        {participant.status === 'APPROVED' && 'Aprovado'}
                        {participant.status === 'PENDING' && 'Pendente'}
                        {participant.status === 'REJECTED' && 'Rejeitado'}
                        {participant.status === 'EXPIRED' && 'Expirado'}
                      </span>
                      <Icon
                        name={
                          expandedParticipant === participant.id
                            ? 'ChevronUp'
                            : 'ChevronDown'
                        }
                        size="md"
                      />
                    </div>
                  </div>
                </div>

                {/* Expanded orders section */}
                {expandedParticipant === participant.id && (
                  <div className="border-t border-border bg-surface-elevated/50">
                    <div className="p-4">
                      <h4 className="text-sm font-semibold mb-3 text-foreground">
                        Pedidos ({getParticipantOrders(participant.id).length})
                      </h4>

                      {getParticipantOrders(participant.id).length === 0 ? (
                        <div className="text-center py-4">
                          <p className="text-sm text-muted-foreground">
                            Nenhum pedido registrado.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {getParticipantOrders(participant.id).map((order) => (
                            <div
                              key={order.id}
                              className="rounded-lg border border-border bg-card p-3"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <span
                                    className={`
                                      px-2 py-0.5 rounded text-xs font-medium border
                                      ${
                                        order.status === 'OPEN'
                                          ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                          : order.status === 'AWAITING_PAYMENT'
                                          ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                                          : order.status === 'PAID'
                                          ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                          : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                                      }
                                    `}
                                  >
                                    {order.status === 'OPEN' && 'Aberto'}
                                    {order.status === 'AWAITING_PAYMENT' && 'Aguardando Pagamento'}
                                    {order.status === 'PAID' && 'Pago'}
                                    {order.status === 'CLOSED' && 'Fechado'}
                                  </span>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {new Date(order.createdAt).toLocaleString('pt-BR')}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-semibold text-foreground">
                                    {formatCurrency(
                                      order.items.reduce(
                                        (sum, item) =>
                                          sum +
                                          (item.selectedPrice?.value || 0) * item.quantity,
                                        0
                                      )
                                    )}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {order.items.length} item(s)
                                  </p>
                                </div>
                              </div>

                              {/* Order items */}
                              <div className="mt-3 space-y-2">
                                {order.items.map((item) => (
                                  <div key={item.id} className="text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-foreground">
                                        {item.quantity}x {item.product.name}
                                      </span>
                                      <span className="text-muted-foreground">
                                        {formatCurrency(
                                          (item.selectedPrice?.value || 0) * item.quantity
                                        )}
                                      </span>
                                    </div>
                                    {item.selectedComplements &&
                                      Array.isArray(item.selectedComplements) &&
                                      item.selectedComplements.length > 0 && (
                                        <div className="text-xs text-muted-foreground mt-1">
                                          {(() => {
                                            const complements = item.selectedComplements as any[];
                                            return complements.map(
                                              (comp: any, idx: number) => (
                                                <span key={idx}>
                                                  + {comp.title || comp.group}
                                                  {idx < complements.length - 1 ? ', ' : ''}
                                                </span>
                                              )
                                            );
                                          })()}
                                        </div>
                                      )}
                                    {item.notes && (
                                      <p className="text-xs text-muted-foreground mt-1 italic">
                                        Nota: {item.notes}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

// ============================================================================
// Plugin Registration
// ============================================================================

export const participantListPlugin: FeaturePlugin = {
  id: 'participant-list',
  name: 'Lista de Participantes',
  type: 'feature',
  layout: 'admin',
  icon: 'Users',
  routes: [
    {
      path: '/participants/:tableSessionId',
      component: ParticipantList,
      label: 'Participantes',
      icon: 'Users',
      showInMenu: false,
    },
  ],
};

// Named export for the component
export { ParticipantList };
