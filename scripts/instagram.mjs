// Günlük zamanlanmış görev (GitHub Actions): firmaların Instagram takipçi ve son paylaşım sayılarını Meta'dan çeker.
// Meta "Business Discovery": yalnızca işletme / içerik üreticisi hesaplarının herkese açık sayıları gelir.
// Ortam değişkenleri: FIREBASE_SERVICE_ACCOUNT, META_ACCESS_TOKEN (uzun ömürlü), META_IG_USER_ID (Moss'un IG işletme hesabı kimliği)
// İsteğe bağlı: META_GRAPH_VERSION (varsayılan v23.0)
import { adminReady, list, get, set, istanbulNow } from './lib/admin.mjs';


const V = process.env.META_GRAPH_VERSION || 'v23.0';
export const usernameOf = (url) => {
  const m = String(url || '').match(/instagram\.com\/([A-Za-z0-9._]+)/);
  return m ? m[1].toLowerCase() : '';
};

async function discover(username) {
  const fields = 'business_discovery.username(' + username + '){username,followers_count,media_count,media.limit(6){id,caption,media_type,timestamp,permalink,like_count,comments_count,view_count}}';
  const url = 'https://graph.facebook.com/' + V + '/' + process.env.META_IG_USER_ID + '?fields=' + encodeURIComponent(fields) + '&access_token=' + encodeURIComponent(process.env.META_ACCESS_TOKEN);
  const r = await fetch(url);
  const j = await r.json();
  if (!r.ok || !j.business_discovery) throw new Error((j.error && j.error.message) || 'Meta hatası ' + r.status);
  return j.business_discovery;
}

async function main() {
  if (!adminReady() || !process.env.META_ACCESS_TOKEN || !process.env.META_IG_USER_ID) { console.log('Meta bağlantısı ayarlı değil, atlandı.'); return; }
  const today = istanbulNow().ymd;
  const firms = (await list('firms')).filter((f) => f.active !== false && usernameOf(f.instagram));
  let ok = 0;
  for (const f of firms) {
    const prev = (await get('insta/' + f.id)) || {};
    try {
      const d = await discover(usernameOf(f.instagram));
      const history = (prev.history || []).filter((h) => h.d !== today).concat({ d: today, f: d.followers_count || 0 }).slice(-120);
      const recent = ((d.media && d.media.data) || []).map((m) => ({
        id: m.id, type: m.media_type, at: m.timestamp, url: m.permalink, caption: (m.caption || '').slice(0, 120),
        likes: m.like_count ?? null, comments: m.comments_count ?? null, views: m.view_count ?? null
      }));
      await set('insta/' + f.id, { username: d.username, followers: d.followers_count || 0, mediaCount: d.media_count || 0, recent, history, updated: today, error: '' });
      ok += 1;
    } catch (e) {
      await set('insta/' + f.id, { ...prev, error: String(e.message || e).slice(0, 200), errorAt: today });
    }
  }
  console.log('Güncellenen firma: ' + ok + '/' + firms.length);
}

if (process.argv[1] && process.argv[1].endsWith('instagram.mjs')) main().catch((e) => { console.error(e); process.exit(1); });
