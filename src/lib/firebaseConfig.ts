/**
 * Firebase Web (client) configuration validation.
 *
 * The NEXT_PUBLIC_FIREBASE_* values below are public Firebase *Web App* config
 * that ships in the browser bundle — they are not secrets. Firebase Admin /
 * service-account credentials must NEVER be placed in frontend environment
 * variables; Admin verification lives in the Backend only.
 */
export const REQUIRED_FIREBASE_ENV_KEYS = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
] as const;

type EnvLike = Record<string, string | undefined>;

/** Returns the required Firebase env keys that are missing or blank in `env`. */
export function getMissingFirebaseEnvKeys(env: EnvLike): string[] {
  return REQUIRED_FIREBASE_ENV_KEYS.filter((key) => !env[key]?.trim());
}

/**
 * Throws an actionable, value-free error when required Firebase Web config is
 * missing, so developers get a clear message instead of an opaque
 * `initializeApp()` runtime failure.
 */
export function assertFirebaseEnv(env: EnvLike): void {
  const missing = getMissingFirebaseEnvKeys(env);
  if (missing.length === 0) return;

  throw new Error(
    `Missing required Firebase environment variables: ${missing.join(', ')}. ` +
      'Copy .env.example to .env.local and fill in the Firebase Web App config from the Firebase Console ' +
      '(Project settings → General → Your apps → SDK setup and configuration), ' +
      'then restart the Next.js dev server.',
  );
}
