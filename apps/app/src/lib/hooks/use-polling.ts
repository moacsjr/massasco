'use client';

import { useEffect, useRef } from 'react';

/**
 * usePolling — runs `callback` on a fixed interval.
 *
 * Replacement for the old SSE-based real-time updates (EventSource is not
 * viable on Lambda/Amplify because each invocation has isolated in-memory
 * state). Consumers should pass their existing "reload data" function as
 * `callback` and a poll interval in milliseconds (3000-5000ms recommended).
 *
 * The latest `callback` is always invoked (via a ref) so callers don't need
 * to memoize it with useCallback just to satisfy this hook.
 */
export function usePolling(callback: () => void, intervalMs: number): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const id = setInterval(() => callbackRef.current(), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
}
