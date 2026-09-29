/**
 * What this file does:
 * Validates payment-application requests before finance workflows run.
 * What calls it:
 * src/app/api/invoices/[invoiceId]/apply-payment/route.ts.
 * What it calls:
 * Zod only.
 * One thing a junior engineer would likely get wrong:
 * Forgetting to reject overpayment amounts, which makes invoice balances go negative downstream.
 */

import { z } from "zod";

export const applyPaymentSchema = z.object({
  // ⚠️ SENIOR NOTE: Payment amounts stay integer cents here because a float sneaking in would corrupt invoice balance math downstream.
  amountCents: z.number().int().positive(),
  method: z.enum(["ACH", "CARD", "WIRE", "CREDIT_MEMO"]),
  reference: z.string().min(2)
});
