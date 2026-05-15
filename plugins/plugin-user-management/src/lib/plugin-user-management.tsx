'use client';

import React, { useEffect, useState } from 'react';
import { FeaturePlugin, pluginLoader } from '@temp-workspace/plugin-loader';
import { useUI } from '@temp-workspace/ui-registry';
import { UserServiceAPI } from '@temp-workspace/plugin-user-service';

const UserManagementPage: React.FC = () => {
  const { resolve } = useUI();
  const Card = resolve('Card');
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const userService = pluginLoader.getService<UserServiceAPI>('user-service');
    userService.listUsers().then(setUsers);
  }, []);

  return (
    <Card title="Gestão de Usuários" padding="lg">
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {users.map(user => (
          <li key={user.id} style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}>
            <strong>{user.name}</strong> ({user.email})
          </li>
        ))}
      </ul>
    </Card>
  );
};

const UserMenuContribution: React.FC = () => {
  return (
    <a href="/plugins/user-management" style={{ color: '#aaa', textDecoration: 'none', fontSize: '0.9rem' }}>
      👥 Usuários
    </a>
  );
};

export const userManagementPlugin: FeaturePlugin = {
  id: 'user-management',
  name: 'Gestão de Usuários',
  type: 'feature',
  routes: [
    {
      path: '',
      component: UserManagementPage,
      label: 'Usuários'
    }
  ],

  contributions: [
    {
      point: 'menubar:items',
      component: UserMenuContribution
    }
  ]
};
