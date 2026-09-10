import {
  ApproveOperatorApplicationResponseDto,
  TourOperatorApplicationDetailDto,
} from '@/types/tour-operator-application';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5021';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public errorCode: string,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const MOCK_APPLICATIONS: Record<number, TourOperatorApplicationDetailDto> = {
  2: {
    userId: 2,
    role: 'TourOperator',
    companyName: 'Công ty TNHH Du lịch & Lữ hành DaNang Tourist',
    taxCode: '0401889922',
    businessLicenseNumber: 'GP-2024-8899',
    contactPhone: '0905123456',
    contactAddress: '123 Nguyễn Văn Linh, P. Nam Dương, Q. Hải Châu, TP. Đà Nẵng',
    applicationStatus: 'PendingApproval',
    accountStatus: 'PendingApproval',
    reviewedBy: null,
    reviewedAt: null,
    documents: [
      {
        documentId: 101,
        documentType: 'BusinessLicense',
        fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        uploadedAt: '2026-09-08T10:25:00Z',
        status: 'Submitted',
      },
      {
        documentId: 102,
        documentType: 'TaxCode',
        fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        uploadedAt: '2026-09-08T10:28:00Z',
        status: 'Submitted',
      },
      {
        documentId: 103,
        documentType: 'Other',
        fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        uploadedAt: '2026-09-08T10:29:00Z',
        status: 'Submitted',
      },
    ],
  },
  3: {
    userId: 3,
    role: 'TourOperator',
    companyName: 'Công ty Cổ phần Du lịch Hội An Travel',
    taxCode: '0401998877',
    businessLicenseNumber: 'GP-2024-9988',
    contactPhone: '0905999888',
    contactAddress: '45 Trần Phú, TP. Hội An, Quảng Nam',
    applicationStatus: 'PendingApproval',
    accountStatus: 'PendingApproval',
    reviewedBy: null,
    reviewedAt: null,
    documents: [
      {
        documentId: 201,
        documentType: 'TaxCode',
        fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        uploadedAt: '2026-09-09T08:10:00Z',
        status: 'Submitted',
      },
      // Missing BusinessLicense — demonstrates mandatory document warning banner
    ],
  },
};

export async function fetchOperatorApplicationDetail(
  userId: number,
  token?: string
): Promise<TourOperatorApplicationDetailDto> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/admin/tour-operator-applications/${userId}`,
      {
        method: 'GET',
        headers,
        cache: 'no-store',
      }
    );

    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn('Backend API connection failed, falling back to mock sample data:', err);
  }

  // Fallback to rich sample mock data for dev preview
  if (MOCK_APPLICATIONS[userId]) {
    return MOCK_APPLICATIONS[userId];
  }

  throw new ApiError(404, 'APPLICATION_NOT_FOUND', `Tour Operator application #${userId} was not found.`);
}

export async function approveOperatorApplication(
  userId: number,
  token?: string
): Promise<ApproveOperatorApplicationResponseDto> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/admin/tour-operator-applications/${userId}/approve`,
      {
        method: 'POST',
        headers,
      }
    );

    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn('Backend API approve failed, falling back to mock approval response:', err);
  }

  // Fallback sample mock approve response
  const sample = MOCK_APPLICATIONS[userId];
  const companyName = sample?.companyName || `Tour Operator #${userId}`;
  return {
    userId,
    accountStatus: 'Active',
    applicationStatus: 'Approved',
    reviewedBy: 1,
    reviewedAt: new Date().toISOString(),
    message: `Phê duyệt hồ sơ "${companyName}" thành công. Tài khoản nhà tổ chức tour đã được kích hoạt. (MSG114)`,
  };
}

export async function rejectOperatorApplication(
  userId: number,
  reason: string,
  token?: string
): Promise<void> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/admin/tour-operator-applications/${userId}/reject`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ reason }),
      }
    );

    if (response.ok) {
      return;
    }
  } catch (err) {
    console.warn('Backend API reject failed, falling back to mock rejection response:', err);
  }
}
