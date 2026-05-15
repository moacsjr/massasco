'use client';

import React, { useState } from 'react';
import { pluginLoader, ExtensionContribution, LeftMenuItemProps } from '@temp-workspace/plugin-loader';
import { useUI } from '@temp-workspace/ui-registry';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';

// ============================================================================
// BottomNavBar — Mobile-only navigation bar (hidden on desktop ≥768px)
// ============================================================================

export const BottomNavBar: React.FC = () => {
  const { resolve } = useUI();
  const Icon = resolve('Icon');
  const Drawer = resolve('Drawer');

  const contributions = pluginLoader.getExtensions('main-template:left-menu');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (contributions.length === 0) return null;

  const handleSelect = (index: number) => {
    setActiveIndex(index === activeIndex ? null : index);
  };

  const handleClose = () => {
    setActiveIndex(null);
  };

  return (
    <>
      {/* Bottom nav bar — mobile only */}
      <nav
        className="
          fixed bottom-0 left-0 right-0 z-[var(--z-sticky)]
          h-14 bg-card border-t border-border
          flex items-center justify-around
          md:hidden
        "
      >
        {/* Hamburger — opens full menu sheet */}
        <Sheet>
          <SheetTrigger asChild>
            <button
              className="flex flex-col items-center justify-center gap-0.5 w-14 h-full text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
              <span className="text-[10px]">Menu</span>
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 sm:w-80 bg-card">
            <SheetHeader>
              <SheetTitle className="text-foreground">Navegação</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-1 mt-4">
              {contributions.map((contribution, index) => {
                const props = contribution.metadata as LeftMenuItemProps | undefined;
                const iconStr = props?.icon ?? '📄';
                return (
                  <button
                    key={index}
                    onClick={() => {
                      setActiveIndex(index);
                    }}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-left hover:bg-secondary transition-colors text-foreground"
                  >
                    <span className="text-lg">
                      <Icon name={iconStr} size="md" />
                    </span>
                    <span className="font-medium">{props?.name ?? 'Navigation'}</span>
                  </button>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>

        {/* Nav items */}
        {contributions.map((contribution, index) => {
          const props = contribution.metadata as LeftMenuItemProps | undefined;
          const iconStr = props?.icon ?? '📄';
          const isActive = activeIndex === index;

          return (
            <button
              key={index}
              onClick={() => handleSelect(index)}
              className={`
                flex flex-col items-center justify-center gap-0.5 w-14 h-full transition-colors
                ${isActive ? 'text-brand' : 'text-muted-foreground hover:text-foreground'}
              `}
              title={props?.name ?? ''}
            >
              <span className="text-lg">
                <Icon name={iconStr} size="md" />
              </span>
              <span className="text-[10px] truncate max-w-full">{props?.name?.split(' ')[0] ?? ''}</span>
            </button>
          );
        })}
      </nav>

      {/* Drawer for active item — mobile */}
      <Drawer
        open={activeIndex !== null}
        position="left"
        offsetLeft="0px"
        width="85vw"
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
