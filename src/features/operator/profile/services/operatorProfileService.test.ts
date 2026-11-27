import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthStorage } from '@/features/auth/session/authSession';
import {
  isOperatorDemoAllowedInCurrentEnv,
  DEMO_OPERATOR_PROFILE,
} from '../data/operatorProfileDemoFixtures';
import {
  getOperatorProfile,
  resetDemoOperatorProfile,
  updateOperatorProfile,
  validateOperatorProfile,
  OperatorProfileApiError,
  OperatorProfileValidationError,
} from './operatorProfileService';
import { OPERATOR_PROFILE_MESSAGES, type OperatorProfileDto } from '../types/operatorProfile';

function setNodeEnv(val?: string) {
  (process.env as Record<string, string | undefined>).NODE_ENV = val;
}

const serverProfile: OperatorProfileDto = {
  userId: 12,
  businessName: 'Sun Tours',
  businessDescription: 'Family tours',
  businessAddress: '1 Beach Rd',
  contactPhone: '0901234567',
  contactEmail: 'hello@suntours.vn',
  website: 'https://suntours.vn',
  logoUrl: 'https://res.cloudinary.com/demo/tripmate/operator-logos/12/logo.png',
  businessLicenceNumber: '79-1234/2026/TCDL-GPLHQT',
  taxCode: '0312345678',
  approvalStatus: 'Approved',
  accountEmail: 'owner@suntours.vn',
};

describe('operatorProfileService (UC-34 Real Integration & Validation)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    resetDemoOperatorProfile();
    vi.spyOn(AuthStorage, 'getAccessToken').mockReturnValue('valid-operator-token');
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('isOperatorDemoAllowedInCurrentEnv', () => {
    it('returns true when non-production AND NEXT_PUBLIC_ENABLE_DEMO_FIXTURES is true', () => {
      setNodeEnv('development');
      process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES = 'true';
      expect(isOperatorDemoAllowedInCurrentEnv()).toBe(true);
    });

    it('returns false in production even if NEXT_PUBLIC_ENABLE_DEMO_FIXTURES is true', () => {
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

  describe('validateOperatorProfile', () => {
    const validPayload = {
      businessName: 'Han River Travel Co., Ltd',
      businessDescription: 'Day tours and travel packages across Central Vietnam.',
      businessAddress: '02 Nguyễn Văn Linh, Đà Nẵng',
      contactPhone: '0905388123',
      contactEmail: 'contact@hanrivertravel.vn',
      website: 'https://hanrivertravel.vn',
    };

    it('returns no errors for a valid payload', () => {
      const errors = validateOperatorProfile(validPayload);
      expect(Object.keys(errors)).toHaveLength(0);
    });

    it('allows blank optional fields so operator can clear them', () => {
      const errors = validateOperatorProfile({
        businessName: 'Sun Tours',
        businessDescription: '   ',
        businessAddress: '',
        contactPhone: '  ',
        contactEmail: '',
        website: '  ',
      });
      expect(Object.keys(errors)).toHaveLength(0);
    });

    it('requires businessName (MSG01) and rejects length > 200', () => {
      const emptyErr = validateOperatorProfile({ ...validPayload, businessName: '   ' });
      expect(emptyErr.businessName).toContain('MSG01');

      const longErr = validateOperatorProfile({
        ...validPayload,
        businessName: 'A'.repeat(201),
      });
      expect(longErr.businessName).toBeDefined();
    });

    it('enforces max lengths for businessDescription (2000) and businessAddress (300)', () => {
      const errors = validateOperatorProfile({
        ...validPayload,
        businessDescription: 'D'.repeat(2001),
        businessAddress: 'A'.repeat(301),
      });
      expect(errors.businessDescription).toBeDefined();
      expect(errors.businessAddress).toBeDefined();
    });

    it('validates contactPhone against ^0\\d{9}$ (MSG04) after trimming', () => {
      expect(
        validateOperatorProfile({ ...validPayload, contactPhone: '  0901234567  ' }).contactPhone
      ).toBeUndefined();

      const invalidSpaces = validateOperatorProfile({
        ...validPayload,
        contactPhone: '0236 388 1234',
      });
      expect(invalidSpaces.contactPhone).toContain('MSG04');

      const wrongPrefix = validateOperatorProfile({
        ...validPayload,
        contactPhone: '1901234567',
      });
      expect(wrongPrefix.contactPhone).toContain('MSG04');
    });

    it('validates contactEmail format (MSG02) and max length (200)', () => {
      const bad = validateOperatorProfile({ ...validPayload, contactEmail: 'not-an-email' });
      expect(bad.contactEmail).toBe(OPERATOR_PROFILE_MESSAGES.INVALID_EMAIL);
      expect(bad.contactEmail).toContain('MSG02');

      const tooLong = validateOperatorProfile({
        ...validPayload,
        contactEmail: `${'a'.repeat(190)}@example.com`,
      });
      expect(tooLong.contactEmail).toBeDefined();
    });

    it('validates website as absolute http/https URL <= 300 chars with helpful copy', () => {
      expect(
        validateOperatorProfile({ ...validPayload, website: 'http://example.vn/path' }).website
      ).toBeUndefined();

      const missingScheme = validateOperatorProfile({
        ...validPayload,
        website: 'hanrivertravel.vn',
      });
      expect(missingScheme.website).toMatch(/http:\/\/.*https:\/\//i);

      const ftpScheme = validateOperatorProfile({
        ...validPayload,
        website: 'ftp://hanrivertravel.vn',
      });
      expect(ftpScheme.website).toMatch(/http:\/\/.*https:\/\//i);

      const tooLong = validateOperatorProfile({
        ...validPayload,
        website: `https://example.com/${'a'.repeat(290)}`,
      });
      expect(tooLong.website).toBeDefined();
    });

    it('validates logoFile MIME (jpeg/png/webp) and size (1 byte to 5 MB) with MSG19', () => {
      const pdfFile = new File(['dummy'], 'doc.pdf', { type: 'application/pdf' });
      expect(validateOperatorProfile({ ...validPayload, logoFile: pdfFile }).logo).toContain('MSG19');

      const gifFile = new File(['dummy'], 'anim.gif', { type: 'image/gif' });
      expect(validateOperatorProfile({ ...validPayload, logoFile: gifFile }).logo).toContain('MSG19');

      const emptyFile = new File([], 'empty.png', { type: 'image/png' });
      expect(validateOperatorProfile({ ...validPayload, logoFile: emptyFile }).logo).toContain('MSG19');

      const bigFile = new File(['dummy'], 'logo.jpg', { type: 'image/jpeg' });
      Object.defineProperty(bigFile, 'size', { value: 5 * 1024 * 1024 + 1 });
      expect(validateOperatorProfile({ ...validPayload, logoFile: bigFile }).logo).toContain('MSG19');

      const okWebp = new File(['dummy'], 'logo.webp', { type: 'image/webp' });
      Object.defineProperty(okWebp, 'size', { value: 1024 * 1024 });
      expect(validateOperatorProfile({ ...validPayload, logoFile: okWebp }).logo).toBeUndefined();
    });
  });

  describe('getOperatorProfile', () => {
    it('returns demo fixture in demo mode when allowed', async () => {
      setNodeEnv('test');
      process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES = 'true';

      const result = await getOperatorProfile({ allowDemo: true });
      expect(result.status).toBe('SUCCESS');
      expect(result.isDemo).toBe(true);
      expect(result.profile?.businessName).toBe(DEMO_OPERATOR_PROFILE.businessName);
    });

    it('calls GET /operator/profile with Bearer token in real mode', async () => {
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(serverProfile), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );
      vi.stubGlobal('fetch', fetchMock);

      const result = await getOperatorProfile({ allowDemo: false });
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toMatch(/\/operator\/profile$/);
      expect((init.headers as Record<string, string>).Authorization).toBe(
        'Bearer valid-operator-token'
      );
      expect(result.status).toBe('SUCCESS');
      expect(result.isDemo).toBe(false);
      expect(result.profile?.businessName).toBe('Sun Tours');
      expect(result.profile?.logoUrl).toBe(serverProfile.logoUrl);
    });

    it('throws 401 OperatorProfileApiError (not MSG127) when token is missing or rejected', async () => {
      vi.spyOn(AuthStorage, 'getAccessToken').mockReturnValue(null);

      await expect(getOperatorProfile({ allowDemo: false })).rejects.toMatchObject({
        name: 'OperatorProfileApiError',
        statusCode: 401,
      });

      vi.spyOn(AuthStorage, 'getAccessToken').mockReturnValue('expired-token');
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(new Response(JSON.stringify({}), { status: 401 }))
      );

      await expect(getOperatorProfile({ allowDemo: false })).rejects.toSatisfy(
        (err: unknown) =>
          err instanceof OperatorProfileApiError &&
          err.statusCode === 401 &&
          !err.message.includes('MSG127')
      );
    });

    it('maps 403 operator_tour.access_required to MSG126', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(
          new Response(JSON.stringify({ errorCode: 'operator_tour.access_required' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          })
        )
      );

      await expect(getOperatorProfile({ allowDemo: false })).rejects.toSatisfy(
        (err: unknown) =>
          err instanceof OperatorProfileApiError &&
          err.statusCode === 403 &&
          err.message.includes('MSG126')
      );
    });

    it('maps 503 and network errors to MSG127', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

      await expect(getOperatorProfile({ allowDemo: false })).rejects.toSatisfy(
        (err: unknown) =>
          err instanceof OperatorProfileApiError && err.message.includes('MSG127')
      );
    });
  });

  describe('updateOperatorProfile', () => {
    const validPayload = {
      businessName: '  Sun Tours Updated  ',
      businessDescription: '  Updated description  ',
      businessAddress: '  ',
      contactPhone: ' 0901234567 ',
      contactEmail: ' hello@suntours.vn ',
      website: ' https://suntours.vn ',
    };

    it('sends PUT multipart/form-data with all 6 trimmed text fields and returns updated profile without MSG121', async () => {
      const updated: OperatorProfileDto = {
        ...serverProfile,
        businessName: 'Sun Tours Updated',
        businessDescription: 'Updated description',
        businessAddress: '',
      };
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            code: 'operator_profile.updated',
            message: 'Operator profile updated successfully.',
            profile: updated,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );
      vi.stubGlobal('fetch', fetchMock);

      const result = await updateOperatorProfile(validPayload, { allowDemo: false });

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toMatch(/\/operator\/profile$/);
      expect(init.method).toBe('PUT');
      expect(init.body).toBeInstanceOf(FormData);
      const form = init.body as FormData;
      expect(form.get('businessName')).toBe('Sun Tours Updated');
      expect(form.get('businessDescription')).toBe('Updated description');
      expect(form.get('businessAddress')).toBe('');
      expect(form.get('contactPhone')).toBe('0901234567');
      expect(form.get('contactEmail')).toBe('hello@suntours.vn');
      expect(form.get('website')).toBe('https://suntours.vn');
      expect(form.get('logo')).toBeNull();
      expect(form.get('removeLogo')).toBeNull();

      expect(result.status).toBe('SUCCESS');
      expect(result.profile?.businessName).toBe('Sun Tours Updated');
      expect(result.message).toBeDefined();
      expect(result.message).not.toContain('MSG121');
    });

    it('never sends both logo and removeLogo=true; prefers logo when logoFile is set', async () => {
      const logoFile = new File(['img-bytes'], 'logo.png', { type: 'image/png' });
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ code: 'operator_profile.updated', profile: serverProfile }),
          { status: 200 }
        )
      );
      vi.stubGlobal('fetch', fetchMock);

      await updateOperatorProfile(
        { ...validPayload, logoFile, removeLogo: true },
        { allowDemo: false }
      );

      const form = (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as FormData;
      expect(form.get('logo')).toBeInstanceOf(File);
      expect(form.get('removeLogo')).toBeNull();
    });

    it('sends removeLogo=true and omits logo when removeLogo is true without logoFile', async () => {
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            code: 'operator_profile.updated',
            profile: { ...serverProfile, logoUrl: undefined },
          }),
          { status: 200 }
        )
      );
      vi.stubGlobal('fetch', fetchMock);

      await updateOperatorProfile(
        { ...validPayload, logoFile: null, removeLogo: true },
        { allowDemo: false }
      );

      const form = (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as FormData;
      expect(form.get('logo')).toBeNull();
      expect(form.get('removeLogo')).toBe('true');
    });

    it('falls back to GET /operator/profile if 200 PUT omits profile payload', async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ code: 'operator_profile.updated' }), { status: 200 })
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify(serverProfile), { status: 200 })
        );
      vi.stubGlobal('fetch', fetchMock);

      const result = await updateOperatorProfile(validPayload, { allowDemo: false });
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(result.profile?.businessName).toBe('Sun Tours');
    });

    it('maps 400 ProblemDetails field errors including removeLogo into OperatorProfileValidationError', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(
          new Response(
            JSON.stringify({
              status: 400,
              errorCode: 'operator_profile.request_invalid',
              errors: {
                businessName: ['MSG01'],
                contactPhone: ['MSG04'],
                contactEmail: ['MSG02'],
                website: ['operator_profile.request_invalid'],
                removeLogo: ['operator_profile.request_invalid'],
              },
            }),
            { status: 400, headers: { 'Content-Type': 'application/problem+json' } }
          )
        )
      );

      await expect(updateOperatorProfile(validPayload, { allowDemo: false })).rejects.toSatisfy(
        (err: unknown) =>
          err instanceof OperatorProfileValidationError &&
          Boolean(err.errors.businessName?.includes('MSG01')) &&
          Boolean(err.errors.contactPhone?.includes('MSG04')) &&
          Boolean(err.errors.contactEmail?.includes('MSG02')) &&
          Boolean(err.errors.website?.match(/http:\/\//i)) &&
          Boolean(err.errors.removeLogo)
      );
    });

    it('treats both 413 and 400-without-errors as oversized logo (MSG19)', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 413 })));
      await expect(updateOperatorProfile(validPayload, { allowDemo: false })).rejects.toSatisfy(
        (err: unknown) =>
          err instanceof OperatorProfileValidationError &&
          Boolean(err.errors.logo?.includes('MSG19'))
      );

      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(
          new Response(JSON.stringify({ title: 'Bad Request', status: 400 }), { status: 400 })
        )
      );
      await expect(updateOperatorProfile(validPayload, { allowDemo: false })).rejects.toSatisfy(
        (err: unknown) =>
          err instanceof OperatorProfileValidationError &&
          Boolean(err.errors.logo?.includes('MSG19'))
      );
    });

    it('maps 503 operator_profile.unavailable to MSG127', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(
          new Response(JSON.stringify({ errorCode: 'operator_profile.unavailable' }), {
            status: 503,
          })
        )
      );

      await expect(updateOperatorProfile(validPayload, { allowDemo: false })).rejects.toSatisfy(
        (err: unknown) =>
          err instanceof OperatorProfileApiError &&
          err.statusCode === 503 &&
          err.message.includes('MSG127')
      );
    });

    it('persists demo updates in-memory within the session', async () => {
      setNodeEnv('test');
      process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES = 'true';

      const updated = await updateOperatorProfile(
        { ...validPayload, businessName: 'Demo Updated Name', removeLogo: true },
        { allowDemo: true }
      );
      expect(updated.status).toBe('SUCCESS');
      expect(updated.isDemo).toBe(true);
      expect(updated.profile?.businessName).toBe('Demo Updated Name');
      expect(updated.profile?.logoUrl).toBeUndefined();

      const reloaded = await getOperatorProfile({ allowDemo: true });
      expect(reloaded.profile?.businessName).toBe('Demo Updated Name');
    });
  });
});
