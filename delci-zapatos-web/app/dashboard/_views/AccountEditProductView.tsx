'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { ChevronLeft, Plus } from 'lucide-react';
import { useDashboardOptional } from '@/app/dashboard/DashboardContext';
import { Button } from '@/app/components/commons/Button';
import { InputField } from '@/app/components/commons/InputField';
import type { Account, AccountItem } from '@/models/account';
import type { Product, ProductCategory, ProductStatus } from '@/models/product';
import { getEffectivePrice, getSizeEffectivePrice } from '@/lib/discountUtils';
import { computeStatus, todayISO } from '@/lib/accountUtils';

type FilterState = {
  query: string;
  category: ProductCategory | 'all';
  status: ProductStatus | 'all';
};

const makeItemId = () => `AI-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export default function AccountEditProductView() {
  const dashboard = useDashboardOptional();
  const params = useParams<{ id?: string | string[] }>();
  const routeId = params?.id;
  const accountId = Array.isArray(routeId) ? routeId[0] : routeId;

  const [account, setAccount] = useState<Account | null>(
    accountId
      ? {
          id: accountId,
          clientId: '',
          clientName: 'Cliente',
          createdAt: todayISO(),
          totalAmount: 0,
          totalPaid: 0,
          remainingAmount: 0,
          totalProducts: 0,
          status: 'active',
          nextPaymentDate: todayISO(),
          items: [],
          payments: [],
        }
      : null
  );
  const [products, setProducts] = useState<Product[]>([]);

  const [filters, setFilters] = useState<FilterState>({
    query: '',
    category: 'all',
    status: 'active',
  });

  const [quantityByProductId, setQuantityByProductId] = useState<Record<string, string>>({});
  const [shoeSizeByProductId, setShoeSizeByProductId] = useState<Record<string, string>>({});

  React.useEffect(() => {
    // TODO: Cargar productos e informacion de cuenta desde API.
    // GET /api/products
    // GET /api/accounts/:id
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

  const handleAddProduct = (product: Product) => {
    if (!account) return;

    const quantity = Math.max(1, Number(quantityByProductId[product.id] ?? '1') || 1);
    let newItem: AccountItem | null = null;

    if (product.category === 'zapatos') {
      const selectedSize = shoeSizeByProductId[product.id] ?? '';
      const sizeVariant = product.sizes.find((variant) => String(variant.size) === selectedSize);
      if (!sizeVariant || sizeVariant.stock <= 0) return;

      const sizePrice = getSizeEffectivePrice(product.price, sizeVariant);
      newItem = {
        id: makeItemId(),
        productId: product.id,
        sku: product.sku,
        name: product.name,
        quantity,
        unitPrice: sizePrice.effectivePrice,
        ...(sizePrice.hasDiscount ? { originalPrice: sizeVariant.price ?? product.price, discountPercentage: sizePrice.discountPercentage } : {}),
        category: 'zapatos',
        color: product.color,
        size: String(sizeVariant.size),
      };
    } else {
      const bagPrice = getEffectivePrice(product);
      newItem = {
        id: makeItemId(),
        productId: product.id,
        sku: product.sku,
        name: product.name,
        quantity,
        unitPrice: bagPrice.effectivePrice,
        ...(bagPrice.hasDiscount ? { originalPrice: product.price, discountPercentage: bagPrice.discountPercentage } : {}),
        category: 'bolsos',
      };
    }

    const nextItems = [...(account.items ?? []), newItem];
    const totalAmount = nextItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const totalProducts = nextItems.reduce((sum, item) => sum + item.quantity, 0);
    const remainingAmount = Math.max(0, totalAmount - account.totalPaid);
    const nextPaymentDate = remainingAmount > 0 ? account.nextPaymentDate ?? todayISO() : undefined;

    const nextAccount: Account = {
      ...account,
      items: nextItems,
      totalAmount,
      totalProducts,
      remainingAmount,
      nextPaymentDate,
      status: computeStatus(remainingAmount, nextPaymentDate),
    };

    setAccount(nextAccount);

    // TODO: Persistir cambios via API.
    // PATCH /api/accounts/:id
    console.log('Pending API integration - update account items payload:', nextAccount);
  };

  if (!account) {
    return (
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20 md:pb-8 w-full">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden p-8 text-center">
          <div className="text-lg font-bold text-gray-900">Cuenta no encontrada</div>
          <div className="text-sm text-gray-600 mt-2">No se pudo cargar la cuenta.</div>
          <div className="mt-6 flex justify-center">
            <Button onClick={() => dashboard?.setView({ key: 'accounts' })} variant="primary">
              Volver a cuentas
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20 md:pb-8 w-full">
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => dashboard?.setView({ key: 'accounts_detail', accountId: account.id })}
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
              <p className="text-sm text-gray-600 mt-1">Cuenta #{account.id} · {account.clientName}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-rose-100 bg-rose-50/70 p-3 text-xs text-rose-700 mb-4">
        TODO: Integrar carga de productos y persistencia de cuenta por API.
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <InputField label="Buscar" value={filters.query} onChange={(value) => setFilters((prev) => ({ ...prev, query: value }))} />

        <div>
          <label htmlFor="account-edit-category" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Categoria</label>
          <select
            id="account-edit-category"
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
          <label htmlFor="account-edit-status" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Estado</label>
          <select
            id="account-edit-status"
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

      <div className="mt-4 bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden p-4 sm:p-6 space-y-3">
        {filteredProducts.length === 0 ? (
          <div className="text-sm text-gray-600">No hay productos disponibles.</div>
        ) : (
          filteredProducts.map((product) => {
            const qty = quantityByProductId[product.id] ?? '1';
            const selectedSize = shoeSizeByProductId[product.id] ?? '';

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
                      onChange={(e) => setShoeSizeByProductId((prev) => ({ ...prev, [product.id]: e.target.value }))}
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
                    onChange={(value) => setQuantityByProductId((prev) => ({ ...prev, [product.id]: value }))}
                  />

                  <Button type="button" size="sm" onClick={() => handleAddProduct(product)}>
                    <Plus className="w-4 h-4 mr-1" />
                    Agregar
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
