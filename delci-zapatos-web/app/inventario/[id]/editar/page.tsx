'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ChevronLeft, Plus, Trash2, Upload } from 'lucide-react';
import { Navbar } from '@/app/components/shared/Navbar';
import { NavButton } from '@/app/components/shared/Navbutton';
import { Footer } from '@/app/components/shared/Footer';
import { Button } from '@/app/components/shared/Button';
import { InputField } from '@/app/components/shared/InputField';
import type { Product, ProductCategory, ProductImage, ProductStatus } from '@/app/models/products';
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
import { mockProducts } from '@/app/lib/mockData';

type SizeRow = {
  size: string;
  stock: string;
  discountPercentage: string;
  offerDurationDays: string;
};

type ImageRow = {
  url: string;
  alt: string;
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

export default function EditarProductoPage() {
  const router = useRouter();
  const params = useParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [originalProduct, setOriginalProduct] = useState<Product | null>(null);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: 'zapatos' as ProductCategory,
    group: SHOE_GROUPS[0] as string,
    subcategory: SANDALIA_SUBCATEGORIES[0] as string,
    color: '',
    sizes: [{ size: '', stock: '0', discountPercentage: '', offerDurationDays: '' }] as SizeRow[],
    bagStock: '0',
    price: '0',
    discountPercentage: '',
    offerDurationDays: '',
    images: [{ url: '', alt: '' }] as ImageRow[],
    status: 'active' as ProductStatus,
  });

  useEffect(() => {
    const raw = window.localStorage.getItem('delci_products');
    let products: Product[] = [];

    if (!raw) {
      products = [...mockProducts];
    } else {
      try {
        products = JSON.parse(raw) as Product[];
      } catch {
        products = [...mockProducts];
      }
    }

    const product = products.find((p) => p.id === params.id);

    if (!product) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setOriginalProduct(product);

    const hasSubcategory = 'subcategory' in product && product.subcategory != null;

    setFormData({
      name: product.name,
      sku: product.sku ?? '',
      category: product.category,
      group: product.group,
      subcategory: hasSubcategory ? (product.subcategory as string) : '',
      color: product.category === 'zapatos' ? product.color : '',
      sizes:
        product.category === 'zapatos'
          ? product.sizes.map((s) => ({
              size: s.size,
              stock: String(s.stock),
              discountPercentage: s.discountPercentage != null ? String(s.discountPercentage) : '',
              offerDurationDays: s.offerDurationDays != null ? String(s.offerDurationDays) : '',
            }))
          : [],
      bagStock: product.category === 'bolsos' ? String(product.stock) : '0',
      price: String(product.price),
      discountPercentage:
        product.discountPercentage != null ? String(product.discountPercentage) : '',
      offerDurationDays:
        product.offerDurationDays != null ? String(product.offerDurationDays) : '',
      images:
        product.images && product.images.length > 0
          ? product.images.map((img) => ({ url: img.url, alt: img.alt ?? '' }))
          : [{ url: '', alt: '' }],
      status: product.status ?? 'active',
    });

    setLoading(false);
  }, [params.id]);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      filePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const groups = useMemo(() => getGroupsForCategory(formData.category), [formData.category]);
  const subcategories = useMemo(
    () => getSubcategoriesFor(formData.category, formData.group),
    [formData.category, formData.group]
  );

  const setField = (field: keyof typeof formData, value: any) => {
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
      sizes: value === 'zapatos' ? [{ size: '', stock: '0', discountPercentage: '', offerDurationDays: '' }] : [],
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

  const handleAddSize = () => {
    setFormData((prev) => ({
      ...prev,
      sizes: [...prev.sizes, { size: '', stock: '0', discountPercentage: '', offerDurationDays: '' }],
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
      images: [...prev.images, { url: '', alt: '' }],
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    const newPreviews = newFiles.map((file) => URL.createObjectURL(file));

    setSelectedFiles((prev) => [...prev, ...newFiles]);
    setFilePreviews((prev) => [...prev, ...newPreviews]);

    // Reset file input so selecting the same file again triggers onChange
    e.target.value = '';
  };

  const handleRemoveFile = (index: number) => {
    URL.revokeObjectURL(filePreviews[index]);
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setFilePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!originalProduct) return;
    setIsSaving(true);

    const price = Number(formData.price) || 0;
    const discountPct = Number(formData.discountPercentage) || 0;
    const offerDays = Number(formData.offerDurationDays) || 0;

    const images: ProductImage[] = formData.images
      .map((img) => ({ url: img.url.trim(), alt: img.alt.trim() || undefined }))
      .filter((img) => img.url.length > 0);

    const base = {
      id: originalProduct.id,
      sku: formData.sku || undefined,
      name: formData.name,
      price,
      status: formData.status,
      images: images.length > 0 ? images : undefined,
    };

    let product: Product;

    if (formData.category === 'zapatos') {
      const originalSizes = originalProduct.category === 'zapatos' ? originalProduct.sizes : [];
      const sizes = formData.sizes
        .map((row) => {
          const dpct = Number(row.discountPercentage) || 0;
          const ddays = Number(row.offerDurationDays) || 0;
          const originalSize = originalSizes.find((s) => s.size === row.size.trim());
          return {
            size: row.size.trim(),
            stock: Number(row.stock) || 0,
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
        group: formData.group as any,
        subcategory: formData.subcategory as any,
        color: formData.color,
        sizes: sizes.length > 0 ? sizes : [{ size: 'N/A', stock: 0 }],
      };
    } else {
      const hasSubcategory = subcategories.length > 0;
      const stock = Number(formData.bagStock) || 0;

      product = {
        ...base,
        ...(discountPct > 0 && offerDays > 0
          ? {
              discountPercentage: discountPct,
              offerDurationDays: offerDays,
              offerStartDate: originalProduct.offerStartDate ?? new Date().toISOString().slice(0, 10),
            }
          : {}),
        category: 'bolsos',
        group: formData.group as any,
        ...(hasSubcategory ? { subcategory: formData.subcategory as any } : {}),
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

    const next = current.map((p) => (p.id === originalProduct.id ? product : p));
    window.localStorage.setItem('delci_products', JSON.stringify(next));

    await new Promise((resolve) => setTimeout(resolve, 300));

    setIsSaving(false);
    router.push('/inventario');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-pink-100 via-pink-50 to-rose-100 relative">
        <Navbar />
        <NavButton />
        <div className="flex-grow flex items-center justify-center">
          <p className="text-gray-500 text-sm">Cargando producto...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-pink-100 via-pink-50 to-rose-100 relative">
        <Navbar />
        <NavButton />
        <div className="flex-grow flex flex-col items-center justify-center gap-4">
          <p className="text-gray-700 text-base font-medium">Producto no encontrado</p>
          <Button variant="secondary" onClick={() => router.push('/inventario')}>
            <ChevronLeft className="w-4 h-4 mr-1" />
            Volver al inventario
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Categor&iacute;a</label>
                <select
                  value={formData.category}
                  onChange={(e) => handleCategoryChange(e.target.value as ProductCategory)}
                  className="w-full pl-4 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400 hover:border-gray-300 appearance-none shadow-sm"
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
                  className="w-full pl-4 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400 hover:border-gray-300 appearance-none shadow-sm"
                >
                  {groups.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Subcategor&iacute;a</label>
                <select
                  value={formData.subcategory}
                  onChange={(e) => setField('subcategory', e.target.value)}
                  disabled={subcategories.length === 0}
                  className="w-full pl-4 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400 hover:border-gray-300 appearance-none shadow-sm disabled:opacity-50"
                >
                  {subcategories.length === 0 ? (
                    <option value="">-</option>
                  ) : (
                    subcategories.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))
                  )}
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
                    <label className="block text-xs sm:text-sm font-medium text-gray-700">Tallas</label>
                    <Button type="button" variant="secondary" size="sm" onClick={handleAddSize}>
                      <Plus className="w-4 h-4 mr-1" />
                      Agregar talla
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {formData.sizes.map((row, index) => (
                      <div key={`${index}`} className="space-y-2 pb-3 border-b border-gray-50 last:border-b-0">
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                          <div className="sm:col-span-3">
                            <InputField
                              label={index === 0 ? 'Talla' : undefined}
                              value={row.size}
                              onChange={(value) => handleSizeChange(index, 'size', value)}
                              placeholder="Ej: 37"
                              required
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <InputField
                              label={index === 0 ? 'Stock' : undefined}
                              type="number"
                              value={row.stock}
                              onChange={(value) => handleSizeChange(index, 'stock', value)}
                              required
                            />
                          </div>
                          <div className="sm:col-span-3">
                            <InputField
                              label={index === 0 ? 'Descuento (%)' : undefined}
                              type="number"
                              value={row.discountPercentage}
                              onChange={(value) => handleSizeChange(index, 'discountPercentage', value)}
                              placeholder="Ej: 15"
                            />
                          </div>
                          <div className="sm:col-span-3">
                            <InputField
                              label={index === 0 ? 'Dias oferta' : undefined}
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField
                label="Precio"
                type="number"
                value={formData.price}
                onChange={(value) => setField('price', value)}
                required
              />

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Estado</label>
                <select
                  value={formData.status}
                  onChange={(e) => setField('status', e.target.value as ProductStatus)}
                  className="w-full pl-4 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400 hover:border-gray-300 appearance-none shadow-sm"
                >
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </div>
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
                  <p className="text-xs text-gray-500 mt-0.5">Agrega una o m&aacute;s URLs (ej. Cloudinary)</p>
                </div>
                <Button type="button" variant="secondary" size="sm" onClick={handleAddImage}>
                  <Plus className="w-4 h-4 mr-1" />
                  Agregar foto
                </Button>
              </div>

              <div className="space-y-2">
                {formData.images.map((img, index) => (
                  <div key={`${index}`} className="grid grid-cols-1 lg:grid-cols-12 gap-2 items-end">
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

              <div className="flex items-center gap-3">
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
                {selectedFiles.length > 0 && (
                  <span className="text-xs text-gray-500">{selectedFiles.length} archivo(s) seleccionado(s)</span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {/* URL previews */}
                {formData.images
                  .map((img) => img.url.trim())
                  .filter((url) => url.length > 0)
                  .slice(0, 8)
                  .map((url) => (
                    <div key={url} className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                      <img src={url} alt="" className="w-full h-28 object-cover" />
                    </div>
                  ))}
                {/* File previews */}
                {filePreviews.map((preview, index) => (
                  <div key={preview} className="relative rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                    <img src={preview} alt="" className="w-full h-28 object-cover" />
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
                Guardar cambios
              </Button>
            </div>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
}
