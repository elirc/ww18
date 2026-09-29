# Testing and debugging

Use the recorded pure lab command and evidence for this project. The tested production functions are [evaluateQuoteDraft](../src/domain/quote-policy.ts) and `ensureQuoteTransition`; no copied pricing model belongs in a regression. When a case fails, first inspect status code and then arithmetic.

For an unknown product, `products.find` returns undefined and the function throws 404 before pricing. For a below-floor line, product and rule exist, then the strict comparison throws 422 before totals. For a terminal transition, the policy map has an empty array and throws 409. These failure classes represent different caller corrections.

Boundary debugging should print quantity, min, max, floor, base cents, submitted cents, and computed percentage. Test quantity exactly at both rule endpoints. Test price exactly at floor and one cent below. Test discount exactly at threshold and a value above it. Use integer cents so decimal rounding does not obscure policy decisions.

The pure lab does not exercise Zod schemas, catalog tenant filtering, Prisma transactions, service authorization, audit writes, or order creation. A passing lab therefore supports domain policy only. Follow-up integration tests are required for workflow claims.
