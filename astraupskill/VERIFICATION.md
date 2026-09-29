# Verification

This course links to [quote-policy.ts](../src/domain/quote-policy.ts), [quote-service.ts](../src/services/quote-service.ts), [money.ts](../src/lib/money.ts), and [errors.ts](../src/lib/errors.ts). The pure lab covers allowed lifecycle edges and exact discount thresholds, exact cent totals, above-threshold finance/deal-desk/legal routing, unknown product 404, below-floor 422, and illegal terminal transitions 409.

No quote-service, database, HTTP, or transaction execution is claimed here. The fixture calls actual policy functions with plain product data and observes return values or AppError status codes. That supports numeric, boundary, routing-flag, and lifecycle-helper statements only. It does not prove tenant scoping, audit creation, approval persistence, or source-wide correctness.

Reviewers should compare each claim against strict `>` threshold checks, inclusive quantity bounds, floor comparison, and the allowed transition map. Use the captured results and source snapshot as the execution record. A follow-up service test should assert that finance, deal-desk, and legal flags become the intended approval/case records inside a transaction, including unknown-product and below-floor refusal paths.

The lab’s five executed cases are a focused domain check, not a broad application certification.

Run `node --experimental-vm-modules --test tests/quote-transition-policy.test.mjs` from the project directory. Quantity min/max behavior is inspected source and an exercise; the captured cases do not comprehensively test both quantity endpoints. The exact money examples use 10,000 base cents, 9,000 and 8,000 threshold prices, and 7,900 above-threshold pricing.

## Astra execution evidence

The captured focused production-source suite executed 5 tests: all passed, zero failed and zero skipped. Read the [captured output](evidence/crud-b05-astra-runtime.log) and [exact command and limits](evidence/results.json). Earlier check records remain preserved in the workspace.
