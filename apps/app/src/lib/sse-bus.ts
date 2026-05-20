/**
 * SSE Event Bus — in-memory pub/sub for real-time order management events.
 *
 * Uses globalThis to survive Next.js dev mode hot reloads so that
 * EventSource clients don't lose their subscriptions when modules are re-evaluated.
 */

export interface SSEEvent {
  type: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

export type SSEListener = (event: SSEEvent) => void;

class SSEBus {
  private listeners: Set<SSEListener>;

  constructor() {
    // Restore from globalThis if available (survives hot reload)
    if (
      typeof globalThis !== 'undefined' &&
      (globalThis as any).__sseBusListeners
    ) {
      this.listeners = (globalThis as any).__sseBusListeners;
    } else {
      this.listeners = new Set();
      if (typeof globalThis !== 'undefined') {
        (globalThis as any).__sseBusListeners = this.listeners;
      }
    }
  }

  publish(type: string, payload: Record<string, unknown>) {
    const event: SSEEvent = {
      type,
      payload,
      timestamp: new Date().toISOString(),
    };

    this.listeners.forEach((fn) => {
      try {
        fn(event);
      } catch {
        // swallow listener errors
      }
    });
  }

  subscribe(listener: SSEListener): void {
    this.listeners.add(listener);
  }

  unsubscribe(listener: SSEListener): void {
    this.listeners.delete(listener);
  }

  listenerCount(): number {
    return this.listeners.size;
  }
}

export const sseBus = new SSEBus();
