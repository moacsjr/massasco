'use client';

import React from 'react';
import { ProductPriceDTO, ProductComplementDTO } from '@temp-workspace/plugin-menu-catalog';
import { useUI } from '@temp-workspace/ui-registry';
import { CartItem } from '../types';

interface OrderSummaryStepProps {
  cart: CartItem[];
  tableNumber: number;
  onAddMore: () => void;
  onCancel: () => void;
  onSubmit: () => void;
}

const OrderSummaryStep: React.FC<OrderSummaryStepProps> = ({
  cart,
  tableNumber,
  onAddMore,
  onCancel,
  onSubmit,
}) => {
  const { resolve } = useUI();
  const Card = resolve('Card');

  const orderTotal = cart.reduce(
    (sum, item) =>
      sum +
      (Number(item.selectedPrice.value) +
        item.selectedComplements.reduce((s, c) => s + Number(c.value), 0)) *
        item.quantity,
    0
  );

  return (
    <div>
      <h3 className="mt-0 mb-4 text-foreground">Resumo do Pedido — Mesa {tableNumber}</h3>

      {cart.length === 0 ? (
        <p className="text-muted-foreground">Nenhum item no carrinho.</p>
      ) : (
        <>
          {/* Cart items */}
          <div className="flex flex-col gap-3 mb-5">
            {cart.map((item, index) => {
              const itemTotal =
                (Number(item.selectedPrice.value) +
                  item.selectedComplements.reduce((s, c) => s + Number(c.value), 0)) *
                item.quantity;

              return (
                <div key={index}>
                  <Card padding="md">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-semibold text-base text-foreground">
                          {item.product.name} × {item.quantity}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {item.selectedPrice.description} — R$ {Number(item.selectedPrice.value).toFixed(2)}
                        </div>
                        {item.selectedComplements.length > 0 && (
                          <div className="text-sm text-muted-foreground mt-0.5">
                            + {item.selectedComplements.map((c) => c.title).join(', ')}
                          </div>
                        )}
                        {item.notes && (
                          <div className="text-sm text-muted-foreground mt-0.5 italic">
                            Obs: {item.notes}
                          </div>
                        )}
                      </div>
                      <div className="font-semibold text-green-400 whitespace-nowrap">
                        R$ {itemTotal.toFixed(2)}
                      </div>
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>

          {/* Total */}
          <div className="flex justify-between items-center py-3 border-t-2 border-border mb-5">
            <span className="font-bold text-lg text-foreground">Total:</span>
            <span className="font-bold text-xl text-green-400">
              R$ {orderTotal.toFixed(2)}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={onAddMore}
              className="
                px-5 py-2.5 rounded-lg
                border border-brand bg-card text-brand
                font-semibold cursor-pointer
                hover:bg-secondary transition-colors
              "
            >
              + Adicionar mais produtos
            </button>
            <button
              onClick={onCancel}
              className="
                px-5 py-2.5 rounded-lg
                border border-destructive bg-card text-destructive
                font-semibold cursor-pointer
                hover:bg-destructive/10 transition-colors
              "
            >
              Cancelar pedido
            </button>
            <button
              onClick={onSubmit}
              className="
                px-6 py-2.5 rounded-lg border-none
                bg-brand text-black font-semibold
                cursor-pointer ml-auto
                hover:bg-yellow-400 transition-colors
              "
            >
              Enviar pedido
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default OrderSummaryStep;
