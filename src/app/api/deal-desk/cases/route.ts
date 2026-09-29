/**
 * What this file does:
 * Returns the active deal desk exception queue for operations teams.
 * What calls it:
 * src/hooks/use-deal-desk.ts.
 * What it calls:
 * src/lib/http/with-route-context.ts and src/services/quote-service.ts.
 * One thing a junior engineer would likely get wrong:
 * Exposing only quote ids here and forcing the UI to fan out into N additional requests just to render basic context.
 */

import { withRouteContext } from "@/lib/http/with-route-context";
import * as quoteService from "@/services/quote-service";

export async function GET(request: Request) {
  return withRouteContext(request, "dealDesk:review", async (context) => {
    const cases = await quoteService.listDealDeskQueue(context);
    return Response.json({ data: cases });
  });
}
