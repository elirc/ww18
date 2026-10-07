# Solutions and review

## Solutions

1. Both endpoints select the rule. At 11 there is no rule, so the line is accepted with no floor and no term check.
2. 36,000 − 32,400 = 3,600 cents, which is a 10 % discount.
3. 8,000 is accepted. 7,999 is rejected with 422, and no totals are computed.
4. Deal desk and finance are both flagged. Adding the unsupported term flags legal too.
5. 404, before any totals.
6. Allowed, then 409.
7. No finance approval, because of rounding.
8. The quote can get stuck in `PENDING_APPROVAL`. Fix it by locking the quote row (`SELECT ... FOR UPDATE` through `$queryRaw`) at the start of the transaction, so the two approvals serialize. A finalize job that sweeps quotes with no pending approvals would also work.
9. Always 403 for admins. Either let admins satisfy any pending approval explicitly, or remove `quote:approve` from their roles so the matrix stops promising something the service never allows.

## Review rubric

1. Endpoint comparisons are inclusive.
2. The floor comparison is strict.
3. Totals are integer cents.
4. Reasons are additive and de-duplicated.
5. Errors carry a status code.
6. Claims stop at the policy boundary. No statement about approvals, tenancy, or persistence is backed by the lab.

A weak review assumes every discount needs finance approval. The code uses per-product thresholds. Another weak review assumes the exact threshold escalates. The code uses `>`, and it compares a **rounded** percentage.

## Senior review: findings across the repo

Found by reading this clone. None of these was reproduced by running code.

| # | Severity | Location | Finding |
|---|---|---|---|
| 1 | High | `src/domain/quote-policy.ts:64-69, 96` | No matching price rule means no floor and no term check, so any price is accepted for out-of-range quantities. |
| 2 | Medium | `src/lib/money.ts:17`, `quote-policy.ts:88,92` | Thresholds compare a rounded whole-number percentage. Discounts up to x.4 % above a threshold skip review. |
| 3 | Medium | `src/services/quote-service.ts:357-419` | Concurrent final approvals can each see the other still PENDING. Neither finalizes, and the quote stalls in `PENDING_APPROVAL`. |
| 4 | Medium | `quote-service.ts:375-382`, `src/repositories/quote-repository.ts:123-143` | `updateApprovalDecision` is a conditional `updateMany` on `status: "PENDING"`, but the service ignores its count. A duplicate decision that matched zero rows still proceeds to the rejection or finalize logic. |
| 5 | Medium | `quote-service.ts:203-212` | `submitQuote` checks `status === "DRAFT"` outside the transaction, and status writes are not conditional. Two concurrent submits can both pass and create two deal-desk cases or duplicate approvals. |
| 6 | Low | `quote-policy.ts:108-112` | Flags are derived by substring-matching human-readable reason text. Rewording a message changes routing. |
| 7 | Low | `src/lib/auth/permissions.ts:42-53`, `quote-service.ts:279-281` | `ORG_ADMIN` and `PLATFORM_ADMIN` hold `quote:approve` but can never approve, because no approval row targets their role. |
| 8 | Low | `quote-policy.ts:44-50` | With overlapping price rules, the first match wins, so pricing depends on the order of the rule array. |

## Test blind spots

- No case with a quantity outside every rule (finding 1).
- No case with a rounded percentage just above a threshold (finding 2).
- Nothing tests the service-level approval and finalize flow, or concurrency.
