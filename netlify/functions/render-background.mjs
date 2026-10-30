// Render: kurgu planını Shotstack'e gönderir, bitmesini bekler, MP4 adresini proje kaydına yazar.
// Ortam değişkenleri: SHOTSTACK_API_KEY, FIREBASE_API_KEY, ALLOWED_EMAILS
// İsteğe bağlı: SHOTSTACK_BASE (varsayılan https://api.shotstack.io/stage — filigranlı deneme ortamı;
//                canlı için Shotstack panelindeki üretim adresini yazın), SHOTSTACK_RESOLUTION (varsayılan hd)
import { verify } from './lib/auth.mjs';
import { patchDoc } from './lib/firestore.mjs';

const BASE = process.env.SHOTSTACK_BASE || 'https://api.shotstack.io/stage';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function timeline(plan, files) {
  const byId = Object.fromEntries(files.map((f) => [f.id, f]));
  const media = []; const texts = [];
  let t = 0;
  (plan.clips || []).forEach((c) => {
    const f = byId[c.fileId];
    if (!f || !f.url) return;
    const clip = {
      asset: f.kind === 'image' ? { type: 'image', src: f.url } : { type: 'video', src: f.url, trim: c.trim || 0 },
      start: Number(t.toFixed(2)), length: c.length, fit: 'cover'
    };
    if (c.transition && c.transition !== 'none') clip.transition = { in: c.transition === 'zoom' ? 'zoom' : c.transition };
    if (f.kind === 'image') clip.effect = 'zoomIn';
    media.push(clip);
    if (c.text) texts.push({ asset: { type: 'title', text: c.text, style: 'minimal', size: 'medium', position: 'bottom' }, start: clip.start, length: c.length });
    t += c.length;
  });
  if (plan.endText) {
    texts.push({ asset: { type: 'title', text: plan.endText, style: 'minimal', size: 'large', position: 'center' }, start: Number(t.toFixed(2)), length: 2.5 });
    media.push({ asset: { type: 'html', html: '<div></div>', css: 'div{background:#111;width:100%;height:100%}', width: 1080, height: 1920 }, start: Number(t.toFixed(2)), length: 2.5 });
  }
  const tl = { background: '#000000', tracks: [{ clips: texts }, { clips: media }] };
  const music = plan.musicFileId && byId[plan.musicFileId];
  if (music && music.url) tl.soundtrack = { src: music.url, effect: 'fadeOut' };
  return tl;
}

export default async (req) => {
  let p;
  try { p = await req.json(); } catch (e) { return; }
  const { projectId, idToken, plan, files } = p || {};
  if (!projectId || !idToken || !plan) return;
  if (!(await verify(idToken))) return;
  if (!process.env.SHOTSTACK_API_KEY) { await patchDoc('projects', projectId, idToken, { renderStatus: 'hata', renderError: 'Render servisi bağlı değil (SHOTSTACK_API_KEY)' }); return; }

  try {
    const body = { timeline: timeline(plan, files || []), output: { format: 'mp4', resolution: process.env.SHOTSTACK_RESOLUTION || 'hd', aspectRatio: plan.aspect || '9:16' } };
    const r = await fetch(BASE + '/render', { method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': process.env.SHOTSTACK_API_KEY }, body: JSON.stringify(body) });
    const j = await r.json();
    if (!r.ok || !j.response || !j.response.id) throw new Error((j.message || (j.response && j.response.error)) || 'Render başlatılamadı (' + r.status + ')');
    const id = j.response.id;
    await patchDoc('projects', projectId, idToken, { renderStatus: 'render', renderId: id });
    for (let i = 0; i < 160; i++) {
      await sleep(5000);
      const s = await fetch(BASE + '/render/' + id, { headers: { 'x-api-key': process.env.SHOTSTACK_API_KEY } }).then((x) => x.json());
      const st = s.response && s.response.status;
      if (st === 'done') { await patchDoc('projects', projectId, idToken, { renderStatus: 'hazir', outputUrl: s.response.url, renderError: '' }); return; }
      if (st === 'failed') throw new Error(s.response.error || 'Render başarısız');
    }
    throw new Error('Render çok uzun sürdü');
  } catch (e) {
    await patchDoc('projects', projectId, idToken, { renderStatus: 'hata', renderError: String(e.message || e).slice(0, 300) });
  }
};
