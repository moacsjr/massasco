'use client';

import React, { useState } from 'react';
import { ProductDTO, CategoryDTO } from '@temp-workspace/plugin-menu-catalog';
import { useUI } from '@temp-workspace/ui-registry';

interface ProductListStepProps {
  products: ProductDTO[] | null | undefined;
  categories: CategoryDTO[] | null | undefined;
  onSelectProduct: (product: ProductDTO) => void;
}

const ProductListStep: React.FC<ProductListStepProps> = ({
  products,
  categories,
  onSelectProduct,
}) => {
  const { resolve } = useUI();
  const Card = resolve('Card');
  const Icon = resolve('Icon');

  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Ensure products and categories are always arrays to prevent .filter() and .map() errors
  const productsArray = Array.isArray(products) ? products : [];
  const categoriesArray = Array.isArray(categories) ? categories : [];
  const filteredProducts = productsArray.filter((p) => {
    const matchesCategory =
      !selectedCategory || p.categoryId === selectedCategory;
    const matchesSearch =
      !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase());
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
            ${
              !selectedCategory
                ? 'bg-brand text-black'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }
          `}
        >
          Todos
        </button>
        {categoriesArray.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`
              px-3 py-1 rounded-full border-none cursor-pointer text-xs font-medium transition-colors
              ${
                selectedCategory === cat.id
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
      <div className="grid grid-cols-2 gap-3">
        {filteredProducts.map((p) => {
          const firstPrice = p.prices?.[0];
          return (
            <div
              key={p.id}
              className="cursor-pointer transition-shadow rounded-lg hover:shadow-lg hover:shadow-brand/5 group h-full"
              onClick={() => onSelectProduct(p)}
            >
              <Card padding="none">
                <div className="flex flex-col h-full min-h-[180px]">
                  {/* Image Area */}
                  {p.imageUrl ? (
                    <div className="w-full h-24 sm:h-32 rounded-t-lg border-b border-border overflow-hidden">
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-24 sm:h-32 bg-secondary flex items-center justify-center text-muted-foreground/30 rounded-t-lg border-b border-border">
                      <Icon name="Utensils" size="lg" />
                    </div>
                  )}

                  {/* Content Area */}
                  <div className="p-3 flex flex-col flex-1">
                    <strong
                      className="block mb-1 text-sm text-foreground truncate"
                      title={p.name}
                    >
                      {p.name}
                    </strong>
                    <div
                      className="text-xs text-muted-foreground mb-2 line-clamp-2 leading-tight flex-1"
                      title={p.description}
                    >
                      {p.description || 'Sem descrição'}
                    </div>

                    {/* Footer Row */}
                    <div className="flex items-center justify-between mt-auto pt-1">
                      <div className="flex-1 truncate pr-1">
                        {firstPrice ? (
                          <span className="text-sm font-bold text-green-400">
                            R$ {Number(firstPrice.value).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-[10px] text-destructive">
                            Sem preço
                          </span>
                        )}
                      </div>
                      <div className="shrink-0 flex items-center justify-center w-7 h-7 bg-brand/10 group-hover:bg-brand text-brand group-hover:text-black rounded-full transition-colors">
                        <Icon name="Plus" size="sm" />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <p className="text-muted-foreground text-center mt-6">
          Nenhum produto encontrado.
        </p>
      )}
    </div>
  );
};

export default ProductListStep;
