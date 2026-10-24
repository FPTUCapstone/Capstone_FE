import { createHmac } from 'node:crypto';
import { NextResponse } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { fetchBackendMock } = vi.hoisted(() => ({ fetchBackendMock: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/server/backend', () => ({ fetchBackend: fetchBackendMock }));

import { signInAdmin } from '@/features/admin/auth/sessionHandlers';
import {
  ADMIN_ACCESS_TOKEN_COOKIE,
  ADMIN_SESSION_SEAL_COOKIE,
  ADMIN_SESSION_SECRET_ENV,
  clearAdminSession,
  computeAdminTokenFingerprint,
  createAdminSessionSeal,
  parseAdminRoleFromToken,
  setAdminSession,
  verifyAdminSession,
  verifyAdminSessionFromCookies,
} from './adminSession';

const VALID_SECRET_BUFFER = Buffer.from('0123456789abcdef0123456789abcdef', 'utf8');
const VALID_SECRET = VALID_SECRET_BUFFER.toString('base64url');
const WRONG_SECRET = Buffer.from('fedcba9876543210fedcba9876543210', 'utf8').toString('base64url');

function createUnsignedJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.forged-signature`;
}

describe('BFF-Signed Administration Session Integrity (HMAC-SHA256)', () => {
  const fixedNowMs = Date.parse('2026-10-09T02:00:00.000Z');
  const futureExpDate = new Date(fixedNowMs + 10 * 60 * 1000); // +10 minutes
  let priorSecret: string | undefined;

  beforeEach(() => {
    priorSecret = process.env[ADMIN_SESSION_SECRET_ENV];
    process.env[ADMIN_SESSION_SECRET_ENV] = VALID_SECRET;
  });

  afterEach(() => {
    if (priorSecret === undefined) {
      delete process.env[ADMIN_SESSION_SECRET_ENV];
    } else {
      process.env[ADMIN_SESSION_SECRET_ENV] = priorSecret;
    }
  });

  it('accepts a canonical base64url encoding of 32 bytes and signs/verifies using the decoded Buffer directly', () => {
    expect(VALID_SECRET).toHaveLength(43);
    expect(Buffer.from(VALID_SECRET, 'base64url').byteLength).toBe(32);

    const token = createUnsignedJwt({
      sub: '7',
      role: 'Administrator',
      exp: Math.floor(futureExpDate.getTime() / 1000),
    });

    const sealed = createAdminSessionSeal({
      token,
      role: 'Administrator',
      userId: 7,
      expiresAt: futureExpDate,
      nowMs: fixedNowMs,
    });

    expect(sealed).not.toBeNull();
    const [version, encodedPayload, signature] = sealed!.seal.split('.');
    const expectedHmacFromDecodedBuffer = createHmac('sha256', VALID_SECRET_BUFFER)
      .update(`${version}.${encodedPayload}`, 'utf8')
      .digest('base64url');
    expect(signature).toBe(expectedHmacFromDecodedBuffer);

    const verified = verifyAdminSession({
      token,
      seal: sealed!.seal,
      nowMs: fixedNowMs + 1000,
    });

    expect(verified).toEqual({
      role: 'Administrator',
      userId: 7,
      issuedAtMs: fixedNowMs,
      expiresAtMs: futureExpDate.getTime(),
      tokenFingerprint: computeAdminTokenFingerprint(token),
    });
  });

  it('creates and verifies a valid signed Staff session', () => {
    const token = createUnsignedJwt({
      sub: '15',
      role: 'Staff',
      exp: Math.floor(futureExpDate.getTime() / 1000),
    });

    const sealed = createAdminSessionSeal({
      token,
      role: 'Staff',
      userId: 15,
      expiresAt: futureExpDate,
      nowMs: fixedNowMs,
    });

    expect(sealed).not.toBeNull();
    const verified = verifyAdminSession({
      token,
      seal: sealed!.seal,
      nowMs: fixedNowMs + 5000,
    });

    expect(verified?.role).toBe('Staff');
    expect(verified?.userId).toBe(15);
  });

  it('caps session expiration at issuedAt + 15 minutes even if Backend token expires later', () => {
    const oneHourLater = new Date(fixedNowMs + 60 * 60 * 1000);
    const token = 'backend-issued-token-value';

    const sealed = createAdminSessionSeal({
      token,
      role: 'Administrator',
      userId: 1,
      expiresAt: oneHourLater,
      nowMs: fixedNowMs,
    });

    expect(sealed).not.toBeNull();
    expect(sealed!.expiresAtMs).toBe(fixedNowMs + 15 * 60 * 1000);
  });

  it('fails closed when session cookies are missing', () => {
    expect(verifyAdminSession({ token: null, seal: null, nowMs: fixedNowMs })).toBeNull();
    expect(verifyAdminSession({ token: 'some-token', seal: null, nowMs: fixedNowMs })).toBeNull();
    expect(verifyAdminSession({ token: null, seal: 'some-seal', nowMs: fixedNowMs })).toBeNull();
  });

  it('rejects empty, missing, old placeholder, 32-char raw string, invalid base64url, non-canonical, 31-byte, and 33-byte decoded secrets', () => {
    const token = 'valid-backend-token';
    const validSealed = createAdminSessionSeal({
      token,
      role: 'Administrator',
      expiresAt: futureExpDate,
      nowMs: fixedNowMs,
    })!;
    expect(validSealed).not.toBeNull();

    // 1. Missing secret is rejected
    delete process.env[ADMIN_SESSION_SECRET_ENV];
    expect(
      createAdminSessionSeal({
        token,
        role: 'Administrator',
        expiresAt: futureExpDate,
        nowMs: fixedNowMs,
      }),
    ).toBeNull();
    expect(verifyAdminSession({ token, seal: validSealed.seal, nowMs: fixedNowMs })).toBeNull();

    const decoded31BytesB64Url = Buffer.alloc(31, 0x42).toString('base64url');
    const decoded33BytesB64Url = Buffer.alloc(33, 0x42).toString('base64url');
    const standardBase64WithPadding = `${VALID_SECRET}=`;
    const standardBase64WithPlusSlash = `${VALID_SECRET.slice(0, 40)}+/A`;
    // 43-char string where the final character 'B' (000001) has non-zero unused trailing bits for 32 bytes
    const nonCanonicalTrailingBits = `${'A'.repeat(42)}B`;

    const invalidSecrets = [
      '', // Empty secret
      '   ', // Whitespace-only secret
      'replace-with-at-least-32-bytes-of-cryptographic-random-secret', // Old public placeholder
      '12345678901234567890123456789012', // 32-character raw string (decodes to 24 bytes)
      'a'.repeat(32), // 32-character raw string
      standardBase64WithPadding, // Invalid base64url (padded with '=')
      standardBase64WithPlusSlash, // Invalid base64url ('+' and '/')
      'tripmate-admin-session-hmac-secret-key-2026-minimum-32-bytes!', // Invalid base64url ('!')
      nonCanonicalTrailingBits, // Non-canonical 43-char base64url
      decoded31BytesB64Url, // Decoded 31-byte key (rejected)
      decoded33BytesB64Url, // Decoded 33-byte key (rejected)
    ];

    for (const badSecret of invalidSecrets) {
      process.env[ADMIN_SESSION_SECRET_ENV] = badSecret;
      expect(
        createAdminSessionSeal({
          token,
          role: 'Administrator',
          expiresAt: futureExpDate,
          nowMs: fixedNowMs,
        }),
      ).toBeNull();
      expect(verifyAdminSession({ token, seal: validSealed.seal, nowMs: fixedNowMs })).toBeNull();
    }
  });

  it('causes a fail-closed 503 login response and clears session cookies when no valid key is configured', async () => {
    const loginRequest = () =>
      new Request('https://web.test/api/admin/session', {
        method: 'POST',
        headers: { Origin: 'https://web.test', 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@example.com', password: 'secret' }),
      });

    fetchBackendMock.mockImplementation(async () =>
      Response.json({
        success: true,
        statusCode: 200,
        data: {
          userId: 7,
          role: 'Administrator',
          status: 'Active',
          accessToken: 'backend-access-token',
          accessTokenExpiresAtUtc: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        },
      }),
    );

    for (const invalidConfiguredSecret of [
      undefined,
      '',
      'replace-with-at-least-32-bytes-of-cryptographic-random-secret',
      '12345678901234567890123456789012',
      Buffer.alloc(31, 0x42).toString('base64url'),
      Buffer.alloc(33, 0x42).toString('base64url'),
    ]) {
      if (invalidConfiguredSecret === undefined) {
        delete process.env[ADMIN_SESSION_SECRET_ENV];
      } else {
        process.env[ADMIN_SESSION_SECRET_ENV] = invalidConfiguredSecret;
      }

      const response = await signInAdmin(loginRequest());
      expect(response.status).toBe(503);
      expect(response.cookies.get(ADMIN_ACCESS_TOKEN_COOKIE)?.value).toBe('');
      expect(response.cookies.get(ADMIN_SESSION_SEAL_COOKIE)?.value).toBe('');
    }
  });

  it('rejects an expired BFF session seal', () => {
    const token = 'valid-backend-token';
    const sealed = createAdminSessionSeal({
      token,
      role: 'Administrator',
      expiresAt: futureExpDate,
      nowMs: fixedNowMs,
    });

    expect(
      verifyAdminSession({
        token,
        seal: sealed!.seal,
        nowMs: futureExpDate.getTime(),
      }),
    ).toBeNull();
  });

  it('rejects a session when the underlying Backend JWT exp is expired even if seal exp is in the future', () => {
    const expiredJwt = createUnsignedJwt({
      sub: '7',
      role: 'Administrator',
      exp: Math.floor((fixedNowMs + 60_000) / 1000), // expires in 1 minute
    });
    const payloadJson = JSON.stringify({
      v: 'v1',
      role: 'Administrator',
      uid: 7,
      th: computeAdminTokenFingerprint(expiredJwt),
      iat: fixedNowMs,
      exp: fixedNowMs + 10 * 60 * 1000,
    });
    const encodedPayload = Buffer.from(payloadJson, 'utf8').toString('base64url');
    const sig = createHmac('sha256', VALID_SECRET_BUFFER)
      .update(`v1.${encodedPayload}`)
      .digest('base64url');
    const customSeal = `v1.${encodedPayload}.${sig}`;

    // At +2 minutes, the JWT's own exp (1 min) has passed
    expect(
      verifyAdminSession({
        token: expiredJwt,
        seal: customSeal,
        nowMs: fixedNowMs + 2 * 60 * 1000,
      }),
    ).toBeNull();
  });

  it('rejects a seal when the embedded role is modified (Staff -> Administrator)', () => {
    const token = 'staff-backend-token';
    const sealed = createAdminSessionSeal({
      token,
      role: 'Staff',
      userId: 15,
      expiresAt: futureExpDate,
      nowMs: fixedNowMs,
    })!;

    const [, payloadB64, sigB64] = sealed.seal.split('.');
    const decoded = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as Record<
      string,
      unknown
    >;
    const tamperedPayloadB64 = Buffer.from(
      JSON.stringify({ ...decoded, role: 'Administrator' }),
      'utf8',
    ).toString('base64url');
    const tamperedSeal = `v1.${tamperedPayloadB64}.${sigB64}`;

    expect(verifyAdminSession({ token, seal: tamperedSeal, nowMs: fixedNowMs + 1000 })).toBeNull();
  });

  it('rejects a replayed seal when paired with a different Backend access token', () => {
    const tokenA = 'admin-token-a';
    const tokenB = 'admin-token-b';
    const sealedForA = createAdminSessionSeal({
      token: tokenA,
      role: 'Administrator',
      expiresAt: futureExpDate,
      nowMs: fixedNowMs,
    })!;

    expect(
      verifyAdminSession({
        token: tokenB,
        seal: sealedForA.seal,
        nowMs: fixedNowMs + 1000,
      }),
    ).toBeNull();
  });

  it('rejects a seal when expiration timestamp is modified', () => {
    const token = 'admin-token';
    const sealed = createAdminSessionSeal({
      token,
      role: 'Administrator',
      expiresAt: futureExpDate,
      nowMs: fixedNowMs,
    })!;

    const [, payloadB64, sigB64] = sealed.seal.split('.');
    const decoded = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as Record<
      string,
      unknown
    >;
    const extendedPayloadB64 = Buffer.from(
      JSON.stringify({ ...decoded, exp: futureExpDate.getTime() + 60_000 }),
      'utf8',
    ).toString('base64url');
    const tamperedSeal = `v1.${extendedPayloadB64}.${sigB64}`;

    expect(verifyAdminSession({ token, seal: tamperedSeal, nowMs: fixedNowMs + 1000 })).toBeNull();
  });

  it('rejects a seal signed with a wrong signing key or invalid HMAC', () => {
    const token = 'admin-token';
    const sealedWithWrongKey = createAdminSessionSeal({
      token,
      role: 'Administrator',
      expiresAt: futureExpDate,
      nowMs: fixedNowMs,
      secret: WRONG_SECRET,
    })!;

    expect(
      verifyAdminSession({
        token,
        seal: sealedWithWrongKey.seal,
        nowMs: fixedNowMs + 1000,
        secret: VALID_SECRET,
      }),
    ).toBeNull();

    const [, payloadB64] = sealedWithWrongKey.seal.split('.');
    expect(
      verifyAdminSession({
        token,
        seal: `v1.${payloadB64}.invalid-hmac-signature`,
        nowMs: fixedNowMs + 1000,
      }),
    ).toBeNull();
  });

  it('rejects unsupported session versions and invalid roles even if signed with the secret', () => {
    const token = 'admin-token';
    const basePayload = {
      v: 'v2',
      role: 'Administrator',
      uid: 1,
      th: computeAdminTokenFingerprint(token),
      iat: fixedNowMs,
      exp: futureExpDate.getTime(),
    };
    const v2PayloadB64 = Buffer.from(JSON.stringify(basePayload), 'utf8').toString('base64url');
    const v2Sig = createHmac('sha256', VALID_SECRET_BUFFER)
      .update(`v2.${v2PayloadB64}`)
      .digest('base64url');
    expect(
      verifyAdminSession({
        token,
        seal: `v2.${v2PayloadB64}.${v2Sig}`,
        nowMs: fixedNowMs + 1000,
      }),
    ).toBeNull();

    const badRolePayload = {
      ...basePayload,
      v: 'v1',
      role: 'SuperAdmin',
    };
    const badRoleB64 = Buffer.from(JSON.stringify(badRolePayload), 'utf8').toString('base64url');
    const badRoleSig = createHmac('sha256', VALID_SECRET_BUFFER)
      .update(`v1.${badRoleB64}`)
      .digest('base64url');
    expect(
      verifyAdminSession({
        token,
        seal: `v1.${badRoleB64}.${badRoleSig}`,
        nowMs: fixedNowMs + 1000,
      }),
    ).toBeNull();
  });

  it('rejects legacy hardcoded test tokens, arbitrary opaque strings, and forged unsigned JWTs', () => {
    const forgedAdminJwt = createUnsignedJwt({
      sub: '1',
      role: 'Administrator',
      exp: Math.floor(futureExpDate.getTime() / 1000),
    });

    for (const candidate of [
      'staff-only-token',
      'server-only-token',
      'admin-access-token',
      'test-access-token',
      'arbitrary-opaque-string',
      forgedAdminJwt,
    ]) {
      expect(parseAdminRoleFromToken(candidate)).toBeNull();
      expect(verifyAdminSession({ token: candidate, seal: null, nowMs: fixedNowMs })).toBeNull();
      expect(
        verifyAdminSession({ token: candidate, seal: candidate, nowMs: fixedNowMs }),
      ).toBeNull();
    }
  });

  it('sets both HttpOnly cookies on setAdminSession and clears both on clearAdminSession', () => {
    const response = setAdminSession(
      NextResponse.json({ authenticated: true }),
      'backend-access-token',
      futureExpDate,
      'Staff',
      { userId: 12, nowMs: fixedNowMs },
    );

    const tokenCookie = response.cookies.get(ADMIN_ACCESS_TOKEN_COOKIE);
    const sealCookie = response.cookies.get(ADMIN_SESSION_SEAL_COOKIE);
    expect(tokenCookie?.value).toBe('backend-access-token');
    expect(sealCookie?.value).toMatch(/^v1\./);

    const verified = verifyAdminSessionFromCookies(
      {
        get: (name: string) =>
          name === ADMIN_ACCESS_TOKEN_COOKIE
            ? tokenCookie
            : name === ADMIN_SESSION_SEAL_COOKIE
              ? sealCookie
              : undefined,
      },
      { nowMs: fixedNowMs + 1000 },
    );
    expect(verified?.role).toBe('Staff');
    expect(verified?.userId).toBe(12);

    const cleared = clearAdminSession(NextResponse.json({ ok: true }));
    expect(cleared.cookies.get(ADMIN_ACCESS_TOKEN_COOKIE)?.value).toBe('');
    expect(cleared.cookies.get(ADMIN_SESSION_SEAL_COOKIE)?.value).toBe('');
  });
});
