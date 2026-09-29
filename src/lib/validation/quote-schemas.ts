/**
 * What this file does:
 * Defines the quote and amendment request schemas at the API boundary.
 * What calls it:
 * Quote-related route handlers and tests.
 * What it calls:
 * Zod only.
 * One thing a junior engineer would likely get wrong:
 * Validating each quote line in isolation but forgetting aggregate constraints like amendment reasons or term changes.
 */

import { z } from "zod";

export const quoteLineInputSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1),
  unitPriceCents: z.number().int().positive()
});

export const createQuoteSchema = z.object({
  opportunityId: z.string().min(1).optional(),
  customerAccountId: z.string().min(1),
  currency: z.literal("USD"),
  // ⚠️ SENIOR NOTE: Term length is bounded here so downstream pricing and approval code can assume a sane negotiation window.
  contractTermMonths: z.number().int().min(1).max(60),
  startsAt: z.string().datetime(),
  exceptionReason: z.string().max(1000).optional(),
  lines: z.array(quoteLineInputSchema).min(1)
});

export const submitQuoteSchema = z.object({
  note: z.string().max(1000).optional()
});

export const decideApprovalSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
  note: z.string().max(1000).optional()
});

export const createAmendmentQuoteSchema = z.object({
  amendmentOfOrderId: z.string().min(1),
  amendmentType: z.enum(["UPSIZE", "DOWNSIZE", "EXTENSION", "CANCELLATION"]),
  customerAccountId: z.string().min(1),
  currency: z.literal("USD"),
  contractTermMonths: z.number().int().min(1).max(60),
  startsAt: z.string().datetime(),
  exceptionReason: z.string().max(1000),
  lines: z.array(quoteLineInputSchema).min(1)
});
