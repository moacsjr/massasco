'use client';

import React from 'react';
import { useUI } from '@temp-workspace/ui-registry';
import { ExtensionContribution, RightMenuItemProps } from '@temp-workspace/plugin-loader';
import { RightMenuTab } from '../hooks/useRightMenuData';

interface RightMenuViewProps {
  tabs: RightMenuTab[];
  triggerIcon: string;
  isOpen: boolean;
  activeTab: number;
  onOpenChange: (open: boolean) => void;
  onActiveTabChange: (index: number) => void;
}

export const RightMenuView: React.FC<RightMenuViewProps> = ({
  tabs,
  triggerIcon,
  isOpen,
  activeTab,
  onOpenChange,
  onActiveTabChange,
}) => {
  const { resolve } = useUI();
  const Icon = resolve('Icon');
  const Drawer = resolve('Drawer');
  const Tabs = resolve('Tabs');

  // RENDER STATE: SKELETON (mapeamento 1:1 com o DOM real)
  if (tabs.length === 0) {
    return (
      <div className="absolute right-3 top-3 z-sticky">
        <div className="w-10 h-10 border border-border rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
      </div>
    );
  }

  // RENDER STATE: READY / SUCCESS
  return (
    <>
      {/* Trigger button - dark theme */}
      <div className="absolute right-3 top-3 z-sticky">
        <button
          onClick={() => onOpenChange(true)}
          className="
            w-10 h-10 border border-border rounded-lg
            bg-card cursor-pointer flex items-center justify-center
            hover:bg-secondary transition-colors
          "
        >
          <Icon name={triggerIcon} size="md" />
        </button>
      </div>

      {/* Drawer with tabs */}
      <Drawer
        open={isOpen}
        position="right"
        width="380px"
        onClose={() => onOpenChange(false)}
      >
        <Tabs
          items={tabs}
          activeIndex={activeTab}
          onChange={onActiveTabChange}
        >
          {(() => {
            const tab = tabs[activeTab];
            if (!tab) return null;
            const ContributionComponent = tab.contribution.component;
            const props = tab.contribution.metadata as
              | RightMenuItemProps
              | undefined;
            return React.createElement(ContributionComponent, {
              tabName: props?.tabName ?? '',
              tabIcon: props?.tabIcon ?? '',
            });
          })()}
        </Tabs>
      </Drawer>
    </>
  );
};
