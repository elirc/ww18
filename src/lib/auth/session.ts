/**
 * What this file does:
 * Resolves the authenticated user and active tenant from the incoming request headers.
 * What calls it:
 * src/lib/http/with-route-context.ts and server-side demo helpers for pages.
 * What it calls:
 * src/lib/auth/demo-users.ts and Zod parsing to reject malformed auth headers early.
 * One thing a junior engineer would likely get wrong:
 * Trusting any tenant id from the request without checking whether the user is actually allowed to act in that tenant.
 */

import { z } from "zod";

import { DEFAULT_DEMO_EMAIL, DEMO_SESSIONS } from "@/lib/auth/demo-users";
import { AppError } from "@/lib/errors";
import type { RequestContext, Session } from "@/lib/auth/types";

const sessionHeaderSchema = z.object({
  email: z.string().email(),
  activeTenantId: z.string().min(1).nullable()
});

function parseHeaders(headersLike: Headers): { email: string; activeTenantId: string | null } {
  return sessionHeaderSchema.parse({
    email: headersLike.get("x-demo-user-email") ?? DEFAULT_DEMO_EMAIL,
    activeTenantId: headersLike.get("x-active-tenant-id")
  });
}

export function getSessionFromHeaders(headersLike: Headers): Session {
  const parsed = parseHeaders(headersLike);
  const baseSession = DEMO_SESSIONS[parsed.email];

  if (!baseSession) {
    throw new AppError(401, `Unknown demo session for ${parsed.email}.`);
  }

  if (baseSession.role === "PLATFORM_ADMIN") {
    if (!parsed.activeTenantId) {
      throw new AppError(401, "Platform admins must select an active tenant.");
    }

    // ⚠️ SENIOR NOTE: Platform admins are still forced into an active tenant so repository code never has to guess whether to scope a query.
    return {
      ...baseSession,
      activeTenantId: parsed.activeTenantId
    };
  }

  if (parsed.activeTenantId && parsed.activeTenantId !== baseSession.tenantId) {
    throw new AppError(403, "You cannot switch into another tenant.");
  }

  return {
    ...baseSession,
    activeTenantId: baseSession.tenantId
  };
}

export function requireTenantContext(session: Session): RequestContext {
  const tenantId = session.activeTenantId ?? session.tenantId;

  if (!tenantId) {
    throw new AppError(400, "This action requires an active tenant context.");
  }

  return {
    session,
    tenantId
  };
}
