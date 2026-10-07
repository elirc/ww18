# Auth And Permissions

Session resolution starts in `src/lib/auth/session.ts`. `getSessionFromHeaders()` reads `x-demo-user-email` and `x-active-tenant-id`, validates them with Zod, and rejects unknown or invalid tenant switches before a request reaches the service layer. `requireTenantContext()` then turns that session into a request context with a concrete `tenantId`.

Role-based access control is centralized in `src/lib/auth/permissions.ts`. `assertCan()` checks the `AppAction` requested by a route against the role matrix in `rolePermissions`. Route files do not embed their own role logic; instead they declare the needed action in `src/lib/http/with-route-context.ts`, which calls `getSessionFromHeaders()`, `assertCan()`, and `requireTenantContext()` before invoking the handler.

Examples of permission enforcement:

- Quote creation is guarded in `src/app/api/quotes/route.ts` by `withRouteContext(request, "quote:create", ...)`.
- Deal desk review is guarded in `src/app/api/quotes/[quoteId]/deal-desk/route.ts` by `withRouteContext(request, "dealDesk:review", ...)`.
- Payment application is guarded in `src/app/api/invoices/[invoiceId]/apply-payment/route.ts` by `withRouteContext(request, "invoice:applyPayment", ...)`.
- Additional resource-level authorization happens in `src/services/quote-service.ts` inside `decideQuoteApproval()`, where the service verifies that the caller's role actually has a pending approval row on that specific quote.

Tenant isolation:

- Session-level tenant selection happens in `src/lib/auth/session.ts`. Platform admins must still choose an active tenant, so downstream repository code always receives one tenant context instead of branching on cross-tenant access.
- Repository-level tenant scoping happens in every tenant-owned query. Examples:
  `src/repositories/quote-repository.ts` `getQuoteById()` filters by `{ tenantId, id: quoteId }`
  `src/repositories/catalog-repository.ts` `getProductsForQuote()` filters by `{ tenantId, id: { in: productIds } }`
  `src/repositories/invoice-repository.ts` `getInvoiceById()` filters by `{ tenantId, id: invoiceId }`
- Parent-entity tenant checks happen before aggregate creation. `src/services/quote-service.ts` `createQuote()` verifies both `customerAccountId` and `opportunityId` through tenant-scoped repository lookups before writing the quote. `src/services/opportunity-service.ts` `createOpportunity()` similarly verifies the `customerAccountId`.

What changes if you ever replace demo auth with real auth:

- Keep `src/lib/auth/session.ts` as the only place that knows how to turn a transport credential into a `Session`.
- Keep `src/lib/auth/permissions.ts` and `src/lib/http/with-route-context.ts` unchanged so route files and services do not care whether the identity came from headers, cookies, or an external IdP.

## Exact locations

- `getSessionFromHeaders()`: `src/lib/auth/session.ts:30-58`. A missing `x-demo-user-email` header falls back to `DEFAULT_DEMO_EMAIL` (line 25), which is `ops.admin@acme.io`, an **ORG_ADMIN** (`src/lib/auth/demo-users.ts:28-35, 78`).
- Platform admins must send `x-active-tenant-id`, or the request fails with 401 (`session.ts:38-41`). The value is **not validated** against a list of real tenants. Any non-empty string is accepted as the active tenant (lines 44-47).
- Non-platform users who send a different tenant id get 403 (`session.ts:50-52`).
- `withRouteContext()`: `src/lib/http/with-route-context.ts:17-32`. Session, then `assertCan`, then `requireTenantContext`, all before the handler parses the body.
- Role matrix: `src/lib/auth/permissions.ts:29-59`.

## Where the boundaries leak or confuse

1. **The anonymous default is an org admin.** A request with no headers authenticates as ORG_ADMIN in the Acme tenant, whose action list (permissions.ts:42-53) is identical to PLATFORM_ADMIN's, so it can perform every action. That is convenient for a demo and must not survive into a deployment.
2. **Matrix promises that the service does not honor.** `ORG_ADMIN` and `PLATFORM_ADMIN` hold `quote:approve`, but `decideQuoteApproval` only accepts a role that has a pending `QuoteApproval` row (`src/services/quote-service.ts:368-372`). Approval rows are only ever created for `FINANCE` and `LEGAL` (`quote-service.ts:32-52`), so admins always get 403 from that route.
3. **Resource-level checks are role-based, not person-based.** Any FINANCE user in the tenant can satisfy the FINANCE approval. `QuoteApproval` stores `approverRole`, not an assigned user.
4. **Platform admins can name a tenant that does not exist.** Every tenant-scoped query then returns nothing, which is harmless, but the session looks valid.

## Exercise

**Goal:** Show which identity a header-less `POST /api/quotes` runs as, and whether it succeeds.
**Check:** `parseHeaders` substitutes `ops.admin@acme.io` (`session.ts:25`). `DEMO_SESSIONS` maps it to `ORG_ADMIN` in the Acme tenant. `assertCan(session, "quote:create")` passes (`permissions.ts:45`). The quote is created with `createdByUserId: "user_org_admin"`.
