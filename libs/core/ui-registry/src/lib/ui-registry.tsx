'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { UIComponentsMap, UI_CONTRACTS } from '@temp-workspace/ui-contracts';

type PartialUIComponentsMap = Partial<UIComponentsMap>;

interface UIContextType {
  components: PartialUIComponentsMap;
}

const UIContext = createContext<UIContextType>({
  components: {},
});

export const UIProvider: React.FC<{
  components: PartialUIComponentsMap;
  children: React.ReactNode;
}> = ({ components, children }) => {
  return (
    <UIContext.Provider value={{ components }}>{children}</UIContext.Provider>
  );
};

// Fallbacks nativos caso o DS não forneça o componente
const FallbackComponents: UIComponentsMap = {
  Button: (props) => (
    <button {...props} className="fallback-button">
      {props.children}
    </button>
  ),
  Card: (props) => (
    <div
      className="fallback-card"
      style={{ border: '1px solid #ccc', padding: '16px' }}
    >
      {props.children}
    </div>
  ),
  Input: (props) => <input {...props} className="fallback-input" />,
  Icon: ({ name, size }) => (
    <span
      style={{
        fontSize: size === 'lg' ? '32px' : size === 'sm' ? '16px' : '24px',
      }}
    >
      {name}
    </span>
  ),
  Drawer: ({ open, children, onClose }) =>
    open ? (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          backgroundColor: 'rgba(0,0,0,0.4)',
        }}
        onClick={onClose}
      >
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            width: '320px',
            height: '100vh',
            backgroundColor: '#fff',
            padding: '16px',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: '18px',
            }}
          >
            ✕
          </button>
          {children}
        </div>
      </div>
    ) : null,
  Tabs: ({ items, activeIndex, onChange, children }) => (
    <div>
      <div style={{ display: 'flex', borderBottom: '1px solid #ccc' }}>
        {items.map((item, i) => (
          <button
            key={i}
            onClick={() => onChange?.(i)}
            style={{
              flex: 1,
              padding: '8px',
              fontWeight: i === activeIndex ? 'bold' : 'normal',
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div style={{ padding: '16px' }}>{children}</div>
    </div>
  ),
};

// HOC para validar props em desenvolvimento
function withValidation<T extends keyof UIComponentsMap>(
  name: T,
  Component: UIComponentsMap[T],
): UIComponentsMap[T] {
  if (process.env.NODE_ENV === 'production') {
    return Component;
  }

  const ValidatedComponent = (props: any) => {
    const contract = UI_CONTRACTS[name];
    if (contract) {
      const result = contract.safeParse(props);
      if (!result.success) {
        console.warn(
          `[UI Registry] Prop validation failed for component <${name}>:`,
          result.error.format(),
        );
      }
    }
    // Renderiza independentemente do erro, garantindo fallbacks ou falha segura
    return <Component {...props} />;
  };

  ValidatedComponent.displayName = `Validated(${name})`;
  return ValidatedComponent as UIComponentsMap[T];
}

export function useUI() {
  const context = useContext(UIContext);

  // Cache resolved components for the duration of this context to prevent remounting
  const resolvedCache = useMemo(() => {
    return {} as Record<string, any>;
  }, [context.components]);

  const resolve = <T extends keyof UIComponentsMap>(
    name: T,
  ): UIComponentsMap[T] => {
    if (resolvedCache[name]) {
      return resolvedCache[name] as UIComponentsMap[T];
    }

    // 1. Resolvemos pelo componente provido no Context (Design System específico)
    let Component = context.components[name];

    // 2. Fallback caso não exista
    if (!Component) {
      console.warn(
        `[UI Registry] Component <${name}> not found in Design System. Using native fallback.`,
      );
      Component = FallbackComponents[name];
    }

    // 3. Em dev, envolvemos num validador de Zod
    const validated = withValidation(name, Component as UIComponentsMap[T]);
    resolvedCache[name] = validated;
    return validated;
  };

  return { resolve };
}
