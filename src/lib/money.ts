/**
 * What this file does:
 * Holds small money helpers used by pricing and billing services.
 * What calls it:
 * Quote, order, and invoice services.
 * What it calls:
 * No downstream modules; calculations stay pure.
 * One thing a junior engineer would likely get wrong:
 * Using floating point math for currency totals and introducing silent rounding drift.
 */

export function calculatePercentDiscount(listPriceCents: number, unitPriceCents: number): number {
  if (listPriceCents === 0) {
    return 0;
  }

  return Math.round(((listPriceCents - unitPriceCents) / listPriceCents) * 100);
}

export function sumMoney(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}
