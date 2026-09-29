/**
 * What this file does:
 * Resolves deal desk exception cases and routes the quote forward or rejects it.
 * What calls it:
 * src/hooks/use-deal-desk.ts via useResolveDealDeskCase().
 * What it calls:
 * src/lib/http/with-route-context.ts, src/lib/http/parse-json.ts, src/lib/validation/deal-desk-schemas.ts, and src/services/quote-service.ts.
 * One thing a junior engineer would likely get wrong:
 * Splitting deal desk resolution into a separate service that mutates the case but forgets to move the quote state with it.
 */

import { parseJson } from "@/lib/http/parse-json";
import { withRouteContext } from "@/lib/http/with-route-context";
import { resolveDealDeskCaseSchema } from "@/lib/validation/deal-desk-schemas";
import * as quoteService from "@/services/quote-service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  return withRouteContext(request, "dealDesk:review", async (context) => {
    const { quoteId } = await params;
    const input = await parseJson(request, resolveDealDeskCaseSchema);
    const result = await quoteService.resolveDealDeskCase(context, quoteId, input);
    return Response.json({ data: result });
  });
}
