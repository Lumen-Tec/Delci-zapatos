'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { ChevronLeft, Plus, Trash2 } from 'lucide-react';
import { useDashboardOptional } from '@/app/dashboard/DashboardContext';
import { Button } from '@/app/components/commons/Button';
import { InputField } from '@/app/components/commons/InputField';
import type { Product, ProductCategory, ProductStatus } from '@/models/product';

type SizeRow = {
  _key: string;
  size: string;
  stock: string;
  price: string;
  discountPercentage: string;
  offerDurationDays: string;
};

const newSizeRow = (): SizeRow => ({ _key: String(Date.now() + Math.random()), size: '', stock: '0', price: '', discountPercentage: '', offerDurationDays: '' });

type FormDataState = {
  name: string;
  sku: string;
  category: ProductCategory;
  color: string;
  sizes: SizeRow[];
  bagStock: string;
  price: string;
  discountPercentage: string;
  offerDurationDays: string;
  status: ProductStatus;
};

const emptyFormData: FormDataState = {
  name: '',
  sku: '',
  category: 'zapatos',
  color: '',
  sizes: [newSizeRow()],
  bagStock: '0',
  price: '0',
  discountPercentage: '',
  offerDurationDays: '',
  status: 'active',
};

function mapProductToFormData(product: Product): FormDataState {
  return {
    name: product.name,
    sku: product.sku ?? '',
    category: product.category,
    color: product.category === 'zapatos' ? product.color : '',
    sizes:
      product.category === 'zapatos'
        ? product.sizes.map((s) => ({
            _key: String(s.size),
            size: String(s.size),
            stock: String(s.stock),
            price: s.price != null ? String(s.price) : '',
            discountPercentage: s.discountPercentage != null ? String(s.discountPercentage) : '',
            offerDurationDays: s.offerDurationDays != null ? String(s.offerDurationDays) : '',
          }))
        : [newSizeRow()],
    bagStock: product.category === 'bolsos' ? String(product.stock) : '0',
    price: String(product.price),
    discountPercentage: product.discountPercentage != null ? String(product.discountPercentage) : '',
    offerDurationDays: product.offerDurationDays != null ? String(product.offerDurationDays) : '',
    status: product.status ?? 'active',
  };
}

type ProductsDetailViewProps = {
  productId?: string;
};

export function ProductsDetailView({ productId }: ProductsDetailViewProps) {
  const dashboard = useDashboardOptional();
  const params = useParams<{ id?: string | string[] }>();
  const routeId = params?.id;
  const routeProductId = Array.isArray(routeId) ? routeId[0] : routeId;
  const resolvedProductId = useMemo(() => productId ?? routeProductId ?? null, [productId, routeProductId]);

  const [isSaving, setIsSaving] = useState(false);
  const [pageState, setPageState] = useState<{
    loading: boolean;
    notFound: boolean;
    originalProduct: Product | null;
    integrationPending: boolean;
  }>({
    loading: true,
    notFound: false,
    originalProduct: null,
    integrationPending: false,
  });

  const [formData, setFormData] = useState<FormDataState>(emptyFormData);

  const goBackToInventory = () => {
    if (dashboard) {
      dashboard.setView({ key: 'products_list' });
      return;
    }
    window.location.href = '/dashboard';
  };

  useEffect(() => {
    let mounted = true;

    const loadProduct = async () => {
      if (!resolvedProductId) {
        if (!mounted) return;
        setPageState({ loading: false, notFound: true, originalProduct: null, integrationPending: false });
        return;
      }

      setPageState((prev) => ({ ...prev, loading: true, notFound: false, integrationPending: false }));

      try {
        // TODO: Integrar llamada real al API para obtener detalle de producto por id.
        // const response = await fetch(`/api/products/${resolvedProductId}`, { cache: 'no-store' });
        // if (!response.ok) throw new Error('Product not found');
        // const product = (await response.json()) as Product;

        const product: Product | null = null;

        if (!mounted) return;

        if (!product) {
          setPageState({ loading: false, notFound: true, originalProduct: null, integrationPending: true });
          return;
        }

        setFormData(mapProductToFormData(product));
        setPageState({ loading: false, notFound: false, originalProduct: product, integrationPending: false });
      } catch (error) {
        console.error('Error loading product detail:', error);
        if (!mounted) return;
        setPageState({ loading: false, notFound: true, originalProduct: null, integrationPending: true });
      }
    };

    void loadProduct();

    return () => {
      mounted = false;
    };
  }, [resolvedProductId]);

  const setField = (field: keyof typeof formData, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCategoryChange = (value: ProductCategory) => {
    setFormData((prev) => ({
      ...prev,
      category: value,
      sizes: value === 'zapatos' ? [newSizeRow()] : [],
    }));
  };

  const handleAddSize = () => {
    setFormData((prev) => ({
      ...prev,
      sizes: [...prev.sizes, newSizeRow()],
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resolvedProductId) return;

    setIsSaving(true);

    const price = Number(formData.price) || 0;
    const discountPct = Number(formData.discountPercentage) || 0;
    const offerDays = Number(formData.offerDurationDays) || 0;

    const base = {
      id: resolvedProductId,
      sku: formData.sku || undefined,
      name: formData.name,
      price,
      status: formData.status,
    };

    let product: Product;

    if (formData.category === 'zapatos') {
      const originalSizes = pageState.originalProduct?.category === 'zapatos' ? pageState.originalProduct.sizes : [];
      const sizes = formData.sizes
        .map((row) => {
          const dpct = Number(row.discountPercentage) || 0;
          const ddays = Number(row.offerDurationDays) || 0;
          const sizePrice = Number(row.price) || 0;
          const originalSize = originalSizes.find((s) => s.size === row.size.trim());
          return {
            size: row.size.trim(),
            stock: Number(row.stock) || 0,
            ...(sizePrice > 0 ? { price: sizePrice } : {}),
            ...(dpct > 0 && ddays > 0
              ? {
                  discountPercentage: dpct,
                  offerDurationDays: ddays,
                  offerStartDate: originalSize?.offerStartDate ?? new Date().toISOString().slice(0, 10),
                }
              : {}),
          };
        })
        .filter((row) => row.size.length > 0);

      product = {
        ...base,
        category: 'zapatos',
        color: formData.color,
        sizes: sizes.length > 0 ? sizes : [{ size: 'N/A', stock: 0 }],
      };
    } else {
      const stock = Number(formData.bagStock) || 0;

      product = {
        ...base,
        ...(discountPct > 0 && offerDays > 0
          ? {
              discountPercentage: discountPct,
              offerDurationDays: offerDays,
              offerStartDate: pageState.originalProduct?.offerStartDate ?? new Date().toISOString().slice(0, 10),
            }
          : {}),
        category: 'bolsos',
        stock,
      } as Product;
    }

    try {
      // TODO: Integrar llamada real al API para actualizar producto.
      // await fetch(`/api/products/${resolvedProductId}`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(product),
      // });
      console.log('Pending API integration - update product payload:', product);
      goBackToInventory();
    } catch (error) {
      console.error('Error updating product:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (pageState.loading) {
    return (
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20 md:pb-8 w-full">
        <div className="rounded-2xl border border-gray-100 bg-white/95 shadow-lg p-6 flex items-center justify-center min-h-52">
          <p className="text-gray-500 text-sm">Cargando producto...</p>
        </div>
      </div>
    );
  }

  if (pageState.notFound) {
    return (
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20 md:pb-8 w-full">
        <div className="rounded-2xl border border-gray-100 bg-white/95 shadow-lg p-6 flex flex-col items-center justify-center gap-4 min-h-52 text-center">
          <p className="text-gray-700 text-base font-medium">Producto no encontrado</p>
          {pageState.integrationPending && (
            <p className="text-xs text-rose-600 max-w-md">
              Pendiente integrar API para cargar detalle de producto por id.
            </p>
          )}
          <Button variant="secondary" onClick={goBackToInventory}>
            <ChevronLeft className="w-4 h-4 mr-1" />
            Volver al inventario
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20 md:pb-8 w-full">
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={goBackToInventory}
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
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Editar producto</h1>
              <p className="text-sm text-gray-600 mt-1">Modifica los datos del producto</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              label="Nombre"
              value={formData.name}
              onChange={(value) => setField('name', value)}
              placeholder="Ej: Sandalia cuña"
              required
            />

            <InputField
              label="SKU"
              value={formData.sku}
              onChange={(value) => setField('sku', value)}
              placeholder="Opcional"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit-category" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Categor&iacute;a
              </label>
              <select
                id="edit-category"
                value={formData.category}
                onChange={(e) => handleCategoryChange(e.target.value as ProductCategory)}
                className="w-full pl-4 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400 hover:border-gray-300 appearance-none shadow-sm"
              >
                <option value="zapatos">Zapatos</option>
                <option value="bolsos">Bolsos</option>
              </select>
            </div>
          </div>

          {formData.category === 'zapatos' ? (
            <div className="space-y-4">
              <InputField
                label="Color"
                value={formData.color}
                onChange={(value) => setField('color', value)}
                placeholder="Ej: Negro"
                required
              />

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="block text-xs sm:text-sm font-medium text-gray-700">Tallas</span>
                  <Button type="button" variant="secondary" size="sm" onClick={handleAddSize}>
                    <Plus className="w-4 h-4 mr-1" />
                    Agregar talla
                  </Button>
                </div>

                <div className="space-y-2">
                  {formData.sizes.map((row, index) => (
                    <div key={row._key} className="space-y-2 pb-3 border-b border-gray-50 last:border-b-0">
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                        <div className="sm:col-span-2">
                          <InputField
                            label="Talla"
                            value={row.size}
                            onChange={(value) => handleSizeChange(index, 'size', value)}
                            placeholder="Ej: 37"
                            required
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <InputField
                            label="Stock"
                            type="number"
                            value={row.stock}
                            onChange={(value) => handleSizeChange(index, 'stock', value)}
                            required
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <InputField
                            label="Precio"
                            type="number"
                            value={row.price}
                            onChange={(value) => handleSizeChange(index, 'price', value)}
                            placeholder={formData.price || '0'}
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <InputField
                            label="Descuento (%)"
                            type="number"
                            value={row.discountPercentage}
                            onChange={(value) => handleSizeChange(index, 'discountPercentage', value)}
                            placeholder="Ej: 15"
                          />
                        </div>
                        <div className="sm:col-span-3">
                          <InputField
                            label="Dias oferta"
                            type="number"
                            value={row.offerDurationDays}
                            onChange={(value) => handleSizeChange(index, 'offerDurationDays', value)}
                            placeholder="Ej: 7"
                          />
                        </div>
                        <div className="sm:col-span-1 flex justify-end">
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
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <InputField
              label="Stock"
              type="number"
              value={formData.bagStock}
              onChange={(value) => setField('bagStock', value)}
              required
            />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <InputField
              label="Precio"
              type="number"
              value={formData.price}
              onChange={(value) => setField('price', value)}
              required
            />
            {formData.category === 'zapatos' && formData.sizes.length > 0 && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setFormData((prev) => ({
                    ...prev,
                    sizes: prev.sizes.map((row) => ({ ...row, price: prev.price })),
                  }));
                }}
              >
                Aplicar precio a todas las tallas
              </Button>
            )}
          </div>

          <div>
            <label htmlFor="edit-status" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              Estado
            </label>
            <select
              id="edit-status"
              value={formData.status}
              onChange={(e) => setField('status', e.target.value as ProductStatus)}
              className="w-full pl-4 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400 hover:border-gray-300 appearance-none shadow-sm"
            >
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
            </select>
          </div>

          {formData.category === 'bolsos' && (
            <div className="border-t border-gray-100 pt-4 mt-2">
              <div className="text-sm font-medium text-gray-700 mb-3">Descuento / Oferta (opcional)</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField
                  label="Descuento (%)"
                  type="number"
                  value={formData.discountPercentage}
                  onChange={(value) => setField('discountPercentage', value)}
                  placeholder="Ej: 15"
                />
                <InputField
                  label="Duracion (dias)"
                  type="number"
                  value={formData.offerDurationDays}
                  onChange={(value) => setField('offerDurationDays', value)}
                  placeholder="Ej: 7"
                />
              </div>
            </div>
          )}

          <div className="rounded-xl border border-rose-100 bg-rose-50/70 p-3 text-xs text-rose-700">
            TODO: Integrar endpoint de API para cargar detalle y guardar actualizacion de producto.
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={goBackToInventory} disabled={isSaving}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" loading={isSaving}>
              Guardar cambios
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProductsDetailView;
