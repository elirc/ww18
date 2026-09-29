/**
 * What this file does:
 * Centralizes the application's permission model so route handlers and services share the same vocabulary.
 * What calls it:
 * src/lib/http/with-route-context.ts and service files that need resource-level authorization.
 * What it calls:
 * src/lib/errors.ts for consistent authorization failures.
 * One thing a junior engineer would likely get wrong:
 * Scattering string-based role checks throughout route files and forgetting to update one of them later.
 */

import type { UserRole } from "@prisma/client";

import { AppError } from "@/lib/errors";
import type { Session } from "@/lib/auth/types";

export type AppAction =
  | "opportunity:create"
  | "opportunity:read"
  | "quote:create"
  | "quote:submit"
  | "quote:approve"
  | "quote:amend"
  | "dealDesk:review"
  | "order:activate"
  | "invoice:applyPayment"
  | "catalog:manage";

const rolePermissions: Record<UserRole, AppAction[]> = {
  PLATFORM_ADMIN: [
    "opportunity:create",
    "opportunity:read",
    "quote:create",
    "quote:submit",
    "quote:approve",
    "quote:amend",
    "dealDesk:review",
    "order:activate",
    "invoice:applyPayment",
    "catalog:manage"
  ],
  ORG_ADMIN: [
    "opportunity:create",
    "opportunity:read",
    "quote:create",
    "quote:submit",
    "quote:approve",
    "quote:amend",
    "dealDesk:review",
    "order:activate",
    "invoice:applyPayment",
    "catalog:manage"
  ],
  SALES: ["opportunity:create", "opportunity:read", "quote:create", "quote:submit", "quote:amend"],
  DEAL_DESK: ["opportunity:read", "dealDesk:review", "quote:approve"],
  FINANCE: ["opportunity:read", "quote:approve", "invoice:applyPayment", "catalog:manage"],
  LEGAL: ["opportunity:read", "quote:approve"],
  OPS: ["opportunity:read", "order:activate"]
};

export function can(session: Session, action: AppAction): boolean {
  return rolePermissions[session.role].includes(action);
}

export function assertCan(session: Session, action: AppAction): void {
  // ⚠️ SENIOR NOTE: Centralizing the authorization matrix keeps new routes from accidentally becoming less restrictive than older ones.
  if (!can(session, action)) {
    throw new AppError(403, `Role ${session.role} cannot perform ${action}.`);
  }
}
