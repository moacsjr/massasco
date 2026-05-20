import {
  ProductDTO,
  ProductPriceDTO,
  ProductComplementDTO,
} from '@temp-workspace/plugin-menu-catalog';

// ============================================================================
// Order Item (from API)
// ============================================================================

export interface OrderItemDTO {
  id: string;
  orderId: string;
  productId: string;
  product: ProductDTO;
  quantity: number;
  notes: string | null;
  status: 'PENDING' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED';
  selectedPrice: ProductPriceDTO | null;
  selectedComplements: ProductComplementDTO[];
}

// ============================================================================
// Order (from API)
// ============================================================================

export interface OrderDTO {
  id: string;
  tableNumber: number;
  status: 'OPEN' | 'AWAITING_PAYMENT' | 'PAID' | 'CLOSED';
  items: OrderItemDTO[];
  createdAt: string;
}

// ============================================================================
// Cart Item (wizard state)
// ============================================================================

export interface CartItem {
  product: ProductDTO;
  selectedPrice: ProductPriceDTO;
  selectedComplements: ProductComplementDTO[];
  quantity: number;
  notes: string;
}

// ============================================================================
// Wizard Steps
// ============================================================================

export type WizardStep = 'product-list' | 'product-details' | 'order-summary';
