# Quote policy lab

This course is grounded in [quote-policy.ts](../src/domain/quote-policy.ts) and its orchestration caller [quote-service.ts](../src/services/quote-service.ts). The policy evaluates catalog products and draft lines, selects quantity rules, computes integer-cent totals, enforces floor prices, and returns routing flags. `ensureQuoteTransition` separately guards the quote lifecycle. The pure lab covers exact discount thresholds, exact cents, above-threshold finance/deal-desk/legal routing, unknown product 404, below-floor 422, and illegal terminal transitions 409.

The policy is intentionally pure. It receives product-shaped values and returns a decision or throws an AppError. It does not query a database, authorize a session, create a deal-desk case, or write an audit event. The service later uses its decision inside a transaction. Keeping those levels separate prevents an exercise about `>` from becoming an unsupported claim about persisted approval rows.

Read each chapter with the source open. Boundary arithmetic is the center of the lab: quantity ranges are inclusive, floor equality is accepted, and thresholds escalate only above their configured percentages. The source snapshot and captured evidence determine what was actually checked.
