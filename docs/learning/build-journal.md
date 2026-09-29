# Build Journal

## Stage 1 — Project framing
- Built the project around a tenant-aware Q2C workflow instead of a single-company internal tool.
- Decided the teaching priority was backend boundaries: auth, repositories, services, workflow state, and auditability.
- Why: This domain is valuable precisely because it forces careful separation between sales workflow, ops workflow, and finance workflow.

## Stage 2 — Stack choice
- Chose Next.js App Router, TypeScript, Prisma, PostgreSQL, Tailwind, Zod, React Query, and REST.
- Kept REST over tRPC so route files remain explicit learning artifacts with visible auth and validation boundaries.
- Why: The goal is to make request flow and server boundaries easy to trace for someone learning backend-oriented product engineering.

## Stage 3 — Domain model and tenant shape
- Added `prisma/schema.prisma` with tenants, users, customer accounts, products, price rules, opportunities, quotes, approvals, deal desk cases, orders, provisioning requests, invoices, payments, revenue events, workflow jobs, and audit logs.
- Added explicit `tenantId` ownership across tenant-scoped aggregates and composite uniqueness where route-safe updates need it.
- Why: Multi-tenancy changes the safe shape of nearly every repository query.

## Stage 4 — Auth and request boundary
- Added `src/lib/auth/session.ts`, `src/lib/auth/permissions.ts`, and `src/lib/http/with-route-context.ts`.
- Added a demo session directory in `src/lib/auth/demo-users.ts` so the rest of the architecture can stay realistic without adding a full auth product.
- Why: A learning codebase still needs explicit auth and RBAC from day one.

## Stage 5 — Service and repository layers
- Added repositories for catalog, accounts, opportunities, quotes, orders, invoices, workflow jobs, and audit logs.
- Added services for catalog, opportunities, quotes, orders, and invoices.
- Why: The project teaches service-layer thinking best when repositories stay boring and services own the workflow rules.

## Stage 6 — Workflow logic
- Added `src/domain/quote-policy.ts` for pure pricing and transition rules.
- Implemented quote drafting, submission, deal desk routing, approval decisions, order creation, order activation, invoice generation, payment application, and revenue-trigger enqueueing.
- Why: The workflow is the heart of the product, and it is where senior-level reasoning shows up most clearly.

## Stage 7 — Thin UI and API wiring
- Added route handlers under `src/app/api` and React Query hooks under `src/hooks`.
- Added pages and thin client components for opportunities, quotes, quote detail, deal desk, and catalog.
- Why: The UI should exercise the backend boundaries without becoming the place where the business logic lives.

## Stage 8 — Tests and docs
- Added focused tests for auth rejection, schema validation, state transitions, and tenant scoping.
- Wrote architecture and learning docs anchored to the actual file paths and function names in the codebase.
- Why: The project is meant to be read as much as it is meant to be built.

## Major Decisions

### Decision: Single-tenant app vs first-class multi-tenant architecture
Why it matters: Tenant shape changes how auth, repositories, ids, and data-leak risk behave.

Options:
- Single-tenant internal tool
  Pros: Simpler queries and fewer auth concerns.
  Cons: Unrealistic for a SaaS-style revenue platform.
  Future pain: Adding tenants later would require touching almost every query and service.
- Multi-tenant with implicit scoping hidden in the ORM
  Pros: Less code in repository methods.
  Cons: Harder to audit and easier to bypass accidentally.
  Future pain: Reviewers cannot easily prove that every query is scoped.
- Multi-tenant with explicit request context and repository scoping
  Pros: Reviewable, testable, and realistic.
  Cons: More repetition in repositories.
  Future pain: Slightly more verbose code.

Choice: Multi-tenant with explicit request context and repository scoping.

Why this option won: The point of the project is to teach strong backend instincts. Explicit scoping in `src/lib/auth/session.ts` and `src/repositories/*.ts` makes the safety rules visible.

What junior, mid, and senior engineers notice differently:
- Junior: Sees extra `tenantId` plumbing as boilerplate.
- Mid: Notices that the plumbing makes authorization reasoning easier.
- Senior: Cares that the safety rule is reviewable on every query and survives team growth.

### Decision: Prisma vs Drizzle
Why it matters: The ORM shapes how readable the data model and repository layer feel.

Options:
- Prisma
  Pros: Excellent schema readability, strong relation ergonomics, easy aggregate loading.
  Cons: Generated client and some abstraction overhead.
  Future pain: Very large hot-path apps may want more SQL control.
- Drizzle
  Pros: Closer to SQL and often lighter-weight.
  Cons: The schema and relation story is less teachable here for a junior-to-mid reader.
  Future pain: Aggregate-heavy workflows can become noisier to read.

Choice: Prisma.

Why this option won: `prisma/schema.prisma` is one of the main learning artifacts in this project, and the aggregate loads in `src/repositories/quote-repository.ts` read cleanly.

What junior, mid, and senior engineers notice differently:
- Junior: Appreciates the schema readability.
- Mid: Notices that repositories remain simpler.
- Senior: Sees the tradeoff between readability and fine-grained SQL control, and accepts it for this product shape.

### Decision: REST vs tRPC
Why it matters: The transport boundary affects how clearly you can teach request flow, auth, and validation.

Options:
- REST with route handlers
  Pros: Explicit HTTP boundary, easy to trace file-by-file, good fit for mixed internal and integration-style workflows.
  Cons: More endpoint files.
  Future pain: Some repetition if the surface area grows a lot.
- tRPC
  Pros: Great type inference and low ceremony.
  Cons: The network boundary becomes less obvious to newer engineers.
  Future pain: Harder to show the shape of “real” API seams in a product like this.

Choice: REST with route handlers.

Why this option won: The docs can literally trace a request from `src/app/api/.../route.ts` into validation, auth, service, and repository files.

What junior, mid, and senior engineers notice differently:
- Junior: Learns where requests actually enter the system.
- Mid: Notices how thin the route files stay.
- Senior: Evaluates whether the API boundary stays stable for future integrations.

### Decision: Inline side effects vs durable workflow jobs
Why it matters: Provisioning and revenue-recognition handoffs touch external systems and should survive transient failures.

Options:
- Call external systems inline during the request
  Pros: Feels straightforward.
  Cons: Fragile and hard to retry safely.
  Future pain: Partial failures leave data and side effects out of sync.
- Enqueue durable workflow jobs
  Pros: Retryable, auditable, and safer for external dependencies.
  Cons: More tables and more operational concepts.
  Future pain: Requires a worker process later.

Choice: Enqueue durable workflow jobs in `src/repositories/workflow-job-repository.ts`.

Why this option won: The request path in `src/services/order-service.ts` and `src/services/invoice-service.ts` can complete quickly while preserving a durable handoff record.

What junior, mid, and senior engineers notice differently:
- Junior: Sees an extra table.
- Mid: Notices this avoids long synchronous requests.
- Senior: Cares about retry semantics, auditability, and failure recovery.

## PR Slices

### Slice 1 — Establish schema, tenant boundaries, and auth primitives
- Purpose: Create the data model and the request-scoped auth/RBAC foundation.
- Only the files containing novel logic: `prisma/schema.prisma`, `src/lib/auth/session.ts`, `src/lib/auth/permissions.ts`, `src/lib/http/with-route-context.ts`
- For reviewers:
  `prisma/schema.prisma` around the tenant-owned aggregates and quote/order/invoice relations
  `src/lib/auth/session.ts` around `getSessionFromHeaders()` tenant-switch checks
  `src/lib/http/with-route-context.ts` around the auth-before-parse ordering
- One thing a junior reviewer would approve without questioning: Missing tenant context for platform admins because the happy path still works.

### Slice 2 — Add repositories and pure quote workflow rules
- Purpose: Create explicit persistence modules and reusable quote policy logic.
- Only the files containing novel logic: `src/domain/quote-policy.ts`, `src/repositories/catalog-repository.ts`, `src/repositories/opportunity-repository.ts`, `src/repositories/customer-account-repository.ts`, `src/repositories/quote-repository.ts`
- For reviewers:
  `src/domain/quote-policy.ts` around `evaluateQuoteDraft()` exception rules and `ensureQuoteTransition()`
  `src/repositories/quote-repository.ts` around `getQuoteById()` include graph and tenant filters
- One thing a junior reviewer would approve without questioning: Repository methods that load child data in separate queries and risk incoherent workflow decisions.

### Slice 3 — Implement opportunity, catalog, and quote services with routing
- Purpose: Build the CPQ and approval-routing heart of the product.
- Only the files containing novel logic: `src/services/catalog-service.ts`, `src/services/opportunity-service.ts`, `src/services/quote-service.ts`, `src/app/api/opportunities/route.ts`, `src/app/api/quotes/route.ts`, `src/app/api/quotes/[quoteId]/submit/route.ts`, `src/app/api/quotes/[quoteId]/approve/route.ts`, `src/app/api/quotes/[quoteId]/deal-desk/route.ts`
- For reviewers:
  `src/services/quote-service.ts` around `submitQuote()`, `resolveDealDeskCase()`, and `decideQuoteApproval()`
  `src/app/api/quotes/[quoteId]/submit/route.ts` around thin-route discipline
- One thing a junior reviewer would approve without questioning: Service code that trusts parent ids without tenant-scoped lookups.

### Slice 4 — Add order activation, billing, and async workflow handoffs
- Purpose: Carry approved commercial intent into operations and finance.
- Only the files containing novel logic: `src/services/order-service.ts`, `src/services/invoice-service.ts`, `src/repositories/order-repository.ts`, `src/repositories/invoice-repository.ts`, `src/repositories/workflow-job-repository.ts`, `src/app/api/orders/[orderId]/activate/route.ts`, `src/app/api/invoices/[invoiceId]/apply-payment/route.ts`
- For reviewers:
  `src/services/order-service.ts` around the activation transaction
  `src/services/invoice-service.ts` around overpayment rejection and revenue-event creation
- One thing a junior reviewer would approve without questioning: External side effects inline in the request instead of durable handoff jobs.

### Slice 5 — Add thin UI, focused tests, and learning docs
- Purpose: Make the architecture explorable through UI, tests, and code-anchored docs.
- Only the files containing novel logic: `src/hooks/use-quotes.ts`, `src/components/quote-detail-client.tsx`, `src/app/api/invoices/[invoiceId]/apply-payment/route.test.ts`, `src/domain/quote-policy.test.ts`, `docs/architecture/request-lifecycle.md`, `docs/learning/flow-traces.md`
- For reviewers:
  `src/hooks/use-quotes.ts` around keeping the browser on the API boundary instead of reaching into services
  `docs/learning/flow-traces.md` around path accuracy and whether the traces match real function names
- One thing a junior reviewer would approve without questioning: Treating docs as optional polish instead of verifying that they still match the shipped code.
