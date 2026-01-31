'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Plus } from 'lucide-react';
import { Navbar } from '@/app/components/shared/Navbar';
import { NavButton } from '@/app/components/shared/Navbutton';
import { Footer } from '@/app/components/shared/Footer';
import { Button } from '@/app/components/shared/Button';
import { InputField } from '@/app/components/shared/InputField';
import type { Account, AccountItem } from '@/app/models/account';
import type { Product, ProductCategory, ProductStatus } from '@/app/models/products';
import {
  BAG_GROUPS,
  BOLSOS_MANO_HOMBRO_SUBCATEGORIES,
  CARTERAS_MONEDEROS_SUBCATEGORIES,
  MANOS_LIBRES_SUBCATEGORIES,
  OTROS_ZAPATOS_SUBCATEGORIES,
  RINONERAS_CANGUROS_SUBCATEGORIES,
  SANDALIA_SUBCATEGORIES,
  SHOE_GROUPS,
  TACON_SUBCATEGORIES,
  BOTA_SUBCATEGORIES,
  TENIS_SUBCATEGORIES,
} from '@/app/models/products';
import { mockAccounts, mockProducts } from '@/app/lib/mockData';

type FilterState = {
  query: string;
  category: ProductCategory | 'all';
  group: string;
  subcategory: string;
  status: ProductStatus | 'all';
  shoeSize: string;
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
    minimumFractionDigits: 2,
  }).format(amount);
};

const todayISO = () => new Date().toISOString().slice(0, 10);

const safeParse = <T,>(raw: string | null): T | null => {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

const loadAccounts = (): Account[] => {
  const raw = window.localStorage.getItem('delci_accounts');
  const parsed = safeParse<Account[]>(raw);
  return parsed ?? mockAccounts;
};

const saveAccounts = (accounts: Account[]) => {
  window.localStorage.setItem('delci_accounts', JSON.stringify(accounts));
};

const getStoredProducts = (): Product[] => {
  const parsed = safeParse<Product[]>(window.localStorage.getItem('delci_products'));
  return parsed ?? mockProducts;
};

const getGroupsForCategory = (category: FilterState['category']): string[] => {
  if (category === 'zapatos') return [...SHOE_GROUPS];
  if (category === 'bolsos') return [...BAG_GROUPS];
  return [];
};

const getSubcategoriesFor = (category: FilterState['category'], group: string): string[] => {
  if (category === 'zapatos') {
    switch (group) {
      case 'Sandalias':
        return [...SANDALIA_SUBCATEGORIES];
      case 'Botas':
        return [...BOTA_SUBCATEGORIES];
      case 'Tenis':
        return [...TENIS_SUBCATEGORIES];
      case 'Zapatos de tacón':
        return [...TACON_SUBCATEGORIES];
      case 'Otros estilos':
        return [...OTROS_ZAPATOS_SUBCATEGORIES];
      default:
        return [];
    }
  }

  if (category === 'bolsos') {
    switch (group) {
      case 'Bolsos de mano y hombro':
        return [...BOLSOS_MANO_HOMBRO_SUBCATEGORIES];
      case 'Manos libres':
        return [...MANOS_LIBRES_SUBCATEGORIES];
      case 'Carteras y monederos':
        return [...CARTERAS_MONEDEROS_SUBCATEGORIES];
      case 'Riñoneras y canguros':
        return [...RINONERAS_CANGUROS_SUBCATEGORIES];
      case 'Bolsos para ocasiones especiales':
        return [];
      default:
        return [];
    }
  }

  return [];
};

const makeItemId = () => `AI-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const createShoeAccountItem = (
  product: Extract<Product, { category: 'zapatos' }>,
  selectedSize: string,
  quantity: number
): AccountItem => {
  const base = {
    id: makeItemId(),
    productId: product.id,
    sku: product.sku,
    name: product.name,
    quantity,
    unitPrice: product.price,
    category: 'zapatos' as const,
    color: product.color,
    size: selectedSize,
  };

  switch (product.group) {
    case 'Sandalias':
      return { ...base, group: 'Sandalias', subcategory: product.subcategory };
    case 'Botas':
      return { ...base, group: 'Botas', subcategory: product.subcategory };
    case 'Tenis':
      return { ...base, group: 'Tenis', subcategory: product.subcategory };
    case 'Zapatos de tacón':
      return { ...base, group: 'Zapatos de tacón', subcategory: product.subcategory };
    case 'Otros estilos':
      return { ...base, group: 'Otros estilos', subcategory: product.subcategory };
  }
};

const computeStatus = (remainingAmount: number, nextPaymentDate?: string) => {
  if (remainingAmount <= 0) return 'paid' as const;

  if (nextPaymentDate) {
    const today = todayISO();
    if (nextPaymentDate < today) return 'overdue' as const;
  }

  return 'active' as const;
};

export default function AgregarProductosCuentaPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const accountId = params?.id;

  const [account, setAccount] = useState<Account | null>(null);
  const [products, setProducts] = useState<Product[]>(mockProducts);

  const [filters, setFilters] = useState<FilterState>({
    query: '',
    category: 'all',
    group: 'all',
    subcategory: 'all',
    status: 'active',
    shoeSize: 'all',
  });

  const [quantityByProductId, setQuantityByProductId] = useState<Record<string, string>>({});
  const [shoeSizeByProductId, setShoeSizeByProductId] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!accountId) return;

    setProducts(getStoredProducts());

    const accounts = loadAccounts();
    const found = accounts.find((a) => a.id === accountId) ?? null;
    setAccount(found);
  }, [accountId]);

  const groups = useMemo(() => getGroupsForCategory(filters.category), [filters.category]);
  const subcategories = useMemo(
    () => (filters.group !== 'all' ? getSubcategoriesFor(filters.category, filters.group) : []),
    [filters.category, filters.group]
  );

  const availableShoeSizes = useMemo(() => {
    const sizes = new Set<string>();

    for (const product of products) {
      if (filters.category !== 'all' && product.category !== filters.category) continue;
      if (product.category !== 'zapatos') continue;

      for (const variant of product.sizes) {
        if (variant.stock > 0) sizes.add(String(variant.size));
      }
    }

    return Array.from(sizes).sort((a, b) => a.localeCompare(b));
  }, [products, filters.category]);

  const filteredProducts = useMemo(() => {
    const q = filters.query.trim().toLowerCase();

    return products.filter((product) => {
      const matchesQuery =
        !q ||
        product.name.toLowerCase().includes(q) ||
        product.id.toLowerCase().includes(q) ||
        (product.sku ? product.sku.toLowerCase().includes(q) : false);

      const matchesCategory = filters.category === 'all' || product.category === filters.category;

      const matchesGroup =
        filters.group === 'all' ||
        (filters.category !== 'all' && product.category === filters.category && product.group === filters.group);

      const matchesSubcategory =
        filters.subcategory === 'all' ||
        ('subcategory' in product && product.subcategory === filters.subcategory);

      const matchesStatus = filters.status === 'all' || (product.status ?? 'active') === filters.status;

      const matchesShoeSize =
        filters.shoeSize === 'all' ||
        (product.category === 'zapatos' && product.sizes.some((s) => String(s.size) === filters.shoeSize && s.stock > 0));

      return matchesQuery && matchesCategory && matchesGroup && matchesSubcategory && matchesStatus && matchesShoeSize;
    });
  }, [products, filters]);

  const handleFilterChange = (field: keyof FilterState, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCategoryChange = (value: FilterState['category']) => {
    setFilters((prev) => ({
      ...prev,
      category: value,
      group: 'all',
      subcategory: 'all',
      shoeSize: 'all',
    }));
  };

  const handleGroupChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      group: value,
      subcategory: 'all',
    }));
  };

  const persistAccount = (next: Account) => {
    const accounts = loadAccounts();
    const updated = accounts.map((a) => (a.id === next.id ? next : a));
    saveAccounts(updated);
    setAccount(next);
  };

  const handleAddProduct = (product: Product) => {
    if (!account) return;

    const quantity = Math.max(1, Number(quantityByProductId[product.id] ?? '1') || 1);
    const currentItems = account.items ?? [];

    let nextItems = [...currentItems];

    if (product.category === 'zapatos') {
      const selectedSize = shoeSizeByProductId[product.id] ?? '';
      const validSize = product.sizes.some((s) => String(s.size) === selectedSize && s.stock > 0);
      if (!validSize) return;

      const existingIndex = nextItems.findIndex(
        (i) => i.category === 'zapatos' && i.productId === product.id && String(i.size) === selectedSize
      );

      if (existingIndex >= 0) {
        nextItems[existingIndex] = { ...nextItems[existingIndex], quantity: nextItems[existingIndex].quantity + quantity };
      } else {
        nextItems.push(createShoeAccountItem(product, selectedSize, quantity));
      }
    } else {
      const existingIndex = nextItems.findIndex((i) => i.category === 'bolsos' && i.productId === product.id);
      if (existingIndex >= 0) {
        nextItems[existingIndex] = { ...nextItems[existingIndex], quantity: nextItems[existingIndex].quantity + quantity };
      } else {
        const bagItem: AccountItem = {
          id: makeItemId(),
          productId: product.id,
          sku: product.sku,
          name: product.name,
          quantity,
          unitPrice: product.price,
          category: 'bolsos',
          group: product.group,
          ...('subcategory' in product && product.subcategory ? { subcategory: product.subcategory } : {}),
        } as AccountItem;
        nextItems.push(bagItem);
      }
    }

    const totalAmount = nextItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const totalProducts = nextItems.reduce((sum, item) => sum + item.quantity, 0);
    const remainingAmount = Math.max(0, totalAmount - account.totalPaid);

    const nextPaymentDate = remainingAmount > 0 ? account.nextPaymentDate ?? todayISO() : undefined;
    const status = computeStatus(remainingAmount, nextPaymentDate);

    persistAccount({
      ...account,
      items: nextItems,
      totalAmount,
      totalProducts,
      remainingAmount,
      nextPaymentDate,
      status,
    });
  };

  if (!account) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-pink-100 via-pink-50 to-rose-100 relative">
        <Navbar />
        <NavButton />

        <div className="flex-grow relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden p-8 text-center">
            <div className="text-lg font-bold text-gray-900">Cuenta no encontrada</div>
            <div className="text-sm text-gray-600 mt-2">No se pudo cargar la cuenta.</div>
            <div className="mt-6 flex justify-center">
              <Button onClick={() => router.push('/cuentas')} variant="primary">
                Volver a cuentas
              </Button>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-pink-100 via-pink-50 to-rose-100 relative">
      <Navbar />
      <NavButton />

      <div className="flex-grow relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20 md:pb-8 w-full">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.push(`/cuentas/${account.id}`)}
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
                  className="w-6 h-6 text-white"
                />
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Agregar productos</h1>
                <p className="text-sm text-gray-600 mt-1">Cuenta #{account.id} · {account.clientName}</p>
              </div>
            </div>

            <Button onClick={() => router.push(`/cuentas/${account.id}`)} variant="primary">
              Listo ({account.items?.length ?? 0})
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
          <div className="px-4 sm:px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-pink-50/50 via-white to-rose-50/50">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
              <div className="lg:col-span-2">
                <InputField
                  label="Buscar"
                  value={filters.query}
                  onChange={(value) => handleFilterChange('query', value)}
                  placeholder="Nombre, ID, SKU..."
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Categoría</label>
                <select
                  value={filters.category}
                  onChange={(e) => handleCategoryChange(e.target.value as FilterState['category'])}
                  className="w-full pl-4 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400 hover:border-gray-300 appearance-none shadow-sm"
                >
                  <option value="all">Todas</option>
                  <option value="zapatos">Zapatos</option>
                  <option value="bolsos">Bolsos</option>
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Grupo</label>
                <select
                  value={filters.group}
                  onChange={(e) => handleGroupChange(e.target.value)}
                  disabled={filters.category === 'all'}
                  className="w-full pl-4 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400 hover:border-gray-300 appearance-none shadow-sm disabled:opacity-50"
                >
                  <option value="all">Todos</option>
                  {groups.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Subcategoría</label>
                <select
                  value={filters.subcategory}
                  onChange={(e) => handleFilterChange('subcategory', e.target.value)}
                  disabled={filters.category === 'all' || filters.group === 'all' || subcategories.length === 0}
                  className="w-full pl-4 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400 hover:border-gray-300 appearance-none shadow-sm disabled:opacity-50"
                >
                  <option value="all">Todas</option>
                  {subcategories.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Estado</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full pl-4 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400 hover:border-gray-300 appearance-none shadow-sm"
                >
                  <option value="all">Todos</option>
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Talla</label>
                <select
                  value={filters.shoeSize}
                  onChange={(e) => handleFilterChange('shoeSize', e.target.value)}
                  disabled={filters.category !== 'zapatos'}
                  className="w-full pl-4 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400 hover:border-gray-300 appearance-none shadow-sm disabled:opacity-50"
                >
                  <option value="all">Todas</option>
                  {availableShoeSizes.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Producto</th>
                  <th className="hidden md:table-cell px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Categoría</th>
                  <th className="hidden lg:table-cell px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Grupo</th>
                  <th className="hidden xl:table-cell px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Subcategoría</th>
                  <th className="hidden md:table-cell px-4 sm:px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Precio</th>
                  <th className="px-4 sm:px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Agregar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="text-sm font-semibold text-gray-900">No hay productos</div>
                      <div className="text-sm text-gray-600 mt-1">Ajusta los filtros o revisa inventario.</div>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => {
                    const qty = quantityByProductId[product.id] ?? '1';
                    const selectedSize = shoeSizeByProductId[product.id] ?? '';
                    const availableSizesForProduct = product.category === 'zapatos' ? product.sizes.filter((s) => s.stock > 0) : [];

                    const canAddShoe =
                      product.category !== 'zapatos' || availableSizesForProduct.some((s) => String(s.size) === String(selectedSize));

                    return (
                      <tr key={product.id} className="hover:bg-pink-50/30 transition-all">
                        <td className="px-4 sm:px-6 py-4">
                          <div className="text-sm font-semibold text-gray-900">{product.name}</div>
                          <div className="text-xs text-gray-600 mt-0.5">#{product.id}{product.sku ? ` · ${product.sku}` : ''}</div>
                          {product.category === 'zapatos' ? (
                            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Talla</label>
                                <select
                                  value={selectedSize}
                                  onChange={(e) => setShoeSizeByProductId((prev) => ({ ...prev, [product.id]: e.target.value }))}
                                  className="w-full pl-3 pr-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400"
                                >
                                  <option value="">Seleccionar</option>
                                  {availableSizesForProduct.map((s) => (
                                    <option key={String(s.size)} value={String(s.size)}>
                                      {String(s.size)} ({s.stock})
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <InputField
                                  label="Cantidad"
                                  type="number"
                                  value={qty}
                                  onChange={(value) => setQuantityByProductId((prev) => ({ ...prev, [product.id]: value }))}
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="mt-2 max-w-[160px]">
                              <InputField
                                label="Cantidad"
                                type="number"
                                value={qty}
                                onChange={(value) => setQuantityByProductId((prev) => ({ ...prev, [product.id]: value }))}
                              />
                            </div>
                          )}
                        </td>
                        <td className="hidden md:table-cell px-4 sm:px-6 py-4 text-sm text-gray-700 capitalize">{product.category}</td>
                        <td className="hidden lg:table-cell px-4 sm:px-6 py-4 text-sm text-gray-700">{product.group}</td>
                        <td className="hidden xl:table-cell px-4 sm:px-6 py-4 text-sm text-gray-700">
                          {'subcategory' in product && product.subcategory ? product.subcategory : '-'}
                        </td>
                        <td className="hidden md:table-cell px-4 sm:px-6 py-4 text-right text-sm text-gray-700">{formatCurrency(product.price)}</td>
                        <td className="px-4 sm:px-6 py-4 text-center">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleAddProduct(product)}
                            disabled={!canAddShoe}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Agregar
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="text-sm text-gray-600 text-center">
              Mostrando <span className="font-medium text-gray-900">{filteredProducts.length}</span> de{' '}
              <span className="font-medium text-gray-900">{products.length}</span> productos
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
