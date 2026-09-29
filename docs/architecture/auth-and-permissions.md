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
