'use client';

import React, { useMemo, useState } from 'react';
import { PackagePlus, Palette, Plus, Tag, Trash2 } from 'lucide-react';
import { Modal } from '@/app/components/shared/Modal';
import { InputField } from '@/app/components/shared/InputField';
import { Button } from '@/app/components/shared/Button';
import type { Product, ProductCategory } from '@/app/models/products';
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

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductCreated?: (product: Product) => void;
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

export const CreateProductModal = ({ isOpen, onClose, onProductCreated }: CreateProductModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: 'zapatos' as ProductCategory,
    group: SHOE_GROUPS[0] as string,
    subcategory: SANDALIA_SUBCATEGORIES[0] as string,
    color: '',
    sizes: [{ size: '', stock: '0' }] as SizeRow[],
    bagStock: '0',
    price: '0',
  });

  const groups = useMemo(() => getGroupsForCategory(formData.category), [formData.category]);
  const subcategories = useMemo(
    () => getSubcategoriesFor(formData.category, formData.group),
    [formData.category, formData.group]
  );

  const setField = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCategoryChange = (value: ProductCategory) => {
    const nextGroups = getGroupsForCategory(value);
    const nextGroup = nextGroups[0] ?? '';
    const nextSubcategories = nextGroup ? getSubcategoriesFor(value, nextGroup) : [];

    setFormData((prev) => ({
      ...prev,
      category: value,
      group: nextGroup,
      subcategory: nextSubcategories[0] ?? '',
      sizes: value === 'zapatos' ? [{ size: '', stock: '0' }] : [],
    }));
  };

  const handleGroupChange = (value: string) => {
    const nextSubcategories = getSubcategoriesFor(formData.category, value);
    setFormData((prev) => ({
      ...prev,
      group: value,
      subcategory: nextSubcategories[0] ?? '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const id = `P${Date.now()}`;
    const price = Number(formData.price) || 0;

    const base = {
      id,
      sku: formData.sku || undefined,
      name: formData.name,
      price,
      status: 'active' as const,
    };

    let product: Product;

    if (formData.category === 'zapatos') {
      const sizes = formData.sizes.map((row) => ({
        size: row.size,
        stock: Number(row.stock) || 0,
      }));

      product = {
        ...base,
        category: 'zapatos',
        group: formData.group as any,
        subcategory: formData.subcategory as any,
        color: formData.color,
        sizes,
      };
    } else {
      const hasSubcategory = subcategories.length > 0;
      const stock = Number(formData.bagStock) || 0;

      product = {
        ...base,
        category: 'bolsos',
        group: formData.group as any,
        ...(hasSubcategory ? { subcategory: formData.subcategory as any } : {}),
        stock,
      } as Product;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));

    onProductCreated?.(product);

    setIsLoading(false);
    onClose();
    setFormData({
      name: '',
      sku: '',
      category: 'zapatos',
      group: SHOE_GROUPS[0] as string,
      subcategory: SANDALIA_SUBCATEGORIES[0] as string,
      color: '',
      sizes: [{ size: '', stock: '0' }],
      bagStock: '0',
      price: '0',
    });
  };

  const handleAddSize = () => {
    setFormData((prev) => ({
      ...prev,
      sizes: [...prev.sizes, { size: '', stock: '0' }],
    }));
  };

  const handleRemoveSize = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      sizes: prev.sizes.filter((_, i) => i !== index),
    }));
  };

  const handleSizeChange = (index: number, field: keyof SizeRow, value: string) => {
    setFormData((prev) => {
      const next = [...prev.sizes];
      next[index] = {
        ...next[index],
        [field]: value,
      };
      return { ...prev, sizes: next };
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Agregar producto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField
          label="Nombre"
          value={formData.name}
          onChange={(value) => setField('name', value)}
          placeholder="Ej: Sandalia cuña"
          required
          icon={<PackagePlus className="w-5 h-5" />}
        />

        <InputField
          label="SKU"
          value={formData.sku}
          onChange={(value) => setField('sku', value)}
          placeholder="Opcional"
          icon={<Tag className="w-5 h-5" />}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Categoría</label>
            <select
              value={formData.category}
              onChange={(e) => handleCategoryChange(e.target.value as ProductCategory)}
              className="w-full pl-4 pr-4 py-2 sm:py-3 rounded-lg border border-gray-300 bg-white text-gray-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-1 focus:border-pink-500 hover:border-gray-400"
            >
              <option value="zapatos">Zapatos</option>
              <option value="bolsos">Bolsos</option>
            </select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Grupo</label>
            <select
              value={formData.group}
              onChange={(e) => handleGroupChange(e.target.value)}
              className="w-full pl-4 pr-4 py-2 sm:py-3 rounded-lg border border-gray-300 bg-white text-gray-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-1 focus:border-pink-500 hover:border-gray-400"
            >
              {groups.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        </div>

        {subcategories.length > 0 && (
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Subcategoría</label>
            <select
              value={formData.subcategory}
              onChange={(e) => setField('subcategory', e.target.value)}
              className="w-full pl-4 pr-4 py-2 sm:py-3 rounded-lg border border-gray-300 bg-white text-gray-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-1 focus:border-pink-500 hover:border-gray-400"
            >
              {subcategories.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        )}

        {formData.category === 'zapatos' && (
          <div className="space-y-3">
            <InputField
              label="Color"
              value={formData.color}
              onChange={(value) => setField('color', value)}
              placeholder="Ej: Negro"
              required
              icon={<Palette className="w-5 h-5" />}
            />

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs sm:text-sm font-medium text-gray-700">Tallas</label>
                <Button type="button" variant="secondary" size="sm" onClick={handleAddSize}>
                  <Plus className="w-4 h-4 mr-1" />
                  Agregar talla
                </Button>
              </div>

              <div className="space-y-2">
                {formData.sizes.map((row, index) => (
                  <div key={`${index}`} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                    <div className="sm:col-span-5">
                      <InputField
                        label={index === 0 ? 'Talla' : undefined}
                        value={row.size}
                        onChange={(value) => handleSizeChange(index, 'size', value)}
                        placeholder="Ej: 37"
                        required
                      />
                    </div>
                    <div className="sm:col-span-5">
                      <InputField
                        label={index === 0 ? 'Stock' : undefined}
                        type="number"
                        value={row.stock}
                        onChange={(value) => handleSizeChange(index, 'stock', value)}
                        required
                      />
                    </div>
                    <div className="sm:col-span-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveSize(index)}
                        disabled={formData.sizes.length <= 1}
                        className="inline-flex items-center justify-center px-3 py-2 rounded-lg text-gray-600 hover:text-white bg-gray-100 hover:bg-gray-600 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Quitar talla"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {formData.category === 'bolsos' && (
            <InputField
              label="Stock"
              type="number"
              value={formData.bagStock}
              onChange={(value) => setField('bagStock', value)}
              required
            />
          )}

          <InputField
            label="Precio"
            type="number"
            value={formData.price}
            onChange={(value) => setField('price', value)}
            required
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" loading={isLoading}>
            Guardar producto
          </Button>
        </div>
      </form>
    </Modal>
  );
};
