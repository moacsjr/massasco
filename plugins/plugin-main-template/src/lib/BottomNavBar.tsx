'use client';

import React from 'react';
import { pluginLoader, FeaturePlugin } from '@temp-workspace/plugin-loader';
import { useUI } from '@temp-workspace/ui-registry';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// ============================================================================
// BottomNavBar — Mobile-only navigation bar (hidden on desktop ≥768px)
// ============================================================================

export const BottomNavBar: React.FC = () => {
  const { resolve } = useUI();
  const Icon = resolve('Icon');
  const pathname = usePathname();

  // Get all feature plugins and their routes where showInMenu is true
  const plugins = pluginLoader
    .getAllPlugins()
    .filter((p): p is FeaturePlugin => p.type === 'feature');

  const menuRoutes = plugins.flatMap((plugin) =>
    (plugin.routes || [])
      .filter((route) => route.showInMenu === true)
      .map((route) => ({
        ...route,
        pluginId: plugin.id,
        // The path in the portal is /plugins/[pluginId]/[routePath]
        fullPath: `/plugins/${plugin.id}${route.path ? `/${route.path}` : ''}`,
      })),
  );

  if (menuRoutes.length === 0) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-sticky h-14 bg-card border-t border-border flex items-center justify-around md:hidden">
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
