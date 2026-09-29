/**
 * What this file does:
 * Returns a single quote aggregate for detail views and workflow actions.
 * What calls it:
 * src/hooks/use-quotes.ts via useQuoteDetail().
 * What it calls:
 * src/lib/http/with-route-context.ts and src/services/quote-service.ts.
 * One thing a junior engineer would likely get wrong:
 * Fetching the quote by id without tenant scoping and trusting the repository to somehow infer the right tenant.
 */

import { withRouteContext } from "@/lib/http/with-route-context";
import * as quoteService from "@/services/quote-service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  return withRouteContext(request, "opportunity:read", async (context) => {
    const { quoteId } = await params;
    const quote = await quoteService.getQuote(context, quoteId);
    return Response.json({ data: quote });
  });
}
