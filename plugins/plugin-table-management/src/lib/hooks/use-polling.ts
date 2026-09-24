'use client';

import { useEffect, useRef } from 'react';

/**
 * usePolling — runs `callback` on a fixed interval.
 *
 * Local copy for this plugin package: plugins are separate Nx projects that
 * only import from other packages via `@temp-workspace/*` aliases (never
 * from `apps/app`), so this tiny hook is duplicated here rather than shared
 * from `apps/app/src/lib/hooks/use-polling.ts`.
 *
 * Replacement for the old SSE-based real-time updates (EventSource is not
 * viable on Lambda/Amplify because each invocation has isolated in-memory
 * state). Consumers should pass their existing "reload data" function as
 * `callback` and a poll interval in milliseconds (3000-5000ms recommended).
 */
export function usePolling(callback: () => void, intervalMs: number): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const id = setInterval(() => callbackRef.current(), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
}
