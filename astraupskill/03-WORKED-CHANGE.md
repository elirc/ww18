# Worked source walkthrough

## What changed

Nothing in production. The snapshot `astraupskill/snapshots/quote-policy.ts.original.txt` is byte-identical to `src/domain/quote-policy.ts`. The delivered artifact is `tests/quote-transition-policy.test.mjs`, which pins the policy's boundary behavior.

## Fixture

From test lines 6-7:

- `product`: `id 'p1'`, `sku 'SKU-1'`, `basePriceCents 10000`, `dealDeskDiscountPct 20`, `autoApprovalDiscountPct 10`
- one rule `r1`: quantities 1-10, `floorPriceCents 6000`, `allowedTermMonths [12]`
- `line(price, quantity = 2)`

## Case-by-case walkthrough

**Exact finance threshold** (line 15): `line(9000)`, term 12.

- discount = round((10000 - 9000) / 10000 × 100) = 10
- subtotal = 10000 × 2 = 20000; total = 9000 × 2 = 18000; discount cents = 2000
- 10 > 20? No. 10 > 10? No. Is 12 in [12]? Yes. So no reasons and all three flags are false.

**Exact deal-desk threshold** (line 16): `line(8000)`. The discount is 20. 20 > 20 is false, so no deal desk. 20 > 10 is true, so finance is required. `pricingRuleId` is `'r1'`.

**Above both thresholds plus a non-standard term** (line 19): `[line(7900), line(7900, 1)]`, term 24.

- total = 7900 × 2 + 7900 × 1 = 23700; subtotal = 30000; discount cents = 6300
- both lines have a 21% discount, so the deal desk and finance reasons are added once each (it is a Set)
- 24 is not in [12], so the legal reason is added
- three reasons in total; all three flags are true

**Refusals** (lines 22-24):

- empty catalog: 404 at line 61
- 5999 is below the 6000 floor: 422 at line 68
- 6000 equals the floor and is accepted

**Lifecycle** (lines 8-13): five allowed edges pass. `REJECTED → APPROVED`, `CONVERTED_TO_ORDER → DRAFT`, `DRAFT → CONVERTED_TO_ORDER`, and `APPROVED → APPROVED` each throw a 409 whose message names both statuses.

## From flags to records (service, not executed by the lab)

`submitQuote` (`src/services/quote-service.ts:203-277`) re-evaluates the stored quote, then inside one transaction does one of three things:

- **deal desk:** status `PENDING_DEAL_DESK`, an OPEN `DealDeskCase`, and an audit row (221-249)
- **approvals needed:** status `PENDING_APPROVAL`, one `QuoteApproval` row per role from `buildApprovalPlan` (32-52), and an audit row (251-273)
- **nothing needed:** `finalizeApprovedQuote` sets APPROVED, creates the order, sets CONVERTED_TO_ORDER, and audits (54-91)

## Exercise: close the "no rule" gap

**Goal:** Make a line with no matching price rule a validation error.
**Check:** (1) After line 64, add `if (!rule) throw new AppError(422, \`No price rule covers quantity ${line.quantity} for ${product.sku}.\`)`. (2) Add a lab case `evaluateQuoteDraft([product], [line(1, 11)], 12)` that expects a 422. Today that call succeeds with a 99% discount, because quantity 11 is outside 1-10 and the floor is skipped. (3) Check whether any seed data relies on rule-less lines (`prisma/seed.ts`) before shipping.
