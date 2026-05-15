import { ServicePlugin } from '@temp-workspace/plugin-loader';

/**
 * OrderCoreAPI — shared service interface for the order management system.
 * Other plugins consume this via pluginLoader.getService<OrderCoreAPI>('order-core').
 */
export interface OrderCoreAPI {
  /** Publish an SSE event to all connected clients */
  publish(eventType: string, payload: Record<string, unknown>): void;
}

const orderCoreAPI: OrderCoreAPI = {
  publish(eventType: string, payload: Record<string, unknown>) {
    // SSE publishing is handled directly in API routes via the sse-bus module.
    // This method exists for interface compatibility; plugins should use the
    // API routes to trigger SSE events.
    console.log(`[order-core] SSE event: ${eventType}`, payload);
  },
};

export const orderCorePlugin: ServicePlugin = {
  id: 'order-core',
  name: 'Order Core',
  type: 'service',
  api: orderCoreAPI,
};
