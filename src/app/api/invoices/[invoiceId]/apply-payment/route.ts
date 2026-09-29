/**
 * What this file does:
 * Applies a payment to an invoice through the finance boundary and emits the revenue trigger.
 * What calls it:
 * Finance clients and tests for authorization rejection.
 * What it calls:
 * src/lib/http/with-route-context.ts, src/lib/http/parse-json.ts, src/lib/validation/invoice-schemas.ts, and src/services/invoice-service.ts.
 * One thing a junior engineer would likely get wrong:
 * Letting ops or sales hit this route because they can see the invoice in the UI, even though only finance should move money.
 */

import { parseJson } from "@/lib/http/parse-json";
import { withRouteContext } from "@/lib/http/with-route-context";
import { applyPaymentSchema } from "@/lib/validation/invoice-schemas";
import * as invoiceService from "@/services/invoice-service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  return withRouteContext(request, "invoice:applyPayment", async (context) => {
    const { invoiceId } = await params;
    const input = await parseJson(request, applyPaymentSchema);
    const result = await invoiceService.applyPayment(context, invoiceId, input);
    return Response.json({ data: result });
  });
}
