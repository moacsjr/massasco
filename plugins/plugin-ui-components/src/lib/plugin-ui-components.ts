/**
 * UI Components Plugin
 *
 * This plugin provides shadcn-based UI components to the portal.
 * It registers as a service plugin that exports the components map,
 * which is consumed by the UIProvider in the app.
 */

import { components } from '@temp-workspace/ui-project';

// Re-export the shadcn-based components for direct import by other plugins
export { components };
export { Fab } from './components/Fab';
export { IconButton } from './components/IconButton';

// Plugin metadata (not a traditional feature/service plugin)
// This is used for documentation and dependency tracking
export const uiComponentsPlugin = {
  id: 'ui-components',
  name: 'UI Components (shadcn)',
  type: 'service' as const,
  api: components,
};
