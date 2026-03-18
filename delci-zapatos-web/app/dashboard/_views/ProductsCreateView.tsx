'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { useDashboard } from '@/app/dashboard/DashboardContext';
import { Button } from '@/app/components/commons/Button';
import { InputField } from '@/app/components/commons/InputField';
import type { Product, ProductCategory } from '@/models/product';

type SizeRow = {
  _key: string;
  size: string;
  stock: string;
  price: string;
  discountPercentage: string;
  offerDurationDays: string;
};

type CreateStep = 1 | 2 | 3;

const newSizeRow = (): SizeRow => ({
  _key: String(Date.now() + Math.random()),
  size: '',
  stock: '0',
  price: '',
  discountPercentage: '',
  offerDurationDays: '',
});

export function ProductsCreateView() {
  const { setView } = useDashboard();
  const [step, setStep] = useState<CreateStep>(1);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: 'zapatos' as ProductCategory,
    color: '',
    sizes: [newSizeRow()] as SizeRow[],
    bagStock: '0',
    price: '0',
    discountPercentage: '',
    offerDurationDays: '',
  });

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
      color: value === 'zapatos' ? prev.color : '',
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

  const canContinueStepOne = formData.name.trim().length > 0 && Number(formData.price) > 0;

  const hasValidShoeSizes =
    formData.category === 'zapatos' &&
    formData.sizes.some((row) => row.size.trim().length > 0 && Number(row.stock) >= 0);

  const canContinueStepTwo =
    formData.category === 'zapatos'
      ? formData.color.trim().length > 0 && hasValidShoeSizes
      : Number(formData.bagStock) >= 0;

  const buildProductPayload = (): Product => {
    const id = `TEMP-${Date.now()}`;
    const price = Number(formData.price) || 0;
    const discountPct = Number(formData.discountPercentage) || 0;
    const offerDays = Number(formData.offerDurationDays) || 0;

    const base = {
      id,
      sku: formData.sku || undefined,
      name: formData.name,
      price,
      status: 'active' as const,
    };

    if (formData.category === 'zapatos') {
      const todayISO = new Date().toISOString().slice(0, 10);
      const sizes = formData.sizes
        .map((row) => {
          const dpct = Number(row.discountPercentage) || 0;
          const ddays = Number(row.offerDurationDays) || 0;
          const sizePrice = Number(row.price) || 0;

          return {
            size: row.size.trim(),
            stock: Number(row.stock) || 0,
            ...(sizePrice > 0 ? { price: sizePrice } : {}),
            ...(dpct > 0 && ddays > 0
              ? { discountPercentage: dpct, offerDurationDays: ddays, offerStartDate: todayISO }
              : {}),
          };
        })
        .filter((row) => row.size.length > 0);

      return {
        ...base,
        category: 'zapatos',
        color: formData.color,
        sizes: sizes.length > 0 ? sizes : [{ size: 'N/A', stock: 0 }],
      };
    }

    return {
      ...base,
      ...(discountPct > 0 && offerDays > 0
        ? {
            discountPercentage: discountPct,
            offerDurationDays: offerDays,
            offerStartDate: new Date().toISOString().slice(0, 10),
          }
        : {}),
      category: 'bolsos',
      stock: Number(formData.bagStock) || 0,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const productPayload = buildProductPayload();

      // TODO: Integrar llamada real al API para crear producto.
      // await fetch('/api/products', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(productPayload),
      // });
      console.log('Pending API integration - product payload:', productPayload);

      setView({ key: 'products_list' });
    } catch (error) {
      console.error('Error creating product:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20 md:pb-8 w-full">
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setView({ key: 'products_list' })}
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
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Nuevo producto</h1>
              <p className="text-sm text-gray-600 mt-1">Creacion por fases para registrar producto</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-rose-100 bg-white/90 p-4">
        <div className="grid grid-cols-3 gap-2 text-xs sm:text-sm">
          {[
            { key: 1, label: 'Información Basica' },
            { key: 2, label: 'Cantidad en Inventario' },
            { key: 3, label: 'Resumen y Guardado' },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setStep(item.key as CreateStep)}
              className={`rounded-lg px-3 py-2 font-medium transition-all ${
                step === item.key
                  ? 'bg-pink-500 text-white shadow-md'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {step === 1 && (
            <div className="space-y-6">
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
                  <label htmlFor="category" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Categoría
                  </label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => handleCategoryChange(e.target.value as ProductCategory)}
                    className="w-full pl-4 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400 hover:border-gray-300 appearance-none shadow-sm"
                  >
                    <option value="zapatos">Zapatos</option>
                    <option value="bolsos">Bolsos</option>
                  </select>
                </div>

                <InputField
                  label="Precio base"
                  type="number"
                  value={formData.price}
                  onChange={(value) => setField('price', value)}
                  required
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              {formData.category === 'zapatos' ? (
                <>
                  <InputField
                    label="Color"
                    value={formData.color}
                    onChange={(value) => setField('color', value)}
                    placeholder="Ej: Negro"
                    required
                  />

                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                      <span className="block text-xs sm:text-sm font-medium text-gray-700">Tallas</span>
                      <Button type="button" variant="secondary" size="md" onClick={handleAddSize} className="w-full sm:w-auto">
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
                                label="Desc (%)"
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
                </>
              ) : (
                <>
                  <InputField
                    label="Stock"
                    type="number"
                    value={formData.bagStock}
                    onChange={(value) => setField('bagStock', value)}
                    required
                  />

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
                </>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-4 text-sm text-gray-700">
                <div className="font-semibold text-gray-900 mb-1">Resumen</div>
                <p>Nombre: {formData.name || '-'}</p>
                <p>Categoria: {formData.category}</p>
                <p>Precio: {formData.price || '0'}</p>
                <p>SKU: {formData.sku || '-'}</p>
                {formData.category === 'zapatos' ? (
                  <>
                    <p>Color: {formData.color || '-'}</p>
                    <p>Tallas configuradas: {formData.sizes.filter((row) => row.size.trim().length > 0).length}</p>
                  </>
                ) : (
                  <p>Stock: {formData.bagStock}</p>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-2">
            <div className="flex gap-2">
              {step > 1 && (
                <Button type="button" variant="secondary" size="lg" onClick={() => setStep((prev) => (prev - 1) as CreateStep)}>
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Anterior
                </Button>
              )}

              {step < 3 && (
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  onClick={() => setStep((prev) => (prev + 1) as CreateStep)}
                  disabled={(step === 1 && !canContinueStepOne) || (step === 2 && !canContinueStepTwo)}
                >
                  Siguiente
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={() => setView({ key: 'products_list' })}
                disabled={isSaving}
              >
                Cancelar
              </Button>

              {step === 3 && (
                <Button type="submit" variant="primary" size="lg" loading={isSaving}>
                  Guardar producto
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProductsCreateView;
