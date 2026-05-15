import { ServicePlugin } from '@temp-workspace/plugin-loader';

export interface AuditAPI {
  log(module: string, eventType: string, payload: Record<string, unknown>): Promise<void>;
  getLogs(filter?: { module?: string; eventType?: string }): Promise<unknown[]>;
}

const auditAPI: AuditAPI = {
  async log(module: string, eventType: string, payload: Record<string, unknown>) {
    try {
      await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module, eventType, payload }),
      });
    } catch {
      console.warn(`[audit] Failed to log: ${module}/${eventType}`);
    }
  },
  async getLogs(filter?: { module?: string; eventType?: string }) {
    try {
      const params = new URLSearchParams();
      if (filter?.module) params.set('module', filter.module);
      if (filter?.eventType) params.set('eventType', filter.eventType);
      const res = await fetch(`/api/audit?${params}`);
      return res.json();
    } catch {
      return [];
    }
  },
};

export const auditPlugin: ServicePlugin = {
  id: 'audit',
  name: 'Audit Log',
  type: 'service',
  api: auditAPI,
};
