'use client';

import React, { useState } from 'react';
import { pluginLoader } from '@temp-workspace/plugin-loader';
import { useUI } from '@temp-workspace/ui-registry';
import { RightMenuItemProps } from '@temp-workspace/plugin-loader';

export const RightMenuSection: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const { resolve } = useUI();
  const Icon = resolve('Icon');
  const Drawer = resolve('Drawer');
  const Tabs = resolve('Tabs');

  const contributions = pluginLoader.getExtensions('main-template:right-menu');

  if (contributions.length === 0) return null;

  const tabItems = contributions.map((c) => {
    const props = c.metadata as RightMenuItemProps | undefined;
    return {
      label: props?.tabName ?? 'Tab',
      icon: props?.tabIcon,
    };
  });

  const triggerIcon =
    (contributions[activeTab]?.metadata as RightMenuItemProps | undefined)
      ?.tabIcon ?? '📋';

  return (
    <>
      {/* Trigger button — dark theme */}
      <div className="absolute right-3 top-3 z-sticky">
        <button
          onClick={() => setIsOpen(true)}
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
        onClose={() => setIsOpen(false)}
      >
        <Tabs items={tabItems} activeIndex={activeTab} onChange={setActiveTab}>
          {(() => {
            const contribution = contributions[activeTab];
            if (!contribution) return null;
            const ContributionComponent = contribution.component;
            const props = contribution.metadata as
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
