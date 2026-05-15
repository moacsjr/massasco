import { z } from 'zod';
import type { ReactNode, MouseEvent } from 'react';

// === Zod Schemas para Validação em Runtime ===

export const ButtonContractSchema = z.object({
  variant: z.enum(['primary', 'secondary', 'outline']).optional().default('primary'),
  size: z.enum(['sm', 'md', 'lg']).optional().default('md'),
  isLoading: z.boolean().optional(),
  onClick: z.any().optional(),
  children: z.custom<ReactNode>((val) => val !== undefined, "children is required"),
});

export const CardContractSchema = z.object({
  title: z.string().optional(),
  padding: z.enum(['none', 'sm', 'md', 'lg']).optional().default('md'),
  children: z.custom<ReactNode>((val) => val !== undefined, "children is required"),
});

export const InputContractSchema = z.object({
  name: z.string(),
  label: z.string(),
  type: z.enum(['text', 'password', 'email', 'number']).optional().default('text'),
  error: z.string().optional(),
  placeholder: z.string().optional(),
  value: z.union([z.string(), z.number()]).optional(),
  onChange: z.any().optional(),
});

export const IconContractSchema = z.object({
  name: z.string(),
  size: z.enum(['sm', 'md', 'lg']).optional().default('md'),
});

export const DrawerContractSchema = z.object({
  open: z.boolean(),
  position: z.enum(['left', 'right']).default('right'),
  width: z.string().optional(),
  offsetLeft: z.string().optional(),
  onClose: z.any().optional(),
  children: z.custom<ReactNode>((val) => val !== undefined, 'children is required').optional(),
});

export const TabsContractSchema = z.object({
  items: z.array(z.object({
    label: z.string(),
    icon: z.string().optional(),
  })),
  activeIndex: z.number().default(0),
  onChange: z.any().optional(),
  children: z.custom<ReactNode>((val) => val !== undefined, 'children is required').optional(),
});

// === Tipos TypeScript Derivados ===

// Omitimos funções puras do Zod inference onde o Zod Function é mais flexível/menos restrito que o React
export type ButtonProps = Omit<z.infer<typeof ButtonContractSchema>, 'onClick'> & {
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
};

export type CardProps = z.infer<typeof CardContractSchema>;

export type InputProps = Omit<z.infer<typeof InputContractSchema>, 'onChange'> & {
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export type IconProps = z.infer<typeof IconContractSchema>;

export type DrawerProps = Omit<z.infer<typeof DrawerContractSchema>, 'onClose'> & {
  onClose?: () => void;
};

export type TabsProps = Omit<z.infer<typeof TabsContractSchema>, 'onChange'> & {
  onChange?: (index: number) => void;
};

// Mapa de Contratos Disponíveis
export const UI_CONTRACTS = {
  Button: ButtonContractSchema,
  Card: CardContractSchema,
  Input: InputContractSchema,
  Icon: IconContractSchema,
  Drawer: DrawerContractSchema,
  Tabs: TabsContractSchema,
} as const;

export type UIComponentsMap = {
  Button: React.ComponentType<ButtonProps>;
  Card: React.ComponentType<CardProps>;
  Input: React.ComponentType<InputProps>;
  Icon: React.ComponentType<IconProps>;
  Drawer: React.ComponentType<DrawerProps>;
  Tabs: React.ComponentType<TabsProps>;
};
