'use client';

import React from 'react';
import { FeaturePlugin, ExtensionPoint } from '@temp-workspace/plugin-loader';

const MenuBarComponent: React.FC = () => {
  return (
    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
      <ExtensionPoint id="menubar:items" />
    </div>
  );
};

export const menubarPlugin: FeaturePlugin = {
  id: 'menubar',
  name: 'Menu Bar',
  type: 'feature',
  extensionPoints: [
    {
      name: 'menubar:items',
      title: 'Itens do Menu',
      description: 'Permite adicionar botões e links à barra de menu superior.',
    },
  ],
  contributions: [
    {
      point: 'main-template:header-menu',
      component: MenuBarComponent,
    },
  ],
};
