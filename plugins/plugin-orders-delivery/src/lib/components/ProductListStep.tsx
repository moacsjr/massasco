'use client';

import React, { useState } from 'react';
import { ProductDTO, CategoryDTO } from '@temp-workspace/plugin-menu-catalog';
import { useUI } from '@temp-workspace/ui-registry';

interface ProductListStepProps {
  products: ProductDTO[];
  categories: CategoryDTO[];
  onSelectProduct: (product: ProductDTO) => void;
}

const ProductListStep: React.FC<ProductListStepProps> = ({ products, categories, onSelectProduct }) => {
  const { resolve } = useUI();
  const Card = resolve('Card');

  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = products.filter((p) => {
    const matchesCategory = !selectedCategory || p.categoryId === selectedCategory;
    const matchesSearch = !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div>
      <h3 className="mt-0 mb-4 text-foreground">Selecionar Produto</h3>

      {/* Search */}
      <div className="mb-3">
        <input
          type="text"
          placeholder="Buscar produto..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="
            w-full px-3 py-2 border border-border rounded-lg text-sm
            bg-card text-foreground placeholder:text-muted-foreground
            focus:outline-none focus:ring-2 focus:ring-brand
          "
        />
      </div>

      {/* Category filter */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        <button
          onClick={() => setSelectedCategory('')}
          className={`
            px-3 py-1 rounded-full border-none cursor-pointer text-xs font-medium transition-colors
            ${!selectedCategory
              ? 'bg-brand text-black'
              : 'bg-secondary text-muted-foreground hover:text-foreground'
            }
          `}
        >
          Todos
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`
              px-3 py-1 rounded-full border-none cursor-pointer text-xs font-medium transition-colors
              ${selectedCategory === cat.id
                ? 'bg-brand text-black'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
              }
            `}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Products grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filteredProducts.map((p) => {
          const firstPrice = p.prices?.[0];
          return (
            <div
              key={p.id}
              className="cursor-pointer transition-shadow rounded-lg hover:shadow-lg hover:shadow-brand/5"
              onClick={() => onSelectProduct(p)}
            >
              <Card padding="md">
                <strong className="block mb-1 text-foreground">{p.name}</strong>
                {p.description && (
                  <div className="text-xs text-muted-foreground mb-1.5">{p.description}</div>
                )}
                {firstPrice && (
                  <div className="text-sm font-semibold text-green-400">
                    R$ {Number(firstPrice.value).toFixed(2)}
                  </div>
                )}
                {(!p.prices || p.prices.length === 0) && (
                  <div className="text-xs text-destructive">Sem preço configurado</div>
                )}
              </Card>
            </div>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <p className="text-muted-foreground text-center mt-6">Nenhum produto encontrado.</p>
      )}
    </div>
  );
};

export default ProductListStep;
