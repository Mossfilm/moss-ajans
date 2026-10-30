// Test modunda sunucu fonksiyonlarını taklit eder: Claude / ChatGPT / render yerine sabit, gerçekçi cevaplar
import { doc, updateDoc } from 'firebase/firestore';

const SVG = (txt, bg) => 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><rect width="1024" height="1024" fill="' + bg + '"/><text x="80" y="560" font-family="sans-serif" font-size="88" font-weight="700" fill="#fff">' + txt + '</text></svg>');

export function installFakeFunctions(db) {
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
          reply: targets.length + ' firma için post hazırladım; görselleri ChatGPT çiziyor.',
          actions: targets.map((f) => ({ action: 'create_post', firmId: f.id, title: 'Öğretmenler Günü', template: 'gorsel', format: 'kare', eyebrow: '24 Kasım', headline: 'Bir öğretmen,\nbin hayal.', caption: 'Öğretmenler Günü kutlu olsun.', tags: '#24Kasım', image_prompt: 'Warm classroom illustration, text "Bir öğretmen, bin hayal."', date: '2026-11-24', time: '09:00' }))
        });
      }
      if (last.includes('çekim')) {
        return Response.json({ reply: 'Takvime ekledim.', actions: [{ action: 'create_task', firmId: firms[0].id, title: 'Etkinlik çekimi', type: 'cekim', date: body.context.today, time: '11:00' }] });
      }
      if (last.includes('video')) {
        return Response.json({ reply: 'Reels senaryosu hazır.', actions: [{ action: 'create_video', firmId: firms[0].id, title: 'Kış bakımı reels', scenes: [{ sec: 3, shot: 'Araç yakın plan', text: 'Kışa hazır mısın?' }, { sec: 4, shot: 'Usta kontrol yapıyor', text: '5 noktalı kontrol', vo: 'Kış gelmeden aracını kontrol ettir.' }], music: 'Tempolu', caption: 'Kışa hazır mısın?', tags: '#kış' }] });
      }
      return Response.json({ reply: 'Merhaba! Bu sahte (test) cevabıdır: ' + last, actions: [] });
    }
    if (name === 'gorsel-background') {
      setTimeout(() => updateDoc(doc(db, 'gallery', body.galleryId), { 'spec.imageUrl': SVG('ChatGPT', '#3B5D8F'), imageStatus: 'hazir' }), 700);
      return new Response(null, { status: 202 });
    }
    if (name === 'kurgu') {
      const media = (body.files || []).filter((f) => f.kind !== 'audio');
      if (!media.length) return Response.json({ error: 'no_media' }, { status: 400 });
      const music = (body.files || []).find((f) => f.kind === 'audio');
      return Response.json({ plan: { summary: (body.revisionNote ? 'Revize: ' + body.revisionNote + '. ' : '') + 'Hızlı açılış, iki sahne, kapanışta firma adı.', aspect: '9:16', clips: media.map((f, i) => ({ fileId: f.id, trim: 0, length: 3, text: i === 0 ? 'Yeni sezon' : '', transition: i ? 'fade' : 'none' })), musicFileId: music ? music.id : '', endText: body.firmName } });
    }
    if (name === 'render-background') {
      setTimeout(() => updateDoc(doc(db, 'projects', body.projectId), { renderStatus: 'render' }), 300);
      setTimeout(() => updateDoc(doc(db, 'projects', body.projectId), { renderStatus: 'hazir', outputUrl: '/test-video.mp4' }), 1200);
      return new Response(null, { status: 202 });
    }
    return new Response('Not found', { status: 404 });
  };
}
