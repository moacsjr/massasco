'use client';

import React from 'react';
import { pluginLoader, ExtensionPoint } from '@temp-workspace/plugin-loader';

export const HeaderFooter: React.FC = () => {
  const hasLeft =
    pluginLoader.getExtensions('main-template:header-footer-left').length > 0;
  const hasCenter =
    pluginLoader.getExtensions('main-template:header-footer-center').length > 0;
  const hasRight =
    pluginLoader.getExtensions('main-template:header-footer-right').length > 0;

  if (!hasLeft && !hasCenter && !hasRight) return null;

  return (
    <div className="px-3 py-1.5 md:px-5 flex items-center gap-4 min-h-[36px] text-muted-foreground">
      {hasLeft && (
        <div className="flex-1 min-w-0">
          <ExtensionPoint id="main-template:header-footer-left" />
        </div>
      )}
      {hasCenter && (
        <div className="flex-0 text-center">
          <ExtensionPoint id="main-template:header-footer-center" />
        </div>
      )}
      {hasRight && (
        <div className="flex-1 min-w-0 flex justify-end">
          <ExtensionPoint id="main-template:header-footer-right" />
        </div>
      )}
    </div>
  );
};
