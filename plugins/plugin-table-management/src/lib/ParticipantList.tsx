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

interface JoinRequest {
  id: string;
  tableSessionId: string;
  requesterName: string;
  requesterEmail?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  requestedAt: string;
  responseMessage?: string;
}

interface OrderItem {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    description?: string;
    prices: Array<{ value: number }>;
  };
  quantity: number;
  notes?: string;
  selectedPrice?: { value: number };
}

interface Order {
  id: string;
  tableSessionId: string;
  customerName: string;
  status: 'OPEN' | 'AWAITING_PAYMENT' | 'PAID' | 'CLOSED';
  items: OrderItem[];
  createdAt: string;
}

interface TableSessionSummary {
  subTotal: number;
  totalPayments: number;
  totalDue: number;
  isFullyPaid: boolean;
}

// ============================================================================
// ParticipantList Component
// ============================================================================

interface ParticipantListProps {
  params?: { tableSessionId?: string };
  tableSessionId?: string;
  onBack?: () => void;
}

const ParticipantList: React.FC<ParticipantListProps> = ({
  params,
  tableSessionId: directTableSessionId,
  onBack,
}) => {
  // Extract tableSessionId from params (plugin router) or direct prop
  const tableSessionId = params?.tableSessionId || directTableSessionId || '';
  
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.location.href = '/plugins/table-management';
    }
  };
  const { resolve } = useUI();
  const Card = resolve('Card');
  const Button = resolve('Button');
  const Icon = resolve('Icon');

  const [participants, setParticipants] = React.useState<Participant[]>([]);
  const [joinRequests, setJoinRequests] = React.useState<JoinRequest[]>([]);
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [processingId, setProcessingId] = React.useState<string | null>(null);
  const [expandedParticipant, setExpandedParticipant] = React.useState<string | null>(null);
  const [sessionSummary, setSessionSummary] = React.useState<TableSessionSummary | null>(null);
  const [isClosingSession, setIsClosingSession] = React.useState(false);

  // Fetch all data
  const fetchData = React.useCallback(async () => {
    try {
      // Fetch participants
      const participantsRes = await fetch(`/api/participants?tableSessionId=${tableSessionId}`);
      if (participantsRes.ok) {
        const participantsData = await participantsRes.json();
        setParticipants(participantsData);
      }

      // Fetch pending join requests
      const requestsRes = await fetch(`/api/participant-join-requests?tableSessionId=${tableSessionId}`);
      if (requestsRes.ok) {
        const requestsData = await requestsRes.json();
        setJoinRequests(requestsData);
      } else {
        console.error('Failed to fetch join requests:', requestsRes.statusText);
      }

      // Fetch orders for this session
      const ordersRes = await fetch(`/api/orders?tableSessionId=${tableSessionId}`);
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(ordersData);
      }

      // Fetch session summary
      const sessionRes = await fetch(`/api/table-sessions/${tableSessionId}`);
      if (sessionRes.ok) {
        const sessionData = await sessionRes.json();
        setSessionSummary(sessionData.summary);
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [tableSessionId]);

  React.useEffect(() => {
    fetchData();

    // SSE listener for JOIN_REQUEST_APPROVED events (real-time updates)
    const eventSource = new EventSource('/api/events');
    eventSource.addEventListener('JOIN_REQUEST_APPROVED', () => {
      // Refresh data when a request is approved
      fetchData();
    });
    eventSource.addEventListener('JOIN_REQUEST_REJECTED', () => {
      // Refresh data when a request is rejected
      fetchData();
    });
    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [tableSessionId, fetchData]);

  // Handle close session
  const handleCloseSession = async () => {
    if (!sessionSummary?.isFullyPaid) {
      setError('Não é possível encerrar a sessão. Existem pedidos não pagos.');
      return;
    }

    if (!confirm('Tem certeza que deseja encerrar esta sessão? Esta ação não pode ser desfeita.')) {
      return;
    }

    setIsClosingSession(true);
    setError(null);

    try {
      const res = await fetch(`/api/table-sessions/${tableSessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'CLOSED',
          closedBy: 'Administrador',
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Erro ao encerrar sessão');
      }

      setSuccess('Sessão encerrada com sucesso! A mesa foi liberada.');
      setTimeout(() => {
        handleBack();
      }, 2000);
    } catch (err: any) {
      console.error('Error closing session:', err);
      setError(err.message || 'Erro ao encerrar sessão');
    } finally {
      setIsClosingSession(false);
    }
  };

  // Get orders for a participant
  const getParticipantOrders = (participantName: string) => {
    return orders.filter((order) => order.customerName === participantName);
  };

  const calculateOrderTotal = (orderItems: OrderItem[]) => {
    return orderItems.reduce((sum, item) => {
      const price = item.selectedPrice?.value || 0;
      return sum + price * item.quantity;
    }, 0);
  };

  const handleApprove = async (joinRequestId: string) => {
    setProcessingId(joinRequestId);
    try {
      const res = await fetch('/api/participant-join-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          joinRequestId,
          action: 'APPROVE',
          approverName: 'Administrador',
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Erro ao aprovar');
      }

      setSuccess('Check-in aprovado com sucesso!');
      setTimeout(() => setSuccess(null), 3000);
      // Data will be refreshed via SSE
    } catch (err: any) {
      console.error('Error approving:', err);
      setError(err.message || 'Erro ao aprovar check-in');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (joinRequestId: string) => {
    setProcessingId(joinRequestId);
    try {
      const res = await fetch('/api/participant-join-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          joinRequestId,
          action: 'REJECT',
          approverName: 'Administrador',
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Erro ao rejeitar');
      }

      setSuccess('Check-in rejeitado');
      setTimeout(() => setSuccess(null), 3000);
      // Data will be refreshed via SSE
    } catch (err: any) {
      console.error('Error rejecting:', err);
      setError(err.message || 'Erro ao rejeitar check-in');
    } finally {
      setProcessingId(null);
    }
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
        <Card title="Participantes e Check-ins Pendentes" padding="lg">
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
      <Card title="Participantes e Check-ins Pendentes" padding="lg">
        {/* Header with back button and close session button */}
        <div className="mb-4 flex justify-between items-center">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <Icon name="ArrowLeft" size="sm" />
            <span className="ml-2">Voltar para Mesas</span>
          </Button>

          {/* Close Session Button - Only show when fully paid */}
          {sessionSummary?.isFullyPaid && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleCloseSession}
              isLoading={isClosingSession}
              className="bg-red-600 hover:bg-red-700"
            >
              <Icon name="Power" size="sm" />
              <span className="ml-2">Encerrar Mesa</span>
            </Button>
          )}
        </div>

        {/* Session Summary */}
        {sessionSummary && (
          <div className="mb-4 p-4 bg-muted rounded-lg">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase mb-3">
              Resumo da Sessão
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Subtotal</p>
                <p className="text-lg font-semibold text-foreground">
                  {formatCurrency(sessionSummary.subTotal)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pagamentos</p>
                <p className="text-lg font-semibold text-green-400">
                  {formatCurrency(sessionSummary.totalPayments)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {sessionSummary.isFullyPaid ? 'Status' : 'Restante'}
                </p>
                {sessionSummary.isFullyPaid ? (
                  <p className="text-lg font-semibold text-green-400">
                    ✅ Pago
                  </p>
                ) : (
                  <p className="text-lg font-semibold text-destructive">
                    {formatCurrency(sessionSummary.totalDue)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg border border-green-200 dark:border-green-800">
            {success}
          </div>
        )}

        {/* Pending Join Requests Section */}
        {joinRequests && joinRequests.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <Icon name="Clock" size="sm" />
              Check-ins ({joinRequests.length})
            </h3>
            <div className="space-y-3">
              {joinRequests.map((request) => {
                const participantOrders = getParticipantOrders(request.requesterName);
                const totalOrders = participantOrders.reduce((sum, order) => 
                  sum + calculateOrderTotal(order.items), 0
                );

                return (
                  <div
                    key={request.id}
                    className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center text-white font-semibold text-sm">
                            {request.requesterName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-semibold text-foreground">{request.requesterName}</h4>
                            {request.requesterEmail && (
                              <p className="text-xs text-muted-foreground">{request.requesterEmail}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-xs text-muted-foreground mb-2">
                          Solicitado em: {new Date(request.requestedAt).toLocaleString('pt-BR')}
                        </div>

                        {/* Orders summary for this participant */}
                        {participantOrders.length > 0 && (
                          <div className="mt-2 p-2 bg-card rounded border border-border">
                            <p className="text-xs font-medium text-foreground mb-1">
                              Pedidos ({participantOrders.length}):
                            </p>
                            {participantOrders.map((order) => (
                              <div key={order.id} className="text-xs text-muted-foreground">
                                <span className={`
                                  px-1 py-0.5 rounded text-[10px] font-medium
                                  ${order.status === 'OPEN' ? 'bg-blue-500/20 text-blue-400' : ''}
                                  ${order.status === 'AWAITING_PAYMENT' ? 'bg-yellow-500/20 text-yellow-400' : ''}
                                  ${order.status === 'PAID' ? 'bg-green-500/20 text-green-400' : ''}
                                `}>
                                  {order.status === 'OPEN' ? 'Aberto' : 
                                   order.status === 'AWAITING_PAYMENT' ? 'Aguardando Pagamento' : 'Pago'}
                                </span>
                                {' '}— {formatCurrency(calculateOrderTotal(order.items))}
                              </div>
                            ))}
                            <div className="text-xs font-semibold text-foreground mt-1">
                              Total: {formatCurrency(totalOrders)}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      {request.status === 'PENDING' && (
                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleApprove(request.id)}
                            isLoading={processingId === request.id}
                          >
                            <Icon name="Check" size="sm" />
                            <span className="ml-1">Aprovar</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReject(request.id)}
                            isLoading={processingId === request.id}
                            className="text-red-400 border-red-500/30 hover:bg-red-500/10"
                          >
                            <Icon name="X" size="sm" />
                            <span className="ml-1">Rejeitar</span>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Participants Section */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <Icon name="Users" size="sm" />
            Participantes ({participants.length})
          </h3>

          {/* Empty state */}
          {participants.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhum participante registrado.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className="rounded-lg border bg-card hover:bg-surface-elevated transition-colors duration-150"
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
                            {participant.role === 'HOST' ? (
                              <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">HOST</span>
                            ) : (
                              <span className="text-xs bg-gray-500/20 text-gray-400 px-2 py-0.5 rounded">GUEST</span>
                            )}
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
                        <span className={`
                          px-2 py-1 rounded text-xs font-medium border
                          ${participant.status === 'APPROVED' ? 'bg-green-500/20 text-green-400 border-green-500/30' : ''}
                          ${participant.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : ''}
                          ${participant.status === 'REJECTED' ? 'bg-red-500/20 text-red-400 border-red-500/30' : ''}
                          ${participant.status === 'EXPIRED' ? 'bg-gray-500/20 text-gray-400 border-gray-500/30' : ''}
                        `}>
                          {participant.status === 'APPROVED' ? 'Aprovado' : 
                           participant.status === 'PENDING' ? 'Pendente' : 
                           participant.status === 'REJECTED' ? 'Rejeitado' : 'Expirado'}
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
                          Pedidos ({getParticipantOrders(participant.name).length})
                        </h4>

                        {getParticipantOrders(participant.name).length === 0 ? (
                          <div className="text-center py-4">
                            <p className="text-sm text-muted-foreground">
                              Nenhum pedido registrado.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {getParticipantOrders(participant.name).map((order) => (
                              <div
                                key={order.id}
                                className="rounded-lg border border-border bg-card p-3"
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <span className={`
                                      px-2 py-0.5 rounded text-xs font-medium border
                                      ${order.status === 'OPEN' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : ''}
                                      ${order.status === 'AWAITING_PAYMENT' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : ''}
                                      ${order.status === 'PAID' ? 'bg-green-500/20 text-green-400 border-green-500/30' : ''}
                                    `}>
                                      {order.status === 'OPEN' ? 'Aberto' : 
                                       order.status === 'AWAITING_PAYMENT' ? 'Aguardando Pagamento' : 'Pago'}
                                    </span>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {new Date(order.createdAt).toLocaleString('pt-BR')}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm font-semibold text-foreground">
                                      {formatCurrency(calculateOrderTotal(order.items))}
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
        </div>
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
