# Staff complaint resolution Web screens

Approved scope: Staff reviews complaints after monetary negotiation is exhausted. Administrator is not granted Staff authority. This screen does not adjudicate bank-transfer disputes (the existing Admin direct-refund screen owns those).

Routes: `/admin/staff/post-trip-complaints` lists review/evidence-request cases and final history with status filter and pagination. `/admin/staff/post-trip-complaints/{id}` shows booking, complaint reason, original private evidence, negotiation and Staff decision history.

Actions are controlled by backend allowedActions. Staff may request evidence from Traveler or Operator, reject, or decide full/partial refund. Reason and contractual basis are mandatory. Partial amounts are positive whole VND within refundableAmount. All writes include rowVersion and one operationId per submission. A binding refund decision requires no further Traveler acceptance. Successful writes refresh detail without replacing the screen. Concurrency failures require refresh before retrying; failures never show success.

Same-origin BFF `/api/staff/post-trip-complaints` uses the signed administration session, accepts Staff only, validates write origin, projects requests, and serves private evidence without public storage URLs. No credentials, provider calls, or new environment settings. Evidence is PDF/JPG/PNG, at most 5 MB. Queue and detail have explicit loading, retry, empty and denied states, semantic controls, right-aligned monetary values, dd/mm/yyyy dates, and responsive layout.

Approved evidence SLA: 72 hours, then return to Staff review without automatic rejection. Detail shows due date and request/result history. Reconsideration is separate append-only history; original decision and refund obligation remain unchanged. UI does not reopen negotiation or create duplicate refunds.

Traveler sees Staff review in the existing booking complaint page and proposal page; Operator sees it inside the complaint detail. Both may submit the requested new evidence or request reconsideration with a reason and genuinely new files after a final Staff decision. BFFs enforce exact signed-in party role, same-origin writes and own-complaint backend authorization. New supplements allow 1–3 PDF/JPG/PNG files, at most 5 MB each; downloads retain compatibility with original UC68 evidence (including WebP and up to 10 MB). No public storage URL is exposed.

Contractual basis is entered by Staff after reviewing the actual agreement; this iteration does not embed signed-contract/itinerary viewing or automate legal verification. Reconsideration adjudication and monetary changes are outside this intake-only scope.

Completed-refund correction: when backend isClosed is true, show a read-only completion notice, preserve review history/private evidence links, and hide all submission/reconsideration controls even if stale allowedActions were present. Backend rejects new writes independently. This applies after actual completion, while pre-completion reconsideration remains as approved.

Approved presentation refinement: show the current outcome and decided amount first; distinguish completed money from an approved refund still in progress. Collapse historical steps by default on closed complaints and group private evidence in a separate collapsible section. Show the 72-hour deadline only for the current outstanding evidence request; past requests must be marked as historical/handled rather than suggesting an action is still due. Preserve all reasons/contract bases in the history, and retain existing submission/closure authorization unchanged.
