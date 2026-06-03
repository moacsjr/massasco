import { pluginLoader, FeaturePlugin, PluginRoute } from '@temp-workspace/plugin-loader';

export interface BottomNavItem {
  pluginId: string;
  path: string;
  label: string;
  icon?: string;
  fullPath: string;
}

export const useBottomNavBarData = (layout: 'portal' | 'admin' = 'admin') => {
  const plugins = pluginLoader
    .getAllPlugins()
    .filter((p): p is FeaturePlugin => p.type === 'feature')
    .filter((plugin) => plugin.layout === layout); // Filtra apenas plugins com layout 'portal');

  const menuRoutes = plugins.flatMap((plugin) =>
    (plugin.routes || [])
      .filter((route) => route.showInMenu === true)
      .map((route) => ({
        ...route,
        pluginId: plugin.id,
        fullPath: `/plugins/${plugin.id}${route.path ? `/${route.path}` : ''}`,
      })),
  );

  return { menuRoutes };
};
