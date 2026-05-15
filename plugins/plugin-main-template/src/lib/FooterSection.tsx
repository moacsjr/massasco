'use client';

import React from 'react';
import { ExtensionPoint } from '@temp-workspace/plugin-loader';

export const FooterSection: React.FC = () => {
  return (
    <footer className="px-3 py-3 md:px-6 border-t border-border bg-card">
      <div className="flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <ExtensionPoint id="main-template:footer-left" />
        </div>
        <div className="flex-0 text-center text-muted-foreground text-sm">
          <ExtensionPoint id="main-template:footer-center" />
        </div>
        <div className="flex-1 min-w-0 flex justify-end">
          <ExtensionPoint id="main-template:footer-right" />
        </div>
      </div>
    </footer>
  );
};
