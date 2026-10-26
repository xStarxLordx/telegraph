// Firebase initialisation: the only module that reads the web config and starts the SDK.
// The config is not secret (security rules protect the data), but it lives in `.env.local` so
// each environment can point at its own project. See `.env.example`.
import { getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/** Every environment variable the SDK needs, mapped to the config key it fills. */
const CONFIG_VARIABLES = Object.freeze({
  VITE_FIREBASE_API_KEY: 'apiKey',
  VITE_FIREBASE_AUTH_DOMAIN: 'authDomain',
  VITE_FIREBASE_PROJECT_ID: 'projectId',
  VITE_FIREBASE_STORAGE_BUCKET: 'storageBucket',
  VITE_FIREBASE_MESSAGING_SENDER_ID: 'messagingSenderId',
  VITE_FIREBASE_APP_ID: 'appId',
});

/** Builds the Firebase web config from `env`, or throws naming every missing variable. */
export function readFirebaseConfig(env) {
  const missing = Object.keys(CONFIG_VARIABLES).filter((name) => !env[name]);
  if (missing.length > 0) {
    throw new Error(
      `Missing Firebase environment variables: ${missing.join(', ')}. ` +
        'Copy .env.example to .env.local, fill them in and restart the dev server.',
    );
  }
  return Object.fromEntries(
    Object.entries(CONFIG_VARIABLES).map(([name, key]) => [key, env[name]]),
  );
}

/** Returns the Firebase app, starting it on the first call. */
export default function getFirebaseApp() {
  return getApps()[0] ?? initializeApp(readFirebaseConfig(import.meta.env));
}

/** Firebase Authentication for the app (the SDK returns the same instance on every call). */
export function getFirebaseAuth() {
  return getAuth(getFirebaseApp());
}

/** Cloud Firestore for the app (the SDK returns the same instance on every call). */
export function getFirebaseDb() {
  return getFirestore(getFirebaseApp());
}
