import { describe, expect, it, vi } from "vitest";

import { getQuoteById } from "@/repositories/quote-repository";

describe("quote repository tenant scoping", () => {
  it("includes tenantId when loading a quote aggregate", async () => {
    // This test matters because missing tenant filters on a root aggregate load become cross-tenant data leaks in real SaaS systems.
    const findFirst = vi.fn().mockResolvedValue(null);
    const db = {
      quote: {
        findFirst
      }
    } as never;

    await getQuoteById(db, "tenant_acme", "quote_1");

    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: "tenant_acme",
          id: "quote_1"
        })
      })
    );
  });
});
