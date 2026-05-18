import React from 'react';
import * as LucideIcons from 'lucide-react';
import Link from 'next/link';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: keyof typeof LucideIcons;
  variant?: 'primary' | 'danger' | 'ghost' | 'outline';
  href?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const IconButton: React.FC<IconButtonProps> = ({ 
  icon, 
  variant = 'ghost', 
  href, 
  size = 'md',
  className = '', 
  ...props 
}) => {
  const IconComponent = LucideIcons[icon] as React.ElementType;
  if (!IconComponent) return null;

  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const iconSizeMap = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  const variantMap = {
    primary: 'bg-brand text-black hover:bg-yellow-400',
    danger: 'bg-red-500/10 text-red-500 hover:bg-red-500/20',
    ghost: 'bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground',
    outline: 'border border-border bg-transparent text-foreground hover:bg-secondary',
  };

  const baseClasses = `inline-flex items-center justify-center rounded-md transition-colors cursor-pointer border-none ${sizeMap[size]} ${variantMap[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={baseClasses} title={props.title}>
        <IconComponent size={iconSizeMap[size]} />
      </Link>
    );
  }

  return (
    <button className={baseClasses} {...props}>
      <IconComponent size={iconSizeMap[size]} />
    </button>
  );
};
