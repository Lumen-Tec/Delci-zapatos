'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Plus } from 'lucide-react';
import { useDashboard } from '@/app/dashboard/DashboardContext';
import { Button } from '@/app/components/commons/Button';
import { InventoryTable } from '@/app/components/inventory/InventoryTable';
import type { Product } from '@/models/product';

export function ProductsListView() {
  const { setView } = useDashboard();
  const [products] = useState<Product[]>([]);

  useEffect(() => {
    // TODO: Cargar productos desde la API
    // Implementar fetch y asignar el resultado al estado `products`.
  }, []);

  const handleViewProduct = (product: Product) => {
    // TODO: Navegar a la vista de detalle/edicion del producto desde dashboard.
    console.log('View product detail', product.id);
  };

  return (
    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20 md:pb-8 w-full">
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
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
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Inventario</h1>
              <p className="text-sm text-gray-600 mt-1">Gestiona y visualiza el inventario de productos</p>
            </div>
          </div>

          <Button
            onClick={() => {
              // TODO: Navegar a la vista de crear producto cuando este implementada.
              setView({ key: 'products_new' });
            }}
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
  );
}

export default ProductsListView;
