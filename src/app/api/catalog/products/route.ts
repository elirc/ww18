/**
 * What this file does:
 * Exposes product catalog reads and writes through explicit auth and validation boundaries.
 * What calls it:
 * src/hooks/use-catalog.ts.
 * What it calls:
 * src/lib/http/with-route-context.ts, src/lib/http/parse-json.ts, src/lib/validation/catalog-schemas.ts, and src/services/catalog-service.ts.
 * One thing a junior engineer would likely get wrong:
 * Letting catalog writes skip through a UI-only admin screen without server-side permission checks.
 */

import { parseJson } from "@/lib/http/parse-json";
import { withRouteContext } from "@/lib/http/with-route-context";
import { createProductSchema } from "@/lib/validation/catalog-schemas";
import * as catalogService from "@/services/catalog-service";

export async function GET(request: Request) {
  return withRouteContext(request, "opportunity:read", async (context) => {
    const products = await catalogService.listCatalog(context);
    return Response.json({ data: products });
  });
}

export async function POST(request: Request) {
  return withRouteContext(request, "catalog:manage", async (context) => {
    const input = await parseJson(request, createProductSchema);
    const product = await catalogService.createProduct(context, input);
    return Response.json({ data: product }, { status: 201 });
  });
}
