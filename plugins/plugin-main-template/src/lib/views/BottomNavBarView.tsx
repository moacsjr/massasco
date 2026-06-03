'use client';

import React from 'react';
import { useUI } from '@temp-workspace/ui-registry';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BottomNavItem } from '../hooks/useBottomNavBarData';

interface BottomNavBarViewProps {
  menuRoutes: BottomNavItem[];
  isLoading?: boolean;
}

export const BottomNavBarView: React.FC<BottomNavBarViewProps> = ({
  menuRoutes,
  isLoading = false,
}) => {
  const { resolve } = useUI();
  const Icon = resolve('Icon');
  const pathname = usePathname();

  // Wrapper classes - immutable structure for CLS zero
  const wrapperClasses =
    'fixed bottom-0 left-0 right-0 z-sticky h-14 bg-card border-t border-border flex items-center justify-around md:hidden';

  // RENDER STATE: SKELETON (mapeamento 1:1 com o DOM real)
  if (isLoading) {
    return (
      <nav className={`${wrapperClasses} animate-pulse`}>
        <div className="flex items-center justify-around w-full">
          <div className="w-14 h-full flex flex-col items-center justify-center gap-0.5">
            <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded mt-1" />
          </div>
          <div className="w-14 h-full flex flex-col items-center justify-center gap-0.5">
            <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded mt-1" />
          </div>
          <div className="w-14 h-full flex flex-col items-center justify-center gap-0.5">
            <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded mt-1" />
          </div>
        </div>
      </nav>
    );
  }

  // RENDER STATE: READY / SUCCESS
  if (menuRoutes.length === 0) return null;

  return (
    <nav className={wrapperClasses}>
      {menuRoutes.map((route, index) => {
        const iconStr = route.icon ?? '📄';
        const isActive =
          pathname === route.fullPath || pathname === `${route.fullPath}/`;

        return (
          <Link
            key={`${route.pluginId}-${index}`}
            href={route.fullPath}
            className={`
              flex flex-col items-center justify-center gap-0.5 w-14 h-full transition-colors
              ${isActive ? 'text-brand font-medium' : 'text-muted-foreground hover:text-foreground'}
            `}
            title={route.label}
          >
            <span className="text-lg">
              <Icon name={iconStr} size="md" />
            </span>
            <span className="text-[10px] truncate max-w-full px-1">
              {route.label.split(' ')[0]}
            </span>
          </Link>
        );
      })}
    </nav>
  );
};
