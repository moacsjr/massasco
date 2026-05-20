import React from 'react';
import { FeaturePlugin } from '@temp-workspace/plugin-loader';
import { useUI } from '@temp-workspace/ui-registry';

const ProfilePage = () => {
  const { resolve } = useUI();
  const Card = resolve('Card');
  const Button = resolve('Button');

  return (
    <Card title="Perfil do Usuário" padding="lg">
      <p>Bem-vindo ao seu perfil de desenvolvedor.</p>
      <div style={{ marginTop: '16px' }}>
        <strong>Nome:</strong> Desenvolvedor DevXP
        <br />
        <strong>Email:</strong> dev@devx-portal.com
      </div>
      <div style={{ marginTop: '24px' }}>
        <Button variant="outline" size="md">
          Alterar Senha
        </Button>
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
