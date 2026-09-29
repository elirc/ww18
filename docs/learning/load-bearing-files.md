# Load-Bearing Files

## src/lib/http/with-route-context.ts
- What it does: Wraps route handlers with session resolution, RBAC, tenant resolution, and error-to-response translation.
- What calls it: Protected route files such as `src/app/api/opportunities/route.ts`, `src/app/api/quotes/[quoteId]/submit/route.ts`, and `src/app/api/invoices/[invoiceId]/apply-payment/route.ts`.
- What it calls: `src/lib/auth/session.ts`, `src/lib/auth/permissions.ts`, and `src/lib/errors.ts`.
- What would break or become insecure if this file were wrong: Routes could skip auth, skip tenant context, or leak raw exceptions.
- What a junior engineer would likely miswrite here: Parsing the body before auth or duplicating try/catch and role checks in each route instead of centralizing them.

## src/lib/auth/session.ts
- What it does: Converts incoming headers into a trusted `Session` and `RequestContext`.
- What calls it: `src/lib/http/with-route-context.ts`.
- What it calls: `src/lib/auth/demo-users.ts` and `src/lib/errors.ts`.
- What would break or become insecure if this file were wrong: Cross-tenant access could slip through at the very first boundary.
- What a junior engineer would likely miswrite here: Trusting any tenant id presented by the caller without checking whether the user may act in that tenant.

## prisma/schema.prisma
- What it does: Defines the persistent domain model and the foreign-key graph for the entire product.
- What calls it: Prisma Client generation and every repository file.
- What it calls: PostgreSQL through Prisma's engine.
- What would break or become insecure if this file were wrong: Tenant boundaries, order-to-invoice relations, and workflow durability would all degrade.
- What a junior engineer would likely miswrite here: Omitting tenant ownership fields on “child” tables because the parent already has them.

## src/domain/quote-policy.ts
- What it does: Encodes quote pricing evaluation and legal state transitions as pure functions.
- What calls it: `src/services/quote-service.ts` and `src/domain/quote-policy.test.ts`.
- What it calls: `src/lib/errors.ts` and `src/lib/money.ts`.
- What would break or become insecure if this file were wrong: Invalid discounts, skipped deal desk routing, or illegal status jumps would become possible.
- What a junior engineer would likely miswrite here: Hiding these rules inside route conditionals where they cannot be reused or tested cleanly.

## src/services/quote-service.ts
- What it does: Owns the commercial workflow from draft quote through approvals and order conversion.
- What calls it: `src/app/api/quotes/route.ts`, `src/app/api/quotes/[quoteId]/submit/route.ts`, `src/app/api/quotes/[quoteId]/approve/route.ts`, and `src/app/api/quotes/[quoteId]/deal-desk/route.ts`.
- What it calls: `src/domain/quote-policy.ts`, repositories under `src/repositories`, and `src/services/order-service.ts`.
- What would break or become insecure if this file were wrong: Quote status, deal desk case state, approval state, and order creation could diverge.
- What a junior engineer would likely miswrite here: Updating quote status without thinking through all related side tables that must move with it.

## src/repositories/quote-repository.ts
- What it does: Loads and persists the quote aggregate plus approvals and deal desk cases.
- What calls it: `src/services/quote-service.ts`.
- What it calls: Prisma through the shared db executor.
- What would break or become insecure if this file were wrong: Cross-tenant quote reads or incomplete aggregate loads would create both data leaks and broken workflow logic.
- What a junior engineer would likely miswrite here: Loading only the quote row and then having the service issue several follow-up queries for approvals and cases.

## src/services/order-service.ts
- What it does: Converts approved quotes into orders and activates orders into provisioning + invoicing.
- What calls it: `src/services/quote-service.ts` and `src/app/api/orders/[orderId]/activate/route.ts`.
- What it calls: `src/repositories/order-repository.ts`, `src/repositories/invoice-repository.ts`, `src/repositories/workflow-job-repository.ts`, and `src/repositories/audit-log-repository.ts`.
- What would break or become insecure if this file were wrong: Orders could activate without invoices, provisioning requests, or durable audit state.
- What a junior engineer would likely miswrite here: Calling an external provisioning system inline instead of enqueuing a durable handoff.

## src/services/invoice-service.ts
- What it does: Applies payments and creates revenue-recognition triggers.
- What calls it: `src/app/api/invoices/[invoiceId]/apply-payment/route.ts`.
- What it calls: `src/repositories/invoice-repository.ts`, `src/repositories/workflow-job-repository.ts`, and `src/repositories/audit-log-repository.ts`.
- What would break or become insecure if this file were wrong: Invoice balances, payment auditability, and revenue-event timing would drift from reality.
- What a junior engineer would likely miswrite here: Updating the invoice balance separately from the payment insert and accepting overpayments.

## src/repositories/invoice-repository.ts
- What it does: Persists invoices, payments, and revenue events.
- What calls it: `src/services/order-service.ts` and `src/services/invoice-service.ts`.
- What it calls: Prisma through `src/lib/db.ts`.
- What would break or become insecure if this file were wrong: Finance data could leak across tenants or become internally inconsistent.
- What a junior engineer would likely miswrite here: Treating the invoice row as enough and not preserving child financial events.
