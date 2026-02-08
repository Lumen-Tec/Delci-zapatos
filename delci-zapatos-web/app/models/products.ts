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

export const SHOE_GROUPS = [
  'Sandalias',
  'Botas',
  'Tenis',
  'Zapatos de tacón',
  'Otros estilos',
] as const;
export type ShoeGroup = (typeof SHOE_GROUPS)[number];

export const SANDALIA_SUBCATEGORIES = [
  'Sandalia cuña',
  'Sandalias plataforma',
  'Sandalias bajas',
  'Sandalias casuales',
  'Sandalias de playa',
] as const;
export type SandaliaSubcategory = (typeof SANDALIA_SUBCATEGORIES)[number];

export const BOTA_SUBCATEGORIES = [
  'Bota baja',
  'Bota tacón alto',
] as const;
export type BotaSubcategory = (typeof BOTA_SUBCATEGORIES)[number];

export const TENIS_SUBCATEGORIES = [
  'Tenis deportivas',
  'Tenis casuales',
] as const;
export type TenisSubcategory = (typeof TENIS_SUBCATEGORIES)[number];

export const TACON_SUBCATEGORIES = [
  'Tacones altos',
  'Tacones bajos',
] as const;
export type TaconSubcategory = (typeof TACON_SUBCATEGORIES)[number];

export const OTROS_ZAPATOS_SUBCATEGORIES = [
  'Mocasines',
  'Mules',
  'Zapatillas flat',
  'Otros estilos de zapatos',
] as const;
export type OtrosZapatosSubcategory = (typeof OTROS_ZAPATOS_SUBCATEGORIES)[number];

export type ShoeClassification =
  | { group: 'Sandalias'; subcategory: SandaliaSubcategory }
  | { group: 'Botas'; subcategory: BotaSubcategory }
  | { group: 'Tenis'; subcategory: TenisSubcategory }
  | { group: 'Zapatos de tacón'; subcategory: TaconSubcategory }
  | { group: 'Otros estilos'; subcategory: OtrosZapatosSubcategory };

export type ShoeSize = string;

export interface ShoeSizeVariant {
  size: ShoeSize;
  stock: number;
  discountPercentage?: number;
  offerDurationDays?: number;
  offerStartDate?: string;
}

export type ShoeProduct = BaseProduct &
  ShoeClassification & {
    category: 'zapatos';
    color: string;
    sizes: ShoeSizeVariant[];
    modelGroupId?: string;
  };

// =========================
// Bolsos
// =========================

export const BAG_GROUPS = [
  'Bolsos de mano y hombro',
  'Manos libres',
  'Carteras y monederos',
  'Riñoneras y canguros',
  'Bolsos para ocasiones especiales',
] as const;
export type BagGroup = (typeof BAG_GROUPS)[number];

export const BOLSOS_MANO_HOMBRO_SUBCATEGORIES = [
  'Bolso',
  'Bolso de hombro',
  'Bolso grande',
] as const;
export type BolsosManoHombroSubcategory = (typeof BOLSOS_MANO_HOMBRO_SUBCATEGORIES)[number];

export const MANOS_LIBRES_SUBCATEGORIES = [
  'Manos libres pequeños',
  'Manos libres medianos',
] as const;
export type ManosLibresSubcategory = (typeof MANOS_LIBRES_SUBCATEGORIES)[number];

export const CARTERAS_MONEDEROS_SUBCATEGORIES = [
  'Cartera de mano',
  'Carteras',
  'Monederos',
] as const;
export type CarterasMonederosSubcategory = (typeof CARTERAS_MONEDEROS_SUBCATEGORIES)[number];

export const RINONERAS_CANGUROS_SUBCATEGORIES = [
  'Canguros',
  'Canguro/faja',
] as const;
export type RinonerasCangurosSubcategory = (typeof RINONERAS_CANGUROS_SUBCATEGORIES)[number];

export type BagClassification =
  | { group: 'Bolsos de mano y hombro'; subcategory: BolsosManoHombroSubcategory }
  | { group: 'Manos libres'; subcategory: ManosLibresSubcategory }
  | { group: 'Carteras y monederos'; subcategory: CarterasMonederosSubcategory }
  | { group: 'Riñoneras y canguros'; subcategory: RinonerasCangurosSubcategory }
  | { group: 'Bolsos para ocasiones especiales'; subcategory?: never };

export type BagProduct = BaseProduct &
  BagClassification & {
    category: 'bolsos';
    stock: number;
  };

export type Product = ShoeProduct | BagProduct;
