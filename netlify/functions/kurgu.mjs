// Montaj planı: kullanıcının anlattığı montajı ve yüklenen ham dosyaları Claude'a verir,
// render servisine gidecek zaman çizelgesini (kurgu planı) geri alır.
// Ortam değişkenleri: ANTHROPIC_API_KEY, FIREBASE_API_KEY, ALLOWED_EMAILS
import { verify } from './lib/auth.mjs';

const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-5-5';

const TOOL = {
  name: 'kurgu_plani',
  description: 'Videonun montaj planını (zaman çizelgesi) kaydeder.',
  input_schema: {
    type: 'object',
    properties: {
      summary: { type: 'string', description: 'Ekibe kısa açıklama: nasıl bir montaj yaptın (Türkçe, 2-4 cümle)' },
      aspect: { type: 'string', enum: ['9:16', '1:1', '4:5', '16:9'] },
      clips: {
        type: 'array', minItems: 1,
        items: {
          type: 'object',
          properties: {
            fileId: { type: 'string', description: 'Kullanılacak dosyanın id değeri (yalnızca video ya da görsel)' },
            trim: { type: 'number', description: 'Kaynak dosyada başlangıç saniyesi (görselde 0)' },
            length: { type: 'number', description: 'Bu parçanın süresi (saniye)' },
            text: { type: 'string', description: 'Bu parçanın üstünde yazacak kısa metin (yoksa boş)' },
            transition: { type: 'string', enum: ['none', 'fade', 'slideLeft', 'zoom'] }
          },
          required: ['fileId', 'trim', 'length']
        }
      },
      musicFileId: { type: 'string', description: 'Arka plan müziği olarak kullanılacak ses dosyasının id değeri (yoksa boş)' },
      endText: { type: 'string', description: 'Kapanışta yazacak metin (ör. firma adı, çağrı)' }
    },
    required: ['summary', 'aspect', 'clips']
  }
};

export default async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  if (!process.env.ANTHROPIC_API_KEY) return Response.json({ error: 'not_configured' }, { status: 503 });
  const email = await verify((req.headers.get('authorization') || '').replace(/^Bearer /, ''));
  if (!email) return Response.json({ error: 'unauthorized' }, { status: 401 });

  let p;
  try { p = await req.json(); } catch (e) { return Response.json({ error: 'bad_request' }, { status: 400 }); }
  const files = (p.files || []).map((f) => ({ id: f.id, name: f.name, kind: f.kind, duration: f.duration || null }));
  if (!files.some((f) => f.kind === 'video' || f.kind === 'image')) return Response.json({ error: 'no_media' }, { status: 400 });

  const system = [
    'Sen Moss Film Agency’nin kurgucususun. Gaziantep’teki firmalar için sosyal medya videoları (genelde 15-45 sn reels) kurguluyorsun.',
    'Kullanıcının anlattığı montajı, elindeki ham dosyalarla kurgu_plani aracını çağırarak planla.',
    'Kurallar: yalnızca listedeki dosyaları kullan; trim + length dosya süresini aşmasın (süre bilinmiyorsa 6 sn’yi geçme);',
    'görseller için trim 0, length 2-4 sn; ilk 2 saniye dikkat çekici olsun; ekran metinleri kısa ve Türkçe olsun; reels için 9:16 seç.',
    p.revisionNote ? 'Bu bir REVİZE. Önceki plan: ' + JSON.stringify(p.previousPlan || {}) + '\nRevize isteği: ' + p.revisionNote + '\nİsteğe göre planı değiştir, beğenilen kısımları koru.' : '',
    'Firma: ' + (p.firmName || '') + ' · Proje: ' + (p.name || '')
  ].filter(Boolean).join('\n');

  const user = 'Montaj tarifi:\n' + (p.brief || '(tarif yok, en iyi reels’i sen kurgula)') + '\n\nHam dosyalar:\n' + JSON.stringify(files);

  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: MODEL, max_tokens: 4096, system, tools: [TOOL], tool_choice: { type: 'tool', name: 'kurgu_plani' }, messages: [{ role: 'user', content: user }] })
  });
  const j = await r.json();
  if (!r.ok) return Response.json({ error: 'api', message: (j.error && j.error.message) || r.status }, { status: 502 });
  const use = (j.content || []).find((c) => c.type === 'tool_use');
  if (!use) return Response.json({ error: 'no_plan' }, { status: 502 });

  const ids = new Set(files.map((f) => f.id));
  const plan = use.input;
  plan.clips = (plan.clips || []).filter((c) => ids.has(c.fileId)).map((c) => ({ ...c, trim: Math.max(0, Number(c.trim) || 0), length: Math.min(30, Math.max(0.5, Number(c.length) || 3)) }));
  if (plan.musicFileId && !ids.has(plan.musicFileId)) plan.musicFileId = '';
  return Response.json({ plan });
};
