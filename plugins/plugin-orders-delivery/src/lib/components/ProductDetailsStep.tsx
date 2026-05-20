'use client';

import React, { useState } from 'react';
import {
  ProductDTO,
  ProductPriceDTO,
  ProductComplementDTO,
} from '@temp-workspace/plugin-menu-catalog';
import { useUI } from '@temp-workspace/ui-registry';

interface ProductDetailsStepProps {
  product: ProductDTO;
  onBack: () => void;
  onAdd: (
    price: ProductPriceDTO,
    complements: ProductComplementDTO[],
    notes: string,
  ) => void;
}

const ProductDetailsStep: React.FC<ProductDetailsStepProps> = ({
  product,
  onBack,
  onAdd,
}) => {
  const { resolve } = useUI();
  const Card = resolve('Card');

  const [selectedPrice, setSelectedPrice] = useState<ProductPriceDTO | null>(
    null,
  );
  const [selectedComplements, setSelectedComplements] = useState<
    ProductComplementDTO[]
  >([]);
  const [notes, setNotes] = useState('');
  const [priceError, setPriceError] = useState(false);

  const toggleComplement = (complement: ProductComplementDTO) => {
    setSelectedComplements((prev) =>
      prev.find((c) => c.id === complement.id)
        ? prev.filter((c) => c.id !== complement.id)
        : [...prev, complement],
    );
  };

  const complementGroups = (product.complements || []).reduce<
    Record<string, ProductComplementDTO[]>
  >(
    (acc, c) => {
      if (!acc[c.group]) acc[c.group] = [];
      acc[c.group].push(c);
      return acc;
    },
    {} as Record<string, ProductComplementDTO[]>,
  );

  const totalPrice =
    (selectedPrice ? Number(selectedPrice.value) : 0) +
    selectedComplements.reduce((sum, c) => sum + Number(c.value), 0);

  const handleAdd = () => {
    if (!selectedPrice) {
      setPriceError(true);
      return;
    }
    onAdd(selectedPrice, selectedComplements, notes);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={onBack}
          className="
            px-3.5 py-1.5 border border-border rounded-lg
            bg-card text-foreground cursor-pointer text-sm
            hover:bg-secondary transition-colors
          "
        >
          ← Voltar
        </button>
        <h3 className="m-0 text-foreground">{product.name}</h3>
      </div>

      {product.description && (
        <p className="text-muted-foreground -mt-2 mb-5">
          {product.description}
        </p>
      )}

      {/* Price selection */}
      <div className="mb-4">
        <Card title="Preço" padding="md">
          {!product.prices || product.prices.length === 0 ? (
            <p className="text-destructive">
              Este produto não possui preços configurados.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {product.prices.map((price) => (
                <label
                  key={price.id}
                  className={`
                    flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors
                    ${
                      selectedPrice?.id === price.id
                        ? 'border-2 border-brand bg-brand/10'
                        : 'border border-border bg-card hover:bg-secondary'
                    }
                  `}
                >
                  <input
                    type="radio"
                    name="price"
                    checked={selectedPrice?.id === price.id}
                    onChange={() => {
                      setSelectedPrice(price);
                      setPriceError(false);
                    }}
                    className="accent-brand"
                  />
                  <span className="flex-1 text-foreground">
                    {price.description}
                  </span>
                  <span className="font-semibold text-green-400">
                    R$ {Number(price.value).toFixed(2)}
                  </span>
                </label>
              ))}
            </div>
          )}
          {priceError && (
            <p className="text-destructive text-xs mt-2">
              Selecione um preço para continuar.
            </p>
          )}
        </Card>
      </div>

      {/* Complements */}
      {Object.keys(complementGroups).length > 0 &&
        Object.entries(complementGroups).map(([group, items]) => (
          <div key={group} className="mb-4">
            <Card title={group} padding="md">
              <div className="flex flex-col gap-2">
                {items.map((complement) => {
                  const isSelected = selectedComplements.some(
                    (c) => c.id === complement.id,
                  );
                  return (
                    <label
                      key={complement.id}
                      className={`
                        flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors
                        ${
                          isSelected
                            ? 'border-2 border-brand bg-brand/10'
                            : 'border border-border bg-card hover:bg-secondary'
                        }
                      `}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleComplement(complement)}
                        className="accent-brand"
                      />
                      <span className="flex-1 text-foreground">
                        {complement.title}
                        {complement.description && (
                          <span className="text-xs text-muted-foreground ml-1.5">
                            — {complement.description}
                          </span>
                        )}
                      </span>
                      <span className="font-medium text-muted-foreground">
                        +R$ {Number(complement.value).toFixed(2)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </Card>
          </div>
        ))}

      {/* Notes */}
      <div className="mb-4">
        <Card title="Observações" padding="md">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: Sem cebola, ponto da carne..."
            rows={2}
            className="
              w-full px-3 py-2 border border-border rounded-lg text-sm
              bg-card text-foreground placeholder:text-muted-foreground
              resize-vertical focus:outline-none focus:ring-2 focus:ring-brand
            "
          />
        </Card>
      </div>

      {/* Footer: total + add button */}
      <div className="flex justify-between items-center mt-5">
        <div className="text-lg font-bold text-green-400">
          R$ {totalPrice.toFixed(2)}
        </div>
        <button
          onClick={handleAdd}
          className="
            px-6 py-2.5 rounded-lg border-none
            bg-brand text-black font-semibold text-base
            cursor-pointer hover:bg-yellow-400 transition-colors
          "
        >
          Adicionar ao Pedido
        </button>
      </div>
    </div>
  );
};

export default ProductDetailsStep;
