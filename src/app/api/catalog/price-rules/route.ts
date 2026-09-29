/**
 * What this file does:
 * Creates pricing rules through the same reviewed server boundary as the rest of the commercial workflow.
 * What calls it:
 * Catalog management clients or external admin tooling.
 * What it calls:
 * src/lib/http/with-route-context.ts, src/lib/http/parse-json.ts, src/lib/validation/catalog-schemas.ts, and src/services/catalog-service.ts.
 * One thing a junior engineer would likely get wrong:
 * Writing this directly from the browser and assuming the product page already proved the user is allowed to change pricing policy.
 */

import { parseJson } from "@/lib/http/parse-json";
import { withRouteContext } from "@/lib/http/with-route-context";
import { createPriceRuleSchema } from "@/lib/validation/catalog-schemas";
import * as catalogService from "@/services/catalog-service";

export async function POST(request: Request) {
  return withRouteContext(request, "catalog:manage", async (context) => {
    const input = await parseJson(request, createPriceRuleSchema);
    const priceRule = await catalogService.createPriceRule(context, input);
    return Response.json({ data: priceRule }, { status: 201 });
  });
}
