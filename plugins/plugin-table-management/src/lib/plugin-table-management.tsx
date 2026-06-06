'use client';

import React from 'react';
import {
  FeaturePlugin,
} from '@temp-workspace/plugin-loader';
import { useUI } from '@temp-workspace/ui-registry';
import { ParticipantList } from './ParticipantList';

// ============================================================================
// Table Management Component
// ============================================================================

interface Table {
  id: string;
  number: number;
  name?: string;
  token?: string;
  isActive?: boolean;
  createdAt?: string;
  sessions?: TableSession[];
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

const TableManagementView: React.FC = () => {
  const { resolve } = useUI();
  const Card = resolve('Card');
  const Button = resolve('Button');
  const Input = resolve('Input');

  const [tables, setTables] = React.useState<TableItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [modalMode, setModalMode] = React.useState<'create' | 'edit' | null>(null);
  const [editingTable, setEditingTable] = React.useState<Table | null>(null);

  // Form state
  const [tableNumber, setTableNumber] = React.useState('');
  const [tableName, setTableName] = React.useState('');

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
        // This should never happen, but TypeScript needs it
        throw new Error('Modo inválido');
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Erro ao salvar mesa');
      }

      // Refresh tables list
      const refreshRes = await fetch('/api/tables');
      if (refreshRes.ok) {
        const data = await refreshRes.json();
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
      }

      closeModal();
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar mesa');
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

      // Refresh tables list
      const refreshRes = await fetch('/api/tables');
      if (refreshRes.ok) {
        const data = await refreshRes.json();
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
      }

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

        {/* Header with Add Button */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-foreground">
            Mesas Cadastradas
          </h2>
          <Button variant="primary" size="md" onClick={openCreateModal}>
            + Adicionar Mesa
          </Button>
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
                className="
                  p-4 rounded-lg border
                  bg-card hover:bg-surface-elevated
                  transition-colors duration-150
                "
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
                    {item.currentSession?.customerName && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {item.currentSession.customerName}
                      </p>
                    )}
                  </div>
                  {item.currentSession && (
                    <span
                      className={`
                        px-2 py-1 rounded text-xs font-medium border
                        ${getStatusColor(item.currentSession.status)}
                      `}
                    >
                      {item.currentSession.status === 'OPEN' && 'Aberta'}
                      {item.currentSession.status === 'AWAITING_PAYMENT' && 'Aguardando Pagamento'}
                      {item.currentSession.status === 'CLOSED' && 'Fechada'}
                    </span>
                  )}
                </div>
                
                {item.currentSession && (
                  <div className="text-xs text-muted-foreground space-y-1 mb-3">
                    <p>Criado: {new Date(item.currentSession.createdAt).toLocaleString('pt-BR')}</p>
                  </div>
                )}
                
                {!item.currentSession && (
                  <p className="text-sm text-muted-foreground italic mb-3">
                    Sem sessão ativa
                  </p>
                )}

                {/* Action buttons */}
                <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(item.table)}
                    >
                      Editar
                    </Button>
                    {item.currentSession && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Navigate to participant list
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
      path: 'participants/:tableSessionId',
      component: ParticipantList,
      label: 'Participantes',
      icon: 'Users',
      showInMenu: false,
    },
  ],
};
