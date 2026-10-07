# Testing Rationale

`src/app/api/invoices/[invoiceId]/apply-payment/route.test.ts` — `rejects a sales user with 403 before finance logic runs`

This is worth testing because payment application is one of the highest-risk endpoints in the system. If a non-finance role can reach `src/services/invoice-service.ts` `applyPayment()`, the bug is not cosmetic; it is a financial-control failure. A broader production suite would also test `FINANCE` happy paths, malformed auth headers, and platform-admin behavior with and without `x-active-tenant-id`.

`src/lib/validation/quote-schemas.test.ts` — `rejects a contract term outside the supported range`

This is worth testing because contract term errors do not stay local to quote entry. A bad term leaks into approval routing, amendment logic, and billing assumptions. A broader production suite would add more invalid quote shapes, line-level price issues, and amendment-specific validation cases.

`src/domain/quote-policy.test.ts` — `rejects skipping from deal desk review straight to approved`

This is worth testing because state-machine bugs often look harmless in code review and then bypass real human checkpoints in production. This test protects the invariant that quoted commercial exceptions cannot silently jump over required workflow states. A broader suite would cover every legal and illegal transition plus transitions that differ by quote type or amendment type.

`src/repositories/quote-repository.test.ts` — `includes tenantId when loading a quote aggregate`

This is worth testing because missing tenant filters are one of the classic SaaS data-leak bugs. The repository test is intentionally narrow and checks the exact query shape sent to Prisma. A broader production suite would add integration tests against a real test database and would cover list queries, parent lookups, and nested ownership checks.

## `tests/quote-transition-policy.test.mjs` — runtime lab for the pricing policy

This is a `node:test` file from the `astraupskill/` course, run with `node --experimental-vm-modules --test`. It loads the real `src/domain/quote-policy.ts` through `tests/helpers/load-typescript.mjs`, with no stubs. Its five cases cover:

- the allowed lifecycle edges, and four forbidden ones (terminal, skipped, and same-status) that each produce a 409 naming both statuses
- exact thresholds (a 10 % and a 20 % discount) that do not escalate past their own threshold
- de-duplicated reasons when a discount is above both thresholds and the term is non-standard
- the unknown-product 404, the below-floor 422, and an exact-floor price that is accepted

Blind spots worth a follow-up test:

- A quantity outside every price rule. Today it skips both the floor check and the term check (`quote-policy.ts:67, 96`).
- A discount that rounds down to the threshold. For example, 10.4 % compares as 10 (`src/lib/money.ts:17`).
- The service-level approval flow, including two approvers deciding concurrently.
