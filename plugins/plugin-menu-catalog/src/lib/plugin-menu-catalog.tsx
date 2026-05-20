'use client';

import React from 'react';
import { FeaturePlugin, ExtensionContribution, ServicePlugin, pluginLoader } from '@temp-workspace/plugin-loader';
import { useUI } from '@temp-workspace/ui-registry';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Fab, IconButton } from '@temp-workspace/plugin-ui-components';

// ============================================================================
// DTOs & Service API
// ============================================================================

export interface CategoryDTO {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
}

export interface ProductPriceDTO {
  id?: string;
  description: string;
  value: number;
}

export interface ProductComplementDTO {
  id?: string;
  group: string;
  title: string;
  description?: string;
  value: number;
}

export interface ProductDTO {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  categoryId: string;
  prices: ProductPriceDTO[];
  complements: ProductComplementDTO[];
}

export interface MenuCatalogAPI {
  listCategories(): Promise<CategoryDTO[]>;
  getCategoryById(id: string): Promise<CategoryDTO>;
  createCategory(data: { name: string; description?: string; imageUrl?: string }): Promise<CategoryDTO>;
  updateCategory(id: string, data: { name: string; description?: string; imageUrl?: string }): Promise<CategoryDTO>;
  deleteCategory(id: string): Promise<void>;
  listProducts(categoryId?: string): Promise<ProductDTO[]>;
  getProductById(id: string): Promise<ProductDTO>;
  createProduct(data: { name: string; description?: string; imageUrl?: string; categoryId: string; prices: { description: string; value: number }[]; complements?: { group: string; title: string; description?: string; value?: number }[] }): Promise<ProductDTO>;
  updateProduct(id: string, data: { name: string; description?: string; imageUrl?: string; categoryId: string; prices: { description: string; value: number }[]; complements?: { group: string; title: string; description?: string; value?: number }[] }): Promise<ProductDTO>;
  deleteProduct(id: string): Promise<void>;
  listPrices(productId: string): Promise<ProductPriceDTO[]>;
  createPrice(data: { productId: string; description: string; value: number }): Promise<ProductPriceDTO>;
  updatePrice(id: string, data: { description: string; value: number }): Promise<ProductPriceDTO>;
  deletePrice(id: string): Promise<void>;
  listComplements(productId: string): Promise<ProductComplementDTO[]>;
  createComplement(data: { productId: string; group: string; title: string; description?: string; value?: number }): Promise<ProductComplementDTO>;
  updateComplement(id: string, data: { group: string; title: string; description?: string; value?: number }): Promise<ProductComplementDTO>;
  deleteComplement(id: string): Promise<void>;
}

const menuCatalogAPI: MenuCatalogAPI = {
  async listCategories() {
    const res = await fetch('/api/categories');
    return res.json();
  },
  async getCategoryById(id) {
    const res = await fetch(`/api/categories/${id}`);
    if (!res.ok) throw new Error('Category not found');
    return res.json();
  },
  async createCategory(data) {
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async updateCategory(id, data) {
    const res = await fetch(`/api/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async deleteCategory(id) {
    await fetch(`/api/categories/${id}`, { method: 'DELETE' });
  },
  async listProducts(categoryId?: string) {
    const url = categoryId ? `/api/products?categoryId=${categoryId}` : '/api/products';
    const res = await fetch(url);
    return res.json();
  },
  async getProductById(id) {
    const res = await fetch(`/api/products/${id}`);
    if (!res.ok) throw new Error('Product not found');
    return res.json();
  },
  async createProduct(data) {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async updateProduct(id, data) {
    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async deleteProduct(id) {
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
  },
  async listPrices(productId) {
    const res = await fetch(`/api/prices?productId=${productId}`);
    return res.json();
  },
  async createPrice(data) {
    const res = await fetch('/api/prices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async updatePrice(id, data) {
    const res = await fetch(`/api/prices/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async deletePrice(id) {
    await fetch(`/api/prices/${id}`, { method: 'DELETE' });
  },
  async listComplements(productId) {
    const res = await fetch(`/api/complements?productId=${productId}`);
    return res.json();
  },
  async createComplement(data) {
    const res = await fetch('/api/complements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async updateComplement(id, data) {
    const res = await fetch(`/api/complements/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async deleteComplement(id) {
    await fetch(`/api/complements/${id}`, { method: 'DELETE' });
  },
};

// ============================================================================
// Styles (shared)
// ============================================================================

const PLUGIN_ID = 'menu-catalog-ui';

const styles = {
  page: { padding: '0 4px' } as React.CSSProperties,
  headingRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' } as React.CSSProperties,
  sectionTitle: { fontSize: '1.1rem', fontWeight: 700, marginBottom: '12px', color: 'var(--devxp-color-text, #fff)' } as React.CSSProperties,
  pill: (active: boolean) => ({
    padding: '4px 12px',
    borderRadius: '16px',
    border: 'none',
    backgroundColor: active ? '#FFC107' : 'var(--devxp-color-surface, #1E1E1E)',
    color: active ? '#000' : 'var(--devxp-color-text-muted, #A0A0A0)',
    cursor: 'pointer',
    fontSize: '0.85rem',
    whiteSpace: 'nowrap' as const,
    flexShrink: 0,
  }),
  listItem: {
    padding: '12px 0',
    borderBottom: '1px solid var(--devxp-color-border, #2A2A2A)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '8px',
  } as React.CSSProperties,
  actionBtn: (color: string) => ({
    padding: '4px 8px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: color,
    color: color === '#FFC107' ? '#000' : '#fff',
    cursor: 'pointer',
    fontSize: '0.8rem',
  }),
  primaryBtn: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#FFC107',
    color: '#000',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 600,
  } as React.CSSProperties,
  secondaryBtn: {
    padding: '8px 16px',
    border: '1px solid var(--devxp-color-border, #2A2A2A)',
    borderRadius: '6px',
    backgroundColor: 'var(--devxp-color-surface, #121212)',
    color: 'var(--devxp-color-text, #fff)',
    cursor: 'pointer',
    fontSize: '0.9rem',
  } as React.CSSProperties,
  smallDangerBtn: {
    padding: '4px 8px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    color: '#EF4444',
    cursor: 'pointer',
    fontSize: '0.75rem',
  } as React.CSSProperties,
  input: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid var(--devxp-color-border, #2A2A2A)',
    borderRadius: '6px',
    fontSize: '0.95rem',
    boxSizing: 'border-box' as const,
    backgroundColor: 'var(--devxp-color-surface, #121212)',
    color: 'var(--devxp-color-text, #fff)',
  } as React.CSSProperties,
  label: { display: 'block', marginBottom: '4px', fontWeight: 600, fontSize: '0.85rem', color: 'var(--devxp-color-text, #fff)' } as React.CSSProperties,
  fieldGroup: { marginBottom: '16px' } as React.CSSProperties,
  formActions: { display: 'flex', gap: '8px', marginTop: '20px' } as React.CSSProperties,
  empty: { color: 'var(--devxp-color-text-muted, #A0A0A0)', textAlign: 'center' as const, padding: '24px 0' } as React.CSSProperties,
  backLink: { display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '16px', color: 'var(--devxp-color-text-muted, #A0A0A0)', textDecoration: 'none', fontSize: '0.85rem', cursor: 'pointer' } as React.CSSProperties,
  select: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid var(--devxp-color-border, #2A2A2A)',
    borderRadius: '6px',
    fontSize: '0.95rem',
    boxSizing: 'border-box' as const,
    backgroundColor: 'var(--devxp-color-surface, #121212)',
  } as React.CSSProperties,
  priceRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'flex-end',
    marginBottom: '8px',
  } as React.CSSProperties,
  priceField: { flex: 1 } as React.CSSProperties,
  priceFieldSmall: { width: '120px' } as React.CSSProperties,
  pricesSection: { marginBottom: '16px', padding: '12px', backgroundColor: 'var(--devxp-color-surface, #121212)', borderRadius: '8px' } as React.CSSProperties,
};

// ============================================================================
// ImageUpload Component
// ============================================================================

const ImageUpload: React.FC<{ value?: string; onChange: (url: string) => void }> = ({ value, onChange }) => {
  const [uploading, setUploading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      if (data.imageUrl) {
        onChange(data.imageUrl);
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao fazer upload da imagem.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {value && (
        <div style={{ width: '120px', height: '120px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--devxp-color-border, #2A2A2A)' }}>
          <img src={value} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}
      <input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} ref={inputRef} style={{ fontSize: '0.85rem' }} />
      {uploading && <span style={{ fontSize: '0.8rem', color: '#FFC107' }}>Enviando...</span>}
    </div>
  );
};

// ============================================================================
// CategoryForm — create & edit
// ============================================================================

interface CategoryFormPageProps {
  params?: { id?: string };
  categoryId?: string;
}

const CategoryFormPage: React.FC<CategoryFormPageProps> = ({ params, categoryId: propCategoryId }) => {
  const categoryId = params?.id ?? propCategoryId;
  const { resolve } = useUI();
  const CardRef = React.useRef<React.ComponentType<any>>(resolve('Card'));
  const Card = CardRef.current;
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [imageUrl, setImageUrl] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const isEdit = !!categoryId;

  React.useEffect(() => {
    if (isEdit) {
      menuCatalogAPI.getCategoryById(categoryId).then((cat) => {
        setName(cat.name);
        setDescription(cat.description || '');
        setImageUrl(cat.imageUrl || '');
      });
    }
  }, [categoryId, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (isEdit) {
        await menuCatalogAPI.updateCategory(categoryId, { name: name.trim(), description: description.trim() || undefined, imageUrl: imageUrl || undefined });
      } else {
        await menuCatalogAPI.createCategory({ name: name.trim(), description: description.trim() || undefined, imageUrl: imageUrl || undefined });
      }
      window.history.back();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.page}>
      <Link href={`/plugins/${PLUGIN_ID}/categories`} style={styles.backLink}>← Voltar</Link>
      <Card title={isEdit ? 'Editar Categoria' : 'Nova Categoria'} padding="lg">
        <form onSubmit={handleSubmit}>
          <div style={styles.fieldGroup}>
            <label style={styles.label} htmlFor="cat-name">Nome</label>
            <input id="cat-name" style={styles.input} value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label} htmlFor="cat-desc">Descrição</label>
            <input id="cat-desc" style={styles.input} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Imagem</label>
            <ImageUpload value={imageUrl} onChange={setImageUrl} />
          </div>
          <div style={styles.formActions}>
            <button type="submit" style={styles.primaryBtn} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
            <button type="button" style={styles.secondaryBtn} onClick={() => window.history.back()}>Cancelar</button>
          </div>
        </form>
      </Card>
    </div>
  );
};

// ============================================================================
// ProductForm — create & edit (with dynamic prices)
// ============================================================================

interface ProductFormPageProps {
  params?: { id?: string };
  productId?: string;
}

const ProductFormPage: React.FC<ProductFormPageProps> = ({ params, productId: propProductId }) => {
  const productId = params?.id ?? propProductId;
  const { resolve } = useUI();
  const CardRef = React.useRef<React.ComponentType<any>>(resolve('Card'));
  const Card = CardRef.current;
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [imageUrl, setImageUrl] = React.useState('');
  const [categoryId, setCategoryId] = React.useState('');
  const [prices, setPrices] = React.useState<{ id?: string; description: string; value: string }[]>([]);
  const [complements, setComplements] = React.useState<{ id?: string; group: string; title: string; description: string; value: string }[]>([]);
  const [categories, setCategories] = React.useState<CategoryDTO[]>([]);
  const [saving, setSaving] = React.useState(false);
  const isEdit = !!productId;

  React.useEffect(() => {
    menuCatalogAPI.listCategories().then(setCategories);
    if (isEdit) {
      menuCatalogAPI.getProductById(productId).then((prod) => {
        setName(prod.name);
        setDescription(prod.description || '');
        setImageUrl(prod.imageUrl || '');
        setCategoryId(prod.categoryId);
        setPrices(prod.prices.map((p) => ({
          id: p.id,
          description: p.description,
          value: String(p.value),
        })));
        setComplements(prod.complements.map((c) => ({
          id: c.id,
          group: c.group,
          title: c.title,
          description: c.description || '',
          value: String(c.value),
        })));
        if (prod.complements.length > 0) {
          lastGroupRef.current = prod.complements[prod.complements.length - 1].group;
        }
      });
    }
  }, [productId, isEdit]);

  // Price helpers
  const addPrice = () => {
    setPrices((prev) => [...prev, { description: '', value: '' }]);
  };

  const removePrice = (index: number) => {
    setPrices((prev) => prev.filter((_, i) => i !== index));
  };

  const updatePrice = (index: number, field: 'description' | 'value', val: string) => {
    setPrices((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: val } : p)));
  };

  // Complement helpers
  const lastGroupRef = React.useRef('');

  const addComplement = () => {
    setComplements((prev) => [...prev, { group: lastGroupRef.current, title: '', description: '', value: '0' }]);
  };

  const removeComplement = (index: number) => {
    setComplements((prev) => prev.filter((_, i) => i !== index));
  };

  const updateComplement = (index: number, field: 'group' | 'title' | 'description' | 'value', val: string) => {
    setComplements((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: val } : c)));
    if (field === 'group' && val) lastGroupRef.current = val;
  };

  // Unique groups for dropdown
  const groups = React.useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    complements.forEach((c) => {
      if (c.group && c.group !== '---new---' && !seen.has(c.group)) {
        seen.add(c.group);
        list.push(c.group);
      }
    });
    return list;
  }, [complements]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !categoryId || prices.length === 0) return;

    const parsedPrices = prices
      .filter((p) => p.description.trim() && p.value)
      .map((p) => ({ description: p.description.trim(), value: parseFloat(p.value) }));

    if (parsedPrices.length === 0) return;

    const parsedComplements = complements
      .filter((c) => c.group.trim() && c.title.trim())
      .map((c) => ({ group: c.group.trim(), title: c.title.trim(), description: c.description.trim() || undefined, value: parseFloat(c.value) || 0 }));

    setSaving(true);
    try {
      const data = {
        name: name.trim(),
        description: description.trim() || undefined,
        imageUrl: imageUrl || undefined,
        categoryId,
        prices: parsedPrices,
        complements: parsedComplements,
      };
      if (isEdit) {
        await menuCatalogAPI.updateProduct(productId, data);
      } else {
        await menuCatalogAPI.createProduct(data);
      }
      window.history.back();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.page}>
      <Link href={`/plugins/${PLUGIN_ID}/products`} style={styles.backLink}>← Voltar</Link>
      <Card title={isEdit ? 'Editar Produto' : 'Novo Produto'} padding="lg">
        <form onSubmit={handleSubmit}>
          <div style={styles.fieldGroup}>
            <label style={styles.label} htmlFor="prod-name">Nome</label>
            <input id="prod-name" style={styles.input} value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label} htmlFor="prod-cat">Categoria</label>
            <select id="prod-cat" style={styles.select} value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
              <option value="">Selecione...</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label} htmlFor="prod-desc">Descrição</label>
            <input id="prod-desc" style={styles.input} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Imagem</label>
            <ImageUpload value={imageUrl} onChange={setImageUrl} />
          </div>

          {/* Prices section */}
          <div style={styles.pricesSection}>
            <div style={{ ...styles.headingRow, marginBottom: '12px' }}>
              <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Preços ({prices.length})</span>
              <button type="button" style={styles.primaryBtn} onClick={addPrice}>+ Adicionar Preço</button>
            </div>
            {prices.length === 0 && (
              <p style={{ ...styles.empty, padding: '12px 0', fontSize: '0.85rem' }}>Adicione pelo menos 1 preço.</p>
            )}
            {prices.map((p, index) => (
              <div key={index} style={styles.priceRow}>
                <div style={styles.priceField}>
                  <label style={styles.label}>Descrição</label>
                  <input
                    style={styles.input}
                    value={p.description}
                    onChange={(e) => updatePrice(index, 'description', e.target.value)}
                    placeholder="Ex: Unitário, Porção..."
                    required
                  />
                </div>
                <div style={styles.priceFieldSmall}>
                  <label style={styles.label}>Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    style={styles.input}
                    value={p.value}
                    onChange={(e) => updatePrice(index, 'value', e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>
                <button type="button" style={styles.smallDangerBtn} onClick={() => removePrice(index)}>✕</button>
              </div>
            ))}
          </div>

          <div style={styles.formActions}>
            <button type="submit" style={styles.primaryBtn} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
            <button type="button" style={styles.secondaryBtn} onClick={() => window.history.back()}>Cancelar</button>
          </div>
        </form>

        {/* Complements section */}
        <div style={{ ...styles.pricesSection, marginTop: '20px' }}>
          <div style={{ ...styles.headingRow, marginBottom: '12px' }}>
            <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Complementos ({complements.length})</span>
            <button type="button" style={styles.primaryBtn} onClick={addComplement}>+ Adicionar Complemento</button>
          </div>
          {complements.length === 0 && (
            <p style={{ ...styles.empty, padding: '12px 0', fontSize: '0.85rem' }}>Nenhum complemento adicionado.</p>
          )}
          {complements.map((c, index) => (
            <div key={index} style={{ marginBottom: '12px', padding: '12px', backgroundColor: 'var(--devxp-color-surface-elevated, #1E1E1E)', borderRadius: '6px', border: '1px solid var(--devxp-color-border, #2A2A2A)' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Grupo</label>
                  {c.group === '---new---' || (c.group && !groups.includes(c.group)) || groups.length === 0 ? (
                    <input
                      style={styles.input}
                      autoFocus={c.group === '---new---'}
                      value={c.group === '---new---' ? '' : c.group}
                      onChange={(e) => updateComplement(index, 'group', e.target.value)}
                      placeholder="Nome do grupo"
                    />
                  ) : (
                    <select style={styles.select} value={c.group} onChange={(e) => updateComplement(index, 'group', e.target.value)}>
                      <option value="">Selecione...</option>
                      {groups.map((g) => <option key={g} value={g}>{g}</option>)}
                      <option value="---new---">+ Novo grupo</option>
                    </select>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Título</label>
                  <input style={styles.input} value={c.title} onChange={(e) => updateComplement(index, 'title', e.target.value)} placeholder="Ex: Bacon extra" />
                </div>
                <div style={{ ...styles.priceFieldSmall }}>
                  <label style={styles.label}>Valor (R$)</label>
                  <input type="number" step="0.01" style={styles.input} value={c.value} onChange={(e) => updateComplement(index, 'value', e.target.value)} placeholder="0.00" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Descrição</label>
                  <input style={styles.input} value={c.description} onChange={(e) => updateComplement(index, 'description', e.target.value)} placeholder="Ex: Adicionar 2 fatias de bacon" />
                </div>
                <button type="button" style={{ ...styles.smallDangerBtn, marginTop: '16px' }} onClick={() => removeComplement(index)}>✕</button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

// ============================================================================
// CategoryListPage
// ============================================================================

const CategoryListPage: React.FC = () => {
  const { resolve } = useUI();
  const CardRef = React.useRef<React.ComponentType<any>>(resolve('Card'));
  const Card = CardRef.current;
  const router = useRouter();
  const [categories, setCategories] = React.useState<CategoryDTO[]>([]);

  React.useEffect(() => {
    menuCatalogAPI.listCategories().then(setCategories);
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) return;
    try {
      await menuCatalogAPI.deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={styles.page}>
      <Link href={`/plugins/${PLUGIN_ID}`} style={styles.backLink}>← Voltar</Link>
      <Card title="Categorias" padding="lg">
        {categories.length === 0 ? (
          <p style={styles.empty}>Nenhuma categoria cadastrada.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {categories.map((c) => (
              <li key={c.id} style={styles.listItem}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                  {c.imageUrl ? (
                    <div style={{ width: '40px', height: '40px', borderRadius: '4px', overflow: 'hidden', flexShrink: 0 }}>
                      <img src={c.imageUrl} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ) : (
                    <div style={{ width: '40px', height: '40px', borderRadius: '4px', backgroundColor: 'var(--devxp-color-surface-elevated, #2A2A2A)', flexShrink: 0 }} />
                  )}
                  <div style={{ minWidth: 0 }}>
                    <strong>{c.name}</strong>
                    {c.description && <div style={{ fontSize: '0.85rem', color: 'var(--devxp-color-text-muted, #A0A0A0)' }}>{c.description}</div>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                  <IconButton icon="Pencil" variant="ghost" size="sm" href={`/plugins/${PLUGIN_ID}/categories/${c.id}`} title="Editar" />
                  <IconButton icon="Trash2" variant="danger" size="sm" onClick={() => handleDelete(c.id)} title="Excluir" />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Fab
        onClick={() => router.push(`/plugins/${PLUGIN_ID}/categories/new`)}
        title="Nova Categoria"
      >
        +
      </Fab>
    </div>
  );
};

// ============================================================================
// ProductListPage
// ============================================================================

const ProductListPage: React.FC = () => {
  const { resolve } = useUI();
  const CardRef = React.useRef<React.ComponentType<any>>(resolve('Card'));
  const Card = CardRef.current;
  const router = useRouter();
  const [categories, setCategories] = React.useState<CategoryDTO[]>([]);
  const [products, setProducts] = React.useState<ProductDTO[]>([]);
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');

  React.useEffect(() => {
    menuCatalogAPI.listCategories().then(setCategories);
    menuCatalogAPI.listProducts().then(setProducts);
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    try {
      await menuCatalogAPI.deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = selectedCategory === 'all' ? products : products.filter((p) => p.categoryId === selectedCategory);

  const displayPrice = (product: ProductDTO) => {
    if (!product.prices || product.prices.length === 0) return '—';
    if (product.prices.length === 1) return `R$ ${product.prices[0].value.toFixed(2)}`;
    const min = Math.min(...product.prices.map((p) => p.value));
    return `A partir de R$ ${min.toFixed(2)}`;
  };

  return (
    <div style={styles.page}>
      <Link href={`/plugins/${PLUGIN_ID}`} style={styles.backLink}>← Voltar</Link>
      <Card title="Produtos" padding="lg">
        {/* Category filter */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', flexWrap: 'nowrap', paddingBottom: '4px' }}>
          <button onClick={() => setSelectedCategory('all')} style={styles.pill(selectedCategory === 'all')}>Todos</button>
          {categories.map((cat) => (
            <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} style={styles.pill(selectedCategory === cat.id)}>{cat.name}</button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p style={styles.empty}>Nenhum produto nesta categoria.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {filtered.map((p) => (
              <li key={p.id} style={styles.listItem}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                  {p.imageUrl ? (
                    <div style={{ width: '40px', height: '40px', borderRadius: '4px', overflow: 'hidden', flexShrink: 0 }}>
                      <img src={p.imageUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ) : (
                    <div style={{ width: '40px', height: '40px', borderRadius: '4px', backgroundColor: 'var(--devxp-color-surface-elevated, #2A2A2A)', flexShrink: 0 }} />
                  )}
                  <div style={{ minWidth: 0 }}>
                    <strong>{p.name}</strong>
                    {p.description && <div style={{ fontSize: '0.85rem', color: 'var(--devxp-color-text-muted, #A0A0A0)' }}>{p.description}</div>}
                    {p.complements && p.complements.length > 0 && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--devxp-color-text-muted, #A0A0A0)' }}>🔗 {p.complements.length} complemento{p.complements.length > 1 ? 's' : ''}</div>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <span style={{ fontWeight: 600, color: '#FFC107', fontSize: '0.85rem' }}>
                    {displayPrice(p)}
                  </span>
                  <IconButton icon="Pencil" variant="ghost" size="sm" href={`/plugins/${PLUGIN_ID}/products/${p.id}`} title="Editar" />
                  <IconButton icon="Trash2" variant="danger" size="sm" onClick={() => handleDelete(p.id)} title="Excluir" />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Fab
        onClick={() => router.push(`/plugins/${PLUGIN_ID}/products/new`)}
        title="Novo Produto"
      >
        +
      </Fab>
    </div>
  );
};

// ============================================================================
// CatalogPage — main hub
// ============================================================================

const CatalogPage: React.FC = () => {
  const { resolve } = useUI();
  const CardRef = React.useRef<React.ComponentType<any>>(resolve('Card'));
  const Card = CardRef.current;

  return (
    <div style={styles.page}>
      <Card title="Cardápio" padding="lg">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Link href={`/plugins/${PLUGIN_ID}/categories`} style={{ ...styles.primaryBtn, textDecoration: 'none', textAlign: 'center' }}>
            📂 Gerenciar Categorias
          </Link>
          <Link href={`/plugins/${PLUGIN_ID}/products`} style={{ ...styles.primaryBtn, textDecoration: 'none', textAlign: 'center' }}>
            📦 Gerenciar Produtos
          </Link>
        </div>
      </Card>
    </div>
  );
};

// ============================================================================
// Route wrapper components (stable references to avoid remount on re-render)
// ============================================================================

const CategoryFormCreatePage: React.FC = () => <CategoryFormPage />;
const CategoryFormEditPage: React.FC<{ params?: { id?: string } }> = ({ params }) => (
  <CategoryFormPage categoryId={params?.id} />
);
const ProductFormCreatePage: React.FC = () => <ProductFormPage />;
const ProductFormEditPage: React.FC<{ params?: { id?: string } }> = ({ params }) => (
  <ProductFormPage productId={params?.id} />
);

// ============================================================================
// Plugin Registration
// ============================================================================

export const menuCatalogServicePlugin: ServicePlugin = {
  id: 'menu-catalog',
  name: 'Menu Catalog Service',
  type: 'service',
  api: menuCatalogAPI,
};

export const menuCatalogFeaturePlugin: FeaturePlugin = {
  id: 'menu-catalog-ui',
  name: 'Menu Catalog',
  type: 'feature',
  icon: 'ShoppingCart',
  routes: [
    { path: '', component: CatalogPage, label: 'Cardápio' },
    { path: 'categories', component: CategoryListPage, label: 'Categorias', showInMenu: true, icon: 'ShoppingCart' },
    { path: 'categories/new', component: () => <CategoryFormPage />, label: 'Nova Categoria' },
    { path: 'categories/:id', component: ({ params }: { params?: { id: string } }) => <CategoryFormPage categoryId={params?.id} />, label: 'Editar Categoria' },
    { path: 'products', component: ProductListPage, label: 'Produtos', showInMenu: true, icon: 'Store' },
    { path: 'products/new', component: () => <ProductFormPage />, label: 'Novo Produto' },
    { path: 'products/:id', component: ({ params }: { params?: { id: string } }) => <ProductFormPage productId={params?.id} />, label: 'Editar Produto' },
  ],
};
