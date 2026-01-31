'use client';

import React, { useMemo, useState } from 'react';
import { Pencil, Save, X as XIcon, Trash2, Plus } from 'lucide-react';
import { Modal } from '@/app/components/shared/Modal';
import { InputField } from '@/app/components/shared/InputField';
import { Button } from '@/app/components/shared/Button';
import type { Product, ProductCategory, ProductStatus, ShoeProduct } from '@/app/models/products';
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

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onProductUpdated?: (product: Product) => void;
}

type SizeRow = {
  size: string;
  stock: string;
};

const getGroupsForCategory = (category: ProductCategory): string[] => {
  if (category === 'zapatos') return [...SHOE_GROUPS];
  return [...BAG_GROUPS];
};

const getSubcategoriesFor = (category: ProductCategory, group: string): string[] => {
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
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
    minimumFractionDigits: 2,
  }).format(amount);
};

const toSizeRows = (product: ShoeProduct): SizeRow[] => {
  return product.sizes.map((s) => ({ size: s.size, stock: String(s.stock) }));
};

export const ProductDetailModal = ({ isOpen, onClose, product, onProductUpdated }: ProductDetailModalProps) => {
  const [isEditing, setIsEditing] = useState(false);

  const [draft, setDraft] = useState({
    name: '',
    sku: '',
    price: '0',
    status: 'active' as ProductStatus,
    group: '' as string,
    subcategory: '' as string,
    color: '' as string,
    stock: '0',
    sizes: [] as SizeRow[],
  });

  const category = product?.category;

  const groups = useMemo(() => {
    if (!category) return [];
    return getGroupsForCategory(category);
  }, [category]);

  const subcategories = useMemo(() => {
    if (!product) return [];
    return getSubcategoriesFor(product.category, draft.group);
  }, [product, draft.group]);

  const hasSubcategory = useMemo(() => {
    if (!product) return false;
    return getSubcategoriesFor(product.category, draft.group).length > 0;
  }, [product, draft.group]);

  React.useEffect(() => {
    if (!product) return;

    setIsEditing(false);
    setDraft({
      name: product.name,
      sku: product.sku ?? '',
      price: String(product.price ?? 0),
      status: (product.status ?? 'active') as ProductStatus,
      group: product.group,
      subcategory: 'subcategory' in product && product.subcategory ? (product.subcategory as string) : '',
      color: product.category === 'zapatos' ? product.color : '',
      stock: product.category === 'bolsos' ? String(product.stock) : '0',
      sizes: product.category === 'zapatos' ? toSizeRows(product) : [],
    });
  }, [product]);

  if (!product) return null;

  const setField = (field: keyof typeof draft, value: any) => {
    setDraft((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleGroupChange = (value: string) => {
    if (!product) return;
    const nextSubcategories = getSubcategoriesFor(product.category, value);

    setDraft((prev) => ({
      ...prev,
      group: value,
      subcategory: nextSubcategories[0] ?? '',
    }));
  };

  const handleSizeChange = (index: number, field: keyof SizeRow, value: string) => {
    setDraft((prev) => {
      const next = [...prev.sizes];
      next[index] = {
        ...next[index],
        [field]: value,
      };
      return { ...prev, sizes: next };
    });
  };

  const handleAddSize = () => {
    setDraft((prev) => ({
      ...prev,
      sizes: [...prev.sizes, { size: '', stock: '0' }],
    }));
  };

  const handleRemoveSize = (index: number) => {
    setDraft((prev) => {
      const next = prev.sizes.filter((_, i) => i !== index);
      return { ...prev, sizes: next };
    });
  };

  const handleSave = () => {
    const price = Number(draft.price) || 0;

    let updated: Product;

    if (product.category === 'zapatos') {
      const sizes = draft.sizes
        .map((s) => ({ size: s.size.trim(), stock: Number(s.stock) || 0 }))
        .filter((s) => s.size.length > 0);

      updated = {
        ...product,
        name: draft.name,
        sku: draft.sku || undefined,
        price,
        status: draft.status,
        group: draft.group as any,
        subcategory: draft.subcategory as any,
        color: draft.color,
        sizes: sizes.length > 0 ? sizes : product.sizes,
      };
    } else {
      const stock = Number(draft.stock) || 0;
      const base = {
        ...product,
        name: draft.name,
        sku: draft.sku || undefined,
        price,
        status: draft.status,
        group: draft.group as any,
        stock,
      };

      updated = (hasSubcategory
        ? {
            ...base,
            subcategory: draft.subcategory as any,
          }
        : base) as Product;
    }

    onProductUpdated?.(updated);
    setIsEditing(false);
  };

  const sizesPreview = product.category === 'zapatos'
    ? product.sizes
        .filter((s) => s.stock > 0)
        .sort((a, b) => String(a.size).localeCompare(String(b.size)))
        .map((s) => `${s.size}(${s.stock})`)
        .join(', ')
    : '';

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setIsEditing(false);
        onClose();
      }}
      title={isEditing ? 'Editar producto' : 'Detalle de producto'}
      className="max-w-2xl"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {isEditing ? (
            <InputField
              label="Nombre"
              value={draft.name}
              onChange={(value) => setField('name', value)}
              required
            />
          ) : (
            <div className="w-full">
              <div className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Nombre</div>
              <div className="px-3 py-2 sm:px-4 sm:py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-900">
                {product.name}
              </div>
            </div>
          )}

          {isEditing ? (
            <InputField
              label="SKU"
              value={draft.sku}
              onChange={(value) => setField('sku', value)}
              placeholder="Opcional"
            />
          ) : (
            <div className="w-full">
              <div className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">SKU</div>
              <div className="px-3 py-2 sm:px-4 sm:py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-900">
                {product.sku ?? '-'}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {isEditing ? (
            <InputField
              label="Precio"
              type="number"
              value={draft.price}
              onChange={(value) => setField('price', value)}
              required
            />
          ) : (
            <div className="w-full">
              <div className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Precio</div>
              <div className="px-3 py-2 sm:px-4 sm:py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-900">
                {formatCurrency(product.price)}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Estado</label>
            {isEditing ? (
              <select
                value={draft.status}
                onChange={(e) => setField('status', e.target.value as ProductStatus)}
                className="w-full pl-4 pr-4 py-2 sm:py-3 rounded-lg border border-gray-300 bg-white text-gray-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-1 focus:border-pink-500 hover:border-gray-400"
              >
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
              </select>
            ) : (
              <div className="px-3 py-2 sm:px-4 sm:py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-900">
                {(product.status ?? 'active') === 'active' ? 'Activo' : 'Inactivo'}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Grupo</label>
            {isEditing ? (
              <select
                value={draft.group}
                onChange={(e) => handleGroupChange(e.target.value)}
                className="w-full pl-4 pr-4 py-2 sm:py-3 rounded-lg border border-gray-300 bg-white text-gray-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-1 focus:border-pink-500 hover:border-gray-400"
              >
                {groups.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            ) : (
              <div className="px-3 py-2 sm:px-4 sm:py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-900">
                {product.group}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Subcategoría</label>
            {hasSubcategory ? (
              isEditing ? (
                <select
                  value={draft.subcategory}
                  onChange={(e) => setField('subcategory', e.target.value)}
                  className="w-full pl-4 pr-4 py-2 sm:py-3 rounded-lg border border-gray-300 bg-white text-gray-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-1 focus:border-pink-500 hover:border-gray-400"
                >
                  {subcategories.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="px-3 py-2 sm:px-4 sm:py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-900">
                  {'subcategory' in product && product.subcategory ? product.subcategory : '-'}
                </div>
              )
            ) : (
              <div className="px-3 py-2 sm:px-4 sm:py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-500">-</div>
            )}
          </div>
        </div>

        {product.category === 'zapatos' ? (
          <div className="space-y-3">
            {isEditing ? (
              <InputField
                label="Color"
                value={draft.color}
                onChange={(value) => setField('color', value)}
                required
              />
            ) : (
              <div className="w-full">
                <div className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Color</div>
                <div className="px-3 py-2 sm:px-4 sm:py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-900">
                  {product.color}
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="block text-xs sm:text-sm font-medium text-gray-700">Tallas</div>
                {isEditing && (
                  <Button type="button" variant="secondary" size="sm" onClick={handleAddSize}>
                    <Plus className="w-4 h-4 mr-1" />
                    Agregar talla
                  </Button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-2">
                  {draft.sizes.map((row, index) => (
                    <div key={`${index}`} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                      <div className="sm:col-span-5">
                        <InputField
                          label={index === 0 ? 'Talla' : undefined}
                          value={row.size}
                          onChange={(value) => handleSizeChange(index, 'size', value)}
                          placeholder="Ej: 37"
                        />
                      </div>
                      <div className="sm:col-span-5">
                        <InputField
                          label={index === 0 ? 'Stock' : undefined}
                          type="number"
                          value={row.stock}
                          onChange={(value) => handleSizeChange(index, 'stock', value)}
                        />
                      </div>
                      <div className="sm:col-span-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveSize(index)}
                          className="inline-flex items-center justify-center px-3 py-2 rounded-lg text-gray-600 hover:text-white bg-gray-100 hover:bg-gray-600 transition-all duration-200 shadow-sm"
                          title="Quitar talla"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-3 py-2 sm:px-4 sm:py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-900">
                  {sizesPreview || '-'}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div>
            {isEditing ? (
              <InputField
                label="Stock"
                type="number"
                value={draft.stock}
                onChange={(value) => setField('stock', value)}
                required
              />
            ) : (
              <div className="w-full">
                <div className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Stock</div>
                <div className="px-3 py-2 sm:px-4 sm:py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-900">
                  {product.stock}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          {isEditing ? (
            <>
              <Button type="button" variant="secondary" onClick={() => setIsEditing(false)}>
                <XIcon className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button type="button" variant="primary" onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Guardar
              </Button>
            </>
          ) : (
            <Button type="button" variant="primary" onClick={() => setIsEditing(true)}>
              <Pencil className="w-4 h-4 mr-2" />
              Editar
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
