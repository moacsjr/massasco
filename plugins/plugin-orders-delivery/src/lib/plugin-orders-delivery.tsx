import { FeaturePlugin } from '@temp-workspace/plugin-loader';
import { OrdersDeliveryPage, NewOrderWizard } from './components';

export const ordersDeliveryPlugin: FeaturePlugin = {
  id: 'orders-delivery',
  name: 'Orders & Delivery',
  type: 'feature',
  icon: '🍽️',
  routes: [
    {
      path: '',
      component: OrdersDeliveryPage,
      label: 'Pedidos',
      icon: 'ShoppingCart',
      showInMenu: true,
    },
    {
      path: 'new',
      component: NewOrderWizard,
      label: 'Novo Pedido',
      showInMenu: false,
    },
  ],
};
