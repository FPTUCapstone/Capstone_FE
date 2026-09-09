export type OperatorDocumentType = 'BusinessLicense' | 'TaxCode' | 'Other';

export type DocumentStatus = 'Submitted' | 'Approved' | 'Rejected';

export type OperatorApprovalStatus = 'PendingApproval' | 'Approved' | 'Rejected';

export interface OperatorDocumentDto {
  documentId: number;
  documentType: OperatorDocumentType;
  fileUrl: string;
  status: DocumentStatus;
  uploadedAt: string;
}

export interface TourOperatorApplicationDetailDto {
  userId: number;
  role: string;
  accountStatus: string;
  applicationStatus: OperatorApprovalStatus;
  companyName: string;
  taxCode: string;
  businessLicenseNumber: string;
  contactPhone?: string;
  contactAddress?: string;
  documents: OperatorDocumentDto[];
  reviewedBy?: number | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
}

export interface ApproveOperatorApplicationResponseDto {
  userId: number;
  accountStatus: string;
  applicationStatus: string;
  reviewedBy: number;
  reviewedAt: string;
  message: string;
}

export interface RejectOperatorApplicationRequest {
  reason: string;
}
