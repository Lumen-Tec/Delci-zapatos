export const PRODUCT_CATEGORIES = ['zapatos', 'bolsos'] as const;
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export type ProductStatus = 'active' | 'inactive';

export interface ProductImage {
  url: string;
  alt?: string;
}

export interface BaseProduct {
  id: string;
  sku?: string;
  name: string;
  description?: string;
  price: number;
  cost?: number;
  images?: ProductImage[];
  status?: ProductStatus;
  createdAt?: string;
  updatedAt?: string;
  discountPercentage?: number;
  offerDurationDays?: number;
  offerStartDate?: string;
}

// =========================
// Zapatos
// =========================
// Nota de negocio:
// - Si un zapato tiene varios colores, cada color se registra como un PRODUCTO aparte.
// - Las tallas sí se manejan como variantes dentro del producto.

export type ShoeSize = string;

export interface ShoeSizeVariant {
  size: ShoeSize;
  stock: number;
  price?: number;
  discountPercentage?: number;
  offerDurationDays?: number;
  offerStartDate?: string;
}

export type ShoeProduct = BaseProduct & {
  category: 'zapatos';
  color: string;
  sizes: ShoeSizeVariant[];
  modelGroupId?: string;
};

// =========================
// Bolsos
// =========================

export type BagProduct = BaseProduct & {
  category: 'bolsos';
  stock: number;
};

export type Product = ShoeProduct | BagProduct;
