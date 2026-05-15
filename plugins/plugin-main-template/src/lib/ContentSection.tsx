'use client';

import React from 'react';
import { pluginLoader, ExtensionPoint } from '@temp-workspace/plugin-loader';

interface ContentSectionProps {
  children: React.ReactNode;
}

export const ContentSection: React.FC<ContentSectionProps> = ({ children }) => {
  const hasLeft = pluginLoader.getExtensions('main-template:content-left').length > 0;
  const hasRight = pluginLoader.getExtensions('main-template:content-right').length > 0;

  return (
    <div className="flex flex-col flex-1 min-w-0">
      {/* Content top area */}
      <ExtensionPoint id="main-template:content-top" />

      {/* Middle row: left sidebar (optional) | main content | right sidebar (optional) */}
      <div className="flex flex-1 min-w-0">
        {hasLeft && (
          <div className="hidden md:block w-[220px] border-r border-border p-4 bg-surface flex-shrink-0 overflow-auto">
            <ExtensionPoint id="main-template:content-left" />
          </div>
        )}

        {/* Main page content */}
        <main className="px-4 py-4 md:px-6 md:py-6 flex-1 overflow-auto min-w-0">
          {children}
        </main>

        {hasRight && (
          <div className="hidden md:block w-[260px] border-l border-border p-4 bg-surface flex-shrink-0 overflow-auto">
            <ExtensionPoint id="main-template:content-right" />
          </div>
        )}
      </div>

      {/* Content bottom area */}
      <ExtensionPoint id="main-template:content-bottom" />
    </div>
  );
};
