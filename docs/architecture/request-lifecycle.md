# Request Lifecycle

Request: Create an opportunity
1. `src/app/api/opportunities/route.ts` — `POST()` receives the request and delegates to `withRouteContext()`.
2. `src/lib/http/with-route-context.ts` — `withRouteContext()` resolves the session, checks the `"opportunity:create"` permission, and produces a tenant-scoped request context.
3. `src/lib/auth/session.ts` — `getSessionFromHeaders()` validates the demo identity headers and `requireTenantContext()` resolves `tenantId`.
4. `src/lib/auth/permissions.ts` — `assertCan()` verifies that the caller's role may create opportunities.
5. `src/lib/http/parse-json.ts` — `parseJson()` parses the body.
6. `src/lib/validation/opportunity-schemas.ts` — `createOpportunitySchema.parse()` validates the payload shape.
7. `src/services/opportunity-service.ts` — `createOpportunity()` verifies the customer account belongs to the tenant, binds `ownerUserId` from the session, writes the opportunity, and records an audit log.
8. `src/repositories/customer-account-repository.ts` — `getCustomerAccountById()` ensures the parent account exists in the active tenant.
9. `src/repositories/opportunity-repository.ts` — `createOpportunity()` inserts the opportunity row.
10. `src/repositories/audit-log-repository.ts` — `createAuditLog()` records the write.
11. Returns `201` with `{ data: opportunity }`

Request: Submit a quote draft into deal desk or approval routing
1. `src/app/api/quotes/[quoteId]/submit/route.ts` — `POST()` receives the quote id and delegates to `withRouteContext()`.
2. `src/lib/http/with-route-context.ts` — `withRouteContext()` resolves the session and checks `"quote:submit"`.
3. `src/lib/http/parse-json.ts` — `parseJson()` parses the optional submission note.
4. `src/lib/validation/quote-schemas.ts` — `submitQuoteSchema.parse()` validates the note payload.
5. `src/services/quote-service.ts` — `submitQuote()` reloads the quote aggregate, recomputes pricing exceptions with `evaluateQuoteDraft()`, and decides between deal desk, approval routing, or direct conversion.
6. `src/domain/quote-policy.ts` — `evaluateQuoteDraft()` calculates discounts, floor-price checks, and exception reasons. `ensureQuoteTransition()` protects the state change.
7. `src/repositories/quote-repository.ts` — `getQuoteById()`, then either `updateQuoteStatus()`, `createDealDeskCase()`, or `createApprovals()` persist the next workflow state.
8. `src/repositories/audit-log-repository.ts` — `createAuditLog()` records the routing decision.
9. Returns `200` with `{ data: { quoteId, status, ... } }`

Request: Apply a payment to an invoice
1. `src/app/api/invoices/[invoiceId]/apply-payment/route.ts` — `POST()` receives the invoice id and delegates to `withRouteContext()`.
2. `src/lib/http/with-route-context.ts` — `withRouteContext()` resolves the session and checks `"invoice:applyPayment"`.
3. `src/lib/http/parse-json.ts` — `parseJson()` parses the payment body.
4. `src/lib/validation/invoice-schemas.ts` — `applyPaymentSchema.parse()` validates amount, method, and reference.
5. `src/services/invoice-service.ts` — `applyPayment()` loads the invoice, rejects invalid states or overpayment, inserts the payment, updates the invoice balance, creates a revenue event, enqueues a workflow job, and writes an audit log in one transaction.
6. `src/repositories/invoice-repository.ts` — `getInvoiceById()`, `createPayment()`, `updateInvoiceBalance()`, and `createRevenueEvent()` persist billing changes.
7. `src/repositories/workflow-job-repository.ts` — `enqueueWorkflowJob()` creates the async revenue-recognition handoff.
8. `src/repositories/audit-log-repository.ts` — `createAuditLog()` records the finance event.
9. Returns `200` with `{ data: { invoiceId, paymentId, balanceCents, revenueEventId } }`

Request: Rejection path for unauthorized payment application
1. `src/app/api/invoices/[invoiceId]/apply-payment/route.ts` — `POST()` delegates immediately to `withRouteContext()`.
2. `src/lib/http/with-route-context.ts` — `withRouteContext()` resolves the session before reading the body.
3. `src/lib/auth/session.ts` — `getSessionFromHeaders()` resolves the user.
4. `src/lib/auth/permissions.ts` — `assertCan()` rejects a role like `SALES` for `"invoice:applyPayment"`.
5. `src/lib/errors.ts` — `getErrorResponse()` converts the `AppError` into an HTTP response.
6. Returns `403` with `{ error: "Role SALES cannot perform invoice:applyPayment." }`

## Concurrency notes for these flows

These come from reading the source. None was exercised.

- **`submitQuote`** checks `quote.status !== "DRAFT"` outside its transaction (`quote-service.ts:208-212`). Status writes go through `updateQuoteStatus`, so two concurrent submits can both pass the check and each create a deal-desk case or a set of approvals.
- **`decideQuoteApproval`** re-reads the quote inside its transaction (line 402) to decide whether to finalize. When the last two approvers decide at the same time, each transaction can still see the other's approval as PENDING, because neither has committed. Both then return without finalizing (410-415), leaving the quote in `PENDING_APPROVAL` with no pending approvals.
- **`updateApprovalDecision`** is itself conditional on `status: "PENDING"` (`src/repositories/quote-repository.ts:131-137`), but the service ignores the returned count.

## Error envelope

`withRouteContext` catches every error and calls `getErrorResponse` (`src/lib/errors.ts`). `AppError` carries its own `statusCode`: the policy and services use 404, 409, 422, 403, and 401. Read `getErrorResponse` to see how `ZodError` and unknown errors are mapped before relying on a particular status for those cases.
