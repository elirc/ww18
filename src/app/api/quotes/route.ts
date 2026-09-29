/**
 * What this file does:
 * Lists quotes and creates quote drafts at the REST boundary.
 * What calls it:
 * src/hooks/use-quotes.ts.
 * What it calls:
 * src/lib/http/with-route-context.ts, src/lib/http/parse-json.ts, src/lib/validation/quote-schemas.ts, and src/services/quote-service.ts.
 * One thing a junior engineer would likely get wrong:
 * Recomputing pricing inside this route instead of delegating to the quote service that the rest of the workflow also uses.
 */

import { parseJson } from "@/lib/http/parse-json";
import { withRouteContext } from "@/lib/http/with-route-context";
import { createQuoteSchema } from "@/lib/validation/quote-schemas";
import * as quoteService from "@/services/quote-service";

export async function GET(request: Request) {
  return withRouteContext(request, "opportunity:read", async (context) => {
    const quotes = await quoteService.listQuotes(context);
    return Response.json({ data: quotes });
  });
}

export async function POST(request: Request) {
  return withRouteContext(request, "quote:create", async (context) => {
    const input = await parseJson(request, createQuoteSchema);
    const quote = await quoteService.createQuote(context, input);
    return Response.json({ data: quote }, { status: 201 });
  });
}
