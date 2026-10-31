#!/usr/bin/env node
// Moss saatlik işçi araçları: Claude'un zamanlanmış görevi bu komutlarla uygulamanın sırasını okur ve sonuçları yazar.
// Ücretsizdir: yalnızca Firestore (Spark planı) kullanır. Bağımlılık yok (Node 18+).
// Ortam değişkeni: FIREBASE_SERVICE_ACCOUNT = Firebase hizmet hesabı JSON'unun tamamı
//
// Komutlar:
//   node moss.mjs durum                         bağlantıyı dener, sıradaki iş sayısını yazar
//   node moss.mjs liste                         bekleyen işleri tüm bağlamıyla JSON olarak yazar
//   node moss.mjs al <jobId>                    işi "isleniyor" yapar (montajsa projeyi de)
//   node moss.mjs bitir <jobId> [hata mesajı]   işi bitirir (mesaj verilirse "hata")
//   node moss.mjs mesaj <jobId|-> <metin.txt> [done.json]   asistan sohbetine Claude cevabı yazar
//   node moss.mjs ekle <gallery|tasks> <veri.json>          yeni kayıt(lar) ekler, kimlikleri yazar
//   node moss.mjs guncelle <koleksiyon/kimlik> <veri.json>   alanları günceller
//   node moss.mjs indir <url> <hedef-dosya>     Google Drive / doğrudan linkten indirir
//   node moss.mjs video-yukle <projectId> <video.mp4> [plan.json]   reels'i uygulamaya koyar
//   node moss.mjs aktivite <tür> <metin> [firmId]            bildirim akışına kayıt düşer
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const sa = (() => { try { return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || ''); } catch (e) { return null; } })();
const PROJECT = (sa && sa.project_id) || process.env.FIREBASE_PROJECT_ID || 'moss-ajans';
const BASE = process.env.MOSS_FAKE_BASE || ('https://firestore.googleapis.com/v1/projects/' + PROJECT + '/databases/(default)/documents');
const WHO = { by: 'claude', byName: 'Claude' };
const die = (m) => { console.error('HATA: ' + m); process.exit(1); };

let tok = null;
async function token() {
  if (process.env.MOSS_FAKE_BASE) return 'test';
  if (!sa) die('FIREBASE_SERVICE_ACCOUNT ortam değişkeni yok ya da geçersiz.');
  if (tok && tok.exp > Date.now() + 60000) return tok.v;
  const now = Math.floor(Date.now() / 1000);
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const unsigned = b64({ alg: 'RS256', typ: 'JWT' }) + '.' + b64({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/datastore', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 });
  const sig = crypto.createSign('RSA-SHA256').update(unsigned).sign(sa.private_key).toString('base64url');
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: 'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=' + unsigned + '.' + sig });
  const j = await r.json();
  if (!j.access_token) die('Google erişim belirteci alınamadı: ' + JSON.stringify(j));
  tok = { v: j.access_token, exp: Date.now() + (j.expires_in || 3600) * 1000 };
  return tok.v;
}
async function api(method, url, body) {
  const r = await fetch(url, { method, headers: { 'content-type': 'application/json', authorization: 'Bearer ' + (await token()) }, body: body ? JSON.stringify(body) : undefined });
  if (r.status === 404) return null;
  const j = await r.json().catch(() => ({}));
  if (!r.ok) die(method + ' ' + url.replace(BASE, '') + ' → ' + r.status + ' ' + JSON.stringify(j.error || j));
  return j;
}

const dec = (v) => {
  if (!v) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('timestampValue' in v) return v.timestampValue;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(dec);
  if ('mapValue' in v) return Object.fromEntries(Object.entries(v.mapValue.fields || {}).map(([k, x]) => [k, dec(x)]));
  return null;
};
const enc = (v) => {
  if (v === null || v === undefined) return { nullValue: null };
  if (v === '__NOW__') return { timestampValue: new Date().toISOString() };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(enc) } };
  if (typeof v === 'object') return { mapValue: { fields: Object.fromEntries(Object.entries(v).map(([k, x]) => [k, enc(x)])) } };
  return { stringValue: String(v) };
};
const docOut = (d) => ({ id: d.name.split('/').pop(), ...Object.fromEntries(Object.entries(d.fields || {}).map(([k, v]) => [k, dec(v)])) });
const fields = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, enc(v)]));

async function list(col) {
  const out = []; let page = '';
  do {
    const j = await api('GET', BASE + '/' + col + '?pageSize=300' + (page ? '&pageToken=' + page : ''));
    ((j && j.documents) || []).forEach((d) => out.push(docOut(d)));
    page = (j && j.nextPageToken) || '';
  } while (page);
  return out;
}
const get = async (p) => { const d = await api('GET', BASE + '/' + p); return d ? docOut(d) : null; };
const add = async (col, data) => docOut(await api('POST', BASE + '/' + col, { fields: fields({ at: '__NOW__', ...data }) })).id;
const patch = (p, data) => api('PATCH', BASE + '/' + p + '?' + Object.keys(data).map((k) => 'updateMask.fieldPaths=' + encodeURIComponent('`' + k + '`')).join('&'), { fields: fields(data) });
const del = (p) => api('DELETE', BASE + '/' + p);
async function where(col, field, value) {
  const j = await api('POST', BASE + ':runQuery', { structuredQuery: { from: [{ collectionId: col }], where: { fieldFilter: { field: { fieldPath: field }, op: 'EQUAL', value: enc(value) } } } });
  return (j || []).filter((x) => x.document).map((x) => docOut(x.document));
}
const readJson = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));

function driveDirect(u) {
  const m = u.match(/\/file\/d\/([\w-]+)/) || u.match(/[?&]id=([\w-]+)/);
  if (/drive\.google\.com|docs\.google\.com/.test(u) && m) return 'https://drive.usercontent.google.com/download?id=' + m[1] + '&export=download&confirm=t';
  if (/dropbox\.com/.test(u)) return u.replace(/[?&]dl=0/, '').replace(/(\?|$)/, (x) => (x === '?' ? '?dl=1&' : '?dl=1'));
  return u;
}

const [, , cmd, ...args] = process.argv;
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul' }).format(new Date());

if (cmd === 'durum') {
  const jobs = await list('jobs');
  console.log(JSON.stringify({ baglanti: 'tamam', proje: PROJECT, bekleyen: jobs.filter((j) => j.status === 'bekliyor').length, islenen: jobs.filter((j) => j.status === 'isleniyor').length }));
} else if (cmd === 'liste') {
  const [jobs, firms, tasks, chat] = await Promise.all([list('jobs'), list('firms'), list('tasks'), list('chat')]);
  const pending = jobs.filter((j) => j.status === 'bekliyor' || (j.status === 'isleniyor' && Date.now() - Date.parse(j.startedAt || 0) > 2 * 3600e3)).sort((a, b) => String(a.at).localeCompare(String(b.at)));
  const out = [];
  for (const j of pending) {
    const x = { ...j };
    if (j.projectId) x.project = await get('projects/' + j.projectId);
    if (j.galleryId) x.galleryItem = await get('gallery/' + j.galleryId);
    out.push(x);
  }
  const recentChat = chat.sort((a, b) => String(a.at).localeCompare(String(b.at))).slice(-20).map((m) => ({ role: m.role, byName: m.byName, text: m.text, jobId: m.jobId || '' }));
  console.log(JSON.stringify({
    bugun: today,
    isler: out,
    firmalar: firms.map((f) => ({ id: f.id, name: f.name, sector: f.sector, active: f.active !== false, instagram: f.instagram || '', package: f.package || {}, notes: (f.notes || '').slice(0, 300) })),
    yaklasanIsler: tasks.filter((t) => !t.done && t.date >= today).sort((a, b) => String(a.date).localeCompare(String(b.date))).slice(0, 40).map((t) => ({ firmId: t.firmId, title: t.title, type: t.type, date: t.date, time: t.time || '' })),
    sonSohbet: recentChat
  }, null, 2));
} else if (cmd === 'al') {
  const j = await get('jobs/' + args[0]); if (!j) die('İş yok: ' + args[0]);
  await patch('jobs/' + args[0], { status: 'isleniyor', startedAt: new Date().toISOString() });
  if (j.projectId) await patch('projects/' + j.projectId, { status: 'isleniyor' });
  console.log('tamam');
} else if (cmd === 'bitir') {
  const j = await get('jobs/' + args[0]); if (!j) die('İş yok: ' + args[0]);
  const err = args.slice(1).join(' ');
  await patch('jobs/' + args[0], { status: err ? 'hata' : 'tamam', error: err, doneAt: new Date().toISOString() });
  if (j.projectId && err) await patch('projects/' + j.projectId, { status: 'hata', workerNote: err });
  if (j.galleryId && err) await patch('gallery/' + j.galleryId, { imageStatus: 'hata', imageError: err });
  console.log('tamam');
} else if (cmd === 'mesaj') {
  const text = fs.readFileSync(args[1], 'utf8').trim();
  const done = args[2] ? readJson(args[2]) : [];
  const id = await add('chat', { role: 'assistant', via: 'claude', text, jobId: args[0] === '-' ? '' : args[0], done, ...WHO });
  console.log(id);
} else if (cmd === 'ekle') {
  const col = args[0]; if (!['gallery', 'tasks'].includes(col)) die('Yalnızca gallery ya da tasks.');
  const data = readJson(args[1]);
  const ids = [];
  for (const d of Array.isArray(data) ? data : [data]) {
    const base = col === 'gallery' ? { status: 'taslak', source: 'claude', caption: '', tags: '', date: '', time: '' } : { done: false, commentCount: 0, revisions: 0, assignees: [], approval: true, location: '', deliver: '', note: '', createdAt: '__NOW__', updatedAt: '__NOW__', createdBy: 'claude' };
    const id = await add(col, { ...base, ...d, ...WHO });
    ids.push(id);
    await add('activity', { kind: col === 'gallery' ? 'gallery' : 'task', text: (col === 'gallery' ? 'Claude galeriye ekledi: ' : 'Claude takvime ekledi: ') + (d.title || ''), firmId: d.firmId || '', [col === 'gallery' ? 'galleryId' : 'taskId']: id, ...WHO });
  }
  console.log(JSON.stringify(ids));
} else if (cmd === 'guncelle') {
  await patch(args[0], readJson(args[1]));
  console.log('tamam');
} else if (cmd === 'indir') {
  const url = driveDirect(args[0]);
  const r = await fetch(url, { redirect: 'follow' });
  const type = r.headers.get('content-type') || '';
  if (!r.ok || type.includes('text/html')) die('İndirilemedi (' + r.status + ', ' + type + '). Link herkese açık mı? Drive’da "Bağlantıya sahip olan herkes" seçili olmalı.');
  fs.mkdirSync(path.dirname(path.resolve(args[1])), { recursive: true });
  await pipeline(Readable.fromWeb(r.body), fs.createWriteStream(args[1]));
  console.log(JSON.stringify({ dosya: args[1], boyut: fs.statSync(args[1]).size, tur: type }));
} else if (cmd === 'video-yukle') {
  const [pid, file, planFile] = args;
  const p = await get('projects/' + pid); if (!p) die('Proje yok: ' + pid);
  const buf = fs.readFileSync(file);
  if (buf.length > 60 * 1048576) die('Video çok büyük (' + (buf.length / 1048576).toFixed(1) + ' MB). 40 MB altına sıkıştır (ör. crf 26, 1080x1920).');
  for (const old of await where('videoParcalar', 'projectId', pid)) await del('videoParcalar/' + old.id);
  const CH = 700000; // base64 ile ~933 KB, Firestore'un 1 MiB belge sınırının altında
  let i = 0;
  for (let o = 0; o < buf.length; o += CH, i++) {
    await api('PATCH', BASE + '/videoParcalar/' + pid + '_' + String(i).padStart(3, '0'), { fields: fields({ projectId: pid, i, d: buf.subarray(o, o + CH).toString('base64') }) });
  }
  const plan = planFile ? readJson(planFile) : null;
  const meta = { parts: i, size: buf.length, mime: 'video/mp4', at: new Date().toISOString(), duration: plan && plan.duration ? plan.duration : null, note: plan && plan.note ? plan.note : '' };
  await patch('projects/' + pid, { status: 'hazir', video: meta, workerNote: '', ...(plan ? { plan } : {}) });
  await add('activity', { kind: 'edit', text: 'Reels hazır: ' + p.name, firmId: p.firmId || '', projectId: pid, ...WHO });
  console.log(JSON.stringify({ parca: i, boyut: buf.length }));
} else if (cmd === 'aktivite') {
  console.log(await add('activity', { kind: args[0] || 'edit', text: args[1] || '', firmId: args[2] || '', ...WHO }));
} else {
  console.log(fs.readFileSync(new URL(import.meta.url), 'utf8').split('\n').filter((l) => l.startsWith('//')).join('\n'));
}
