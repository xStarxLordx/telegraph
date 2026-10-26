import { deleteApp, getApps } from 'firebase/app';
import { afterEach, describe, expect, it, vi } from 'vitest';
import getFirebaseApp, { getFirebaseAuth, getFirebaseDb, readFirebaseConfig } from './firebaseApp';

const ENV = {
  VITE_FIREBASE_API_KEY: 'key',
  VITE_FIREBASE_AUTH_DOMAIN: 'demo.firebaseapp.com',
  VITE_FIREBASE_PROJECT_ID: 'demo',
  VITE_FIREBASE_STORAGE_BUCKET: 'demo.firebasestorage.app',
  VITE_FIREBASE_MESSAGING_SENDER_ID: '123',
  VITE_FIREBASE_APP_ID: '1:123:web:abc',
};

afterEach(async () => {
  vi.unstubAllEnvs();
  await Promise.all(getApps().map(deleteApp));
});

describe('readFirebaseConfig', () => {
  it('maps every variable to its SDK config key', () => {
    expect(readFirebaseConfig(ENV)).toEqual({
      apiKey: 'key',
      authDomain: 'demo.firebaseapp.com',
      projectId: 'demo',
      storageBucket: 'demo.firebasestorage.app',
      messagingSenderId: '123',
      appId: '1:123:web:abc',
    });
  });

  it('names every missing variable in the error', () => {
    const { VITE_FIREBASE_API_KEY: _key, VITE_FIREBASE_APP_ID: _appId, ...partial } = ENV;
    expect(() => readFirebaseConfig(partial)).toThrow(
      /VITE_FIREBASE_API_KEY, VITE_FIREBASE_APP_ID/,
    );
  });

  it('treats an empty value as missing', () => {
    expect(() => readFirebaseConfig({ ...ENV, VITE_FIREBASE_PROJECT_ID: '' })).toThrow(
      /VITE_FIREBASE_PROJECT_ID/,
    );
  });
});

describe('getFirebaseApp', () => {
  it('starts the app once and reuses it', () => {
    Object.entries(ENV).forEach(([name, value]) => vi.stubEnv(name, value));
    const app = getFirebaseApp();
    expect(app.options.projectId).toBe('demo');
    expect(getFirebaseApp()).toBe(app);
  });

  it('fails with a clear message when the config is missing', () => {
    Object.keys(ENV).forEach((name) => vi.stubEnv(name, ''));
    expect(() => getFirebaseApp()).toThrow(/Missing Firebase environment variables/);
  });
});

describe('Firebase services', () => {
  it('bind Auth and Firestore to the same app, reusing each instance', () => {
    Object.entries(ENV).forEach(([name, value]) => vi.stubEnv(name, value));
    const app = getFirebaseApp();
    expect(getFirebaseAuth().app).toBe(app);
    expect(getFirebaseAuth()).toBe(getFirebaseAuth());
    expect(getFirebaseDb().app).toBe(app);
    expect(getFirebaseDb()).toBe(getFirebaseDb());
  });
});
