import type { Product, ProductSize } from '@/models/product';

export type InventoryRow = Product & {
  totalStock: number;
};

export const getProductTotalStock = (product: Product): number => {
  if (product.category === 'zapatos') {
    return product.sizes?.reduce((sum, variant) => sum + variant.stock, 0) || 0;
  }

  return product.stock || 0;
};

export const toInventoryRow = (product: Product): InventoryRow => {
  return {
    ...product,
    totalStock: getProductTotalStock(product),
  };
};

export const getShoeStockBySize = (product: Product): ProductSize[] => {
  if (product.category === 'zapatos') {
    return product.sizes || [];
  }
  return [];
};

