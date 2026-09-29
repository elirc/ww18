# Source map

The route layer calls [quote-service.ts](../src/services/quote-service.ts). Creation loads tenant-scoped products using [catalog-repository.ts](../src/repositories/catalog-repository.ts), then passes them with draft lines and contract months into `evaluateQuoteDraft` from [quote-policy.ts](../src/domain/quote-policy.ts). The policy imports [money.ts](../src/lib/money.ts) for cents and [errors.ts](../src/lib/errors.ts) for status-bearing failures.

Within evaluation, product lookup precedes rule selection. `findApplicableRule` uses inclusive minimum and maximum quantities. A floor violation throws before totals. Successful lines carry list price, discount percentage, and pricing rule ID. The second loop collects discount and term reasons. `ensureQuoteTransition` uses a separate graph.

| source step | behavior |
|---|---|
| product lookup | missing product is 404 |
| rule match | quantity endpoints included |
| floor check | below price is 422 |
| totals | integer cents |
| routing | flags for finance, deal desk, legal |
| status graph | illegal edge is 409 |

The pure lab executes domain functions only. Service transactions, repository filters, and HTTP parsing are outside its evidence.
