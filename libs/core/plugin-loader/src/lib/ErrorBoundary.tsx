'use client';

import * as React from 'react';
import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
  name?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[ErrorBoundary] Uncaught error in plugin ${this.props.name || 'unknown'}:`, error, errorInfo);
  }

  public override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{ 
          padding: '8px 12px', 
          margin: '4px',
          backgroundColor: '#fff1f0', 
          border: '1px solid #ffa39e', 
          borderRadius: '4px',
          color: '#cf1322',
          fontSize: '0.85rem',
          display: 'inline-block'
        }}>
          ⚠️ <strong>Plugin Error</strong> {this.props.name && `(${this.props.name})`}
          <div style={{ fontSize: '0.75rem', marginTop: '4px', opacity: 0.8 }}>
            {this.state.error?.message}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
