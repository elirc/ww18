/**
 * What this file does:
 * Defines the request-scoped auth types shared across routes, pages, services, and tests.
 * What calls it:
 * src/lib/auth/session.ts, src/lib/auth/permissions.ts, src/lib/http/with-route-context.ts, and service files.
 * What it calls:
 * No downstream files; this is a shared type boundary.
 * One thing a junior engineer would likely get wrong:
 * Mixing transport-specific request details into the session type and making authorization harder to reuse.
 */

import type { UserRole } from "@prisma/client";

export type Session = {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId: string | null;
  activeTenantId: string | null;
};

export type RequestContext = {
  session: Session;
  tenantId: string;
};
