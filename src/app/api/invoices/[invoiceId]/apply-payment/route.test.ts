import { describe, expect, it } from "vitest";

import { POST } from "@/app/api/invoices/[invoiceId]/apply-payment/route";

describe("invoice apply-payment route", () => {
  it("rejects a sales user with 403 before finance logic runs", async () => {
    // This test matters because money-moving endpoints are high-risk; a role leak here becomes a direct financial-control bug.
    const request = new Request("http://localhost/api/invoices/inv_123/apply-payment", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-demo-user-email": "sales@acme.io",
        "x-active-tenant-id": "tenant_acme"
      },
      body: JSON.stringify({
        amountCents: 5000,
        method: "ACH",
        reference: "PAY-100"
      })
    });

    const response = await POST(request, {
      params: Promise.resolve({ invoiceId: "inv_123" })
    });

    expect(response.status).toBe(403);
  });
});
