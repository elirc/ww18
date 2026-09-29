# Solutions and review

Exercise one uses a closed interval, so both endpoints select. Exercise two multiplies by quantity before subtracting: 36,000 minus 32,400 equals 3,600 cents. Exercise three accepts equal floor and rejects one cent below with 422. Exercise four adds deal desk and finance for 20 percent, then legal for a disallowed term. Exercise five throws 404 before totals. Exercise six permits DRAFT to pending approval and rejects a conversion back to APPROVED with 409. Exercise seven separates return values from writes.

Review [quote-policy.ts](../src/domain/quote-policy.ts) for endpoint comparisons, strict floor behavior, integer totals, additive reasons, and status-bearing errors. Then inspect [quote-service.ts](../src/services/quote-service.ts) to see `buildApprovalPlan` turn flags into roles. A weak review assumes every discount needs finance; the code uses product thresholds. Another assumes exact threshold escalates; `>` says otherwise.

The pure lab is valuable because it isolates policy, but it cannot certify all source. Do not infer tenant authorization, audit durability, transaction rollback, or order creation from these assertions. The appropriate next test loads the service with tenant-scoped catalog fixtures and a transaction double.
