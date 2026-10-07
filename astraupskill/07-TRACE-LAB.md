# Trace lab

## Trace A: valid line at the quantity minimum

Use the lab product with `line(9000, 1)` and term 12.

1. Product lookup finds `p1` (`quote-policy.ts:58`).
2. Rule search: is 1 ≥ 1 and 1 ≤ 10? Yes, so `r1` is selected (47).
3. Discount: round(1000 / 10000 × 100) = 10 (65).
4. Floor: is 9000 < 6000? No, the line is accepted (67).
5. The evaluated line carries `pricingRuleId: 'r1'`, `listPriceCents: 10000`, `discountPct: 10`.
6. Totals: subtotal 10000, total 9000, discount 1000 (79-81).
7. Reasons: 10 > 20? No. 10 > 10? No. Is 12 in [12]? Yes. So there are no reasons, and all flags are false.

## Trace B: one cent below the floor

`line(5999)`. Steps 1-3 run as in Trace A, then line 68 throws `AppError(422)`. Totals, reasons, and lifecycle code never run.

## Trace C: unknown product

The catalog is `[]`. Line 61 throws `AppError(404)` immediately, so rule selection is skipped.

## Trace D: quantity outside every rule (not in the lab)

`line(1, 11)`, with unit price 1 cent.

1. The product is found.
2. Rule: 11 > 10, so `null`.
3. Discount: round(9999 / 10000 × 100) = 100.
4. Floor check skipped, because `rule` is null.
5. Reasons: deal desk (100 > 20) and finance (100 > 10). Term check skipped.
6. Result: accepted, routed to deal desk.

A human reviewer still sees the quote, but the configured floor price never fired.

| Trace point | Valid | Below floor | Unknown | Out-of-range qty |
|---|---|---|---|---|
| product | found | found | missing (404) | found |
| rule | r1 | r1 | skipped | null |
| floor | passes | 422 | skipped | **skipped** |
| totals | computed | skipped | skipped | computed |
| term check | passes | skipped | skipped | **skipped** |

## Trace E: lifecycle

`ensureQuoteTransition` looks up `allowedTransitions[current]` and checks `.includes(next)` (127). Trace `PENDING_DEAL_DESK → APPROVED`. The allowed list is `["PENDING_APPROVAL", "REJECTED"]`, so it throws 409 with "Quote cannot move from PENDING_DEAL_DESK to APPROVED.". This trace is pure. The transaction and audit boundaries belong to the caller in `quote-service.ts`.

## Exercise

**Goal:** Add Trace D to the lab as a characterization test.
**Check:** `const r = m.evaluateQuoteDraft([product], [line(1, 11)], 12)`. Assert `r.lines[0].pricingRuleId === null`, `r.requiresDealDesk === true`, and `r.requiresLegalApproval === false`. If you later fix finding 1, flip the test to expect 422.
