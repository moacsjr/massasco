'use client';

import React from 'react';
import { ExtensionPoint } from '@temp-workspace/plugin-loader';
import { useUI } from '@temp-workspace/ui-registry';
import { HeaderFooter } from './HeaderFooter';

export const HeaderSection: React.FC = () => {
  const { resolve } = useUI();
  const Icon = resolve('Icon');

  return (
    <header className="bg-card border-b border-border text-foreground">
      {/* Main header bar */}
      <div className="px-3 md:px-5 flex items-center h-14 gap-4">
        {/* App icon */}
        <span className="text-brand flex items-center">
          <Icon name="ChefHat" size="md" />
        </span>
        {/* App name */}
        <span className="font-bold text-lg tracking-tight text-brand">
          massas<span className="text-foreground">.co</span>
        </span>
        {/* Header menu extension point */}
        <div className="flex-1 flex items-center gap-3">
          <ExtensionPoint id="main-template:header-menu" />
        </div>
      </div>
      {/* Header footer with 3 areas */}
      <HeaderFooter />
    </header>
  );
};
