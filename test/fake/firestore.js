// Test için bellekte çalışan sahte Firestore. Uygulamanın kullandığı API alt kümesini taklit eder.
const store = new Map(); // path -> data
const listeners = new Set();
let auto = 0;
const now = () => Date.now();
const SENTINEL = Symbol('sentinel');

class Timestamp { constructor(ms) { this.ms = ms; } toMillis() { return this.ms; } toDate() { return new Date(this.ms); } }

export function initializeFirestore() { return { fake: true }; }
export function getFirestore() { return { fake: true }; }
export const persistentLocalCache = () => ({});
export const persistentMultipleTabManager = () => ({});
export const connectFirestoreEmulator = () => {};
export const serverTimestamp = () => ({ [SENTINEL]: 'ts' });
export const increment = (n) => ({ [SENTINEL]: 'inc', n });

export function collection(_db, ...parts) {
  if (parts[0] && typeof parts[0] === 'object' && parts[0].path) parts = [parts[0].path, ...parts.slice(1)];
  return { type: 'collection', path: parts.join('/') };
}
export function doc(a, ...parts) {
  if (a && a.type === 'collection' && parts.length === 0) return { type: 'doc', path: a.path + '/' + ('auto' + (++auto) + Math.random().toString(36).slice(2, 8)), get id() { return this.path.split('/').pop(); } };
  const base = a && a.type === 'collection' ? [a.path] : [];
  const path = base.concat(parts).join('/');
  return { type: 'doc', path, get id() { return path.split('/').pop(); } };
}
export const query = (c, ...mods) => ({ ...c, mods });
export const orderBy = (field, dir = 'asc') => ({ kind: 'order', field, dir });
export const limit = (n) => ({ kind: 'limit', n });

function resolve(old, patch, merge) {
  const out = merge ? { ...(old || {}) } : {};
  Object.entries(patch).forEach(([k, v]) => {
    let val = v;
    if (v && v[SENTINEL] === 'ts') val = new Timestamp(now());
    else if (v && v[SENTINEL] === 'inc') val = ((old && old[k]) || 0) + v.n;
    if (k.includes('.')) {
      const [h, ...rest] = k.split('.');
      out[h] = resolve(out[h] || {}, { [rest.join('.')]: v }, true);
    } else out[k] = val;
  });
  return out;
}
function parentOf(path) { return path.split('/').slice(0, -1).join('/'); }
function snapDoc(path) {
  const data = store.get(path);
  return { id: path.split('/').pop(), ref: { type: 'doc', path, get id() { return path.split('/').pop(); } }, exists: () => data !== undefined, data: () => (data ? { ...data } : undefined) };
}
function runQuery(q) {
  let docs = [...store.keys()].filter((p) => parentOf(p) === q.path).map(snapDoc);
  (q.mods || []).forEach((m) => {
    if (m.kind === 'order') {
      const val = (d) => { const x = d.data()[m.field]; return x && x.toMillis ? x.toMillis() : x; };
      docs.sort((a, b) => (val(a) < val(b) ? -1 : val(a) > val(b) ? 1 : 0) * (m.dir === 'desc' ? -1 : 1));
    }
  });
  const lim = (q.mods || []).find((m) => m.kind === 'limit');
  if (lim) docs = docs.slice(0, lim.n);
  return { docs, empty: docs.length === 0, size: docs.length, metadata: { fromCache: false } };
}
function notify() {
  queueMicrotask(() => listeners.forEach((l) => l.fire()));
}
function write(path, data, merge) { store.set(path, resolve(store.get(path), data, merge)); }

export async function addDoc(c, data) { const r = doc(c); write(r.path, data, false); notify(); return r; }
export async function setDoc(r, data, opts) { write(r.path, data, opts && opts.merge); notify(); }
export async function updateDoc(r, data) { if (!store.has(r.path)) throw new Error('not-found: ' + r.path); write(r.path, data, true); notify(); }
export async function deleteDoc(r) { store.delete(r.path); notify(); }
export async function getDoc(r) { return snapDoc(r.path); }
export async function getDocs(q) { return runQuery(q); }
export function writeBatch() {
  const ops = [];
  return {
    set: (r, d, o) => ops.push(() => write(r.path, d, o && o.merge)),
    update: (r, d) => ops.push(() => write(r.path, d, true)),
    delete: (r) => ops.push(() => store.delete(r.path)),
    commit: async () => { ops.forEach((f) => f()); notify(); }
  };
}
export async function runTransaction(_db, fn) {
  const tx = { get: async (r) => snapDoc(r.path), set: (r, d) => write(r.path, d, false), update: (r, d) => write(r.path, d, true) };
  const res = await fn(tx); notify(); return res;
}
export function onSnapshot(target, cb, onErr) {
  const l = { fire: () => { try { cb(target.type === 'doc' ? snapDoc(target.path) : runQuery(target)); } catch (e) { if (onErr) onErr(e); else console.error(e); } } };
  listeners.add(l);
  queueMicrotask(l.fire);
  return () => listeners.delete(l);
}

// Testlerden erişim
if (typeof window !== 'undefined') window.__fakeDb = { store, notify, dump: () => Object.fromEntries(store) };
