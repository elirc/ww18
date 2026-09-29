# Worked source walkthrough

In [quote-policy.ts](../src/domain/quote-policy.ts), each draft line first finds its product. If no product is present, the function throws `AppError(404, ...)`. It then finds a price rule where quantity lies between minimum and maximum. A selected rule rejects only `unitPriceCents < floorPriceCents`, so equality survives. The line records list price and discount percentage.

After mapping lines, `subtotalCents` sums list price times quantity and `totalCents` sums submitted price times quantity. The difference is discount cents. A second pass checks each line’s product thresholds and allowed term list, adding reasons to a Set. The returned booleans are derived from reason text.

A concrete fixture with base 10,000, sale 8,000, quantity 2 gives subtotal 20,000, total 16,000, discount 4,000, and a 20 percent discount. If deal desk is 15 and finance 10, both flags are true. If the term is absent, legal is also true. `ensureQuoteTransition("REJECTED", "APPROVED")` independently throws 409.

These snippets are real source behavior, while the service’s transaction is only a caller. Do not say this function creates an approval row or enforces tenant scope.
