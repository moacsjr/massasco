"use client";

import { FeaturePlugin } from '@temp-workspace/plugin-loader';
import { OrdersDeliveryContainer } from './containers/OrdersDeliveryContainer';
import { NewOrderContainer } from './containers/NewOrderContainer';

// Re-export containers for direct imports by other plugins if needed
export { OrdersDeliveryContainer, NewOrderContainer } from './containers';

export const ordersDeliveryPlugin: FeaturePlugin = {
  id: 'orders-delivery',
  name: 'Orders & Delivery',
  type: 'feature',
  icon: '🍽️',
  routes: [
    {
      path: '',
      component: OrdersDeliveryContainer,
      label: 'Pedidos',
      icon: 'ShoppingCart',
      showInMenu: true,
    },
    {
      path: 'new',
      component: NewOrderContainer,
      label: 'Novo Pedido',
      showInMenu: false,
    },
  ],
};
