'use client';

import React from 'react';
import {
  FeaturePlugin,
  ExtensionContribution,
  pluginLoader,
  PluginRoute,
} from '@temp-workspace/plugin-loader';
import { useUI } from '@temp-workspace/ui-registry';
import { LeftMenuItemProps } from '@temp-workspace/plugin-loader';
import Link from 'next/link';

/**
 * NavBarContent — renders a grouped list of all navigable routes
 * from every registered feature plugin.
 */
const NavBarContent: React.FC = () => {
  const { resolve } = useUI();
  const Card = resolve('Card');

  const allPlugins = pluginLoader.getAllPlugins();
  const featurePlugins = allPlugins.filter(
    (p): p is FeaturePlugin =>
      p.type === 'feature' && !!(p as FeaturePlugin).routes,
  );

  return (
    <Card title="Navigation" padding="none">
      <nav style={{ padding: '12px' }}>
        {featurePlugins.map((plugin) => (
          <div key={plugin.id} style={{ marginBottom: '16px' }}>
            {/* Plugin group header */}
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                color: '#6b7280',
                marginBottom: '6px',
                letterSpacing: '0.05em',
              }}
            >
              {plugin.name}
            </div>
            {/* Routes */}
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {plugin.routes!.filter((r) => r.showInMenu !== false).map((route) => {
                const href = `/plugins/${plugin.id}/${route.path}`;
                return (
                  <li key={route.path} style={{ marginBottom: '2px' }}>
                    <Link
                      href={href}
                      style={{
                        display: 'block',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        color: '#374151',
                        fontSize: '0.9rem',
                        transition: 'background-color 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor =
                          '#f3f4f6';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor =
                          'transparent';
                      }}
                    >
                      {route.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </Card>
  );
};

/**
 * NavBarWrapper — contributes to main-template:left-menu.
 * Receives name/icon props from the nav rail but doesn't use them
 * (they describe this entry in the rail itself).
 */
const NavBarWrapper: React.FC<LeftMenuItemProps> = () => {
  return <NavBarContent />;
};

const contributions = [
  {
    point: 'main-template:left-menu' as const,
    component: NavBarWrapper,
    metadata: {
      name: 'Navigation',
      icon: '🧭',
    },
  },
] as ExtensionContribution[];

export const menuNavBarPlugin: FeaturePlugin = {
  id: 'menu-nav-bar',
  name: 'Menu Navigation Bar',
  type: 'feature',
  contributions,
};
