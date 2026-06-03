'use client';

import React from 'react';
import { useUI } from '@temp-workspace/ui-registry';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LeftMenuItem } from '../hooks/useLeftMenuData';

interface LeftMenuViewProps {
  menuRoutes: LeftMenuItem[];
  isLoading?: boolean;
}

export const LeftMenuView: React.FC<LeftMenuViewProps> = ({
  menuRoutes,
  isLoading = false,
}) => {
  const { resolve } = useUI();
  const Icon = resolve('Icon');
  const pathname = usePathname();

  // Wrapper classes - immutable structure for CLS zero
  const wrapperClasses =
    'w-16 bg-card border-r border-border flex flex-col items-stretch py-3 gap-2 flex-shrink-0';

  // RENDER STATE: SKELETON (mapeamento 1:1 com o DOM real)
  if (isLoading) {
    return (
      <nav className={`${wrapperClasses} animate-pulse`}>
        <div className="space-y-2">
          <div className="mx-2 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          <div className="mx-2 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          <div className="mx-2 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        </div>
      </nav>
    );
  }

  // RENDER STATE: READY / SUCCESS
  if (menuRoutes.length === 0) return null;

  return (
    <nav className={wrapperClasses}>
      {menuRoutes.map((item) => {
        const href = `/plugins/${item.pluginId}${item.path ? `/${item.path}` : ''}`;
        const isActive = pathname === href || pathname === `${href}/`;

        return (
          <Link
            key={`${item.pluginId}/${item.path}`}
            href={href}
            title={item.label}
            className={`
              mx-2 py-2 rounded-lg
              flex items-center justify-center
              transition-colors duration-150
              ${
                isActive
                  ? 'bg-secondary text-brand font-medium'
                  : 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-secondary'
              }
            `}
          >
            <Icon name={item.routeIcon ?? item.pluginIcon} size="md" />
          </Link>
        );
      })}
    </nav>
  );
};
