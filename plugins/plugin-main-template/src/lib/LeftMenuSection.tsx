'use client';

import React from 'react';
import { FeaturePlugin, pluginLoader } from '@temp-workspace/plugin-loader';
import { useUI } from '@temp-workspace/ui-registry';
import Link from 'next/link';

export const LeftMenuSection: React.FC = () => {
  const { resolve } = useUI();
  const Icon = resolve('Icon');

  const allPlugins = pluginLoader.getAllPlugins();
  const featurePlugins = allPlugins.filter(
    (p): p is FeaturePlugin => p.type === 'feature' && !!(p as FeaturePlugin).routes
  );

  const menuRoutes = featurePlugins.flatMap(plugin => {
    const routes = plugin.routes;
    if (!routes) return [];
    return routes
      .filter(route => route.showInMenu === true)
      .map(route => ({
        pluginId: plugin.id,
        pluginIcon: plugin.icon ?? '📄',
        routeIcon: route.icon,
        path: route.path,
        label: route.label,
      }));
  });

  if (menuRoutes.length === 0) return null;

  return (
    <nav
      className="
        w-16 bg-card border-r border-border
        flex flex-col items-stretch
        py-3 gap-2 flex-shrink-0
      "
    >
      {menuRoutes.map((item) => {
        const href = `/plugins/${item.pluginId}/${item.path}`;

        return (
          <Link
            key={`${item.pluginId}/${item.path}`}
            href={href}
            title={item.label}
            className="
              mx-2 py-2 rounded-lg
              flex items-center justify-center
              transition-colors duration-150
              bg-transparent text-muted-foreground hover:text-foreground hover:bg-secondary
            "
          >
            <Icon name={item.routeIcon ?? item.pluginIcon} size="md" />
          </Link>
        );
      })}
    </nav>
  );
};
