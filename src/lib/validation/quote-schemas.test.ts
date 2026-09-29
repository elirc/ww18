import { describe, expect, it } from "vitest";

import { createQuoteSchema } from "@/lib/validation/quote-schemas";

describe("createQuoteSchema", () => {
  it("rejects a contract term outside the supported range", () => {
    // This test matters because term validation bugs create downstream approval and billing drift long before anyone notices in the UI.
    const result = createQuoteSchema.safeParse({
      customerAccountId: "acct_demo_acme",
      currency: "USD",
      contractTermMonths: 72,
      startsAt: new Date().toISOString(),
      lines: [{ productId: "prod_demo_core", quantity: 5, unitPriceCents: 9000 }]
    });

    expect(result.success).toBe(false);
  });
});
