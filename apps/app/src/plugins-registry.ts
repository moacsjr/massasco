import { pluginLoader } from '@temp-workspace/plugin-loader';
import { authPlugin } from '@temp-workspace/plugin-auth';
import { menubarPlugin } from '@temp-workspace/plugin-menubar';
import { userServicePlugin } from '@temp-workspace/plugin-user-service';
import { userManagementPlugin } from '@temp-workspace/plugin-user-management';
import { mainTemplatePlugin } from '@temp-workspace/plugin-main-template';
import { menuNavBarPlugin } from '@temp-workspace/plugin-menu-nav-bar';
import { orderCorePlugin } from '@temp-workspace/plugin-order-core';
import {
  menuCatalogServicePlugin,
  menuCatalogFeaturePlugin,
} from '@temp-workspace/plugin-menu-catalog';
import { ordersDeliveryPlugin } from '@temp-workspace/plugin-orders-delivery';
import { kdsPlugin } from '@temp-workspace/plugin-kds';
import {
  paymentsServicePlugin,
  paymentsFeaturePlugin,
} from '@temp-workspace/plugin-payments';
import { auditPlugin } from '@temp-workspace/plugin-audit';
import { uiComponentsPlugin } from '@temp-workspace/plugin-ui-components';

/**
 * Registro estático de plugins para o Monorepo.
 */
export function initializePlugins() {
  // Core services
  pluginLoader.register(userServicePlugin);
  pluginLoader.register(orderCorePlugin);
  pluginLoader.register(auditPlugin);
  pluginLoader.register(menuCatalogServicePlugin);
  pluginLoader.register(paymentsServicePlugin);
  pluginLoader.register(uiComponentsPlugin);

  // Feature plugins
  pluginLoader.register(authPlugin);
  pluginLoader.register(menubarPlugin);
  pluginLoader.register(userManagementPlugin);
  pluginLoader.register(mainTemplatePlugin);
  pluginLoader.register(menuNavBarPlugin);
  pluginLoader.register(menuCatalogFeaturePlugin);
  pluginLoader.register(ordersDeliveryPlugin);
  pluginLoader.register(kdsPlugin);
  pluginLoader.register(paymentsFeaturePlugin);
}
