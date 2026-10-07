# Source map

## Who calls the policy

`src/services/quote-service.ts` calls `evaluateQuoteDraft` in four places:

| Caller | Line | Products come from |
|---|---|---|
| `createQuote` | 161 | `catalogRepository.getProductsForQuote(prisma, tenantId, ids)` (156-160), tenant-scoped |
| `submitQuote` | 214-218 | the stored quote's lines and their products (`normalizeProductsFromQuote`, 93-100) |
| `resolveDealDeskCase` | 321-325 | the stored quote |
| `createAmendmentQuote` | 441 | tenant-scoped catalog |

`ensureQuoteTransition` is called before every status write: 222, 254, 304, 332, 385, and inside `finalizeApprovedQuote` at 59.

## Inside `evaluateQuoteDraft` (`src/domain/quote-policy.ts`)

| Step | Lines | Behavior |
|---|---|---|
| product lookup | 58-62 | missing product throws `AppError(404, "Product ... was not found in the active tenant.")` |
| rule match | 64, via 44-50 | the first rule with `min <= qty <= max`, otherwise `null` |
| discount | 65 | `Math.round(((list - unit) / list) * 100)`, or `0` when list is 0 |
| floor | 67-69 | only when a rule exists: `unit < floor` throws `AppError(422)` |
| line result | 71-76 | adds `pricingRuleId`, `listPriceCents`, `discountPct` |
| totals | 79-81 | `subtotal = Σ list × qty`, `total = Σ unit × qty`, `discount = subtotal - total` |
| reasons | 84-99 | deal desk if `discountPct > dealDeskDiscountPct`; finance if `> autoApprovalDiscountPct`; legal if the rule's `allowedTermMonths` lacks the term |
| flags | 108-112 | `requiresDealDesk` and `requiresLegalApproval` from reason text; `requiresFinanceApproval` is true for finance **or** deal-desk reasons |

## Lifecycle map (117-124)

| From | Allowed to |
|---|---|
| DRAFT | PENDING_DEAL_DESK, PENDING_APPROVAL, APPROVED, REJECTED |
| PENDING_DEAL_DESK | PENDING_APPROVAL, REJECTED |
| PENDING_APPROVAL | APPROVED, REJECTED |
| APPROVED | CONVERTED_TO_ORDER |
| REJECTED, CONVERTED_TO_ORDER | — |

Same-status moves are **not** allowed. Unlike some other projects in this series, there is no `current === next` shortcut. Test line 12 includes `APPROVED → APPROVED` as a 409.

## Supporting modules

- `src/lib/money.ts`: `calculatePercentDiscount` (12-18) and `sumMoney` (20-22).
- `src/lib/errors.ts`: `AppError(statusCode, message)`. Note the argument order (line 15).
- Routes go through `withRouteContext` (`src/lib/http/with-route-context.ts:17-32`), which resolves the session, checks the action permission, and resolves the tenant **before** the handler parses the body.

## Exercise

**Goal:** For a SALES user creating a quote, list the order of authorization, tenant resolution, validation, and policy evaluation.
**Check:** `getSessionFromHeaders`, then `assertCan(session, "quote:create")`, then `requireTenantContext` (all in `with-route-context.ts:23-26`), then the route's body parse, then `createQuote`: customer lookup (134-142), optional opportunity lookup (144-154), catalog fetch (156-160), and `evaluateQuoteDraft` (161) before the transaction (163). A 404 or 422 from the policy therefore writes nothing.
