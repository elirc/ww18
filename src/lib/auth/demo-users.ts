/**
 * What this file does:
 * Provides a tiny in-repo identity directory so the rest of the code can demonstrate real auth boundaries without a full IdP.
 * What calls it:
 * src/lib/auth/session.ts and the demo client fetcher used by React Query hooks.
 * What it calls:
 * No runtime dependencies; it is static data.
 * One thing a junior engineer would likely get wrong:
 * Treating demo auth data like production security instead of keeping it behind a clearly replaceable boundary.
 */

import type { Session } from "@/lib/auth/types";

export const DEMO_TENANTS = {
  acme: "tenant_acme",
  northstar: "tenant_northstar"
} as const;

export const DEMO_SESSIONS: Record<string, Session> = {
  "platform.admin@example.com": {
    userId: "user_platform_admin",
    email: "platform.admin@example.com",
    name: "Riley Platform",
    role: "PLATFORM_ADMIN",
    tenantId: null,
    activeTenantId: DEMO_TENANTS.acme
  },
  "ops.admin@acme.io": {
    userId: "user_org_admin",
    email: "ops.admin@acme.io",
    name: "Jordan Admin",
    role: "ORG_ADMIN",
    tenantId: DEMO_TENANTS.acme,
    activeTenantId: DEMO_TENANTS.acme
  },
  "sales@acme.io": {
    userId: "user_sales",
    email: "sales@acme.io",
    name: "Casey Sales",
    role: "SALES",
    tenantId: DEMO_TENANTS.acme,
    activeTenantId: DEMO_TENANTS.acme
  },
  "dealdesk@acme.io": {
    userId: "user_deal_desk",
    email: "dealdesk@acme.io",
    name: "Avery Deal Desk",
    role: "DEAL_DESK",
    tenantId: DEMO_TENANTS.acme,
    activeTenantId: DEMO_TENANTS.acme
  },
  "finance@acme.io": {
    userId: "user_finance",
    email: "finance@acme.io",
    name: "Morgan Finance",
    role: "FINANCE",
    tenantId: DEMO_TENANTS.acme,
    activeTenantId: DEMO_TENANTS.acme
  },
  "legal@acme.io": {
    userId: "user_legal",
    email: "legal@acme.io",
    name: "Taylor Legal",
    role: "LEGAL",
    tenantId: DEMO_TENANTS.acme,
    activeTenantId: DEMO_TENANTS.acme
  },
  "ops@acme.io": {
    userId: "user_ops",
    email: "ops@acme.io",
    name: "Quinn Ops",
    role: "OPS",
    tenantId: DEMO_TENANTS.acme,
    activeTenantId: DEMO_TENANTS.acme
  }
};

export const DEFAULT_DEMO_EMAIL = "ops.admin@acme.io";
