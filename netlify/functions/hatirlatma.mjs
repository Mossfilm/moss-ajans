// Saatlik zamanlanmış görev: telefona hatırlatma bildirimleri gönderir.
// Ortam değişkenleri: FIREBASE_SERVICE_ACCOUNT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY
// Kurallar (İstanbul saati):
//   08:00  sabah özeti, çekim sabahı hazırlık (eksik kontrol listesi), pazartesi haftalık çekim planı
//   09:00  özel güne 21 / 7 gün kala hatırlatma
//   18:00  yarınki işler
//   her saat  “Yaptın mı?”: saati 30+ dk geçmiş, yapılmamış bugünkü işler
//   22:00–08:00 arası bildirim gönderilmez
import webpush from 'web-push';
import { adminReady, list, set, remove, istanbulNow } from './lib/admin.mjs';
import { specialDays } from '../../src/data.js';

export const config = { schedule: '5 * * * *' };

const TYPE = { cekim: 'Çekim', gonderi: 'Gönderi', reels: 'Reels', hikaye: 'Hikâye', kurgu: 'Kurgu', tasarim: 'Tasarım', reklam: 'Reklam', toplanti: 'Toplantı', rapor: 'Rapor', diger: 'İş' };
const addDays = (ymd, n) => { const [y, m, d] = ymd.split('-').map(Number); const x = new Date(Date.UTC(y, m - 1, d + n)); return x.toISOString().slice(0, 10); };
const forUser = (t, uid) => { const a = t.assignees || []; return !a.length || a.includes('all') || a.includes(uid); };

export function plan({ now, subs, tasks, firms, sent }) {
  const out = [];
  const fname = (id) => (firms.find((f) => f.id === id) || {}).name || '';
  const push = (sub, key, title, body, url) => { if (!sent.has(key + '-' + sub.id)) out.push({ sub, key: key + '-' + sub.id, title, body, url }); };
  if (now.hour >= 22 || now.hour < 8) return out;
  const today = tasks.filter((t) => t.date === now.ymd);
  const tomorrow = tasks.filter((t) => t.date === addDays(now.ymd, 1) && !t.done);

  subs.forEach((s) => {
    const p = { morning: true, dayBefore: true, check: true, shootDay: true, weekly: true, special: true, ...(s.prefs || {}) };
    const mine = today.filter((t) => forUser(t, s.id) && !t.done).sort((a, b) => ((a.time || '99') < (b.time || '99') ? -1 : 1));

    if (now.hour === 8 && p.morning && mine.length) {
      push(s, 'sabah-' + now.ymd, 'Bugün ' + mine.length + ' iş var', mine.slice(0, 4).map((t) => (t.time ? t.time + ' ' : '') + fname(t.firmId) + ' · ' + t.title).join('\n'), '/');
    }
    if (now.hour === 8 && p.shootDay) {
      mine.filter((t) => t.type === 'cekim').forEach((t) => {
        const missing = (t.checklist || []).filter((c) => !c.done).map((c) => c.label);
        push(s, 'cekim-' + t.id, 'Bugün çekim günü: ' + fname(t.firmId), (t.time ? t.time + ' · ' : '') + t.title + (missing.length ? '\nListede ' + missing.length + ' eksik: ' + missing.slice(0, 3).join(', ') : '\nÇekim listesi hazır.'), '/is/' + t.id);
      });
    }
    if (now.hour === 8 && p.weekly && now.weekday === 'Mon') {
      push(s, 'hafta-' + now.ymd, 'Bu haftanın çekim planı hazır', 'İçerik stoğu ve özel günlere göre önerilere bak.', '/cekim-plani');
    }
    if (now.hour === 9 && p.special) {
      const year = Number(now.ymd.slice(0, 4));
      specialDays(year).concat(specialDays(year + 1)).forEach((d) => {
        [21, 7].forEach((n) => {
          if (d.date === addDays(now.ymd, n)) push(s, 'ozel-' + d.date + '-' + n, d.name + '’ne ' + n + ' gün var', (d.who ? d.who + ' için ' : '') + 'tasarım ve video hazırlığına başlama zamanı.', '/takvim?date=' + d.date);
        });
      });
    }
    if (now.hour === 18 && p.dayBefore) {
      const t2 = tomorrow.filter((t) => forUser(t, s.id));
      if (t2.length) push(s, 'yarin-' + now.ymd, 'Yarın ' + t2.length + ' iş var', t2.slice(0, 4).map((t) => (t.time ? t.time + ' ' : '') + fname(t.firmId) + ' · ' + (TYPE[t.type] || 'İş')).join('\n'), '/');
    }
    if (p.check) {
      const nowMin = now.hour * 60 + now.minute;
      mine.filter((t) => t.time && t.type !== 'toplanti').forEach((t) => {
        const [h, m] = t.time.split(':').map(Number);
        const due = h * 60 + m;
        if (nowMin - due >= 30 && nowMin - due <= 4 * 60) push(s, 'kontrol-' + t.id, 'Yaptın mı? ' + fname(t.firmId), t.time + ' · ' + t.title + ' tamamlandıysa uygulamada işaretle.', '/is/' + t.id);
      });
    }
  });
  return out;
}

export default async () => {
  if (!adminReady() || !process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return new Response('not configured');
  webpush.setVapidDetails('mailto:hello@mossfilmagency.com', process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
  const now = istanbulNow();
  const [subs, tasks, firms, log] = await Promise.all([list('pushSubs'), list('tasks'), list('firms'), list('pushLog')]);
  const sent = new Set(log.map((l) => l.id));
  const jobs = plan({ now, subs: subs.filter((s) => s.sub && s.sub.endpoint), tasks, firms, sent });
  for (const j of jobs) {
    try {
      await webpush.sendNotification(j.sub.sub, JSON.stringify({ title: j.title, body: j.body, url: j.url }), { TTL: 3600 });
      await set('pushLog/' + j.key, { at: new Date(), uid: j.sub.id });
    } catch (e) {
      if (e.statusCode === 404 || e.statusCode === 410) await remove('pushSubs/' + j.sub.id);
    }
  }
  // 14 günden eski kayıtları temizle
  const old = Date.now() - 14 * 86400000;
  await Promise.all(log.filter((l) => l.at && l.at < old).map((l) => remove('pushLog/' + l.id)));
  return new Response('sent ' + jobs.length);
};
