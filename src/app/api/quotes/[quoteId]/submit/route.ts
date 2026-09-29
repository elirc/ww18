/**
 * What this file does:
 * Submits a draft quote into deal desk or approval routing.
 * What calls it:
 * src/hooks/use-quotes.ts via useSubmitQuote().
 * What it calls:
 * src/lib/http/with-route-context.ts, src/lib/http/parse-json.ts, src/lib/validation/quote-schemas.ts, and src/services/quote-service.ts.
 * One thing a junior engineer would likely get wrong:
 * Trusting the UI's displayed status and not reloading the quote before transitioning it in the service.
 */

import { parseJson } from "@/lib/http/parse-json";
import { withRouteContext } from "@/lib/http/with-route-context";
import { submitQuoteSchema } from "@/lib/validation/quote-schemas";
import * as quoteService from "@/services/quote-service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  return withRouteContext(request, "quote:submit", async (context) => {
    const { quoteId } = await params;
    const input = await parseJson(request, submitQuoteSchema);
    const result = await quoteService.submitQuote(context, quoteId, input);
    return Response.json({ data: result });
  });
}
