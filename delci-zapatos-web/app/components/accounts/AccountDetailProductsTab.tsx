'use client';

import React from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/app/components/commons/Button';
import type { AccountDetailsResult } from '@/types/accountsRepository';
import { formatCurrency } from '@/lib/accountUtils';

interface AccountDetailProductsTabProps {
  items: AccountDetailsResult['items'];
  onRemoveItem: (itemId: string) => void;
  onAddProducts: () => void;
  showAddProductsButton?: boolean;
}

export function AccountDetailProductsTab({
  items,
  onRemoveItem,
  onAddProducts,
  showAddProductsButton = true,
}: AccountDetailProductsTabProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-gray-900">Productos</h2>
          {showAddProductsButton && (
            <Button onClick={onAddProducts} variant="primary" size="sm">
              Agregar productos
            </Button>
          )}
        </div>
      </div>
      <div className="p-6">
        {items.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-sm font-semibold text-gray-900">No hay productos en esta cuenta</div>
            <div className="text-sm text-gray-600 mt-1">Agrega productos para calcular el total.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Producto</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Cant.</th>
                  <th className="hidden sm:table-cell px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Subtotal</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Accion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-pink-50/30 transition-all">
                    <td className="px-4 py-3">
                      <div className="text-sm font-semibold text-gray-900">{item.name}</div>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-900">{item.quantity}</td>
                    <td className="hidden sm:table-cell px-4 py-3 text-right text-sm font-semibold text-gray-900">
                      {formatCurrency(item.unitPrice * item.quantity)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.id)}
                        className="inline-flex items-center justify-center px-3 py-2 rounded-xl text-gray-600 hover:text-white bg-gray-100 hover:bg-gray-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
