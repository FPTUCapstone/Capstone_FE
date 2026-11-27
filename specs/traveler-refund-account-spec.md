# Traveler default refund account

User requests a reusable refund recipient account in Account workspace. Add /account/refund-account and menu item Tài khoản nhận hoàn tiền. Traveler enters bank code/name, account number and holder once, then can edit/save. Authenticated GET/PUT /api/v1/traveler/refund-account serves own profile only; no browser storage, credentials, supplied user ID or public caching.

New direct refund cases automatically snapshot the saved default and proceed using existing recipient confirmation logic. Saving the default also confirms recipient details for this Traveler's existing cases still AwaitingRecipient, atomically starting the normal transfer deadline. Existing cases with confirmed recipients or transfers are never changed. No default means current per-case recipient entry remains available; confirming a recipient saves the default for subsequent refunds. Do not silently import old cases or invent bank verification claims. Required/max lengths follow BE existing refund constraints (20/50/200).

Loading, empty first entry, saving, saved confirmation and retry errors are explicit. Do not offer delete/multiple accounts or change historical refund amounts/statuses. Personal bank details are encrypted server-side at rest; only own account page returns full values.
