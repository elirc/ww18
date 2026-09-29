# Concepts Demonstrated

## Service layer
Where to look: `src/services/quote-service.ts` — `submitQuote()` owns the quote workflow decision instead of the route or React component.
Also see: `src/services/order-service.ts` for a downstream fulfillment service boundary.
Risk if wrong: Business rules leak into routes and components, and the workflow becomes impossible to reuse safely.

## Repository pattern
Where to look: `src/repositories/quote-repository.ts` — `getQuoteById()` loads the quote aggregate and keeps Prisma details out of the service.
Also see: `src/repositories/invoice-repository.ts` for finance persistence boundaries.
Risk if wrong: Services become tightly coupled to query details and tenant scoping becomes harder to audit.

## Zod validation boundary
Where to look: `src/lib/validation/quote-schemas.ts` — `createQuoteSchema` and `submitQuoteSchema` validate incoming quote payloads.
Also see: `src/lib/http/parse-json.ts` for the helper that forces route files to parse through schemas.
Risk if wrong: Invalid or partial payloads reach the service layer and create inconsistent state.

## Auth/session flow
Where to look: `src/lib/auth/session.ts` — `getSessionFromHeaders()` turns headers into a `Session`.
Also see: `src/lib/http/with-route-context.ts` for where the resolved session becomes a `RequestContext`.
Risk if wrong: Users can act without a trusted tenant context.

## Role-based access control
Where to look: `src/lib/auth/permissions.ts` — `assertCan()` enforces the `AppAction` matrix.
Also see: `src/app/api/invoices/[invoiceId]/apply-payment/route.ts` for a protected finance endpoint.
Risk if wrong: Sensitive actions like payment application or catalog changes become callable by the wrong roles.

## Status or state transitions
Where to look: `src/domain/quote-policy.ts` — `ensureQuoteTransition()` prevents illegal quote status jumps.
Also see: `src/services/quote-service.ts` for where those transitions are applied during submit, approval, and deal desk resolution.
Risk if wrong: The system accepts impossible states that downstream code cannot reason about.

## Audit logging
Where to look: `src/repositories/audit-log-repository.ts` — `createAuditLog()` is called after sensitive writes.
Also see: `src/services/invoice-service.ts` and `src/services/order-service.ts` for concrete finance and fulfillment audit events.
Risk if wrong: Investigating who approved a discount or applied a payment becomes guesswork.

## Background job design
Where to look: `src/repositories/workflow-job-repository.ts` — `enqueueWorkflowJob()` persists durable async handoffs.
Also see: `src/services/order-service.ts` `activateOrder()` and `src/services/invoice-service.ts` `applyPayment()` for the enqueue points.
Risk if wrong: Provisioning and revenue side effects get lost when a synchronous request fails midway.

## Multi-tenancy
Where to look: `src/lib/auth/session.ts` — `requireTenantContext()` guarantees an active tenant context.
Also see: `src/repositories/quote-repository.ts` and `src/repositories/invoice-repository.ts` for tenant-scoped queries.
Risk if wrong: Cross-tenant data leaks occur even when RBAC appears correct.

## CPQ pricing evaluation
Where to look: `src/domain/quote-policy.ts` — `evaluateQuoteDraft()` computes floor-price checks, discount thresholds, and term exceptions.
Also see: `src/services/quote-service.ts` `createQuote()` and `submitQuote()` for how those decisions affect workflow state.
Risk if wrong: Quotes can bypass pricing policy or route to the wrong approvers.

## Transaction boundaries
Where to look: `src/services/order-service.ts` — `activateOrder()` wraps order activation, provisioning request creation, invoice creation, workflow enqueue, and audit logging in one transaction.
Also see: `src/services/invoice-service.ts` `applyPayment()` for the finance equivalent.
Risk if wrong: Requests succeed partially, leaving downstream systems and the database out of sync.
