# Testing and debugging

## How the lab loads the policy

`tests/quote-transition-policy.test.mjs:5` calls `loadTypeScript('src/domain/quote-policy.ts', { root: path.resolve('.') })` with **no stubs**. The loader (`tests/helpers/load-typescript.mjs`) strips types, so `import type { PriceRule, Product, QuoteStatus } from "@prisma/client"` (`quote-policy.ts:12`) disappears. The remaining imports are `@/lib/errors` and `@/lib/money`, both under `src/`. If someone changes line 12 to a value import, for example to use a Prisma enum at runtime, the lab fails with `Unstubbed external dependency: @prisma/client`.

## Debugging order

When a case fails, check in this order:

1. **The status code.** 404 means product lookup (line 61). 422 means floor (line 68). 409 means lifecycle (line 128). Each tells the caller something different: fix the catalog, fix the price, or refresh the quote state.
2. **The arithmetic.** Print quantity, `minQuantity`, `maxQuantity`, `floorPriceCents`, `basePriceCents`, `unitPriceCents`, and the computed `discountPct`. Remember the rounding at `src/lib/money.ts:17`.
3. **The reasons.** Print `result.reasons`. The flags are derived from substrings ("deal desk", "finance approval", "non-standard contract term"), so a wording change shows up here first.

## Boundary checklist

| Boundary | Lab coverage |
|---|---|
| exact floor accepted, one cent below rejected | yes (lines 23-24) |
| exact deal-desk and finance thresholds do not escalate | yes (15-16) |
| quantity at min and max of a rule | **no**; the lab uses quantities 1 and 2 only. 1 is the min, so only the min endpoint is touched |
| quantity outside every rule | **no** |
| rounding just above a threshold (10.4%) | **no** |
| list price 0 (`calculatePercentDiscount` returns 0) | **no** |
| overlapping rules | **no** |

## Other tests in the repo

Vitest picks up the colocated files:

- `src/domain/quote-policy.test.ts`
- `src/lib/validation/quote-schemas.test.ts`
- `src/repositories/quote-repository.test.ts`
- `src/app/api/invoices/[invoiceId]/apply-payment/route.test.ts`

Read them alongside the lab. The recorded evidence covers only the lab command.

## What the lab cannot show

Zod parsing, tenant-scoped catalog loading, the service's transactions, approval and deal-desk persistence, order creation, and route authorization are all outside its reach. A passing lab supports statements about the policy only.

## Exercise

**Goal:** Prove the rounding blind spot.
**Check:** Add `const r = m.evaluateQuoteDraft([product], [line(8960)], 12)` and assert `r.lines[0].discountPct === 10` and `r.requiresFinanceApproval === false`, even though the exact discount is 10.4%. Then decide whether the comparison should use the unrounded ratio.
