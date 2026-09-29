import { describe, expect, it } from "vitest";

import { ensureQuoteTransition } from "@/domain/quote-policy";

describe("ensureQuoteTransition", () => {
  it("rejects skipping from deal desk review straight to approved", () => {
    // This test matters because invalid workflow jumps silently bypass required human review and create unauthorized commercial commitments.
    expect(() => ensureQuoteTransition("PENDING_DEAL_DESK", "APPROVED")).toThrow(
      /cannot move/
    );
  });
});
