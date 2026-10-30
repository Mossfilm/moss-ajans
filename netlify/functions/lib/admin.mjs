// Zamanlanmış görevler için Firestore erişimi (servis hesabıyla, kullanıcı oturumu olmadan).
// Ortam değişkeni: FIREBASE_SERVICE_ACCOUNT = Firebase konsolu → Proje ayarları → Hizmet hesapları → "Yeni özel anahtar oluştur" ile inen JSON'un tamamı.
import crypto from 'node:crypto';

let cached = null;
function account() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (e) { return null; }
}
export const adminReady = () => Boolean(account());

async function token() {
  if (cached && cached.exp > Date.now() + 60000) return cached.token;
  const sa = account();
  const now = Math.floor(Date.now() / 1000);
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const unsigned = b64({ alg: 'RS256', typ: 'JWT' }) + '.' + b64({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/datastore', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 });
  const sig = crypto.createSign('RSA-SHA256').update(unsigned).sign(sa.private_key).toString('base64url');
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=' + unsigned + '.' + sig
  });
  const j = await r.json();
  if (!j.access_token) throw new Error('Google token alınamadı');
  cached = { token: j.access_token, exp: Date.now() + (j.expires_in || 3600) * 1000 };
  return cached.token;
}

const base = () => 'https://firestore.googleapis.com/v1/projects/' + (account().project_id || process.env.FIREBASE_PROJECT_ID || 'moss-ajans') + '/databases/(default)/documents';

export function decode(v) {
  if (!v) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('nullValue' in v) return null;
  if ('timestampValue' in v) return Date.parse(v.timestampValue);
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(decode);
  if ('mapValue' in v) return Object.fromEntries(Object.entries(v.mapValue.fields || {}).map(([k, x]) => [k, decode(x)]));
  return null;
}
function encode(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(encode) } };
  if (v instanceof Date) return { timestampValue: v.toISOString() };
  if (typeof v === 'object') return { mapValue: { fields: Object.fromEntries(Object.entries(v).map(([k, x]) => [k, encode(x)])) } };
  return { stringValue: String(v) };
}

export async function list(collection) {
  const out = [];
  let page = '';
  do {
    const r = await fetch(base() + '/' + collection + '?pageSize=300' + (page ? '&pageToken=' + page : ''), { headers: { authorization: 'Bearer ' + (await token()) } });
    const j = await r.json();
    (j.documents || []).forEach((d) => out.push({ id: d.name.split('/').pop(), ...Object.fromEntries(Object.entries(d.fields || {}).map(([k, v]) => [k, decode(v)])) }));
    page = j.nextPageToken || '';
  } while (page);
  return out;
}

export async function get(path) {
  const r = await fetch(base() + '/' + path, { headers: { authorization: 'Bearer ' + (await token()) } });
  if (r.status === 404) return null;
  const d = await r.json();
  return Object.fromEntries(Object.entries(d.fields || {}).map(([k, v]) => [k, decode(v)]));
}

export async function set(path, data) {
  const r = await fetch(base() + '/' + path, {
    method: 'PATCH', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + (await token()) },
    body: JSON.stringify({ fields: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, encode(v)])) })
  });
  return r.ok;
}

export async function remove(path) {
  await fetch(base() + '/' + path, { method: 'DELETE', headers: { authorization: 'Bearer ' + (await token()) } });
}

// İstanbul saatine göre bugün ve saat
export function istanbulNow() {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Istanbul', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', weekday: 'short', hour12: false })
    .formatToParts(new Date()).map((p) => [p.type, p.value]));
  return { ymd: parts.year + '-' + parts.month + '-' + parts.day, hour: Number(parts.hour) % 24, minute: Number(parts.minute), weekday: parts.weekday };
}
