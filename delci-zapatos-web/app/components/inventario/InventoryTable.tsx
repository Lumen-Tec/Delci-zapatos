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

export interface InventoryFilterState {
  query: string;
  category: ProductCategory | 'all';
  group: string;
  subcategory: string;
  status: ProductStatus | 'all';
}

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

export const InventoryTable = React.memo<InventoryTableProps>(({ products, onViewProduct, className = '' }) => {
  const [filters, setFilters] = useState<InventoryFilterState>({
    query: '',
    category: 'all',
    group: 'all',
    subcategory: 'all',
    status: 'all',
  });

  const groups = useMemo(() => getGroupsForCategory(filters.category), [filters.category]);
  const subcategories = useMemo(
    () => (filters.group !== 'all' ? getSubcategoriesFor(filters.category, filters.group) : []),
    [filters.category, filters.group]
  );

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

      return matchesQuery && matchesCategory && matchesGroup && matchesSubcategory && matchesStatus;
    });
  }, [products, filters]);

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

  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden ${className}`}>
      <div className="px-4 sm:px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-pink-50/50 via-white to-rose-50/50">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span className="w-2 h-2 bg-pink-500 rounded-full animate-pulse"></span>
              Inventario
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              <span className="font-medium text-pink-600">{filteredProducts.length}</span> de {products.length} productos encontrados
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 flex-1 lg:max-w-4xl">
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
                    <option key={g} value={g}>
                      {g}
                    </option>
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
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
  
      <div className="overflow-x-auto lg:overflow-x-visible">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-50/50 border-b border-gray-100">
            <tr>
              <th className="hidden md:table-cell px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Producto
              </th>
              <th className="hidden xl:table-cell px-3 sm:px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Categoría
              </th>
              <th className="hidden xl:table-cell px-3 sm:px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Grupo
              </th>
              <th className="hidden 2xl:table-cell px-3 sm:px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Subcategoría
              </th>
              <th className="hidden md:table-cell px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Precio
              </th>
              <th className="px-4 sm:px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                Stock
              </th>
              <th className="px-4 sm:px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                Acción
              </th>
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
                  <p className="text-sm text-gray-500 max-w-sm mx-auto">
                    No se encontraron productos con los filtros seleccionados. Intenta ajustar tus criterios.
                  </p>
                </td>
              </tr>
            ) : (
              filteredProducts.map((product, index) => {
                const totalStock = getProductTotalStock(product);
                const sizesLabel = getShoeSizesLabel(product);
                const subtitleParts: string[] = [];

                if (product.category === 'zapatos') {
                  subtitleParts.push(product.color);
                }

                subtitleParts.push(product.group);

                if ('subcategory' in product && product.subcategory) {
                  subtitleParts.push(product.subcategory);
                }

                if (product.category === 'zapatos' && sizesLabel !== '-') {
                  subtitleParts.push(`Tallas: ${sizesLabel}`);
                }

                return (
                  <tr
                    key={product.id}
                    className={`hover:bg-pink-50/30 transition-all duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}
                  >
                    <td className="hidden md:table-cell px-4 sm:px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-gray-100 text-sm font-mono font-medium text-gray-700">
                        #{product.id}
                      </span>
                    </td>

                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-900 break-words">{product.name}</span>
                        <span className="text-xs text-gray-500 mt-0.5 md:hidden">
                          #{product.id} · {subtitleParts.join(' · ')}
                        </span>
                        <span className="hidden md:inline text-xs text-gray-500 mt-0.5">
                          {subtitleParts.join(' · ')}
                        </span>
                      </div>
                    </td>

                    <td className="hidden xl:table-cell px-3 sm:px-4 py-4">
                      <span className="text-sm text-gray-700 capitalize">{product.category}</span>
                    </td>

                    <td className="hidden xl:table-cell px-3 sm:px-4 py-4">
                      <span className="text-sm text-gray-700">{product.group}</span>
                    </td>

                    <td className="hidden 2xl:table-cell px-3 sm:px-4 py-4">
                      {'subcategory' in product && product.subcategory ? (
                        <span className="text-sm text-gray-700">{product.subcategory}</span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>

                    <td className="hidden md:table-cell px-4 sm:px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-700">{formatCurrency(product.price)}</span>
                    </td>

                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-pink-50 text-sm font-semibold text-pink-700">
                        {totalStock}
                      </span>
                    </td>

                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => onViewProduct?.(product)}
                        className="inline-flex items-center justify-center px-3 py-2 rounded-xl text-pink-600 hover:text-white bg-pink-50 hover:bg-pink-500 transition-all duration-200 shadow-sm hover:shadow-md text-xs font-medium"
                        title="Ver / Editar"
                      >
                        <Eye className="w-4 h-4 mr-1.5" />
                        Ver
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
});

InventoryTable.displayName = 'InventoryTable';
