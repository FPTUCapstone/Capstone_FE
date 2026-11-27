# Direct refund correction plan

1. Add failing component regressions for TO prefill, Admin evidence links and retained detail after resolving; fix existing operator/detail screens.
2. Add failing authenticated binary proxy tests, implement the case/evidence server route without public storage access. BE query supplies latest transfer in correction/completed states and authorizes file reads.
3. Run focused tests, lint and typecheck; validate read-only live API for existing case/evidence. Do not submit a decision, reset data, push or deploy. UI-only placement checks need no added tests per user preference.
