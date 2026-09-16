import { describe, expect, it } from 'vitest';

import {
  REQUIRED_FIREBASE_ENV_KEYS,
  assertFirebaseEnv,
  getMissingFirebaseEnvKeys,
} from './firebaseConfig';

const completeEnv = (): Record<string, string> => ({
  NEXT_PUBLIC_FIREBASE_API_KEY: 'test-api-key',
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'test.firebaseapp.com',
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'test-project',
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'test.appspot.com',
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '1234567890',
  NEXT_PUBLIC_FIREBASE_APP_ID: '1:1234567890:web:abcdef',
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: 'G-TEST000',
});

describe('firebaseConfig validation', () => {
  it('accepts a complete Firebase Web configuration', () => {
    expect(getMissingFirebaseEnvKeys(completeEnv())).toEqual([]);
    expect(() => assertFirebaseEnv(completeEnv())).not.toThrow();
  });

  it('does not require the optional Analytics measurement id', () => {
    const env = completeEnv();
    delete env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID;

    expect(getMissingFirebaseEnvKeys(env)).toEqual([]);
    expect(() => assertFirebaseEnv(env)).not.toThrow();
  });

  it('lists every missing required key in the error message', () => {
    const env = completeEnv();
    delete env.NEXT_PUBLIC_FIREBASE_API_KEY;
    env.NEXT_PUBLIC_FIREBASE_APP_ID = '   ';

    expect(getMissingFirebaseEnvKeys(env)).toEqual([
      'NEXT_PUBLIC_FIREBASE_API_KEY',
      'NEXT_PUBLIC_FIREBASE_APP_ID',
    ]);

    expect(() => assertFirebaseEnv(env)).toThrow(
      /NEXT_PUBLIC_FIREBASE_API_KEY[\s\S]*NEXT_PUBLIC_FIREBASE_APP_ID/,
    );
    expect(() => assertFirebaseEnv(env)).toThrow(/\.env\.local/);
  });

  it('names the missing keys without echoing any configuration values', () => {
    const env = completeEnv();
    delete env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    let message = '';
    try {
      assertFirebaseEnv(env);
    } catch (error) {
      message = (error as Error).message;
    }

    expect(message).toContain('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
    // No provided value (or any other filled value) may leak into the message.
    for (const value of Object.values(env)) {
      expect(message).not.toContain(value);
    }
  });

  it('only validates public Web config keys, never Admin/service-account credentials', () => {
    expect(REQUIRED_FIREBASE_ENV_KEYS.every((key) => key.startsWith('NEXT_PUBLIC_FIREBASE_'))).toBe(
      true,
    );
    expect(REQUIRED_FIREBASE_ENV_KEYS).not.toContain('FIREBASE_SERVICE_ACCOUNT_KEY_JSON');
    expect(REQUIRED_FIREBASE_ENV_KEYS).not.toContain('GOOGLE_APPLICATION_CREDENTIALS');
  });
});
