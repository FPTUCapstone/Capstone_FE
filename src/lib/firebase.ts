import { getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

import { assertFirebaseEnv } from './firebaseConfig';

// In production, enforce strict environment variables check.
// In development, fall back gracefully to allow UI and landing page development
// without crashing when .env.local has not been reloaded or filled.
try {
  assertFirebaseEnv(process.env);
} catch (error) {
  if (process.env.NODE_ENV === 'production') {
    throw error;
  }
  console.warn(
    '[Firebase Dev Warning]: Missing Firebase Web environment variables. ' +
      'Using local dev placeholder config so the UI can render without crashing.',
  );
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyDevPlaceholderKeyForLocalPreview',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'tripmate-82be3.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'tripmate-82be3',
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'tripmate-82be3.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '105500206516',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:105500206516:web:devplaceholder',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-DEVPREVIEW00',
};

const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;

