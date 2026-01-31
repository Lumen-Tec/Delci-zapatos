 'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Plus } from 'lucide-react';
import { Navbar } from '@/app/components/shared/Navbar';
import { NavButton } from '@/app/components/shared/Navbutton';
import { Footer } from '@/app/components/shared/Footer';
import { Button } from '@/app/components/shared/Button';
import { InventoryTable } from '@/app/components/inventario/InventoryTable';
import { ProductDetailModal } from '@/app/components/inventario/ProductDetailModal';
import { mockProducts } from '@/app/lib/mockData';
import type { Product } from '@/app/models/products';

export default function InventarioPage() {
  const router = useRouter();
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>(mockProducts);

  useEffect(() => {
    const raw = window.localStorage.getItem('delci_products');
    if (!raw) {
      window.localStorage.setItem('delci_products', JSON.stringify(mockProducts));
      setProducts(mockProducts);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as Product[];
      setProducts(parsed);
    } catch {
      window.localStorage.setItem('delci_products', JSON.stringify(mockProducts));
      setProducts(mockProducts);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem('delci_products', JSON.stringify(products));
  }, [products]);

  const handleProductCreated = (product: Product) => {
    setProducts((prev) => [product, ...prev]);
  };

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsDetailModalOpen(true);
  };

  const handleProductUpdated = (updatedProduct: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p)));
    setSelectedProduct(updatedProduct);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-pink-100 via-pink-50 to-rose-100 relative">
      <Navbar />
      <NavButton />

      <div className="flex-grow relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20 md:pb-8 w-full">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
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
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Inventario</h1>
                <p className="text-sm text-gray-600 mt-1">Gestiona y visualiza el inventario de productos</p>
              </div>
            </div>

            <Button
              onClick={() => router.push('/inventario/nuevo')}
              className="w-fit self-end flex items-center justify-center gap-2 py-3 px-6 sm:py-2 sm:px-4 text-base sm:text-sm shadow-lg hover:shadow-xl active:scale-95 transition-all"
              size="lg"
            >
              <Plus className="w-6 h-6 sm:w-5 sm:h-5" />
              Agregar producto
            </Button>
          </div>
        </div>

        <InventoryTable products={products} onViewProduct={handleViewProduct} className="mb-6 sm:mb-8" />
      </div>

      <Footer />

      <ProductDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
        onProductUpdated={handleProductUpdated}
      />
    </div>
  );
}
