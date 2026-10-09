import type { OperatorDocumentDto } from '@/types/tour-operator-application';

/**
 * Approval requires a Business License document that has not been rejected. The Tax Code is a
 * text field verified via a public registry, so no separate Tax Code upload is required.
 */
export function hasUsableBusinessLicense(documents: readonly OperatorDocumentDto[]): boolean {
  return documents.some((document) => document.documentType === 'BusinessLicense' && document.status !== 'Rejected');
}
