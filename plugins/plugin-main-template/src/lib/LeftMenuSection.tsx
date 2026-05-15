'use client';

import React, { useState } from 'react';
import { pluginLoader, ExtensionContribution } from '@temp-workspace/plugin-loader';
import { useUI } from '@temp-workspace/ui-registry';
import { LeftMenuItemProps } from '@temp-workspace/plugin-loader';

export const LeftMenuSection: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const { resolve } = useUI();
  const Icon = resolve('Icon');
  const Drawer = resolve('Drawer');

  const contributions = pluginLoader.getExtensions('main-template:left-menu');

  if (contributions.length === 0) return null;

  const handleSelect = (index: number) => {
    setActiveIndex(index === activeIndex ? null : index);
  };

  const handleClose = () => {
    setActiveIndex(null);
  };

  return (
    <>
      {/* Nav rail — dark theme */}
      <nav
        className="
          w-14 bg-card border-r border-border
          flex flex-col items-center
          py-3 gap-2 flex-shrink-0
        "
      >
        {contributions.map((contribution, index) => {
          const props = contribution.metadata as LeftMenuItemProps | undefined;
          const iconStr = props?.icon ?? '📄';
          const isActive = activeIndex === index;

          return (
            <button
              key={index}
              onClick={() => handleSelect(index)}
              title={props?.name ?? ''}
              className={`
                w-10 h-10 border-none rounded-lg
                flex items-center justify-center text-lg
                transition-colors duration-150
                ${isActive
                  ? 'bg-brand text-black'
                  : 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-secondary'
                }
              `}
            >
              <Icon name={iconStr} size="md" />
            </button>
          );
        })}
      </nav>

      {/* Drawer for active item — dark theme */}
      <Drawer
        open={activeIndex !== null}
        position="left"
        offsetLeft="56px"
        width="340px"
        onClose={handleClose}
      >
        {activeIndex !== null && (
          <>
            <div className="px-5 py-4 border-b border-border font-semibold text-lg text-foreground">
              {(contributions[activeIndex].metadata as LeftMenuItemProps | undefined)?.name ?? 'Navigation'}
            </div>
            <div className="flex-1 overflow-auto">
              {(() => {
                const contribution = contributions[activeIndex];
                const ContributionComponent = contribution.component;
                const props = contribution.metadata as LeftMenuItemProps | undefined;
                return React.createElement(ContributionComponent, {
                  name: props?.name ?? '',
                  icon: props?.icon ?? '',
                });
              })()}
            </div>
          </>
        )}
      </Drawer>
    </>
  );
};
