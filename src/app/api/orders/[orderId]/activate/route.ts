/**
 * What this file does:
 * Activates a draft order and kicks off provisioning + invoice creation.
 * What calls it:
 * Order-ops clients and tests that verify role enforcement.
 * What it calls:
 * src/lib/http/with-route-context.ts and src/services/order-service.ts.
 * One thing a junior engineer would likely get wrong:
 * Putting provisioning HTTP calls directly in this route instead of creating durable handoff records inside the service transaction.
 */

import { withRouteContext } from "@/lib/http/with-route-context";
import * as orderService from "@/services/order-service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  return withRouteContext(request, "order:activate", async (context) => {
    const { orderId } = await params;
    const result = await orderService.activateOrder(context, orderId);
    return Response.json({ data: result });
  });
}
