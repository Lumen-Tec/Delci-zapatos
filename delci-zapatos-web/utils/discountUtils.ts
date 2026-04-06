import type { Product, ShoeSizeVariant } from '@/models/product';

type CompatShoeSizeVariant = ShoeSizeVariant & {
  discountPct?: number;
  discountDays?: number;
  discountStartDate?: string;
};

// ── Product-level discount (used by bags) ──

export function isOfferActive(product: Product): boolean {
  const discountPercentage = product.discountPct;
  const offerStartDate = product.discountStartDate;
  const offerDurationDays = product.discountDays;

  if (
    discountPercentage == null ||
    discountPercentage <= 0 ||
    !offerStartDate ||
    offerDurationDays == null ||
    offerDurationDays <= 0
  ) {
    return false;
  }

  const start = new Date(offerStartDate);
  const end = new Date(start);
  end.setDate(end.getDate() + offerDurationDays);

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
  if (!isOfferActive(product) || !product.discountPct) {
    return { effectivePrice: product.basePrice, hasDiscount: false, discountPercentage: 0 };
  }

  const discounted = Math.round(product.basePrice * (1 - product.discountPct / 100));

  return {
    effectivePrice: discounted,
    hasDiscount: true,
    discountPercentage: product.discountPct,
  };
}

export function getRemainingOfferDays(product: Product): number | null {
  if (!isOfferActive(product) || !product.discountStartDate || !product.discountDays) {
    return null;
  }

  const start = new Date(product.discountStartDate);
  const end = new Date(start);
  end.setDate(end.getDate() + product.discountDays);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const diffMs = end.getTime() - today.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

// ── Size-level discount (used by shoes) ──

export function isSizeOfferActive(variant: ShoeSizeVariant): boolean {
  const compatVariant = variant as CompatShoeSizeVariant;
  const discountPercentage = compatVariant.discountPct ?? compatVariant.discountPercentage;
  const offerStartDate = compatVariant.discountStartDate ?? compatVariant.offerStartDate;
  const offerDurationDays = compatVariant.discountDays ?? compatVariant.offerDurationDays;

  if (
    discountPercentage == null ||
    discountPercentage <= 0 ||
    !offerStartDate ||
    offerDurationDays == null ||
    offerDurationDays <= 0
  ) {
    return false;
  }

  const start = new Date(offerStartDate);
  const end = new Date(start);
  end.setDate(end.getDate() + offerDurationDays);

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
  const actualBase = variant.price ?? basePrice;
  const compatVariant = variant as CompatShoeSizeVariant;
  const discountPercentage = compatVariant.discountPct ?? compatVariant.discountPercentage;

  if (!isSizeOfferActive(variant) || !discountPercentage) {
    return { effectivePrice: actualBase, hasDiscount: false, discountPercentage: 0 };
  }

  const discounted = Math.round(actualBase * (1 - discountPercentage / 100));

  return {
    effectivePrice: discounted,
    hasDiscount: true,
    discountPercentage,
  };
}

export function getSizeRemainingDays(variant: ShoeSizeVariant): number | null {
  const compatVariant = variant as CompatShoeSizeVariant;
  const offerStartDate = compatVariant.discountStartDate ?? compatVariant.offerStartDate;
  const offerDurationDays = compatVariant.discountDays ?? compatVariant.offerDurationDays;

  if (!isSizeOfferActive(variant) || !offerStartDate || !offerDurationDays) {
    return null;
  }

  const start = new Date(offerStartDate);
  const end = new Date(start);
  end.setDate(end.getDate() + offerDurationDays);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const diffMs = end.getTime() - today.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

/** Check if a product (shoe or bag) has any active discount */
export function productHasActiveDiscount(product: Product): boolean {
  if (product.category === 'zapatos') {
    return (product.sizes ?? []).some((s) => isSizeOfferActive(s));
  }
  return isOfferActive(product);
}
