/**
 * What this file does:
 * Validates incoming opportunity writes at the HTTP boundary.
 * What calls it:
 * src/app/api/opportunities/route.ts.
 * What it calls:
 * Zod only.
 * One thing a junior engineer would likely get wrong:
 * Trusting client-sent stages or dates without constraining them to realistic workflow values.
 */

import { z } from "zod";

export const createOpportunitySchema = z.object({
  customerAccountId: z.string().min(1),
  name: z.string().min(3),
  currency: z.literal("USD"),
  targetAmountCents: z.number().int().positive(),
  expectedCloseDate: z.string().datetime(),
  notes: z.string().max(2000).optional()
});
