# Q2C Ops Platform

This project is a tenant-aware quote-to-cash application built to teach production-style backend product engineering. The core flow starts in `src/app/api/opportunities/route.ts`, moves through `src/services/quote-service.ts` for CPQ and approval routing, then fans out into `src/services/order-service.ts` and `src/services/invoice-service.ts` for downstream fulfillment and finance.

Top-level layers:

- `src/app` holds the App Router pages and REST route handlers. Examples: `src/app/api/quotes/route.ts` is the quote HTTP boundary, and `src/app/quotes/[quoteId]/page.tsx` renders the quote detail UI.
- `src/components` contains thin UI pieces that call hooks instead of owning business logic. Example: `src/components/quote-detail-client.tsx` triggers submit and approve actions but does not compute quote state.
- `src/hooks` contains React Query hooks that talk to REST endpoints. Example: `src/hooks/use-quotes.ts` calls `/api/quotes` and `/api/quotes/[quoteId]/submit`.
- `src/lib` holds cross-cutting infrastructure. `src/lib/auth/session.ts` resolves the session, `src/lib/auth/permissions.ts` owns RBAC, `src/lib/http/with-route-context.ts` enforces auth on routes, and `src/lib/validation/*.ts` owns Zod input boundaries.
- `src/services` is the business layer. `src/services/quote-service.ts` owns CPQ, deal desk routing, approvals, and conversion to order. `src/services/order-service.ts` owns order activation, provisioning handoff creation, and invoice generation.
- `src/repositories` encapsulates Prisma access and tenant scoping. `src/repositories/quote-repository.ts` loads the full quote aggregate, and `src/repositories/invoice-repository.ts` owns invoice, payment, and revenue-event persistence.
- `src/domain` contains pure workflow rules. `src/domain/quote-policy.ts` calculates pricing exceptions and validates quote status transitions without hitting the database.
- `prisma` defines persistence. `prisma/schema.prisma` is the source of truth for tenants, catalog, quotes, approvals, orders, invoices, and workflow jobs. `prisma/seed.ts` seeds the demo tenant, account, users, and core product ids used by the sample UI.

Why the folders are split this way:

- Request parsing and auth live near the HTTP edge so invalid or unauthorized requests fail before service work begins.
- Business rules live in services and `src/domain` so the same logic is reusable from UI-triggered routes, background flows, and tests.
- Repositories stay explicit and tenant-scoped so a reviewer can inspect query safety file by file.
