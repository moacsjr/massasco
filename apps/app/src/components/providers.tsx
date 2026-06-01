'use client';

import React from 'react';
import { UIProvider } from '@temp-workspace/ui-registry';
import { components } from '@temp-workspace/ui-project';
import { AuthProvider } from '@temp-workspace/plugin-auth';
import { initializePlugins } from '../plugins-registry';
import { Toaster } from '@/components/ui/toaster';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  // Inicializa os plugins no lado do cliente
  initializePlugins();

  return (
    <UIProvider components={components}>
      <AuthProvider>
        {children}
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </UIProvider>
  );
}
