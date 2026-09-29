/**
 * What this file does:
 * Validates product and pricing-rule writes before they enter the catalog service layer.
 * What calls it:
 * Catalog API route handlers.
 * What it calls:
 * Zod only.
 * One thing a junior engineer would likely get wrong:
 * Accepting impossible pricing windows like a floor price above the list price or an empty allowed-term list.
 */

import { z } from "zod";

export const createProductSchema = z.object({
  sku: z.string().min(2),
  name: z.string().min(2),
  billingCadence: z.enum(["monthly", "annual"]),
  basePriceCents: z.number().int().positive(),
  standardTermMonths: z.number().int().min(1),
  autoApprovalDiscountPct: z.number().int().min(0).max(100),
  dealDeskDiscountPct: z.number().int().min(0).max(100)
});

export const createPriceRuleSchema = z
  .object({
    productId: z.string().min(1),
    minQuantity: z.number().int().min(1),
    maxQuantity: z.number().int().min(1),
    floorPriceCents: z.number().int().positive(),
    financeApprovalDiscountPct: z.number().int().min(0).max(100),
    legalApprovalForNonStandardTerm: z.boolean(),
    allowedTermMonths: z.array(z.number().int().min(1)).min(1)
  })
  .refine((value) => value.maxQuantity >= value.minQuantity, {
    message: "maxQuantity must be greater than or equal to minQuantity.",
    path: ["maxQuantity"]
  });
