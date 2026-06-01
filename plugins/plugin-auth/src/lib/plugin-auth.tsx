'use client';

import React from 'react';
import { FeaturePlugin, ServicePlugin } from '@temp-workspace/plugin-loader';
import { useUI } from '@temp-workspace/ui-registry';
import { useAuth } from './AuthContext';

const ProfilePage = () => {
  const { resolve } = useUI();
  const Card = resolve('Card');
  const Button = resolve('Button');
  const { user, logout } = useAuth();

  if (!user) {
    return <p className="text-foreground">Carregando perfil...</p>;
  }

  return (
    <Card title="Perfil do Usuário" padding="lg">
      <div className="text-foreground">
        <p className="mb-4">Bem-vindo ao seu perfil do Portal DevXP.</p>
        <div className="space-y-2 p-4 bg-card-secondary/20 rounded-lg border border-border">
          <div>
            <strong>Nome:</strong> {user.name}
          </div>
          <div>
            <strong>Email:</strong> {user.email}
          </div>
          {user.sub && (
            <div className="text-xs text-slate-500">
              <strong>ID (Cognito):</strong> {user.sub}
            </div>
          )}
        </div>
        <div className="mt-6 flex gap-4">
          <Button variant="outline" size="md" onClick={logout}>
            Sair da Conta (Sign Out)
          </Button>
        </div>
      </div>
    </Card>
  );
};

export const authPlugin: FeaturePlugin = {
  id: 'auth',
  name: 'Autenticação',
  type: 'feature',
  routes: [
    {
      path: 'profile',
      component: ProfilePage,
      label: 'Meu Perfil',
    },
  ],
};

// Exportar também como um ServicePlugin para disponibilizar a API de auth para outros plugins
export const authServicePlugin: ServicePlugin = {
  id: 'auth-service',
  name: 'Auth Service',
  type: 'service',
  api: {
    getCurrentUser: () => {
      // Nota: no client, pode ser consumido via useAuth. Essa API é para consumo dinâmico via pluginLoader.
      try {
        const cookies = document.cookie.split(';');
        const idToken = cookies.find((c) => c.trim().startsWith('id_token='));
        if (!idToken) return null;
        const payload = JSON.parse(atob(idToken.split('=')[1].split('.')[1]));
        return { name: payload.name, email: payload.email };
      } catch (e) {
        return null;
      }
    },
  },
};
