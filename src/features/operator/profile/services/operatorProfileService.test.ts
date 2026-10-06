import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  isOperatorDemoAllowedInCurrentEnv,
  DEMO_OPERATOR_PROFILE,
} from '../data/operatorProfileDemoFixtures';
import {
  getOperatorProfile,
  updateOperatorProfile,
  validateOperatorProfile,
  OperatorProfileValidationError,
} from './operatorProfileService';
import { OPERATOR_PROFILE_MESSAGES } from '../types/operatorProfile';

function setNodeEnv(val?: string) {
  (process.env as Record<string, string | undefined>).NODE_ENV = val;
}

describe('operatorProfileService (UC-34 Specification & Truthfulness)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('isOperatorDemoAllowedInCurrentEnv (UC34-TRUTH-3, UC34-TRUTH-4)', () => {
    it('returns true when non-production AND NEXT_PUBLIC_ENABLE_DEMO_FIXTURES is true', () => {
      setNodeEnv('development');
      process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES = 'true';
      expect(isOperatorDemoAllowedInCurrentEnv()).toBe(true);
    });

    it('returns false in production even if NEXT_PUBLIC_ENABLE_DEMO_FIXTURES is true (UC34-TRUTH-3)', () => {
      setNodeEnv('production');
      process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES = 'true';
      expect(isOperatorDemoAllowedInCurrentEnv()).toBe(false);
    });

    it('returns false when NEXT_PUBLIC_ENABLE_DEMO_FIXTURES is false or unset', () => {
      setNodeEnv('development');
      process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES = 'false';
      expect(isOperatorDemoAllowedInCurrentEnv()).toBe(false);

      delete process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES;
      expect(isOperatorDemoAllowedInCurrentEnv()).toBe(false);
    });
  });

  describe('validateOperatorProfile (UC34-VALID-1, UC34-VALID-2, UC34-VALID-3, UC34-VALID-4)', () => {
    const validPayload = {
      businessName: 'Han River Travel Co., Ltd',
      businessDescription: 'Day tours and travel packages across Central Vietnam.',
      businessAddress: '02 Nguyễn Văn Linh, Đà Nẵng',
      contactPhone: '0236 388 1234',
      contactEmail: 'contact@hanrivertravel.vn',
      website: 'https://hanrivertravel.vn',
    };

    it('returns no errors for valid payload', () => {
      const errors = validateOperatorProfile(validPayload);
      expect(Object.keys(errors)).toHaveLength(0);
    });

    it('SRS_AMBIGUITY_REQUIRED_FIELDS: allows empty businessName without client-enforced MSG01 error', () => {
      const errors = validateOperatorProfile({ ...validPayload, businessName: '' });
      expect(errors.businessName).toBeUndefined();
    });

    it('SRS_AMBIGUITY_REQUIRED_FIELDS: allows empty contactPhone without client-enforced MSG01 error', () => {
      const errors = validateOperatorProfile({ ...validPayload, contactPhone: '' });
      expect(errors.contactPhone).toBeUndefined();
    });

    it('SRS_AMBIGUITY_REQUIRED_FIELDS: allows empty contactEmail without client-enforced MSG01 error', () => {
      const errors = validateOperatorProfile({ ...validPayload, contactEmail: '' });
      expect(errors.contactEmail).toBeUndefined();
    });

    it('SRS_AMBIGUITY_REQUIRED_FIELDS: does not enforce MSG01 on unproven fields when all fields are empty', () => {
      const errors = validateOperatorProfile({
        businessName: '',
        businessDescription: '',
        businessAddress: '',
        contactPhone: '',
        contactEmail: '',
        website: '',
      });
      expect(Object.keys(errors)).toHaveLength(0);
    });

    it('UC34-VALID-2: Rejects invalid contact email format with MSG02 when email is provided', () => {
      const errors = validateOperatorProfile({ ...validPayload, contactEmail: 'not-an-email' });
      expect(errors.contactEmail).toBe(OPERATOR_PROFILE_MESSAGES.INVALID_EMAIL);
      expect(errors.contactEmail).toContain('MSG02');
    });

    it('UC34-VALID-3: Rejects non-image logo file (e.g. PDF) with MSG19', () => {
      const pdfFile = new File(['dummy'], 'doc.pdf', { type: 'application/pdf' });
      const errors = validateOperatorProfile({ ...validPayload, logoFile: pdfFile });
      expect(errors.logo).toBe(OPERATOR_PROFILE_MESSAGES.INVALID_LOGO);
      expect(errors.logo).toContain('MSG19');
    });

    it('UC34-VALID-4: Rejects logo file exceeding 5MB with MSG19 (BR-16)', () => {
      const bigFile = new File(['dummy'], 'logo.jpg', { type: 'image/jpeg' });
      Object.defineProperty(bigFile, 'size', { value: 5 * 1024 * 1024 + 1 });
      const errors = validateOperatorProfile({ ...validPayload, logoFile: bigFile });
      expect(errors.logo).toBe(OPERATOR_PROFILE_MESSAGES.INVALID_LOGO);
      expect(errors.logo).toContain('MSG19');
    });

    it('accepts valid image logo file <= 5MB', () => {
      const okFile = new File(['dummy'], 'logo.png', { type: 'image/png' });
      Object.defineProperty(okFile, 'size', { value: 1024 * 1024 });
      const errors = validateOperatorProfile({ ...validPayload, logoFile: okFile });
      expect(errors.logo).toBeUndefined();
    });

    it('accepts website and phone without invented format restrictions', () => {
      const errors = validateOperatorProfile({
        ...validPayload,
        website: 'my-custom-website-note',
        contactPhone: 'any-phone-format',
      });
      expect(Object.keys(errors)).toHaveLength(0);
    });
  });

  describe('getOperatorProfile (UC34-TRUTH-1, UC34-TRUTH-4, UC34-TRUTH-5)', () => {
    it('returns demo fixture when allowDemo is true in non-production (UC34-TRUTH-4, UC34-TRUTH-5)', async () => {
      setNodeEnv('test');
      process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES = 'true';

      const result = await getOperatorProfile({ allowDemo: true });
      expect(result.status).toBe('SUCCESS');
      expect(result.isDemo).toBe(true);
      expect(result.profile?.businessName).toBe(DEMO_OPERATOR_PROFILE.businessName);
      expect(result.profile?.taxCode).toBe(DEMO_OPERATOR_PROFILE.taxCode);
      expect(result.profile?.businessLicenceNumber).toBe(DEMO_OPERATOR_PROFILE.businessLicenceNumber);
    });

    it('UC34-TRUTH-1: Real mode returns PENDING_BE_INTEGRATION and zero fabricated values without calling speculative endpoints', async () => {
      const result = await getOperatorProfile({
        allowDemo: false,
        accountEmail: 'user.real@tripmate.vn',
      });

      expect(result.status).toBe('PENDING_BE_INTEGRATION');
      expect(result.isDemo).toBe(false);
      expect(result.message).toContain('chờ kết nối dịch vụ máy chủ');
      // No fabricated company name or tax code
      expect(result.profile?.businessName).toBe('');
      expect(result.profile?.taxCode).toBe('');
      expect(result.profile?.businessLicenceNumber).toBe('');
      expect(result.profile?.accountEmail).toBe('user.real@tripmate.vn');
    });
  });

  describe('updateOperatorProfile (UC34-TRUTH-2, UC34-VALID-5)', () => {
    const validPayload = {
      businessName: 'Han River Travel Co., Ltd',
      businessDescription: 'Licensed inbound operator.',
      businessAddress: '02 Nguyễn Văn Linh, Đà Nẵng',
      contactPhone: '0236 388 1234',
      contactEmail: 'contact@hanrivertravel.vn',
      website: 'https://hanrivertravel.vn',
    };

    it('throws OperatorProfileValidationError if payload is invalid (e.g. invalid email format)', async () => {
      await expect(
        updateOperatorProfile({ ...validPayload, contactEmail: 'invalid-email' })
      ).rejects.toThrow(OperatorProfileValidationError);
    });

    it('UC34-TRUTH-2: Real mode does not produce fake MSG121 success and returns PENDING_BE_INTEGRATION', async () => {
      const result = await updateOperatorProfile(validPayload, { allowDemo: false });
      expect(result.status).toBe('PENDING_BE_INTEGRATION');
      expect(result.message).toContain('chờ kết nối dịch vụ máy chủ');
      expect(result.message).not.toContain('MSG121');
    });

    it('simulates local success in demo mode with explicit DEMO indicator', async () => {
      setNodeEnv('test');
      process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES = 'true';

      const result = await updateOperatorProfile(
        { ...validPayload, businessName: 'Cập nhật tên mới' },
        { allowDemo: true }
      );

      expect(result.status).toBe('SUCCESS');
      expect(result.isDemo).toBe(true);
      expect(result.profile?.businessName).toBe('Cập nhật tên mới');
      expect(result.message).toContain('DEMO');
    });
  });
});
