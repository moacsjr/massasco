import { FeaturePlugin, pluginLoader } from '@temp-workspace/plugin-loader';

export interface LeftMenuItem {
  pluginId: string;
  pluginIcon: string;
  routeIcon?: string;
  path: string;
  label: string;
}

export const useLeftMenuData = () => {
  const allPlugins = pluginLoader.getAllPlugins();
  const featurePlugins = allPlugins.filter(
    (p): p is FeaturePlugin =>
      p.type === 'feature' && !!(p as FeaturePlugin).routes,
  );

  const menuRoutes = featurePlugins.flatMap((plugin) => {
    const routes = plugin.routes;
    if (!routes) return [];
    return routes
      .filter((route) => route.showInMenu === true)
      .map((route) => ({
        pluginId: plugin.id,
        pluginIcon: plugin.icon ?? '📄',
        routeIcon: route.icon,
        path: route.path,
        label: route.label,
      }));
  });

  return { menuRoutes };
};
