/**
 * What this file does:
 * Creates amendment quotes using the same pricing and approval flow as net-new quotes.
 * What calls it:
 * Deal ops tooling or future contract-management UIs.
 * What it calls:
 * src/lib/http/with-route-context.ts, src/lib/http/parse-json.ts, src/lib/validation/quote-schemas.ts, and src/services/quote-service.ts.
 * One thing a junior engineer would likely get wrong:
 * Treating amendments as a separate mini-system and reimplementing all the pricing and approval logic from scratch.
 */

import { parseJson } from "@/lib/http/parse-json";
import { withRouteContext } from "@/lib/http/with-route-context";
import { createAmendmentQuoteSchema } from "@/lib/validation/quote-schemas";
import * as quoteService from "@/services/quote-service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  return withRouteContext(request, "quote:amend", async (context) => {
    await params;
    const input = await parseJson(request, createAmendmentQuoteSchema);
    const quote = await quoteService.createAmendmentQuote(context, input);
    return Response.json({ data: quote }, { status: 201 });
  });
}
