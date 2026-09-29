# Numeric and lifecycle concepts

The policy uses closed quantity intervals: a rule applies when quantity is at least `minQuantity` and at most `maxQuantity`. A price rule’s floor is a lower bound with strict rejection below it. Discount percentage comes from base and submitted cents. Threshold flags use strict greater-than comparisons, so equality does not escalate.

A discount above the deal-desk threshold adds a deal-desk reason and, because the policy result treats deal-desk discounting as finance-sensitive, finance approval as well. A discount above only the finance threshold requires finance. A term not found in `allowedTermMonths` adds legal. These are independent reasons collected in a set.

The lifecycle map has DRAFT routes to pending, approved, or rejected states; PENDING states can continue or reject; APPROVED can convert; REJECTED and CONVERTED_TO_ORDER are terminal. `ensureQuoteTransition` throws status 409 for a forbidden edge.

| boundary | expected |
|---|---|
| min/max quantity | rule selected |
| exact floor | allowed |
| below floor | 422 |
| exact discount threshold | no flag from that threshold |
| unknown product | 404 |
| terminal transition | 409 |

None of these pure rules proves persistence or authorization.
