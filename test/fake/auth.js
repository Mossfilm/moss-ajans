// Sahte Firebase Auth (yalnızca test)
const users = new Map();
let current = null;
const subs = new Set();
const emit = () => subs.forEach((cb) => cb(current));
const mkUser = (email) => ({ uid: 'u_' + email.replace(/\W/g, ''), email, getIdToken: async () => 'fake-token-' + email });
const err = (code) => { const e = new Error(code); e.code = code; return e; };

export const getAuth = () => ({ get currentUser() { return current; } });
export const connectAuthEmulator = () => {};
export function onAuthStateChanged(_a, cb) { subs.add(cb); setTimeout(() => cb(current), 0); return () => subs.delete(cb); }
export async function createUserWithEmailAndPassword(_a, email, pass) {
  if (users.has(email)) throw err('auth/email-already-in-use');
  if (pass.length < 6) throw err('auth/weak-password');
  users.set(email, pass); current = mkUser(email); emit(); return { user: current };
}
export async function signInWithEmailAndPassword(_a, email, pass) {
  if (!users.has(email) || users.get(email) !== pass) throw err('auth/invalid-credential');
  current = mkUser(email); emit(); return { user: current };
}
export async function signOut() { current = null; emit(); }
export async function sendPasswordResetEmail(_a, email) { if (!email.includes('@')) throw err('auth/invalid-email'); }
