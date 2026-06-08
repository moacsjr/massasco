'use client';

import React from 'react';
import { CheckInView } from '@temp-workspace/plugin-table-management';

// ============================================================================
// Types
// ============================================================================

interface TableData {
  id: string;
  number: number;
  name?: string;
  isActive: boolean;
  token: string;
  createdAt: string;
}

interface CheckInViewWrapperProps {
  params?: Promise<{ tableToken?: string }>;
}

// ============================================================================
// CheckInViewWrapper Component
// ============================================================================

const CheckInViewWrapper: React.FC<CheckInViewWrapperProps> = ({ params }) => {
  const [tableToken, setTableToken] = React.useState<string | undefined>(undefined);
  const [tableId, setTableId] = React.useState<string | null>(null);
  const [tableNumber, setTableNumber] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (params) {
      (async () => {
        const resolvedParams = await params;
        if (resolvedParams && resolvedParams.tableToken) {
          const token = resolvedParams.tableToken;
          setTableToken(token);
          
          // Look up table number from token
          try {
            const res = await fetch(`/api/tables/token/${token}`);
            if (res.ok) {
              const data: TableData = await res.json();
              setTableId(data.id);
              setTableNumber(data.number);
            } else {
              setError('Mesa não encontrada');
            }
          } catch (err) {
            console.error('Error fetching table:', err);
            setError('Erro ao carregar mesa');
          } finally {
            setLoading(false);
          }
        }
      })();
    }
  }, [params]);

  // Save table session to localStorage when tableNumber is loaded
  // This ensures the customer portal can detect that the user has checked in
  React.useEffect(() => {
    if (tableNumber !== null && tableToken) {
      // Check if tableSession already exists in localStorage
      const existingSession = localStorage.getItem('customerTableSession');
      if (!existingSession) {
        // The actual tableSession will be saved after the check-in form is submitted
        // Here we just store the table number for reference
        localStorage.setItem('customerTable', tableNumber.toString());
      }
    }
  }, [tableNumber, tableToken]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            type="button"
            onClick={() => (window.location.href = '/plugins/customer-portal/')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Voltar para o início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      {tableNumber ? (
        <div className="max-w-[1200px]">
          <div className="text-center mb-6">
            <p className="text-muted-foreground mb-2">
              Realize o check-in para acessar o cardápio digital.
            </p>
            <p className="text-sm text-muted-foreground">
              Mesa: <span className="font-semibold">{tableNumber}</span>
            </p>
          </div>
          <CheckInView tableToken={tableToken} tableId={tableId} tableNumber={tableNumber} />
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">
            Token da mesa não encontrado.
          </p>
          <button
            type="button"
            onClick={() => (window.location.href = '/plugins/customer-portal/')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Voltar para o início
          </button>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Export
// ============================================================================

export { CheckInViewWrapper };