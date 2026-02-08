import type { Product, ShoeSizeVariant } from '@/app/models/products';

// ── Product-level discount (used by bags) ──

export function isOfferActive(product: Product): boolean {
  if (
    product.discountPercentage == null ||
    product.discountPercentage <= 0 ||
    !product.offerStartDate ||
    product.offerDurationDays == null ||
    product.offerDurationDays <= 0
  ) {
    return false;
  }

  const start = new Date(product.offerStartDate);
  const end = new Date(start);
  end.setDate(end.getDate() + product.offerDurationDays);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  return today < end;
}

export function getEffectivePrice(product: Product): {
  effectivePrice: number;
  hasDiscount: boolean;
  discountPercentage: number;
} {
  if (!isOfferActive(product) || !product.discountPercentage) {
    return { effectivePrice: product.price, hasDiscount: false, discountPercentage: 0 };
  }

  const discounted = Math.round(product.price * (1 - product.discountPercentage / 100));

  return {
    effectivePrice: discounted,
    hasDiscount: true,
    discountPercentage: product.discountPercentage,
  };
}

export function getRemainingOfferDays(product: Product): number | null {
  if (!isOfferActive(product) || !product.offerStartDate || !product.offerDurationDays) {
    return null;
  }

  const start = new Date(product.offerStartDate);
  const end = new Date(start);
  end.setDate(end.getDate() + product.offerDurationDays);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const diffMs = end.getTime() - today.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

// ── Size-level discount (used by shoes) ──

export function isSizeOfferActive(variant: ShoeSizeVariant): boolean {
  if (
    variant.discountPercentage == null ||
    variant.discountPercentage <= 0 ||
    !variant.offerStartDate ||
    variant.offerDurationDays == null ||
    variant.offerDurationDays <= 0
  ) {
    return false;
  }

  const start = new Date(variant.offerStartDate);
  const end = new Date(start);
  end.setDate(end.getDate() + variant.offerDurationDays);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  return today < end;
}

export function getSizeEffectivePrice(
  basePrice: number,
  variant: ShoeSizeVariant
): {
  effectivePrice: number;
  hasDiscount: boolean;
  discountPercentage: number;
} {
  if (!isSizeOfferActive(variant) || !variant.discountPercentage) {
    return { effectivePrice: basePrice, hasDiscount: false, discountPercentage: 0 };
  }

  const discounted = Math.round(basePrice * (1 - variant.discountPercentage / 100));

  return {
    effectivePrice: discounted,
    hasDiscount: true,
    discountPercentage: variant.discountPercentage,
  };
}

export function getSizeRemainingDays(variant: ShoeSizeVariant): number | null {
  if (!isSizeOfferActive(variant) || !variant.offerStartDate || !variant.offerDurationDays) {
    return null;
  }

  const start = new Date(variant.offerStartDate);
  const end = new Date(start);
  end.setDate(end.getDate() + variant.offerDurationDays);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const diffMs = end.getTime() - today.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export function hasAnyActiveSizeDiscount(product: Extract<Product, { category: 'zapatos' }>): boolean {
  return product.sizes.some((s) => isSizeOfferActive(s));
}

/** Check if a product (shoe or bag) has any active discount */
export function productHasActiveDiscount(product: Product): boolean {
  if (product.category === 'zapatos') {
    return hasAnyActiveSizeDiscount(product);
  }
  return isOfferActive(product);
}
