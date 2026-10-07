# Quote policy lab

ww18 is a multi-tenant quote-to-cash demo built with Next.js route handlers, Prisma, Zod, and React Query. It manages opportunities, quotes, a deal-desk exception queue, finance and legal approvals, orders, and invoice payments. This course is about the **pure pricing and lifecycle policy** at its centre: [`src/domain/quote-policy.ts`](../src/domain/quote-policy.ts). Its orchestration caller is [`src/services/quote-service.ts`](../src/services/quote-service.ts).

## What the policy does

- `evaluateQuoteDraft(products, draftLines, contractTermMonths)` (`quote-policy.ts:52-115`) does the following for each line:
  - finds the product, or throws `AppError(404)`
  - picks the first price rule whose quantity range contains the line's quantity, with both ends inclusive (44-50)
  - computes a rounded discount percentage (`src/lib/money.ts:12-18`)
  - rejects a price strictly below the rule's floor with `AppError(422)` (67-69)

  It then sums list and sale totals in integer cents (79-81), collects de-duplicated review reasons (82-99), and derives three flags from the reason text (108-112).
- `ensureQuoteTransition(current, next)` (126-130) checks the lifecycle map (117-124) and throws `AppError(409)` for an edge that is not listed.

The policy is pure. It never queries a database, authorizes a session, writes approvals, or audits. `quote-service.ts` turns its flags into deal-desk cases and approval rows inside `prisma.$transaction`.

## What was delivered

`tests/quote-transition-policy.test.mjs` contains five `node:test` cases that execute the real `quote-policy.ts`. The policy itself is unchanged: `diff astraupskill/snapshots/quote-policy.ts.original.txt src/domain/quote-policy.ts` prints nothing. The repo also has Vitest unit tests next to the source, such as `src/domain/quote-policy.test.ts`.

## Run it

```text
node --experimental-vm-modules --test tests/quote-transition-policy.test.mjs
```

Run it from the repository root (`root: path.resolve('.')`, test line 5). It works without stubs because `quote-policy.ts` imports Prisma only as types (`import type`, line 12), which type stripping removes.

## Key boundary facts to keep in your head

- Quantity ranges are closed intervals: `>= min && <= max` (line 47).
- An exact floor price is accepted. One cent below throws 422.
- Thresholds escalate only when the discount is **strictly greater than** the threshold (lines 88 and 92).
- The discount percentage is **rounded to a whole number** before it is compared (`money.ts:17`). A 10.4% discount compares as 10.
- If no rule matches the quantity, there is **no floor check and no term check** for that line (67 and 96 both need `rule`).

The last two facts are the main findings in chapter 06.
