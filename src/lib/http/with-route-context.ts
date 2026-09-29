/**
 * What this file does:
 * Wraps route handlers with session resolution, tenant resolution, and action-level authorization.
 * What calls it:
 * Every route handler in src/app/api that needs auth and tenant-aware business logic.
 * What it calls:
 * src/lib/auth/session.ts, src/lib/auth/permissions.ts, and src/lib/errors.ts.
 * One thing a junior engineer would likely get wrong:
 * Letting the handler parse the body before auth runs, which wastes work and can leak validation behavior to unauthorized callers.
 */

import { assertCan, type AppAction } from "@/lib/auth/permissions";
import { getSessionFromHeaders, requireTenantContext } from "@/lib/auth/session";
import type { RequestContext } from "@/lib/auth/types";
import { getErrorResponse } from "@/lib/errors";

export async function withRouteContext(
  request: Request,
  action: AppAction,
  handler: (context: RequestContext) => Promise<Response>
): Promise<Response> {
  try {
    const session = getSessionFromHeaders(request.headers);
    // ⚠️ SENIOR NOTE: Auth and authorization run before body parsing so unauthorized callers cannot probe validation behavior or waste service work.
    assertCan(session, action);
    const context = requireTenantContext(session);

    return await handler(context);
  } catch (error) {
    return getErrorResponse(error);
  }
}
