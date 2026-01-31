import type { Product, ShoeProduct, ShoeSizeVariant } from '@/app/models/products';

export type InventoryRow = Product & {
  totalStock: number;
};

export const getProductTotalStock = (product: Product): number => {
  if (product.category === 'zapatos') {
    return product.sizes.reduce((sum, variant) => sum + variant.stock, 0);
  }

  return product.stock;
};

export const toInventoryRow = (product: Product): InventoryRow => {
  return {
    ...product,
    totalStock: getProductTotalStock(product),
  };
};

export const getShoeStockBySize = (product: ShoeProduct): ShoeSizeVariant[] => {
  return product.sizes;
};

