// Test modunda sunucu fonksiyonlarını taklit eder: Claude / ChatGPT / render yerine sabit, gerçekçi cevaplar
import { doc, updateDoc } from 'firebase/firestore';

const SVG = (txt, bg) => 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><rect width="1024" height="1024" fill="' + bg + '"/><text x="80" y="560" font-family="sans-serif" font-size="88" font-weight="700" fill="#fff">' + txt + '</text></svg>');

export const TINY_MP4 = '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';

// Önizleme/test: Claude'un saatlik işini taklit eder (gerçekte zamanlanmış görev yapar)
export async function fakeWorkerRun() {
  const { collection, getDocs, setDoc, addDoc, serverTimestamp } = await import('firebase/firestore');
  const fdb = {};
  const jobs = (await getDocs(collection(fdb, 'jobs'))).docs.map((d) => ({ id: d.id, ...d.data() })).filter((j) => j.status === 'bekliyor');
  for (const j of jobs) {
    if (j.kind === 'video' && j.projectId) {
      const p = (await getDocs(collection(fdb, 'projects'))).docs.find((d) => d.id === j.projectId);
      const src = (p && p.data().sources) || [];
      await setDoc(doc(fdb, 'videoParcalar', j.projectId + '_000'), { projectId: j.projectId, i: 0, d: TINY_MP4 });
      await updateDoc(doc(fdb, 'projects', j.projectId), { status: 'hazir', workerNote: '', video: { parts: 1, size: Math.round(TINY_MP4.length * 0.75), mime: 'video/mp4', at: new Date().toISOString(), duration: 2, note: 'Önizleme: taklit montaj' },
        plan: { summary: 'Önizleme: en hareketli anlarla hızlı açılış, ortada ürün yakın planları, sonda firma adı.', duration: 2, clips: src.map((s, i) => ({ sourceId: s.id, trim: i * 2, length: 2, what: i ? 'ürün yakın plan' : 'giriş', text: i ? '' : 'Yeni sezon' })) } });
      await addDoc(collection(fdb, 'activity'), { kind: 'edit', text: 'Reels hazır', by: 'claude', byName: 'Claude', at: serverTimestamp(), projectId: j.projectId });
    } else if (j.kind === 'post' && j.galleryId) {
      await updateDoc(doc(fdb, 'gallery', j.galleryId), { 'spec.template': 'gorsel', 'spec.imageUrl': SVG('Claude', '#2F4A2C'), imageStatus: 'hazir' });
    } else {
      await addDoc(collection(fdb, 'chat'), { role: 'assistant', via: 'claude', text: 'Claude (önizleme): “' + (j.text || '') + '” isteğine baktım ve yaptım.', jobId: j.id, by: 'claude', byName: 'Claude', at: serverTimestamp() });
    }
    await updateDoc(doc(fdb, 'jobs', j.id), { status: 'tamam' });
  }
  return jobs.length;
}

export function installFakeFunctions(db) {
  window.__fakeWorkerRun = fakeWorkerRun;
  const real = window.fetch.bind(window);
  window.__fnCalls = [];
  window.fetch = async (url, opts = {}) => {
    const u = String(url);
    if (!u.startsWith('/.netlify/functions/')) return real(url, opts);
    const name = u.split('/').pop().split('?')[0];
    const body = opts.body ? JSON.parse(opts.body) : {};
    window.__fnCalls.push({ name, body });
    await new Promise((r) => setTimeout(r, 250));
    if (name === 'asistan') {
      const last = (body.messages || []).slice(-1)[0].text.toLowerCase();
      const firms = (body.context.firms || []).filter((f) => f.active);
      if (last.includes('post')) {
        const targets = last.includes('eğitim') ? firms.filter((f) => f.sector === 'Eğitim') : firms.slice(0, 2);
        return Response.json({
          via: 'gemini',
          reply: targets.length + ' firma için şablonlu post hazırladım, galeride.',
          actions: targets.map((f) => ({ action: 'create_post', firmId: f.id, title: 'Öğretmenler Günü', template: 'kutlama', format: 'kare', eyebrow: '24 Kasım', headline: 'Bir öğretmen,\nbin hayal.', caption: 'Öğretmenler Günü kutlu olsun.', tags: '#24Kasım', date: '2026-11-24', time: '09:00' }))
        });
      }
      if (last.includes('kota')) return Response.json({ error: 'quota' }, { status: 429 });
      if (last.includes('montaj') || last.includes('özel tasarım')) {
        return Response.json({ via: 'gemini', reply: 'Bunu Claude’un sırasına ekledim, en geç yaklaşık 1 saat içinde hazır olur.', actions: [{ action: 'queue_for_claude', kind: last.includes('montaj') ? 'video' : 'post', firmId: firms[0].id, brief: last }] });
      }
      if (last.includes('çekim')) {
        return Response.json({ reply: 'Takvime ekledim.', actions: [{ action: 'create_task', firmId: firms[0].id, title: 'Etkinlik çekimi', type: 'cekim', date: body.context.today, time: '11:00' }] });
      }
      if (last.includes('video')) {
        return Response.json({ reply: 'Reels senaryosu hazır.', actions: [{ action: 'create_video', firmId: firms[0].id, title: 'Kış bakımı reels', scenes: [{ sec: 3, shot: 'Araç yakın plan', text: 'Kışa hazır mısın?' }, { sec: 4, shot: 'Usta kontrol yapıyor', text: '5 noktalı kontrol', vo: 'Kış gelmeden aracını kontrol ettir.' }], music: 'Tempolu', caption: 'Kışa hazır mısın?', tags: '#kış' }] });
      }
      return Response.json({ reply: 'Merhaba! Bu sahte (test) cevabıdır: ' + last, actions: [] });
    }
    return new Response('Not found', { status: 404 });
  };
}
