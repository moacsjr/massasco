'use client';

import * as React from 'react';
import { ComponentType } from 'react';
import { pluginLoader } from './plugin-loader';
import { ErrorBoundary } from './ErrorBoundary';
import { ExtensionPoints } from './contracts';

interface ExtensionPointProps<K extends keyof ExtensionPoints> {
  /** The extension point ID — type-checked against ExtensionPoints map */
  id: K;
  /** Props to pass to every contributing component — shape validated by TypeScript */
  props?: ExtensionPoints[K];
}

/**
 * Renders all plugin contributions registered for a given Extension Point.
 *
 * The generic `K` is bounded by `keyof ExtensionPoints`, which means:
 * - `id` must be a declared extension point (compile-time guarantee)
 * - `props` must match the exact shape declared in the ExtensionPoints map
 *
 * Example:
 *   <ExtensionPoint id="app:layout:header" />           // ✅ OK — {} props
 *   <ExtensionPoint id="nonexistent" />                  // ❌ TS ERROR
 */
export function ExtensionPoint<K extends keyof ExtensionPoints>({ id, props }: ExtensionPointProps<K>) {
  const contributions = pluginLoader.getExtensions(id);

  if (contributions.length === 0) {
    return null;
  }

  return (
    <>
      {contributions.map((contribution, index) => {
        const Component = contribution.component as ComponentType<ExtensionPoints[K]>;
        return (
          <ErrorBoundary key={`${id}-${index}`} name={`${id} contribution`}>
            <Component {...props!} />
          </ErrorBoundary>
        );
      })}
    </>
  );
}
