import { ComponentType } from 'react';
import { ExtensionPoints } from './contracts';

export type PluginType = 'feature' | 'service';

/**
 * Route definition for a FeaturePlugin.
 */
export interface PluginRoute {
  path: string;
  component: ComponentType<any>;
  label: string;
  showInMenu?: boolean;
  icon?: string;
}

/**
 * A contribution from a plugin to a specific Extension Point.
 *
 * The generic `K` is bounded by `keyof ExtensionPoints`, so TypeScript enforces:
 * - `point` must be a valid extension point ID (compile-time check)
 * - `component` must accept the exact props type declared for that point
 *
 * Example:
 *   const contr: ExtensionContribution<'app:layout:header'> = {
 *     point: 'app:layout:header',  // ✅ valid key
 *     component: MyHeader          // ✅ must accept {} props
 *   };
 */
export interface ExtensionContribution<K extends keyof ExtensionPoints = keyof ExtensionPoints> {
  point: K;
  component: ComponentType<ExtensionPoints[K]>;
  metadata?: any;
}

/**
 * Metadata that describes an Extension Point offered by a FeaturePlugin.
 *
 * Like `ExtensionContribution`, the generic `K` is bounded by `keyof ExtensionPoints`
 * to guarantee that `name` is always a valid, typed extension point ID.
 */
export interface ExtensionPointDefinition<K extends keyof ExtensionPoints = keyof ExtensionPoints> {
  name: K;
  title: string;
  description: string;
  link?: string;
  hint?: string;
  icon?: string;
  component?: ComponentType<ExtensionPoints[K]>;
}

export interface BasePlugin {
  id: string;
  name: string;
  type: PluginType;
}

export interface FeaturePlugin extends BasePlugin {
  type: 'feature';
  icon?: string;
  routes?: PluginRoute[];
  extensionPoints?: ExtensionPointDefinition[];
  contributions?: ExtensionContribution[];
}

export interface ServicePlugin extends BasePlugin {
  type: 'service';
  api: any;
}

export type DevXPPlugin = FeaturePlugin | ServicePlugin;

class PluginLoaderStore {
  private plugins: Map<string, DevXPPlugin> = new Map();
  private extensionPoints: Map<string, ExtensionPointDefinition> = new Map();
  private extensions: Map<string, ExtensionContribution[]> = new Map();
  private services: Map<string, any> = new Map();

  register(plugin: DevXPPlugin) {
    if (this.plugins.has(plugin.id)) {
      console.warn(`[PluginLoader] Plugin with id ${plugin.id} is already registered.`);
      return;
    }

    this.plugins.set(plugin.id, plugin);
    
    if (plugin.type === 'service') {
      this.services.set(plugin.id, plugin.api);
    }

    if (plugin.type === 'feature') {
      // Registrar extension points oferecidos pelo plugin
      if (plugin.extensionPoints) {
        plugin.extensionPoints.forEach(ep => {
          this.extensionPoints.set(ep.name, ep);
        });
      }

      // Registrar contribuições do plugin
      if (plugin.contributions) {
        plugin.contributions.forEach(contribution => {
          const existing = this.extensions.get(contribution.point) || [];
          this.extensions.set(contribution.point, [...existing, contribution]);
        });
      }
    }

    console.log(`[PluginLoader] Registered ${plugin.type}: ${plugin.name} (${plugin.id})`);
  }

  getPlugin(id: string): DevXPPlugin | undefined {
    return this.plugins.get(id);
  }

  getAllPlugins(): DevXPPlugin[] {
    return Array.from(this.plugins.values());
  }

  getExtensionPoint<K extends keyof ExtensionPoints>(name: K): ExtensionPointDefinition<K> | undefined {
    return this.extensionPoints.get(name) as ExtensionPointDefinition<K> | undefined;
  }

  getAllExtensionPoints(): ExtensionPointDefinition[] {
    return Array.from(this.extensionPoints.values());
  }

  getService<T>(serviceId: string): T {
    const service = this.services.get(serviceId);
    if (!service) {
      throw new Error(`[PluginLoader] Service not found: ${serviceId}`);
    }
    return service as T;
  }

  getExtensions<K extends keyof ExtensionPoints>(pointId: K): ExtensionContribution<K>[] {
    return (this.extensions.get(pointId) || []) as unknown as ExtensionContribution<K>[];
  }

  resolveRoute(pluginId: string, path: string): PluginRoute | undefined {
    const plugin = this.getPlugin(pluginId);
    if (!plugin || plugin.type !== 'feature' || !plugin.routes) return undefined;

    const route = plugin.routes.find(r => {
      if (r.path === path || `/${r.path}` === path) return true;

      // Support dynamic segments like :id
      const routeParts = r.path.split('/');
      const pathParts = path.split('/');
      if (routeParts.length !== pathParts.length) return false;
      return routeParts.every((part, i) => part.startsWith(':') || part === pathParts[i]);
    });

    return route;
  }
}

export const pluginLoader = new PluginLoaderStore();
