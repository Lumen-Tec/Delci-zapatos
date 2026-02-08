'use client';

import React, { useMemo, useState } from 'react';
import { Eye, Filter, Search } from 'lucide-react';
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
import { getProductTotalStock } from '@/app/models/inventory';
import { isOfferActive, getEffectivePrice, getRemainingOfferDays, productHasActiveDiscount, isSizeOfferActive, getSizeEffectivePrice, getSizeRemainingDays } from '@/app/lib/discountUtils';

export interface InventoryFilterState {
  query: string;
  category: ProductCategory | 'all';
  group: string;
  subcategory: string;
  status: ProductStatus | 'all';
  shoeSize: string;
}

type InventoryTab = 'todos' | 'descuento' | 'activos';

interface InventoryTableProps {
  products: Product[];
  onViewProduct?: (product: Product) => void;
  className?: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
    minimumFractionDigits: 2,
  }).format(amount);
};

const getGroupsForCategory = (category: InventoryFilterState['category']): string[] => {
  if (category === 'zapatos') return [...SHOE_GROUPS];
  if (category === 'bolsos') return [...BAG_GROUPS];
  return [];
};

const getSubcategoriesFor = (category: InventoryFilterState['category'], group: string): string[] => {
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

const TABS: { key: InventoryTab; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'descuento', label: 'Con descuento' },
  { key: 'activos', label: 'Activos' },
];

export const InventoryTable = React.memo<InventoryTableProps>(({ products, onViewProduct, className = '' }) => {
  const [activeTab, setActiveTab] = useState<InventoryTab>('todos');
  const [filters, setFilters] = useState<InventoryFilterState>({
    query: '',
    category: 'all',
    group: 'all',
    subcategory: 'all',
    status: 'all',
    shoeSize: 'all',
  });

  const groups = useMemo(() => getGroupsForCategory(filters.category), [filters.category]);
  const subcategories = useMemo(
    () => (filters.group !== 'all' ? getSubcategoriesFor(filters.category, filters.group) : []),
    [filters.category, filters.group]
  );

  const tabCounts = useMemo(() => {
    const discountCount = products.filter((p) => productHasActiveDiscount(p)).length;
    const activeCount = products.filter((p) => (p.status ?? 'active') === 'active').length;
    return { todos: products.length, descuento: discountCount, activos: activeCount };
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = filters.query.trim().toLowerCase();

    return products.filter((product) => {
      if (activeTab === 'descuento' && !productHasActiveDiscount(product)) return false;
      if (activeTab === 'activos' && (product.status ?? 'active') !== 'active') return false;

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
        (product.category === 'zapatos' && product.sizes.some((s) => s.size === filters.shoeSize && s.stock > 0));

      return matchesQuery && matchesCategory && matchesGroup && matchesSubcategory && matchesStatus && matchesShoeSize;
    });
  }, [products, filters, activeTab]);

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

  const handleFilterChange = (field: keyof InventoryFilterState, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCategoryChange = (value: InventoryFilterState['category']) => {
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

  const getShoeSizesLabel = (product: Product) => {
    if (product.category !== 'zapatos') return '-';

    const withStock = product.sizes.filter((s) => s.stock > 0);
    if (withStock.length === 0) return '-';

    return withStock
      .slice()
      .sort((a, b) => String(a.size).localeCompare(String(b.size)))
      .map((s) => `${s.size}(${s.stock})`)
      .join(', ');
  };

  const renderAllTable = () => (
    <>
      <thead className="bg-gradient-to-r from-gray-50 to-gray-50/50 border-b border-gray-100">
        <tr>
          <th className="hidden md:table-cell px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">ID</th>
          <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Producto</th>
          <th className="hidden xl:table-cell px-3 sm:px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Categoría</th>
          <th className="hidden xl:table-cell px-3 sm:px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Grupo</th>
          <th className="hidden 2xl:table-cell px-3 sm:px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Subcategoría</th>
          <th className="hidden md:table-cell px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Precio</th>
          <th className="px-4 sm:px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Stock</th>
          <th className="px-4 sm:px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Acción</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-50">
        {filteredProducts.length === 0 ? (
          <tr>
            <td colSpan={8} className="px-4 sm:px-6 py-16 text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center mb-4 shadow-sm">
                <Search className="w-8 h-8 text-pink-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">No hay productos</h3>
              <p className="text-sm text-gray-500 max-w-sm mx-auto">No se encontraron productos con los filtros seleccionados.</p>
            </td>
          </tr>
        ) : (
          filteredProducts.map((product, index) => {
            const totalStock = getProductTotalStock(product);
            const sizesLabel = getShoeSizesLabel(product);
            const subtitleParts: string[] = [];

            if (product.category === 'zapatos') subtitleParts.push(product.color);
            subtitleParts.push(product.group);
            if ('subcategory' in product && product.subcategory) subtitleParts.push(product.subcategory);
            if (product.category === 'zapatos' && sizesLabel !== '-') subtitleParts.push(`Tallas: ${sizesLabel}`);

            return (
              <tr key={product.id} className={`hover:bg-pink-50/30 transition-all duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                <td className="hidden md:table-cell px-4 sm:px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-gray-100 text-sm font-mono font-medium text-gray-700">#{product.id}</span>
                </td>
                <td className="px-4 sm:px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-900 break-words">{product.name}</span>
                    <span className="text-xs text-gray-500 mt-0.5 md:hidden">#{product.id} · {subtitleParts.join(' · ')}</span>
                    <span className="hidden md:inline text-xs text-gray-500 mt-0.5">{subtitleParts.join(' · ')}</span>
                  </div>
                </td>
                <td className="hidden xl:table-cell px-3 sm:px-4 py-4"><span className="text-sm text-gray-700 capitalize">{product.category}</span></td>
                <td className="hidden xl:table-cell px-3 sm:px-4 py-4"><span className="text-sm text-gray-700">{product.group}</span></td>
                <td className="hidden 2xl:table-cell px-3 sm:px-4 py-4">
                  {'subcategory' in product && product.subcategory ? <span className="text-sm text-gray-700">{product.subcategory}</span> : <span className="text-sm text-gray-400">-</span>}
                </td>
                <td className="hidden md:table-cell px-4 sm:px-6 py-4 whitespace-nowrap"><span className="text-sm text-gray-700">{formatCurrency(product.price)}</span></td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-pink-50 text-sm font-semibold text-pink-700">{totalStock}</span>
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-center">
                  <button onClick={() => onViewProduct?.(product)} className="inline-flex items-center justify-center px-3 py-2 rounded-xl text-pink-600 hover:text-white bg-pink-50 hover:bg-pink-500 transition-all duration-200 shadow-sm hover:shadow-md text-xs font-medium" title="Ver / Editar">
                    <Eye className="w-4 h-4 mr-1.5" />Ver
                  </button>
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </>
  );

  const renderDiscountTable = () => (
    <>
      <thead className="bg-gradient-to-r from-gray-50 to-gray-50/50 border-b border-gray-100">
        <tr>
          <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Producto</th>
          <th className="hidden md:table-cell px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Detalle descuento</th>
          <th className="hidden md:table-cell px-4 sm:px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Stock</th>
          <th className="px-4 sm:px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Acción</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-50">
        {filteredProducts.length === 0 ? (
          <tr>
            <td colSpan={4} className="px-4 sm:px-6 py-16 text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center mb-4 shadow-sm">
                <Search className="w-8 h-8 text-pink-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">Sin ofertas activas</h3>
              <p className="text-sm text-gray-500 max-w-sm mx-auto">No hay productos con descuento activo actualmente.</p>
            </td>
          </tr>
        ) : (
          filteredProducts.map((product, index) => {
            const totalStock = getProductTotalStock(product);

            if (product.category === 'zapatos') {
              const discountedSizes = product.sizes.filter((s) => isSizeOfferActive(s));
              return (
                <tr key={product.id} className={`hover:bg-pink-50/30 transition-all duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                  <td className="px-4 sm:px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-gray-900 break-words">{product.name}</span>
                      <span className="text-xs text-gray-500 mt-0.5">#{product.id}{product.sku ? ` · ${product.sku}` : ''}</span>
                    </div>
                  </td>
                  <td className="hidden md:table-cell px-4 sm:px-6 py-4">
                    <div className="space-y-1">
                      {discountedSizes.map((s) => {
                        const { effectivePrice, discountPercentage: dp } = getSizeEffectivePrice(product.price, s);
                        const remaining = getSizeRemainingDays(s);
                        return (
                          <div key={String(s.size)} className="flex items-center gap-2 text-xs">
                            <span className="font-medium text-gray-700">T.{s.size}</span>
                            <span className="line-through text-gray-400">{formatCurrency(product.price)}</span>
                            <span className="inline-block px-1.5 py-0.5 bg-rose-100 text-rose-700 font-semibold rounded-full">-{dp}%</span>
                            <span className="font-semibold text-rose-600">{formatCurrency(effectivePrice)}</span>
                            {remaining !== null && (
                              <span className={`${remaining <= 2 ? 'text-red-600' : 'text-gray-500'}`}>
                                {remaining === 0 ? 'Ultimo dia' : `${remaining}d`}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </td>
                  <td className="hidden md:table-cell px-4 sm:px-6 py-4 whitespace-nowrap text-right">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-pink-50 text-sm font-semibold text-pink-700">{totalStock}</span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-center">
                    <button onClick={() => onViewProduct?.(product)} className="inline-flex items-center justify-center px-3 py-2 rounded-xl text-pink-600 hover:text-white bg-pink-50 hover:bg-pink-500 transition-all duration-200 shadow-sm hover:shadow-md text-xs font-medium" title="Ver / Editar">
                      <Eye className="w-4 h-4 mr-1.5" />Ver
                    </button>
                  </td>
                </tr>
              );
            }

            // Bag product - product-level discount
            const { effectivePrice, discountPercentage } = getEffectivePrice(product);
            const remaining = getRemainingOfferDays(product);

            return (
              <tr key={product.id} className={`hover:bg-pink-50/30 transition-all duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                <td className="px-4 sm:px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-900 break-words">{product.name}</span>
                    <span className="text-xs text-gray-500 mt-0.5">#{product.id}{product.sku ? ` · ${product.sku}` : ''}</span>
                  </div>
                </td>
                <td className="hidden md:table-cell px-4 sm:px-6 py-4">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="line-through text-gray-400">{formatCurrency(product.price)}</span>
                    <span className="inline-block px-1.5 py-0.5 bg-rose-100 text-rose-700 font-semibold rounded-full">-{discountPercentage}%</span>
                    <span className="font-semibold text-rose-600">{formatCurrency(effectivePrice)}</span>
                    {remaining !== null && (
                      <span className={`${remaining <= 2 ? 'text-red-600' : 'text-gray-500'}`}>
                        {remaining === 0 ? 'Ultimo dia' : `${remaining}d`}
                      </span>
                    )}
                  </div>
                </td>
                <td className="hidden md:table-cell px-4 sm:px-6 py-4 whitespace-nowrap text-right">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-pink-50 text-sm font-semibold text-pink-700">{totalStock}</span>
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-center">
                  <button onClick={() => onViewProduct?.(product)} className="inline-flex items-center justify-center px-3 py-2 rounded-xl text-pink-600 hover:text-white bg-pink-50 hover:bg-pink-500 transition-all duration-200 shadow-sm hover:shadow-md text-xs font-medium" title="Ver / Editar">
                    <Eye className="w-4 h-4 mr-1.5" />Ver
                  </button>
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </>
  );

  const renderActiveTable = () => (
    <>
      <thead className="bg-gradient-to-r from-gray-50 to-gray-50/50 border-b border-gray-100">
        <tr>
          <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Producto</th>
          <th className="hidden md:table-cell px-3 sm:px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Categoría</th>
          <th className="hidden lg:table-cell px-3 sm:px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Grupo</th>
          <th className="px-4 sm:px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Precio</th>
          <th className="px-4 sm:px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Stock</th>
          <th className="px-4 sm:px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Acción</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-50">
        {filteredProducts.length === 0 ? (
          <tr>
            <td colSpan={6} className="px-4 sm:px-6 py-16 text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center mb-4 shadow-sm">
                <Search className="w-8 h-8 text-pink-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">Sin productos activos</h3>
              <p className="text-sm text-gray-500 max-w-sm mx-auto">No hay productos activos con los filtros seleccionados.</p>
            </td>
          </tr>
        ) : (
          filteredProducts.map((product, index) => {
            const totalStock = getProductTotalStock(product);
            const hasDiscount = productHasActiveDiscount(product);

            return (
              <tr key={product.id} className={`hover:bg-pink-50/30 transition-all duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                <td className="px-4 sm:px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-900 break-words">
                      {product.name}
                      {hasDiscount && (
                        <span className="ml-2 inline-block px-1.5 py-0.5 bg-rose-100 text-rose-600 text-xs font-medium rounded-full">Oferta</span>
                      )}
                    </span>
                    <span className="text-xs text-gray-500 mt-0.5">#{product.id}{product.sku ? ` · ${product.sku}` : ''}</span>
                  </div>
                </td>
                <td className="hidden md:table-cell px-3 sm:px-4 py-4"><span className="text-sm text-gray-700 capitalize">{product.category}</span></td>
                <td className="hidden lg:table-cell px-3 sm:px-4 py-4"><span className="text-sm text-gray-700">{product.group}</span></td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right">
                  <span className="text-sm text-gray-700">{formatCurrency(product.price)}</span>
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-pink-50 text-sm font-semibold text-pink-700">{totalStock}</span>
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-center">
                  <button onClick={() => onViewProduct?.(product)} className="inline-flex items-center justify-center px-3 py-2 rounded-xl text-pink-600 hover:text-white bg-pink-50 hover:bg-pink-500 transition-all duration-200 shadow-sm hover:shadow-md text-xs font-medium" title="Ver / Editar">
                    <Eye className="w-4 h-4 mr-1.5" />Ver
                  </button>
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </>
  );

  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden ${className}`}>
      <div className="px-4 sm:px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-pink-50/50 via-white to-rose-50/50">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span className="w-2 h-2 bg-pink-500 rounded-full animate-pulse"></span>
              Inventario
            </h3>

            <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                    activeTab === tab.key
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                  <span className={`ml-1.5 inline-flex items-center justify-center px-1.5 py-0.5 text-xs rounded-full ${
                    activeTab === tab.key ? 'bg-pink-100 text-pink-700' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {tabCounts[tab.key]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <div>
              <label htmlFor="inventory-query" className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Buscar
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  id="inventory-query"
                  type="text"
                  value={filters.query}
                  onChange={(e) => handleFilterChange('query', e.target.value)}
                  placeholder="Nombre, ID, SKU..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400 hover:border-gray-300 placeholder:text-gray-400 shadow-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="inventory-category" className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Categoría
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter className="w-4 h-4 text-gray-400" />
                </div>
                <select
                  id="inventory-category"
                  value={filters.category}
                  onChange={(e) => handleCategoryChange(e.target.value as InventoryFilterState['category'])}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400 hover:border-gray-300 appearance-none shadow-sm"
                >
                  <option value="all">Todas</option>
                  <option value="zapatos">Zapatos</option>
                  <option value="bolsos">Bolsos</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="inventory-group" className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Grupo
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter className="w-4 h-4 text-gray-400" />
                </div>
                <select
                  id="inventory-group"
                  value={filters.group}
                  onChange={(e) => handleGroupChange(e.target.value)}
                  disabled={filters.category === 'all'}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400 hover:border-gray-300 appearance-none shadow-sm disabled:opacity-50"
                >
                  <option value="all">Todos</option>
                  {groups.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="inventory-subcategory" className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Subcategoría
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter className="w-4 h-4 text-gray-400" />
                </div>
                <select
                  id="inventory-subcategory"
                  value={filters.subcategory}
                  onChange={(e) => handleFilterChange('subcategory', e.target.value)}
                  disabled={filters.category === 'all' || filters.group === 'all' || subcategories.length === 0}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400 hover:border-gray-300 appearance-none shadow-sm disabled:opacity-50"
                >
                  <option value="all">Todas</option>
                  {subcategories.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="inventory-status" className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Estado
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter className="w-4 h-4 text-gray-400" />
                </div>
                <select
                  id="inventory-status"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400 hover:border-gray-300 appearance-none shadow-sm"
                >
                  <option value="all">Todos</option>
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="inventory-shoe-size" className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Talla
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter className="w-4 h-4 text-gray-400" />
                </div>
                <select
                  id="inventory-shoe-size"
                  value={filters.shoeSize}
                  onChange={(e) => handleFilterChange('shoeSize', e.target.value)}
                  disabled={filters.category !== 'zapatos'}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400 hover:border-gray-300 appearance-none shadow-sm disabled:opacity-50"
                >
                  <option value="all">Todas</option>
                  {availableShoeSizes.map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto lg:overflow-x-visible">
        <table className="w-full">
          {activeTab === 'todos' && renderAllTable()}
          {activeTab === 'descuento' && renderDiscountTable()}
          {activeTab === 'activos' && renderActiveTable()}
        </table>
      </div>

      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex flex-col gap-1 text-center">
          <div className="text-sm font-semibold text-gray-900">Inventario</div>
          <div className="text-sm text-gray-600">
            <span className="font-medium text-gray-900">{filteredProducts.length}</span> de{' '}
            <span className="font-medium text-gray-900">{products.length}</span> productos encontrados
          </div>
        </div>
      </div>
    </div>
  );
});

InventoryTable.displayName = 'InventoryTable';
