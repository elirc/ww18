/**
 * What this file does:
 * Exposes opportunity listing and creation through the HTTP boundary.
 * What calls it:
 * src/hooks/use-opportunities.ts from the UI and tests that exercise auth + validation behavior.
 * What it calls:
 * src/lib/http/with-route-context.ts, src/lib/http/parse-json.ts, src/lib/validation/opportunity-schemas.ts, and src/services/opportunity-service.ts.
 * One thing a junior engineer would likely get wrong:
 * Doing role checks inline here and then forgetting to mirror them on the GET and POST branches.
 */

import { parseJson } from "@/lib/http/parse-json";
import { withRouteContext } from "@/lib/http/with-route-context";
import { createOpportunitySchema } from "@/lib/validation/opportunity-schemas";
import * as opportunityService from "@/services/opportunity-service";

export async function GET(request: Request) {
  return withRouteContext(request, "opportunity:read", async (context) => {
    const opportunities = await opportunityService.listPipeline(context);
    return Response.json({ data: opportunities });
  });
}

export async function POST(request: Request) {
  return withRouteContext(request, "opportunity:create", async (context) => {
    const input = await parseJson(request, createOpportunitySchema);
    const opportunity = await opportunityService.createOpportunity(context, input);
    return Response.json({ data: opportunity }, { status: 201 });
  });
}
