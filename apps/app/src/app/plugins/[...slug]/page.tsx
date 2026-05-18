'use client';

import React, { useEffect, useState, use } from 'react';
import { pluginLoader, PluginRoute, ErrorBoundary } from '@temp-workspace/plugin-loader';
import { initializePlugins } from '../../../plugins-registry';

interface PluginPageProps {
  params: Promise<{
    slug: string[];
  }>;
}

export default function PluginPage({ params }: PluginPageProps) {
  const resolvedParams = use(params);
  const { slug } = resolvedParams;

  const [route, setRoute] = useState<PluginRoute | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Garante que os plugins estão inicializados no client
    initializePlugins();

    const [pluginId, ...pathParts] = slug;
    const internalPath = pathParts.join('/');

    const resolved = pluginLoader.resolveRoute(pluginId, internalPath);
    
    if (resolved) {
      setRoute(resolved);
    } else {
      setError(`Rota ou Plugin não encontrado: ${slug.join('/')}`);
    }
  }, [slug]);

  if (error) {
    return (
      <div style={{ padding: '20px', color: 'red', border: '1px solid red', borderRadius: '8px' }}>
        <h2>Erro de Plugin</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!route) {
    return <p>Carregando componente do plugin...</p>;
  }

  const Component = route.component;
  const [pluginId, ..._pathParts] = slug;

  // Extract dynamic params from the URL path
  const routeParts = route.path.split('/');
  const pathParts = _pathParts;
  const routeParams: Record<string, string> = {};
  routeParts.forEach((part, i) => {
    if (part.startsWith(':') && pathParts[i]) {
      routeParams[part.slice(1)] = pathParts[i];
    }
  });

  return (
    <div>      
      <ErrorBoundary name={`Plugin Page: ${pluginId}`}>
        <Component params={routeParams} />
      </ErrorBoundary>
    </div>
  );
}
