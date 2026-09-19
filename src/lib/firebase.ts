import { getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

import { assertFirebaseEnv } from './firebaseConfig';

// Next.js/Turbopack only reliably inlines statically analyzable
// process.env.NEXT_PUBLIC_* member references into the browser bundle.
// Passing process.env directly to assertFirebaseEnv can therefore make
// runtime lookups see an empty environment shim in the browser.
const env = {
  NEXT_PUBLIC_FIREBASE_API_KEY:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID:
    process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const firebaseConfig = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

/**
 * Firebase is initialized lazily when an authentication action actually
 * requires it.
 *
 * Client modules can be evaluated while Next.js prerenders pages, so eager
 * Firebase initialization here would make CI/build depend on browser Firebase
 * configuration even for pages that do not use authentication.
 */
export function getFirebaseAuth() {
  assertFirebaseEnv(env);

  const app =
    getApps().length > 0
      ? getApps()[0]
      : initializeApp(firebaseConfig);

  return getAuth(app);
}
