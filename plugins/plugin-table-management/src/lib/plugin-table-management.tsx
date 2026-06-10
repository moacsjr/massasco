'use client';

import React from 'react';
import {
  FeaturePlugin,
} from '@temp-workspace/plugin-loader';
import { useUI } from '@temp-workspace/ui-registry';
import { ParticipantList } from './ParticipantList';
import { CheckInView } from './CheckInView';

// ============================================================================
// Types
// ============================================================================

interface Table {
  id: string;
  number: number;
  name?: string;
  token?: string;
  isActive: boolean;
  qrCodeUrl?: string;
  createdAt?: string;
  sessions?: TableSession[];
  tableAccessTokens?: TableAccessToken[];
}

interface TableWithSession extends Table {
  currentSession: TableSession;
}

interface TableAccessToken {
  id: string;
  token: string;
  isActive: boolean;
  revoked: boolean;
  revokedAt?: string;
  createdAt: string;
}

interface TableSession {
  id: string;
  tableNumber: number;
  customerName?: string;
  status: 'OPEN' | 'CLOSED' | 'AWAITING_PAYMENT';
  createdAt: string;
}

interface TableItem {
  table: Table;
  currentSession: TableSession | null;
}

// ============================================================================
// Table Management Component
// ============================================================================

const TableManagementView: React.FC = () => {
  const { resolve } = useUI();
  const Card = resolve('Card');
  const Button = resolve('Button');
  const Input = resolve('Input');
  const Icon = resolve('Icon');

  const [tables, setTables] = React.useState<TableItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = React.useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = React.useState(false);
  const [modalMode, setModalMode] = React.useState<'create' | 'edit' | null>(null);
  const [editingTable, setEditingTable] = React.useState<Table | null>(null);
  const [tableToDeactivate, setTableToDeactivate] = React.useState<Table | null>(null);
  const [tableToRegenerateQR, setTableToRegenerateQR] = React.useState<Table | null>(null);
  
  // Form states
  const [tableNumber, setTableNumber] = React.useState('');
  const [tableName, setTableName] = React.useState('');
  const [deactivationReason, setDeactivationReason] = React.useState('');
  const [qrAction, setQrAction] = React.useState<'generate' | 'download' | 'regenerate'>('generate');
  
  // Loading states
  const [isQRLoading, setIsQRLoading] = React.useState(false);
  const [isDownloadingQR, setIsDownloadingQR] = React.useState(false);
  const [isDownloadingAllQR, setIsDownloadingAllQR] = React.useState(false);
  
  // Generated QR code URL state
  const [generatedQrUrl, setGeneratedQrUrl] = React.useState<string | null>(null);

  // Fetch tables from /api/tables
  React.useEffect(() => {
    const fetchTables = async () => {
      try {
        const res = await fetch('/api/tables');
        if (!res.ok) throw new Error('Failed to fetch tables');
        const data = await res.json();
        
        // Group sessions by table number
        const tableMap = new Map<number, TableItem>();
        
        data.forEach((table: Table) => {
          // Get the most recent session
          const sessions = table.sessions || [];
          const currentSession = sessions.length > 0 ? sessions[0] : null;
          
          tableMap.set(table.number, {
            table,
            currentSession,
          });
        });

        // Convert to array and sort by table number
        const sortedTables = Array.from(tableMap.values()).sort(
          (a, b) => a.table.number - b.table.number
        );
        
        setTables(sortedTables);
      } catch (err: any) {
        console.error('Error fetching tables:', err);
        setError(err.message || 'Erro ao carregar mesas');
      } finally {
        setLoading(false);
      }
    };

    fetchTables();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'AWAITING_PAYMENT':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'CLOSED':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getTableStatusBadge = (table: Table) => {
    if (!table.isActive) {
      return <span className="px-2 py-1 rounded text-xs font-medium bg-gray-500/20 text-gray-400 border border-gray-500/30">Inativa</span>;
    }
    
    if (table.sessions && table.sessions.length > 0) {
      const currentSession = table.sessions[0];
      if (currentSession.status === 'OPEN') {
        return (
          <span
            className={`
              px-2 py-1 rounded text-xs font-medium border
              ${getStatusColor(currentSession.status)}
            `}
          >
            Aberta
          </span>
        );
      }
    }
    return <span className="px-2 py-1 rounded text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">Disponível</span>;
  };

  const openCreateModal = () => {
    setModalMode('create');
    setTableNumber('');
    setTableName('');
    setEditingTable(null);
    setIsModalOpen(true);
  };

  const openEditModal = (table: Table) => {
    setModalMode('edit');
    setTableNumber(table.number.toString());
    setTableName(table.name || '');
    setEditingTable(table);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalMode(null);
    setEditingTable(null);
    setTableNumber('');
    setTableName('');
  };

  const openDeactivateModal = (table: Table) => {
    setTableToDeactivate(table);
    setDeactivationReason('');
    setIsDeactivateModalOpen(true);
  };

  const closeDeactivateModal = () => {
    setIsDeactivateModalOpen(false);
    setTableToDeactivate(null);
    setDeactivationReason('');
  };

  const openQRModal = (table: Table, action: 'generate' | 'download' | 'regenerate') => {
    setTableToRegenerateQR(table);
    setQrAction(action);
    setIsQRModalOpen(true);
  };

  const closeQRModal = () => {
    setIsQRModalOpen(false);
    setTableToRegenerateQR(null);
    setQrAction('generate');
    setGeneratedQrUrl(null);
  };

  const handleSave = async () => {
    if (!tableNumber) {
      setError('O número da mesa é obrigatório');
      return;
    }

    if (!modalMode) {
      setError('Modo inválido');
      return;
    }

    try {
      const payload = {
        number: parseInt(tableNumber, 10),
        name: tableName || undefined,
      };

      let res: Response;
      if (modalMode === 'create') {
        res = await fetch('/api/tables', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else if (modalMode === 'edit' && editingTable) {
        res = await fetch('/api/tables', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingTable.id,
            number: parseInt(tableNumber, 10),
            name: tableName || undefined,
          }),
        });
      } else {
        throw new Error('Modo inválido');
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Erro ao salvar mesa');
      }

      // Refresh tables list
      await fetchTables();
      closeModal();
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar mesa');
    }
  };

  const handleDeactivate = async () => {
    if (!tableToDeactivate) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/tables/${tableToDeactivate.id}/deactivate`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: deactivationReason || undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Erro ao desativar mesa');
      }

      await fetchTables();
      closeDeactivateModal();
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Erro ao desativar mesa');
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (tableId: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/tables/${tableId}/activate`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Erro ao ativar mesa');
      }

      await fetchTables();
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Erro ao ativar mesa');
    } finally {
      setLoading(false);
    }
  };

  const handleQRAction = async () => {
    if (!tableToRegenerateQR) return;

    setIsQRLoading(true);
    setIsDownloadingQR(false);
    setError(null);

    try {
      if (qrAction === 'generate' || qrAction === 'regenerate') {
        const res = await fetch('/api/qr-codes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tableId: tableToRegenerateQR.id,
            regenerate: qrAction === 'regenerate',
          }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Erro ao gerar QR Code');
        }

        const data = await res.json();
        setGeneratedQrUrl(data.qrCodeUrl);
        // Don't close modal - show the QR code image
        setIsQRLoading(false);
        return;
      } else if (qrAction === 'download') {
        setIsDownloadingQR(true);
        const res = await fetch(`/api/qr-codes/download?tableId=${tableToRegenerateQR.id}`);
        
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Erro ao baixar QR Code');
        }

        // Download PDF
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `qr-code-mesa-${tableToRegenerateQR.number}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }

      closeQRModal();
    } catch (err: any) {
      setError(err.message || 'Erro na operação do QR Code');
    } finally {
      setIsQRLoading(false);
      setIsDownloadingQR(false);
    }
  };

  const fetchTables = async () => {
    try {
      const res = await fetch('/api/tables');
      if (!res.ok) throw new Error('Failed to fetch tables');
      const data = await res.json();
      
      const tableMap = new Map<number, TableItem>();
      
      data.forEach((table: Table) => {
        const sessions = table.sessions || [];
        const currentSession = sessions.length > 0 ? sessions[0] : null;
        tableMap.set(table.number, { table, currentSession });
      });

      const sortedTables = Array.from(tableMap.values()).sort(
        (a, b) => a.table.number - b.table.number
      );
      
      setTables(sortedTables);
    } catch (err: any) {
      console.error('Error fetching tables:', err);
      setError(err.message || 'Erro ao carregar mesas');
    }
  };

  const handleDownloadAllQR = async () => {
    setIsDownloadingAllQR(true);
    setError(null);

    try {
      const res = await fetch('/api/qr-codes/download');

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Erro ao baixar QR Codes');
      }

      // Download PDF
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'qr-codes-todas-mesas.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || 'Erro ao baixar QR Codes de todas as mesas');
    } finally {
      setIsDownloadingAllQR(false);
    }
  };

  const handleDelete = async (tableId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta mesa?')) return;

    try {
      const res = await fetch('/api/tables', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: tableId }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Erro ao excluir mesa');
      }

      await fetchTables();
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir mesa');
    }
  };

  if (loading) {
    return (
      <div className="max-w-[1200px]">
        <Card title="Gerenciamento de Mesas" padding="lg">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px]">
      <Card title="Gerenciamento de Mesas" padding="lg">
        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        {/* Header with Action Buttons */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-foreground">
            Mesas Cadastradas
          </h2>
          <div className="flex gap-2">
            {tables.length > 0 && (
              <Button
                variant="outline"
                size="md"
                onClick={handleDownloadAllQR}
                isLoading={isDownloadingAllQR}
              >
                🖨️ Imprimir Todos QR Codes
              </Button>
            )}
            <Button variant="primary" size="md" onClick={openCreateModal}>
              + Adicionar Mesa
            </Button>
          </div>
        </div>

        {/* Empty state */}
        {tables.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhuma mesa registrada.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Clique em "Adicionar Mesa" para começar
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tables.map((item) => (
              <div
                key={item.table.id}
                className={`
                  p-4 rounded-lg border
                  ${item.table.isActive 
                    ? 'bg-card hover:bg-surface-elevated' 
                    : 'bg-gray-50 dark:bg-gray-800/50 opacity-60'}
                  transition-colors duration-150
                `}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {item.table.name || `Mesa ${item.table.number}`}
                    </h3>
                    {item.table.name && (
                      <p className="text-sm text-muted-foreground">
                        Mesa {item.table.number}
                      </p>
                    )}
                    {item.currentSession && item.currentSession.customerName && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {item.currentSession.customerName}
                      </p>
                    )}
                  </div>
                  {getTableStatusBadge(item.table)}
                </div>
                
                {item.currentSession && (
                  <div className="text-xs text-muted-foreground space-y-1 mb-3">
                    <p>Criado: {new Date(item.currentSession.createdAt).toLocaleString('pt-BR')}</p>
                  </div>
                )}
                
                {!item.currentSession && item.table.isActive && (
                  <p className="text-sm text-muted-foreground italic mb-3">
                    Sem sessão ativa
                  </p>
                )}

                {/* Action buttons */}
                <div className="flex gap-2 mt-3 pt-3 border-t border-border flex-wrap">
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(item.table)}
                    >
                      Editar
                    </Button>
                    
                    {item.table.isActive ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDeactivateModal(item.table)}
                        className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800"
                      >
                        <span className="mr-1">🛑</span> Desativar
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleActivate(item.table.id)}
                        className="text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 border-green-200 dark:border-green-800"
                      >
                        <span className="mr-1">✅</span> Ativar
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openQRModal(item.table, 'generate')}
                    >
                      <span className="mr-1">📱</span> QR Code
                    </Button>

                    {item.currentSession && item.currentSession.status === 'OPEN' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const sessionId = item.currentSession!.id;
                          window.location.href = `/plugins/table-management/participants/${sessionId}`;
                        }}
                      >
                        <span className="mr-1">👥</span> Participantes
                      </Button>
                    )}
                    
                    <button
                      onClick={() => handleDelete(item.table.id)}
                      className="
                        px-3 py-1.5 rounded-md text-sm font-medium
                        bg-red-600 text-white hover:bg-red-700
                        transition-colors
                      "
                      title="Excluir mesa"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Modal for Create/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4">
              {modalMode === 'create' ? 'Adicionar Mesa' : 'Editar Mesa'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Número da Mesa
                </label>
                <Input
                  name="tableNumber"
                  label="Número da Mesa"
                  type="number"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="Ex: 1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Nome (opcional)
                </label>
                <Input
                  name="tableName"
                  label="Nome (opcional)"
                  type="text"
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  placeholder="Ex: Mesa da Janela"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="md"
                  onClick={closeModal}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleSave}
                >
                  {modalMode === 'create' ? 'Salvar' : 'Atualizar'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Modal */}
      {isDeactivateModalOpen && tableToDeactivate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4 text-red-600 dark:text-red-400">
              Desativar Mesa {tableToDeactivate.number}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Motivo da desativação (opcional)
                </label>
                <textarea
                  value={deactivationReason}
                  onChange={(e) => setDeactivationReason(e.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-brand min-h-[100px]"
                  placeholder="Ex: Mesa danificada, em manutenção..."
                />
              </div>
              
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                  ⚠️ A mesa deixará de aceitar novos check-ins, mas sessões existentes permanecerão válidas.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                size="md"
                onClick={closeDeactivateModal}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleDeactivate}
                isLoading={loading}
              >
                Desativar Mesa
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {isQRModalOpen && tableToRegenerateQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4">
              {qrAction === 'generate' && 'Gerar QR Code'}
              {qrAction === 'regenerate' && 'Regenerar QR Code'}
              {qrAction === 'download' && 'Baixar QR Code'}
            </h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-foreground mb-2">
                  <strong>Mesa {tableToRegenerateQR.number}</strong>
                </p>
                {tableToRegenerateQR.name && (
                  <p className="text-sm text-muted-foreground mb-2">{tableToRegenerateQR.name}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  QR Code URL: <code className="bg-white dark:bg-gray-700 px-1 py-0.5 rounded break-all">https://portal.massas.co/customer-portal/checkin/{tableToRegenerateQR.token}</code>
                </p>
              </div>

              {/* Generated QR Code Image */}
              {generatedQrUrl && (
                <div className="flex flex-col items-center gap-3 p-4 bg-white rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-sm font-medium">QR Code gerado com sucesso!</p>
                  </div>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(generatedQrUrl)}`}
                    alt={`QR Code Mesa ${tableToRegenerateQR.number}`}
                    className="w-[250px] h-[250px] border border-gray-200 rounded-lg"
                  />
                  <p className="text-xs text-muted-foreground text-center break-all max-w-full px-2">
                    {generatedQrUrl}
                  </p>
                </div>
              )}
              
              {qrAction === 'regenerate' && !generatedQrUrl && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm text-yellow-700 dark:text-yellow-400">
                    ⚠️ O QR Code anterior será invalidado. Novo token gerado com 128 bits de entropia.
                  </p>
                </div>
              )}
              
              {qrAction === 'download' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">PDF Pronto para Impressão</p>
                      <p className="text-xs text-muted-foreground">Contém QR code e número da mesa</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                size="md"
                onClick={closeQRModal}
              >
                Fechar
              </Button>
              {!generatedQrUrl && (
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleQRAction}
                  isLoading={isQRLoading || isDownloadingQR}
                >
                  {qrAction === 'generate' && 'Gerar QR Code'}
                  {qrAction === 'regenerate' && 'Regenerar QR Code'}
                  {qrAction === 'download' && 'Baixar PDF'}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Plugin Registration
// ============================================================================

export const tableManagementPlugin: FeaturePlugin = {
  id: 'table-management',
  name: 'Gerenciamento de Mesas',
  type: 'feature',
  layout: 'admin',
  icon: 'LayoutDashboard',
  routes: [
    {
      path: '',
      component: TableManagementView,
      label: 'Mesas',
      icon: 'LayoutDashboard',
      showInMenu: true,
    },
    {
      path: 'check-in',
      component: CheckInView,
      label: 'Check-in',
      icon: 'UserCheck',
      showInMenu: true,
    },
    {
      path: 'participants/:tableSessionId',
      component: ParticipantList,
      label: 'Participantes',
      icon: 'Users',
      showInMenu: false,
    },
  ],
};