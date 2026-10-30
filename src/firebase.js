import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { firebaseConfig } from './firebase-config.js';

// Yerel test için: VITE_EMULATOR=1 ile çalıştırılırsa Firebase emülatörlerine bağlanır.
const EMU = import.meta.env.VITE_EMULATOR === '1';
const cfg = EMU ? { apiKey: 'demo-key', authDomain: 'localhost', projectId: 'demo-moss', appId: 'demo' } : firebaseConfig;

export const isConfigured = Boolean(cfg.apiKey && cfg.projectId);

export const app = isConfigured ? initializeApp(cfg) : null;
export const auth = isConfigured ? getAuth(app) : null;
export const db = isConfigured
  ? initializeFirestore(app, EMU ? {} : { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) })
  : null;
export const storage = isConfigured && !EMU ? getStorage(app) : null;
if (EMU) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
}
