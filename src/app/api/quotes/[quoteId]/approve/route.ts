/**
 * What this file does:
 * Accepts finance/legal/deal-desk approval decisions for a quote.
 * What calls it:
 * src/hooks/use-quotes.ts via useApproveQuote().
 * What it calls:
 * src/lib/http/with-route-context.ts, src/lib/http/parse-json.ts, src/lib/validation/quote-schemas.ts, and src/services/quote-service.ts.
 * One thing a junior engineer would likely get wrong:
 * Checking only that the role can approve quotes in general and forgetting to verify that this role actually has a pending approval on this specific quote.
 */

import { parseJson } from "@/lib/http/parse-json";
import { withRouteContext } from "@/lib/http/with-route-context";
import { decideApprovalSchema } from "@/lib/validation/quote-schemas";
import * as quoteService from "@/services/quote-service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  return withRouteContext(request, "quote:approve", async (context) => {
    const { quoteId } = await params;
    const input = await parseJson(request, decideApprovalSchema);
    const result = await quoteService.decideQuoteApproval(context, quoteId, input);
    return Response.json({ data: result });
  });
}
