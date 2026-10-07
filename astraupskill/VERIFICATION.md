# Verification

## 1. Recorded by the original Astra run (not re-run for this revision)

[evidence/results.json](evidence/results.json) records one check:

- command `node --experimental-vm-modules --test tests/quote-transition-policy.test.mjs`
- `executedTests: 5`, all passing, elapsed 4.52 s, started 2026-09-22T03:20:01Z
- `cwd` was a staging directory on the author's machine (`...\stage\b17f4c546008`), not this clone

The JSON names a log file, `crud-b05-astra-runtime.log`, that is **not committed**. The earlier "captured output" link does not resolve in this clone.

## 2. Confirmed by reading this clone

- `src/domain/quote-policy.ts` is byte-identical to `astraupskill/snapshots/quote-policy.ts.original.txt`. No production change was made.
- The lab has five `test(...)` calls, at lines 8, 11, 14, 18, and 21. It calls only `ensureQuoteTransition` and `evaluateQuoteDraft`.
- The money examples use base 10,000 cents. The threshold prices are 9,000 (exact finance) and 8,000 (exact deal desk). The above-threshold price is 7,900, the floor is 6,000, and below-floor is 5,999.
- Quantity endpoints: the lab uses quantities 1 and 2 against a 1-10 rule. The max endpoint, and quantities outside the rule, are not executed.

## 3. Never executed, as far as the repo records

- `npm test` (Vitest): `src/domain/quote-policy.test.ts`, `src/lib/validation/quote-schemas.test.ts`, `src/repositories/quote-repository.test.ts`, `src/app/api/invoices/[invoiceId]/apply-payment/route.test.ts`
- `next build`, `tsc`, Prisma migrate or seed
- any `quote-service` flow: deal-desk routing, approval rows, finalize-to-order
- concurrent approvals or submits

## What this evidence supports

Statements about the numeric boundaries, routing flags, and lifecycle helper only. It does not support claims about tenant scoping, audit creation, approval persistence, or order creation. The suggested next test loads `quote-service.ts` with a tenant-scoped catalog fixture and a transaction double, and asserts that the finance, deal-desk, and legal flags become the intended approval and case records, including the unknown-product and below-floor refusal paths.
