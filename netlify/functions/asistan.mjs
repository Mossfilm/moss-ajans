// Moss Asistan: uygulamadaki sohbet ekranının arka ucu.
// Gerekli ortam değişkenleri (Netlify → Site configuration → Environment variables):
//   ANTHROPIC_API_KEY  : Anthropic API anahtarı
//   FIREBASE_API_KEY   : src/firebase-config.js içindeki apiKey (giriş doğrulaması için)
//   ALLOWED_EMAILS     : virgülle ayrılmış ekip e-postaları
// İsteğe bağlı: CLAUDE_MODEL (varsayılan claude-sonnet-5-5)
// Görseller: OPENAI_API_KEY tanımlıysa post görselleri ChatGPT'nin görsel modeline çizdirilir (gorsel-background).
import { verify } from './lib/auth.mjs';

const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-5-5';

const TOOLS = [
  {
    name: 'create_post',
    description: 'Bir firma için Instagram gönderisi tasarlar ve firmanın galerisine taslak olarak ekler. Tasarım, verilen şablon ve metinlerle uygulama içinde çizilir.',
    input_schema: {
      type: 'object',
      properties: {
        firmId: { type: 'string', description: 'Firma kimliği (bağlamdaki firms listesinden id)' },
        title: { type: 'string', description: 'Galeride görünecek kısa başlık' },
        template: { type: 'string', enum: ['gorsel', 'anma', 'kutlama', 'duyuru', 'urun', 'alinti'], description: 'gorsel: ChatGPT ile çizilen tam tasarım (görsel modeli bağlıysa her zaman bunu kullan); anma: siyah-beyaz anma günleri; kutlama: bayram ve özel günler; duyuru: kampanya, kayıt, sınav sonucu; urun: yemek/ürün; alinti: söz veya müşteri yorumu' },
        format: { type: 'string', enum: ['kare', 'dikey', 'hikaye'] },
        eyebrow: { type: 'string', description: 'Üstteki kısa etiket, en fazla 4 kelime' },
        headline: { type: 'string', description: 'Ana başlık, en fazla 8 kelime. Satır kırmak için \\n kullan.' },
        sub: { type: 'string', description: 'Alt metin, en fazla 18 kelime' },
        foot: { type: 'string', description: 'Alt bilgi: firma adı, şube ya da çağrı' },
        caption: { type: 'string', description: 'Instagram paylaşım metni' },
        tags: { type: 'string', description: 'Hashtagler, boşlukla ayrılmış' },
        image_prompt: { type: 'string', description: 'ChatGPT görsel modeline gidecek, İNGİLİZCE yazılmış ayrıntılı tasarım tarifi: kompozisyon, stil, ışık, renkler (firmanın marka renkleri hex olarak), tipografi. Görselin üzerinde yazacak Türkçe metni tırnak içinde, Türkçe karakterleriyle aynen ver. Logo çizdirme; köşede logo için boş alan bırak (logo uygulama tarafından eklenir). Gerçek kişi yüzü, marka logosu ya da telifli karakter isteme.' },
        date: { type: 'string', description: 'Önerilen paylaşım tarihi YYYY-MM-DD' },
        time: { type: 'string', description: 'Önerilen saat HH:MM' }
      },
      required: ['firmId', 'title', 'template', 'format', 'headline', 'caption']
    }
  },
  {
    name: 'create_video',
    description: 'Bir firma için dikey reels videosu senaryosu ve animasyonlu önizlemesi hazırlar, galeriye ekler.',
    input_schema: {
      type: 'object',
      properties: {
        firmId: { type: 'string' },
        title: { type: 'string' },
        scenes: {
          type: 'array', minItems: 2, maxItems: 7,
          items: {
            type: 'object',
            properties: {
              sec: { type: 'number', description: 'Sahne süresi (saniye)' },
              shot: { type: 'string', description: 'Çekilecek görüntü' },
              text: { type: 'string', description: 'Ekranda yazacak kısa metin' },
              vo: { type: 'string', description: 'Seslendirme metni (yoksa boş)' }
            },
            required: ['sec', 'shot', 'text']
          }
        },
        music: { type: 'string' },
        caption: { type: 'string' },
        tags: { type: 'string' },
        date: { type: 'string' },
        time: { type: 'string' }
      },
      required: ['firmId', 'title', 'scenes', 'caption']
    }
  },
  {
    name: 'create_task',
    description: 'Takvime ve üretim hattına yeni bir iş ekler (çekim, paylaşım, toplantı vb.).',
    input_schema: {
      type: 'object',
      properties: {
        firmId: { type: 'string' },
        title: { type: 'string' },
        type: { type: 'string', enum: ['cekim', 'gonderi', 'reels', 'hikaye', 'kurgu', 'tasarim', 'reklam', 'toplanti', 'rapor', 'diger'] },
        date: { type: 'string' },
        time: { type: 'string' },
        note: { type: 'string' }
      },
      required: ['firmId', 'title', 'type', 'date']
    }
  }
];

function system(ctx) {
  return [
    'Sen Moss Film Agency’nin (Gaziantep’te bir medya ajansı) ekip uygulamasındaki asistansın. Ekip 3–5 kişi; Türkçe, samimi ve kısa konuş.',
    'Görevin: firmalar için içerik fikri üretmek, fikirleri ekiple tartışmak, istenince post ve video hazırlayıp galeriye eklemek, takvime iş eklemek.',
    'Kurallar:',
    '- Post ve video istendiğinde create_post / create_video araçlarını kullan; birden fazla firma istenirse her firma için ayrı çağır.',
    ctx.imagesEnabled
      ? '- Görselleri ChatGPT (OpenAI görsel modeli) çiziyor: her create_post için mutlaka image_prompt yaz ve template olarak "gorsel" kullan. Her firmanın tasarımı kendi sektörüne ve marka renklerine özgü olsun; aynı tasarımı firmalar arasında kopyalama.'
      : '- Görsel modeli bağlı değil: create_post için hazır şablonlardan (anma, kutlama, duyuru, urun, alinti) uygun olanı seç; image_prompt yazma.',
    '- Yalnızca kullanıcının istediği içeriği üret; istenmeyen ek post ya da video hazırlama.',
    '- Bilmediğin bilgileri uydurma: fiyat, adres, telefon, sınav sonucu, öğretmen adı gibi bilgiler için [FİYAT], [ADRES] gibi yer tutucu bırak.',
    '- Anma günlerinde (10 Kasım gibi) anma şablonunu ve ağırbaşlı bir dil kullan; kutlama dili kullanma.',
    '- Gerçek kişilerin fotoğrafını ya da sözünü kullanma; Atatürk’e ait söz eklemek istersen yalnızca çok bilinen ve doğruluğundan emin olduğun bir söz kullan, emin değilsen ekleme.',
    '- Başlıklar kısa ve çarpıcı olsun; metin dili firmanın sektörüne uygun olsun.',
    '- Aktif olmayan firmalar (active=false) için içerik üretme, nedenini söyle.',
    '- Bir işlem yaptıysan cevabında kısaca ne yaptığını söyle.',
    '',
    'Bugünün tarihi: ' + (ctx.today || ''),
    ctx.focusFirm ? 'Şu an konuşulan firma: ' + ctx.focusFirm : '',
    ctx.focusItem ? 'Kullanıcının düzenlemek istediği galeri içeriği: ' + JSON.stringify(ctx.focusItem) : '',
    'Firmalar: ' + JSON.stringify(ctx.firms || []),
    'Önümüzdeki işler: ' + JSON.stringify(ctx.tasks || []),
    'Yaklaşan özel günler: ' + JSON.stringify(ctx.special || [])
  ].filter(Boolean).join('\n');
}

async function claude(body) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify(body)
  });
  const j = await r.json();
  if (!r.ok) throw new Error((j.error && j.error.message) || 'API hatası');
  return j;
}

export default async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  if (!process.env.ANTHROPIC_API_KEY) return Response.json({ error: 'not_configured' }, { status: 503 });
  const auth = (req.headers.get('authorization') || '').replace(/^Bearer /, '');
  const email = await verify(auth);
  if (!email) return Response.json({ error: 'unauthorized' }, { status: 401 });

  let input;
  try { input = await req.json(); } catch (e) { return Response.json({ error: 'bad_request' }, { status: 400 }); }
  const messages = (input.messages || []).slice(-20).map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.text || '') })).filter((m) => m.content);
  if (!messages.length) return Response.json({ error: 'bad_request' }, { status: 400 });

  const ctx = { ...(input.context || {}), imagesEnabled: Boolean(process.env.OPENAI_API_KEY) };
  const sys = system(ctx);
  const actions = [];
  let convo = messages;
  let reply = '';
  try {
    for (let round = 0; round < 3; round++) {
      const res = await claude({ model: MODEL, max_tokens: 4096, system: sys, tools: TOOLS, messages: convo });
      const texts = res.content.filter((c) => c.type === 'text').map((c) => c.text).join('\n').trim();
      const uses = res.content.filter((c) => c.type === 'tool_use');
      if (texts) reply = texts;
      if (res.stop_reason !== 'tool_use' || !uses.length) break;
      uses.forEach((u) => actions.push({ type: u.name, ...u.input }));
      convo = convo.concat(
        { role: 'assistant', content: res.content },
        { role: 'user', content: uses.map((u) => ({ type: 'tool_result', tool_use_id: u.id, content: 'Tamamlandı, uygulamaya eklendi.' })) }
      );
    }
  } catch (e) {
    return Response.json({ error: 'api', message: e.message }, { status: 502 });
  }
  return Response.json({ reply: reply || 'Tamam.', actions, imagesEnabled: ctx.imagesEnabled });
};
