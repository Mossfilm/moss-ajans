// Anlık asistan: Google Gemini'nin ücretsiz katmanını doğrudan uygulamadan çağırır (sunucu gerekmez).
// Anahtar uygulamanın korumalı veritabanında durur (config/app.geminiKey); yalnızca ekip okuyabilir.
// Montaj ve özel tasarım gibi ağır işler "jobs" sırasına alınır; Claude saatte bir yapar.

const S = (description, extra = {}) => ({ type: 'string', description, ...extra });
const TOOLS = [
  {
    name: 'create_post',
    description: 'Bir firma için Instagram gönderisi hazırlar ve firmanın galerisine taslak olarak ekler. Tasarım uygulamadaki hazır şablonla, firmanın renkleri ve logosuyla çizilir.',
    parameters: {
      type: 'object',
      properties: {
        firmId: S('Firma kimliği (firms listesindeki id)'),
        title: S('Galeride görünecek kısa başlık'),
        template: S('anma: siyah-beyaz anma günleri; kutlama: bayram ve özel günler; duyuru: kampanya, kayıt, sınav sonucu; urun: yemek/ürün; alinti: söz veya müşteri yorumu', { enum: ['anma', 'kutlama', 'duyuru', 'urun', 'alinti'] }),
        format: S('kare, dikey ya da hikaye', { enum: ['kare', 'dikey', 'hikaye'] }),
        eyebrow: S('Üstteki kısa etiket, en fazla 4 kelime'),
        headline: S('Ana başlık, en fazla 8 kelime. Satır kırmak için \\n kullan.'),
        sub: S('Alt metin, en fazla 18 kelime'),
        foot: S('Alt bilgi: firma adı, şube ya da çağrı'),
        caption: S('Instagram paylaşım metni'),
        tags: S('Hashtagler, boşlukla ayrılmış'),
        date: S('Önerilen paylaşım tarihi YYYY-MM-DD'),
        time: S('Önerilen saat HH:MM')
      },
      required: ['firmId', 'title', 'template', 'format', 'headline', 'caption']
    }
  },
  {
    name: 'create_video',
    description: 'Bir firma için dikey reels senaryosu ve animasyonlu önizlemesi hazırlar, galeriye ekler. (Gerçek video montajı değil; montaj için queue_for_claude kullan.)',
    parameters: {
      type: 'object',
      properties: {
        firmId: S('Firma kimliği'),
        title: S('Başlık'),
        scenes: {
          type: 'array',
          description: '2-7 sahne',
          items: {
            type: 'object',
            properties: { sec: { type: 'number', description: 'Sahne süresi (saniye)' }, shot: S('Çekilecek görüntü'), text: S('Ekranda yazacak kısa metin'), vo: S('Seslendirme metni (yoksa boş)') },
            required: ['sec', 'shot', 'text']
          }
        },
        music: S('Müzik önerisi'),
        caption: S('Paylaşım metni'),
        tags: S('Hashtagler'),
        date: S('YYYY-MM-DD'),
        time: S('HH:MM')
      },
      required: ['firmId', 'title', 'scenes', 'caption']
    }
  },
  {
    name: 'create_task',
    description: 'Takvime ve üretim hattına yeni bir iş ekler (çekim, paylaşım, toplantı vb.).',
    parameters: {
      type: 'object',
      properties: {
        firmId: S('Firma kimliği'),
        title: S('İş başlığı'),
        type: S('İş türü', { enum: ['cekim', 'gonderi', 'reels', 'hikaye', 'kurgu', 'tasarim', 'reklam', 'toplanti', 'rapor', 'diger'] }),
        date: S('YYYY-MM-DD'),
        time: S('HH:MM'),
        note: S('Not')
      },
      required: ['firmId', 'title', 'type', 'date']
    }
  },
  {
    name: 'queue_for_claude',
    description: 'Senin yapamayacağın ağır işleri Claude\'un saatlik sırasına ekler: ham videolardan montaj, özel/özgün post tasarımı, uzun analiz. Claude en geç yaklaşık 1 saat içinde yapıp sonucu uygulamaya koyar.',
    parameters: {
      type: 'object',
      properties: {
        kind: S('post: özel tasarım; video: montaj; diger: analiz ya da başka iş', { enum: ['post', 'video', 'diger'] }),
        firmId: S('Firma kimliği (varsa)'),
        brief: S('Claude\'a gidecek ayrıntılı, Türkçe iş tarifi')
      },
      required: ['kind', 'brief']
    }
  }
];

function system(ctx) {
  return [
    'Sen Moss Film Agency’nin (Gaziantep’te bir medya ajansı) ekip uygulamasındaki asistansın. Ekip 3–5 kişi; Türkçe, samimi ve kısa konuş.',
    'Görevin: firmalar için içerik fikri üretmek, fikirleri ekiple tartışmak, istenince post (create_post) ve reels senaryosu (create_video) hazırlayıp galeriye eklemek, takvime iş eklemek (create_task).',
    'Ham videolardan montaj, altyazı, müzikli kurgu ya da şablon dışı özel tasarım istenirse queue_for_claude ile Claude\'un sırasına ekle ve kullanıcıya "en geç yaklaşık 1 saat içinde hazır olur" de. Montaj için kullanıcıyı Edit sekmesine de yönlendirebilirsin.',
    'Kurallar:',
    '- Birden fazla firma istenirse her firma için ayrı çağır. Yalnızca istenen içeriği üret.',
    '- Bilmediğin bilgileri uydurma: fiyat, adres, telefon, sınav sonucu gibi bilgiler için [FİYAT], [ADRES] gibi yer tutucu bırak.',
    '- Anma günlerinde (10 Kasım gibi) anma şablonunu ve ağırbaşlı bir dil kullan.',
    '- Gerçek kişilere söz atfetme; emin olmadığın alıntıyı ekleme.',
    '- Aktif olmayan firmalar (active=false) için içerik üretme, nedenini söyle.',
    '- Her cevapta kısa bir metin yaz; bir işlem yaptıysan ne yaptığını söyle.',
    '',
    'Bugünün tarihi: ' + (ctx.today || ''),
    ctx.focusFirm ? 'Şu an konuşulan firma: ' + ctx.focusFirm : '',
    ctx.focusItem ? 'Kullanıcının düzenlemek istediği galeri içeriği: ' + JSON.stringify(ctx.focusItem) : '',
    'Firmalar: ' + JSON.stringify(ctx.firms || []),
    'Önümüzdeki işler: ' + JSON.stringify(ctx.tasks || []),
    'Yaklaşan özel günler: ' + JSON.stringify(ctx.special || [])
  ].filter(Boolean).join('\n');
}


export class QuotaError extends Error {}

async function call(key, model, body) {
  const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + encodeURIComponent(key), {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body)
  });
  const j = await r.json().catch(() => ({}));
  if (r.status === 429) throw new QuotaError('quota');
  if (!r.ok) throw new Error((j.error && j.error.message) || 'Gemini hatası ' + r.status);
  return j;
}

export async function askGemini({ key, model = 'gemini-flash-latest', messages, context }) {
  let contents = (messages || []).slice(-20)
    .map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: String(m.text || '') }] }))
    .filter((m) => m.parts[0].text);
  while (contents.length && contents[0].role !== 'user') contents.shift();
  const base = { system_instruction: { parts: [{ text: system(context || {}) }] }, tools: [{ functionDeclarations: TOOLS }], generationConfig: { temperature: 0.7 } };
  const actions = [];
  let reply = '';
  for (let round = 0; round < 3; round++) {
    const res = await call(key, model, { ...base, contents });
    const parts = (((res.candidates || [])[0] || {}).content || {}).parts || [];
    const text = parts.filter((p) => p.text).map((p) => p.text).join('\n').trim();
    const calls = parts.filter((p) => p.functionCall).map((p) => p.functionCall);
    if (text) reply = text;
    if (!calls.length) break;
    calls.forEach((c) => actions.push({ ...(c.args || {}), action: c.name }));
    contents = contents.concat(
      { role: 'model', parts: calls.map((c) => ({ functionCall: c })) },
      { role: 'user', parts: calls.map((c) => ({ functionResponse: { name: c.name, response: { result: c.name === 'queue_for_claude' ? 'Claude sırasına eklendi, en geç ~1 saat' : 'Tamamlandı, uygulamaya eklendi' } } })) }
    );
  }
  return { reply: reply || 'Tamam.', actions, via: 'gemini' };
}
