# Direct refund correction UX

User-requested fixes: restore the latest reported transfer details when TO resubmits after Admin review; keep editable amount/reference/local transfer time and require uploaded evidence as before. Do not submit a report automatically or change refund amounts/status rules.

Admin may open or download case-bound private PDF/JPG/PNG evidence through an authenticated server route. Staff and unauthenticated callers cannot use the Admin route; never expose storage keys or public URLs. Missing files return an actionable error.

After a decision, show a success banner and reload the case, retaining recipient, latest transfer, evidence, decision and navigation. Completed cases show completed status rather than an active dispute. Existing resolution rules and audit behavior remain unchanged.
