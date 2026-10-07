# Numeric and lifecycle concepts

## 1. Closed intervals

`findApplicableRule` returns the first rule where `quantity >= rule.minQuantity && quantity <= rule.maxQuantity` (`src/domain/quote-policy.ts:47`). Both endpoints are included. If two rules overlap, the **first** in the array wins. The array order comes from whatever the repository returns, so overlapping rules make pricing depend on query order.

## 2. A rule is optional, and so are its protections

When no rule matches, `rule` is `null`. The floor check (line 67) and the term check (line 96) are both guarded by `rule &&`. A line whose quantity falls outside every configured range is therefore accepted at **any** price, with no floor and no legal routing. It is still subject to the discount-threshold reasons, because those read product fields. Whether a missing rule should mean "no constraints" or "reject" is a product decision. The current code chooses "no constraints" silently.

## 3. Strict thresholds on a rounded percentage

`calculatePercentDiscount` returns `Math.round(((list - unit) / list) * 100)` (`src/lib/money.ts:17`). The comparisons are strict `>` (lines 88 and 92). Combined:

- an exact 10% discount with a finance threshold of 10 does **not** escalate (test line 15 asserts this)
- a 10.4% discount rounds to 10 and also does not escalate
- a 10.5% discount rounds to 11 and does escalate

So the effective finance threshold is "at least 10.5%", not "above 10%". With list price 10,000 cents, a unit price of 8,960 gives 10.4% and slips under the threshold.

## 4. Integer cents

Totals multiply integer cents by integer quantities (lines 79-80). There is no float arithmetic on money except inside the percentage calculation, and that result is only used for routing, never for amounts.

## 5. Reasons, then flags

Reasons are collected in a `Set` (line 82), so two lines of the same SKU produce one reason each type (test line 19 asserts three distinct reasons). The flags are then derived by searching reason **text** (108-112). That is brittle: rewording a message, for example changing "deal desk" in the string at line 89, silently changes routing. `requiresFinanceApproval` is also true whenever a deal-desk reason exists (line 110). So a deal-desk exception always ends in finance approval too, once `resolveDealDeskCase` builds the plan (`quote-service.ts:326-329`).

## 6. Lifecycle

`ensureQuoteTransition` makes REJECTED and CONVERTED_TO_ORDER terminal and forbids same-status moves. DRAFT may jump straight to APPROVED. That is the "no exceptions needed" path, `finalizeApprovedQuote` (`quote-service.ts:275`), which immediately converts to an order (59-75).

## Self-check

**Goal:** With list 10,000, a deal-desk threshold of 20, a finance threshold of 10, and a rule covering 1-10 with floor 6,000, classify unit prices 9,000, 8,960, 8,000, 7,900, and 5,999 at quantity 2.
**Check:**

- 9,000: 10%, no flags.
- 8,960: 10.4% rounds to 10, no flags.
- 8,000: 20%, finance only, because 20 is not > 20.
- 7,900: 21%, deal desk plus finance.
- 5,999: 422.

Confirm 9,000, 8,000, 7,900, and 5,999 against `tests/quote-transition-policy.test.mjs:15-23`. The 8,960 case is not in the lab.
