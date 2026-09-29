# Trace lab

Trace a valid line at the quantity minimum. Product lookup returns a record; rule search sees quantity >= min and <= max; discount calculation returns a percentage; floor equality passes; an evaluated line is produced. Totals then multiply list and submitted cents by quantity.

Trace the same line one cent below floor. Lookup and rule selection succeed, but the floor branch throws 422. No subtotal, routing, or lifecycle code runs. For an unknown product, the first lookup throws 404 and even rule selection is skipped.

Trace routing after successful lines. The second loop finds the same product and selected rule, compares discount to deal and finance thresholds, checks term membership, creates a de-duplicated reason list, and derives booleans. Trace lifecycle separately: `ensureQuoteTransition` indexes the current status and checks the next status array.

| trace point | valid | below floor | unknown |
|---|---|---|---|
| product | found | found | missing |
| rule | possible | possible | skipped |
| price | accepted | 422 | skipped |
| totals | computed | skipped | skipped |

This trace is pure. Transaction and audit boundaries belong to the caller.
