# Graded practice

Work through these without the solutions open. For each answer, cite the comparison or arithmetic line in `src/domain/quote-policy.ts` or `src/services/quote-service.ts`, give your predicted value or `statusCode`, and say whether the lab executes that case or you are reasoning from the source alone.

1. **Rule endpoints.**
   **Goal:** A rule covers quantities 5-10. Predict whether the rule is selected at 5, 10, and 11.
   **Check:** It is selected at 5 and 10. At 11, `rule` is `null`, so no floor and no term check run (lines 47, 67, 96). That is different from a missing product, which throws 404.

2. **Arithmetic.**
   **Goal:** Base 12,000 cents, sale 10,800 cents, quantity 3. Compute subtotal, total, discount cents, and discount percentage, with units.
   **Check:** subtotal 36,000 cents, total 32,400 cents, discount 3,600 cents, discount 10 % (`money.ts:17`).

3. **Floor.**
   **Goal:** The floor is 8,000. Compare a unit price of 8,000 with 7,999, and say where execution stops in the failing case.
   **Check:** 8,000 is accepted. 7,999 throws 422 at line 68, before any totals are computed.

4. **Routing.**
   **Goal:** The deal-desk threshold is 15, the finance threshold is 10, and the discount is 20. Predict the flags, then predict them again with an unsupported term.
   **Check:** Deal desk and finance are both true. Finance is true by its own reason and also because line 110 counts deal-desk reasons as finance. With the unsupported term, legal is true as well.

5. **Missing product.**
   **Goal:** Predict what happens when a line's product is not in the catalog.
   **Check:** 404 at line 61. No totals are computed.

6. **Lifecycle.**
   **Goal:** Compare `DRAFT → PENDING_APPROVAL` with `CONVERTED_TO_ORDER → APPROVED`.
   **Check:** The first is allowed (line 118). The second throws 409 (line 123).

7. **Rounding.**
   **Goal:** List 10,000, finance threshold 10, unit 8,960. Predict whether finance approval is required.
   **Check:** No. The 10.4% discount rounds to 10, and 10 > 10 is false.

8. **Approver race.**
   **Goal:** A quote needs both FINANCE and LEGAL approval, and both approve at the same moment. Predict the final quote status.
   **Check:** Each `decideQuoteApproval` checks status outside its transaction (`quote-service.ts:362-372`), updates its own approval row (375-382), and re-reads the quote inside its transaction (402). Under READ COMMITTED, each transaction can still see the **other** approval as PENDING, because neither has committed. Both then return early at 410-415, and nobody calls `finalizeApprovedQuote`. The quote is left in `PENDING_APPROVAL` with zero pending approvals. Design a fix: a row lock on the quote, or a single "finalize if none pending" step run after commit.

9. **Admin approval.**
   **Goal:** Can `ORG_ADMIN`, which holds `quote:approve` (`src/lib/auth/permissions.ts:47`), approve a quote?
   **Check:** No. `pendingApprovalForRole` searches for an approval row whose `approverRole` equals the session role (279-281). The plan only ever creates `FINANCE` and `LEGAL` rows (32-52), so an admin always gets 403 at line 371.
