'use client';

import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ChevronLeft, Plus, Trash2, Upload } from 'lucide-react';
import { Navbar } from '@/app/components/shared/Navbar';
import { NavButton } from '@/app/components/shared/Navbutton';
import { Footer } from '@/app/components/shared/Footer';
import { Button } from '@/app/components/shared/Button';
import { InputField } from '@/app/components/shared/InputField';
import type { Product, ProductCategory, ProductImage } from '@/app/models/products';
import { mockProducts } from '@/app/lib/mockData';

type SizeRow = {
  _key: string;
  size: string;
  stock: string;
  price: string;
  discountPercentage: string;
  offerDurationDays: string;
};

const newSizeRow = (): SizeRow => ({ _key: String(Date.now() + Math.random()), size: '', stock: '0', price: '', discountPercentage: '', offerDurationDays: '' });

type ImageRow = {
  _key: string;
  url: string;
  alt: string;
};

const newImageRow = (): ImageRow => ({ _key: String(Date.now() + Math.random()), url: '', alt: '' });

export default function NuevoProductoPage() {
  const router = useRouter();
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
    images: [newImageRow()] as ImageRow[],
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setSelectedFiles((prev) => [...prev, ...files]);
    const previews = files.map((f) => URL.createObjectURL(f));
    setFilePreviews((prev) => [...prev, ...previews]);
    e.target.value = '';
  };

  const handleRemoveFile = (index: number) => {
    URL.revokeObjectURL(filePreviews[index]);
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setFilePreviews((prev) => prev.filter((_, i) => i !== index));
  };

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

  const handleAddImage = () => {
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, newImageRow()],
    }));
  };

  const handleRemoveImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleImageChange = (index: number, field: keyof ImageRow, value: string) => {
    setFormData((prev) => {
      const next = [...prev.images];
      next[index] = {
        ...next[index],
        [field]: value,
      };
      return { ...prev, images: next };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const id = `P${Date.now()}`;
    const price = Number(formData.price) || 0;
    const discountPct = Number(formData.discountPercentage) || 0;
    const offerDays = Number(formData.offerDurationDays) || 0;

    const images: ProductImage[] = formData.images
      .map((img) => ({ url: img.url.trim(), alt: img.alt.trim() || undefined }))
      .filter((img) => img.url.length > 0);

    const base = {
      id,
      sku: formData.sku || undefined,
      name: formData.name,
      price,
      status: 'active' as const,
      images: images.length > 0 ? images : undefined,
    };

    let product: Product;

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
              offerStartDate: new Date().toISOString().slice(0, 10),
            }
          : {}),
        category: 'bolsos',
        stock,
      } as Product;
    }

    const raw = window.localStorage.getItem('delci_products');
    let current: Product[] = [];

    if (!raw) {
      current = [...mockProducts];
    } else {
      try {
        current = JSON.parse(raw) as Product[];
      } catch {
        current = [...mockProducts];
      }
    }

    const next = [product, ...current];
    window.localStorage.setItem('delci_products', JSON.stringify(next));

    await new Promise((resolve) => setTimeout(resolve, 300));

    setIsSaving(false);
    router.push('/inventario');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-pink-100 via-pink-50 to-rose-100 relative">
      <Navbar />
      <NavButton />

      <div className="flex-grow relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20 md:pb-8 w-full">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.push('/inventario')}
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
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Nuevo producto</h1>
                <p className="text-sm text-gray-600 mt-1">Crea un producto para el inventario</p>
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
                <label htmlFor="category" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Categoría</label>
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

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Fotos</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Agrega URLs o sube desde tu dispositivo</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button type="button" variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="w-4 h-4 mr-1" />
                    Subir desde dispositivo
                  </Button>
                  <Button type="button" variant="secondary" size="sm" onClick={handleAddImage}>
                    <Plus className="w-4 h-4 mr-1" />
                    Agregar URL
                  </Button>
                </div>
              </div>

              {selectedFiles.length > 0 && (
                <div className="text-xs text-gray-500">{selectedFiles.length} archivo(s) seleccionado(s)</div>
              )}

              <div className="space-y-2">
                {formData.images.map((img, index) => (
                  <div key={img._key} className="grid grid-cols-1 lg:grid-cols-12 gap-2 items-end">
                    <div className="lg:col-span-7">
                      <InputField
                        label={index === 0 ? 'URL' : undefined}
                        value={img.url}
                        onChange={(value) => handleImageChange(index, 'url', value)}
                        placeholder="https://..."
                      />
                    </div>
                    <div className="lg:col-span-4">
                      <InputField
                        label={index === 0 ? 'Alt (opcional)' : undefined}
                        value={img.alt}
                        onChange={(value) => handleImageChange(index, 'alt', value)}
                        placeholder="Descripción"
                      />
                    </div>
                    <div className="lg:col-span-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        disabled={formData.images.length <= 1}
                        className="inline-flex items-center justify-center px-3 py-2 rounded-lg text-gray-600 hover:text-white bg-gray-100 hover:bg-gray-600 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Quitar foto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {formData.images
                  .map((img) => img.url.trim())
                  .filter((url) => url.length > 0)
                  .slice(0, 8)
                  .map((url) => (
                    <div key={url} className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                      <Image src={url} alt="" width={112} height={112} className="w-full h-28 object-cover" />
                    </div>
                  ))}
                {filePreviews.map((preview, index) => (
                  <div key={preview} className="relative rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                    <Image src={preview} alt="" width={112} height={112} className="w-full h-28 object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      className="absolute top-1 right-1 p-1 rounded-full bg-white/80 hover:bg-white text-gray-600 hover:text-red-500 transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => router.push('/inventario')} disabled={isSaving}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" loading={isSaving}>
                Guardar producto
              </Button>
            </div>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
}
