'use client';

import React, { useEffect } from 'react';
import { ButtonProps, CardProps, InputProps, IconProps, DrawerProps, TabsProps, UIComponentsMap } from '@temp-workspace/ui-contracts';
import { Button as ShadcnButton } from '../components/ui/button';
import { Card as ShadcnCard, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';
import { Input as ShadcnInput } from '../components/ui/input';
import { Tabs as ShadcnTabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import * as LucideIcons from 'lucide-react';

function cn(...inputs: (string | undefined | false | null)[]) {
  return twMerge(clsx(inputs));
}

// ============================================================================
// Button — primary = yellow brand (#FFC107)
// ============================================================================

const Button: React.FC<ButtonProps> = ({ variant, size, isLoading, children, onClick }) => {
  const variantMap: Record<NonNullable<ButtonProps['variant']>, Parameters<typeof ShadcnButton>[0]['variant']> = {
    primary: 'default',    // yellow background, black text
    secondary: 'secondary', // elevated surface
    outline: 'outline',     // white border
  };

  const sizeMap: Record<NonNullable<ButtonProps['size']>, Parameters<typeof ShadcnButton>[0]['size']> = {
    sm: 'sm',
    md: 'default',
    lg: 'lg',
  };

  return (
    <ShadcnButton
      variant={variantMap[variant || 'primary']}
      size={sizeMap[size || 'md']}
      onClick={onClick}
      disabled={isLoading}
    >
      {isLoading ? 'Carregando...' : children}
    </ShadcnButton>
  );
};

// ============================================================================
// Card — dark surface (#121212)
// ============================================================================

const Card: React.FC<CardProps & { description?: string; footer?: React.ReactNode }> = ({
  title,
  description,
  padding,
  children,
  footer,
}) => {
  const paddingMap: Record<NonNullable<CardProps['padding']>, string> = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  return (
    <ShadcnCard>
      {title && (
        <CardHeader className="pb-2">
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className={cn(paddingMap[padding || 'md'], !title && 'pt-4')}>
        {children}
      </CardContent>
      {footer && <CardFooter>{footer}</CardFooter>}
    </ShadcnCard>
  );
};

// ============================================================================
// Input — dark background, yellow focus ring
// ============================================================================

const Input: React.FC<InputProps> = ({ name, label, error, placeholder, type, value, onChange }) => {
  return (
    <div className="flex flex-col gap-1.5 mb-3">
      <label htmlFor={name} className="text-sm font-medium text-foreground">{label}</label>
      <ShadcnInput
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={cn(error && 'border-destructive')}
      />
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
};

// ============================================================================
// Icon — Lucide by name, emoji fallback
// ============================================================================

const Icon: React.FC<IconProps> = ({ name, size }) => {
  const sizeMap: Record<NonNullable<IconProps['size']>, string> = {
    sm: '16px',
    md: '24px',
    lg: '32px',
  };

  const IconComponent = (LucideIcons as unknown as Record<string, React.ComponentType<{ size?: string | number }>>)[name];

  if (IconComponent) {
    return <IconComponent size={sizeMap[size || 'md']} />;
  }

  return (
    <span
      role="img"
      aria-label={name}
      style={{ fontSize: sizeMap[size || 'md'], lineHeight: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
    >
      {name}
    </span>
  );
};

// ============================================================================
// Drawer — uses z-index CSS variables
// ============================================================================

const Drawer: React.FC<DrawerProps> = ({ open, position = 'right', width, offsetLeft, onClose, children }) => {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const drawerWidth = width ?? '320px';
  const isLeft = position === 'left';

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 bg-black/80 z-[var(--z-overlay)]" />
      <div
        className={cn(
          'fixed top-0 h-screen bg-card shadow-lg z-[var(--z-drawer)] flex flex-col overflow-auto',
          isLeft ? 'left-0' : 'right-0'
        )}
        style={{
          width: drawerWidth,
          left: isLeft ? offsetLeft : undefined,
        }}
      >
        <button
          onClick={onClose}
          className={cn(
            'absolute top-3 bg-transparent border-none text-xl cursor-pointer text-foreground z-[var(--z-tooltip)]',
            isLeft ? 'right-3' : 'left-3'
          )}
          aria-label="Close drawer"
        >
          ✕
        </button>
        {children}
      </div>
    </>
  );
};

// ============================================================================
// Tabs — active underline = yellow
// ============================================================================

const Tabs: React.FC<TabsProps> = ({ items, activeIndex = 0, onChange, children }) => {
  return (
    <ShadcnTabs value={items[activeIndex]?.label || ''} onValueChange={(value) => {
      const index = items.findIndex((item) => item.label === value);
      if (index >= 0) onChange?.(index);
    }}>
      <TabsList className="w-full justify-start bg-card">
        {items.map((item, i) => (
          <TabsTrigger key={i} value={item.label} className="flex items-center gap-1.5 data-[state=active]:text-brand">
            {item.icon && <span className="text-base">{item.icon}</span>}
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>
      <div className="mt-2 overflow-auto p-4">{children}</div>
    </ShadcnTabs>
  );
};

export const components: UIComponentsMap = {
  Button,
  Card,
  Input,
  Icon,
  Drawer,
  Tabs,
};
