/**
 * Beneficiary bank account contracts for the Tour Operator's finance workspace.
 *
 * The UC-46 "Request Payout Settlement" model (available balance, settlement months, request
 * and cancel actions, payout history by request) was removed from SRS v11, replaced by the
 * automatic daily settlement run (DAILY-PAYOUT-TRANSFER, UC-71 to UC-74). This file kept only
 * the bank-account contract, which the new model still needs (a Tour Operator must configure a
 * beneficiary account to receive the automatic transfer). The Tour Operator's settlement
 * history under the new model is `src/features/operator/payout-settlements` (separate feature).
 */

export interface BeneficiaryBankAccountDto {
  bankName: string | null;
  accountHolderName: string | null;
  maskedAccountNumber: string | null;
  updatedAtUtc: string | null;
}

/** Only used to submit a bank-account update; the full number never comes back from the server. */
export interface BeneficiaryBankAccountInput {
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
}

export interface PayoutActionResult<T = undefined> {
  success: boolean;
  data?: T;
  message?: string;
  errorCode?: string;
}
