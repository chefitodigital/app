export function getDeliveryMinimumShortfall(
  subtotal: number,
  discountAmount: number,
  minimumOrderValue: number,
  isDeliveryOrder: boolean,
): number {
  if (!isDeliveryOrder || minimumOrderValue <= 0) return 0;
  return Math.max(0, minimumOrderValue - Math.max(0, subtotal - discountAmount));
}
