'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, Plus, Trash2 } from 'lucide-react';
import { useDashboardOptional } from '@/app/dashboard/DashboardContext';
import { Button } from '@/app/components/commons/Button';
import { InputField } from '@/app/components/commons/InputField';
import type { AccountItem } from '@/models/account';
import type { Product, ProductCategory, ProductStatus } from '@/models/product';
import { getEffectivePrice, getSizeEffectivePrice } from '@/lib/discountUtils';

type Draft = {
  clientId: string;
  biweeklyAmount: number;
  nextPaymentDate: string;
  initialPendingAmount: number;
  items: AccountItem[];
};

const DRAFT_KEY = 'delci_account_draft';

type FilterState = {
  query: string;
  category: ProductCategory | 'all';
  status: ProductStatus | 'all';
};

const safeParse = <T,>(raw: string | null): T | null => {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

const makeItemId = () => `AI-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
    minimumFractionDigits: 2,
  }).format(amount);

export default function AccountsAddProductView() {
  const dashboard = useDashboardOptional();
  const [products, setProducts] = useState<Product[]>([]);
  const [draft, setDraft] = useState<Draft | null>(() => safeParse<Draft>(window.localStorage.getItem(DRAFT_KEY)));
  const [filters, setFilters] = useState<FilterState>({ query: '', category: 'all', status: 'active' });
  const [qtyByProductId, setQtyByProductId] = useState<Record<string, string>>({});
  const [sizeByProductId, setSizeByProductId] = useState<Record<string, string>>({});

  React.useEffect(() => {
    // TODO: Cargar productos desde API.
    // const response = await fetch('/api/products', { cache: 'no-store' });
    // const data = (await response.json()) as Product[];
    // setProducts(data);
    setProducts([]);
  }, []);

  const filteredProducts = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    return products.filter((product) => {
      const matchesQuery = !q || product.name.toLowerCase().includes(q) || (product.sku ?? '').toLowerCase().includes(q);
      const matchesCategory = filters.category === 'all' || product.category === filters.category;
      const matchesStatus = filters.status === 'all' || (product.status ?? 'active') === filters.status;
      return matchesQuery && matchesCategory && matchesStatus;
    });
  }, [products, filters]);

  const updateDraft = (next: Draft) => {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
    setDraft(next);
  };

  const handleAdd = (product: Product) => {
    if (!draft) return;

    const qty = Math.max(1, Number(qtyByProductId[product.id] ?? '1') || 1);

    if (product.category === 'zapatos') {
      const selectedSize = sizeByProductId[product.id] ?? '';
      const sizeVariant = product.sizes.find((variant) => String(variant.size) === selectedSize);
      if (!sizeVariant || sizeVariant.stock <= 0) return;

      const price = getSizeEffectivePrice(product.price, sizeVariant);
      const newItem: AccountItem = {
        id: makeItemId(),
        productId: product.id,
        sku: product.sku,
        name: product.name,
        quantity: qty,
        unitPrice: price.effectivePrice,
        ...(price.hasDiscount ? { originalPrice: sizeVariant.price ?? product.price, discountPercentage: price.discountPercentage } : {}),
        category: 'zapatos',
        color: product.color,
        size: String(sizeVariant.size),
      };

      updateDraft({ ...draft, items: [...draft.items, newItem] });
      return;
    }

    const bagPrice = getEffectivePrice(product);
    const bagItem: AccountItem = {
      id: makeItemId(),
      productId: product.id,
      sku: product.sku,
      name: product.name,
      quantity: qty,
      unitPrice: bagPrice.effectivePrice,
      ...(bagPrice.hasDiscount ? { originalPrice: product.price, discountPercentage: bagPrice.discountPercentage } : {}),
      category: 'bolsos',
    };

    updateDraft({ ...draft, items: [...draft.items, bagItem] });
  };

  return (
    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20 md:pb-8 w-full">
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => dashboard?.setView({ key: 'accounts_new' })}
              className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/80 border border-rose-200 text-rose-700 shadow-sm hover:bg-white transition-all"
              title="Volver"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-lg">
              <Image
                src="https://res.cloudinary.com/drec8g03e/image/upload/v1769717761/inventario_sdhozi.svg"
                alt="Inventario"
                width={24}
                height={24}
                className="w-6 h-6"
              />
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Agregar productos</h1>
              <p className="text-sm text-gray-600 mt-1">Selecciona productos para el borrador de cuenta</p>
            </div>
          </div>

          <Button onClick={() => dashboard?.setView({ key: 'accounts_new' })} variant="primary">
            Listo ({draft?.items.length ?? 0})
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-rose-100 bg-rose-50/70 p-3 text-xs text-rose-700 mb-4">
        TODO: Integrar catalogo de productos y guardado de items del borrador via API.
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden p-4 sm:p-6 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <InputField label="Buscar" value={filters.query} onChange={(value) => setFilters((prev) => ({ ...prev, query: value }))} />
          <div>
            <label htmlFor="draft-cat" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Categoria</label>
            <select
              id="draft-cat"
              value={filters.category}
              onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value as FilterState['category'] }))}
              className="w-full pl-4 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm"
            >
              <option value="all">Todas</option>
              <option value="zapatos">Zapatos</option>
              <option value="bolsos">Bolsos</option>
            </select>
          </div>
          <div>
            <label htmlFor="draft-st" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Estado</label>
            <select
              id="draft-st"
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value as FilterState['status'] }))}
              className="w-full pl-4 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm"
            >
              <option value="all">Todos</option>
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
            </select>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-sm text-gray-600">No hay productos disponibles.</div>
        ) : (
          filteredProducts.map((product) => {
            const qty = qtyByProductId[product.id] ?? '1';
            const selectedSize = sizeByProductId[product.id] ?? '';

            return (
              <div key={product.id} className="border border-gray-100 rounded-xl p-3 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                <div className="sm:col-span-2">
                  <div className="text-sm font-semibold text-gray-900">{product.name}</div>
                  <div className="text-xs text-gray-600 mt-0.5">{product.category}</div>
                </div>

                {product.category === 'zapatos' ? (
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Talla</label>
                    <select
                      value={selectedSize}
                      onChange={(e) => setSizeByProductId((prev) => ({ ...prev, [product.id]: e.target.value }))}
                      className="w-full pl-3 pr-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm"
                    >
                      <option value="">Seleccionar</option>
                      {product.sizes
                        .filter((variant) => variant.stock > 0)
                        .map((variant) => (
                          <option key={String(variant.size)} value={String(variant.size)}>
                            {String(variant.size)} ({variant.stock})
                          </option>
                        ))}
                    </select>
                  </div>
                ) : (
                  <div />
                )}

                <div className="flex gap-2">
                  <InputField
                    label="Cantidad"
                    type="number"
                    value={qty}
                    onChange={(value) => setQtyByProductId((prev) => ({ ...prev, [product.id]: value }))}
                  />
                  <Button type="button" size="sm" onClick={() => handleAdd(product)}>
                    <Plus className="w-4 h-4 mr-1" />
                    Agregar
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Productos agregados</h2>
            <p className="text-sm text-gray-600 mt-1">{draft?.items.length ?? 0} productos</p>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-600">Total</div>
            <div className="text-lg font-bold text-gray-900">
              {formatCurrency((draft?.items ?? []).reduce((sum, item) => sum + item.quantity * item.unitPrice, 0))}
            </div>
          </div>
        </div>

        <div className="p-6 space-y-2">
          {(draft?.items ?? []).length === 0 ? (
            <div className="text-sm text-gray-600">No has agregado productos.</div>
          ) : (
            (draft?.items ?? []).map((item) => (
              <div key={item.id} className="border border-gray-100 rounded-xl p-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-gray-900">{item.name}</div>
                  <div className="text-xs text-gray-600">Cant: {item.quantity}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">{formatCurrency(item.unitPrice * item.quantity)}</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (!draft) return;
                      updateDraft({ ...draft, items: draft.items.filter((current) => current.id !== item.id) });
                    }}
                    className="inline-flex items-center justify-center px-3 py-2 rounded-xl text-gray-600 hover:text-white bg-gray-100 hover:bg-gray-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
