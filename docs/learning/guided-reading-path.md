# Guided Reading Path

## Step 1 — src/lib/http/with-route-context.ts
**Why read this:** This is the narrow funnel every protected API request uses.
**What to look for:** How auth, RBAC, and tenant context are enforced before the handler runs.
**What to trace:** Called by `src/app/api/opportunities/route.ts`, `src/app/api/quotes/[quoteId]/submit/route.ts`, and other route files; calls `src/lib/auth/session.ts` and `src/lib/auth/permissions.ts`.
**What a junior would likely miss:** The route wrapper intentionally runs before body parsing to reduce both wasted work and information leakage.

## Step 2 — src/lib/auth/session.ts
**Why read this:** It shows the replaceable boundary between transport credentials and app-level request context.
**What to look for:** `getSessionFromHeaders()` and `requireTenantContext()`.
**What to trace:** Called by `src/lib/http/with-route-context.ts`; feeds `RequestContext` into every service call.
**What a junior would likely miss:** Platform admins are still forced into one active tenant so the rest of the system stays tenant-shaped.

## Step 3 — src/lib/auth/permissions.ts
**Why read this:** This file makes the role model reviewable.
**What to look for:** The `AppAction` vocabulary and the `rolePermissions` matrix.
**What to trace:** Called by `src/lib/http/with-route-context.ts`; conceptually governs every route file under `src/app/api`.
**What a junior would likely miss:** The app action vocabulary is more stable than route paths and is easier to audit during reviews.

## Step 4 — prisma/schema.prisma
**Why read this:** The schema is the real domain map for the entire product.
**What to look for:** Tenant ownership on aggregates, the quote-to-order-to-invoice chain, and durable workflow tables like `QuoteApproval`, `DealDeskCase`, `WorkflowJob`, and `AuditLog`.
**What to trace:** Used indirectly by every repository under `src/repositories`.
**What a junior would likely miss:** Snapshot fields like `Quote.totalCents` and `Invoice.balanceCents` exist to preserve financial history, not just convenience.

## Step 5 — src/domain/quote-policy.ts
**Why read this:** It isolates pure commercial rules from persistence and transport.
**What to look for:** `evaluateQuoteDraft()` and `ensureQuoteTransition()`.
**What to trace:** Called by `src/services/quote-service.ts`; tested in `src/domain/quote-policy.test.ts`.
**What a junior would likely miss:** Status transition rules belong in a reusable domain function, not scattered across buttons and routes.

## Step 6 — src/repositories/quote-repository.ts
**Why read this:** This is the best example of repository-shaped aggregate loading in the project.
**What to look for:** `getQuoteById()` and the included child relations.
**What to trace:** Called by `src/services/quote-service.ts`; calls Prisma through `src/lib/db.ts`.
**What a junior would likely miss:** The include graph is deliberately shaped so the service can make one coherent state decision without several round trips.

## Step 7 — src/services/quote-service.ts
**Why read this:** This is the commercial workflow brain of the application.
**What to look for:** `createQuote()`, `submitQuote()`, `resolveDealDeskCase()`, `decideQuoteApproval()`, and `createAmendmentQuote()`.
**What to trace:** Called by quote and deal desk route files; calls `src/domain/quote-policy.ts`, quote/catalog/account repositories, and `src/services/order-service.ts`.
**What a junior would likely miss:** The service owns the full quote state machine, not the route and definitely not the React component.

## Step 8 — src/services/order-service.ts
**Why read this:** It shows the handoff from approved commercial intent into fulfillment and billing.
**What to look for:** `createOrderFromApprovedQuote()` and `activateOrder()`.
**What to trace:** Called by `src/services/quote-service.ts` and `src/app/api/orders/[orderId]/activate/route.ts`; calls order, invoice, workflow-job, and audit repositories.
**What a junior would likely miss:** Order activation is a transaction boundary because downstream systems begin acting immediately after this step.

## Step 9 — src/services/invoice-service.ts
**Why read this:** It handles the finance side of the lifecycle.
**What to look for:** `applyPayment()`.
**What to trace:** Called by `src/app/api/invoices/[invoiceId]/apply-payment/route.ts`; calls `src/repositories/invoice-repository.ts`, `src/repositories/workflow-job-repository.ts`, and `src/repositories/audit-log-repository.ts`.
**What a junior would likely miss:** Payment application is both a money movement and a revenue event, so the service writes more than just a payment row.

## Step 10 — src/repositories/invoice-repository.ts
**Why read this:** It shows the finance persistence boundary clearly.
**What to look for:** `getInvoiceById()`, `createPayment()`, `updateInvoiceBalance()`, and `createRevenueEvent()`.
**What to trace:** Called by `src/services/order-service.ts` and `src/services/invoice-service.ts`.
**What a junior would likely miss:** Billing state is stored as a snapshot plus child events; relying on one or the other alone is brittle.

## Step 11 — src/app/api/quotes/[quoteId]/submit/route.ts
**Why read this:** It is a clean example of a thin route file in a well-layered system.
**What to look for:** The file does auth, validation, and exactly one service call.
**What to trace:** Calls `src/lib/http/with-route-context.ts`, `src/lib/http/parse-json.ts`, `src/lib/validation/quote-schemas.ts`, and `src/services/quote-service.ts`.
**What a junior would likely miss:** Thin routes are a feature, not a lack of sophistication.

## Step 12 — src/app/api/invoices/[invoiceId]/apply-payment/route.test.ts
**Why read this:** It demonstrates how to test the HTTP boundary without a full browser stack.
**What to look for:** The unauthorized `SALES` request and the expected `403`.
**What to trace:** Imports the route from `src/app/api/invoices/[invoiceId]/apply-payment/route.ts`.
**What a junior would likely miss:** The most important tests often target authorization or workflow invariants, not rendering.
