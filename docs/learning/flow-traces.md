# Flow Traces

## Flow: Create opportunity from the UI
1. `src/app/opportunities/page.tsx` — renders `OpportunitiesBoard`.
2. `src/components/opportunities-board.tsx` — form submit calls `useCreateOpportunity().mutate()`.
3. `src/hooks/use-opportunities.ts` — `useCreateOpportunity()` fires `POST /api/opportunities` via `demoFetch()`.
4. `src/lib/api/demo-fetch.ts` — `demoFetch()` attaches demo auth headers and sends JSON.
5. `src/app/api/opportunities/route.ts` — `POST()` delegates to `withRouteContext()`, parses the body, and calls `createOpportunity()`.
6. `src/lib/http/with-route-context.ts` — `withRouteContext()` resolves session and permission.
7. `src/lib/auth/session.ts` — `getSessionFromHeaders()` and `requireTenantContext()` create the request context.
8. `src/lib/auth/permissions.ts` — `assertCan()` checks `"opportunity:create"`.
9. `src/lib/http/parse-json.ts` — `parseJson()` reads the request body.
10. `src/lib/validation/opportunity-schemas.ts` — `createOpportunitySchema.parse()` validates shape and types.
11. `src/services/opportunity-service.ts` — `createOpportunity()` verifies account ownership, sets `ownerUserId`, and opens a transaction.
12. `src/repositories/customer-account-repository.ts` — `getCustomerAccountById()` confirms the tenant owns the target account.
13. `src/repositories/opportunity-repository.ts` — `createOpportunity()` inserts the row.
14. `src/repositories/audit-log-repository.ts` — `createAuditLog()` records `opportunity.created`.
15. Returns `{ data: opportunity }`

## Flow: Submit quote and route to deal desk or approvers
1. `src/app/quotes/[quoteId]/page.tsx` — renders `QuoteDetailClient`.
2. `src/components/quote-detail-client.tsx` — submit button calls `useSubmitQuote().mutate()`.
3. `src/hooks/use-quotes.ts` — `useSubmitQuote()` fires `POST /api/quotes/[quoteId]/submit`.
4. `src/lib/api/demo-fetch.ts` — `demoFetch()` sends auth headers plus JSON note payload.
5. `src/app/api/quotes/[quoteId]/submit/route.ts` — `POST()` wraps the request with auth, validates the note, and calls `submitQuote()`.
6. `src/lib/http/with-route-context.ts` — `withRouteContext()` enforces session, role, and tenant.
7. `src/lib/validation/quote-schemas.ts` — `submitQuoteSchema.parse()` validates the payload.
8. `src/services/quote-service.ts` — `submitQuote()` reloads the quote and evaluates the draft with `evaluateQuoteDraft()`.
9. `src/repositories/quote-repository.ts` — `getQuoteById()` loads the aggregate including lines, product rules, approvals, and deal desk state.
10. `src/domain/quote-policy.ts` — `evaluateQuoteDraft()` computes pricing reasons and `ensureQuoteTransition()` guards the next status.
11. `src/repositories/quote-repository.ts` — either `createDealDeskCase()` plus `updateQuoteStatus()` or `createApprovals()` plus `updateQuoteStatus()` persists the route.
12. `src/repositories/audit-log-repository.ts` — `createAuditLog()` records `quote.routed_to_deal_desk` or `quote.routed_to_approval`.
13. Returns `{ data: { quoteId, status, ... } }`

## Flow: Permission rejection on payment application
1. `src/app/api/invoices/[invoiceId]/apply-payment/route.test.ts` — constructs a `Request` as the `SALES` user and calls `POST()`.
2. `src/app/api/invoices/[invoiceId]/apply-payment/route.ts` — `POST()` delegates immediately to `withRouteContext()`.
3. `src/lib/http/with-route-context.ts` — `withRouteContext()` resolves session before any body parsing.
4. `src/lib/auth/session.ts` — `getSessionFromHeaders()` resolves the user.
5. `src/lib/auth/permissions.ts` — `assertCan()` rejects `"invoice:applyPayment"` for `SALES`.
6. `src/lib/errors.ts` — `getErrorResponse()` turns the thrown `AppError` into a `403` response.
7. Returns `{ error: "Role SALES cannot perform invoice:applyPayment." }`

## Flow: Final approval converts quote into order
1. `src/app/quotes/[quoteId]/page.tsx` — renders `QuoteDetailClient`.
2. `src/components/quote-detail-client.tsx` — approve button calls `useApproveQuote().mutate()`.
3. `src/hooks/use-quotes.ts` — `useApproveQuote()` fires `POST /api/quotes/[quoteId]/approve`.
4. `src/app/api/quotes/[quoteId]/approve/route.ts` — `POST()` authenticates, validates the decision payload, and calls `decideQuoteApproval()`.
5. `src/lib/validation/quote-schemas.ts` — `decideApprovalSchema.parse()` validates the approval decision.
6. `src/services/quote-service.ts` — `decideQuoteApproval()` verifies the caller has a pending approval row and updates that row.
7. `src/repositories/quote-repository.ts` — `updateApprovalDecision()` writes the decision and `getQuoteById()` reloads the aggregate.
8. `src/services/quote-service.ts` — `finalizeApprovedQuote()` advances the quote to `APPROVED`.
9. `src/repositories/quote-repository.ts` — `updateQuoteStatus()` writes the status.
10. `src/services/order-service.ts` — `createOrderFromApprovedQuote()` creates the order snapshot from quote lines.
11. `src/repositories/order-repository.ts` — `createOrderAggregate()` inserts the order and order lines.
12. `src/repositories/quote-repository.ts` — `updateQuoteStatus()` moves the quote to `CONVERTED_TO_ORDER`.
13. `src/repositories/audit-log-repository.ts` — `createAuditLog()` records `quote.approved_and_converted`.
14. Returns `{ data: { quoteId, orderId } }`

## Flow: Activate order and enqueue async provisioning handoff
1. `src/app/api/orders/[orderId]/activate/route.ts` — `POST()` authenticates the request and calls `activateOrder()`.
2. `src/lib/http/with-route-context.ts` — `withRouteContext()` resolves the request context and checks `"order:activate"`.
3. `src/services/order-service.ts` — `activateOrder()` loads the order, rejects non-draft orders, updates order status, creates a provisioning request, creates an invoice, and enqueues a workflow job in one transaction.
4. `src/repositories/order-repository.ts` — `getOrderById()`, `updateOrderStatus()`, and `createProvisioningRequest()` persist the fulfillment handoff.
5. `src/repositories/invoice-repository.ts` — `createInvoice()` creates the first invoice.
6. `src/repositories/workflow-job-repository.ts` — `enqueueWorkflowJob()` creates the `PROVISIONING_HANDOFF` job.
7. `src/repositories/audit-log-repository.ts` — `createAuditLog()` records `order.activated`.
8. Returns `{ data: { orderId, provisioningRequestId, invoiceId } }`

## Flow: Apply payment and enqueue async revenue recognition
1. `src/app/api/invoices/[invoiceId]/apply-payment/route.ts` — `POST()` authenticates the finance request and validates the body.
2. `src/lib/http/with-route-context.ts` — `withRouteContext()` resolves session, role, and tenant.
3. `src/lib/validation/invoice-schemas.ts` — `applyPaymentSchema.parse()` validates the payload.
4. `src/services/invoice-service.ts` — `applyPayment()` rejects invalid invoice states or overpayment and opens a transaction.
5. `src/repositories/invoice-repository.ts` — `getInvoiceById()` loads the invoice, then `createPayment()`, `updateInvoiceBalance()`, and `createRevenueEvent()` persist the billing update.
6. `src/repositories/workflow-job-repository.ts` — `enqueueWorkflowJob()` creates the `REVENUE_RECOGNITION` job.
7. `src/repositories/audit-log-repository.ts` — `createAuditLog()` records the payment application.
8. Returns `{ data: { invoiceId, paymentId, balanceCents, revenueEventId } }`
