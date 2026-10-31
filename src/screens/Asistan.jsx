import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store.jsx';
import { Nav, Icon, Logo, useRoute } from '../components/ui.jsx';
import { PostPreview, startDrawing } from '../components/Post.jsx';
import { todayYmd, ymd, addDays, upcomingSpecialDays, TYPES } from '../data.js';
import { auth } from '../firebase.js';

const KEY = 'moss-asistan-chat';
const CHIPS = [
  'Yaklaşan özel günler için tüm firmalara post hazırla',
  'Hangi firmanın içeriği azalıyor?',
  'Bu hafta için 3 reels fikri ver',
  'Ağustos Döner için kampanya postu yap'
];

export default function Asistan() {
  const { firms, tasks, gallery, addGallery, addTask } = useStore();
  const r = useRoute();
  const focusFirmId = r.q.get('firma');
  const focusItemId = r.q.get('galeri');
  const focusFirm = firms.find((f) => f.id === focusFirmId);
  const focusItem = gallery.find((g) => g.id === focusItemId);
  const [msgs, setMsgs] = useState(() => { try { return JSON.parse(sessionStorage.getItem(KEY) || '[]'); } catch (e) { return []; } });
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [setup, setSetup] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { try { sessionStorage.setItem(KEY, JSON.stringify(msgs.slice(-40))); } catch (e) { /* yok say */ } endRef.current && endRef.current.scrollIntoView({ block: 'end' }); }, [msgs, busy]);

  const context = () => {
    const t0 = todayYmd(); const end = ymd(addDays(new Date(), 30));
    return {
      today: t0,
      focusFirm: focusFirm ? focusFirm.name + ' (' + focusFirm.id + ')' : '',
      focusItem: focusItem ? { id: focusItem.id, firmId: focusItem.firmId, kind: focusItem.kind, title: focusItem.title, spec: focusItem.spec, caption: focusItem.caption } : null,
      firms: firms.map((f) => ({ id: f.id, name: f.name, sector: f.sector, active: f.active !== false, package: f.package || {}, notes: (f.notes || '').slice(0, 200) })),
      tasks: tasks.filter((t) => !t.done && t.date >= t0 && t.date <= end).slice(0, 60).map((t) => ({ firmId: t.firmId, title: t.title, type: t.type, date: t.date, stage: t.stage })),
      special: upcomingSpecialDays(45)
    };
  };

  const apply = async (actions) => {
    const done = [];
    for (const a of actions) {
      try {
        if (a.action === 'create_post') {
          const { action, firmId, title, caption, tags, date, time, image_prompt, ...rest } = a;
          const draw = Boolean(image_prompt);
          const spec = { ...rest, template: draw ? 'gorsel' : (rest.template === 'gorsel' ? 'duyuru' : rest.template), imagePrompt: image_prompt || '' };
          const id = await addGallery({ firmId, kind: 'post', title, caption: caption || '', tags: tags || '', date: date || '', time: time || '', source: draw ? 'chatgpt' : 'asistan', spec, imageStatus: draw ? 'hazirlaniyor' : '' });
          if (draw) startDrawing(id, image_prompt, spec.format).catch(() => {});
          done.push({ kind: 'post', id, firmId, title, spec, draw });
        } else if (a.action === 'create_video') {
          const { firmId, title, scenes, music, caption, tags, date, time } = a;
          const id = await addGallery({ firmId, kind: 'video', title, caption: caption || '', tags: tags || '', date: date || '', time: time || '', source: 'asistan', spec: { scenes: scenes || [], music: music || '' } });
          done.push({ kind: 'video', id, firmId, title });
        } else if (a.action === 'create_task') {
          const STAGE = { cekim: 2, gonderi: 3, reels: 3, hikaye: 3, kurgu: 3, tasarim: 3, reklam: 3 };
          const id = await addTask({ firmId: a.firmId, title: a.title, type: a.type in TYPES ? a.type : 'diger', date: a.date || '', time: a.time || '', note: a.note || '', assignees: [], approval: true, stage: a.type in STAGE ? STAGE[a.type] : null, location: '', deliver: '' });
          done.push({ kind: 'task', id, firmId: a.firmId, title: a.title, date: a.date });
        }
      } catch (e) { /* tek işlem hatası diğerlerini durdurmasın */ }
    }
    return done;
  };

  const ask = async (text) => {
    const q = (text || '').trim();
    if (!q || busy) return;
    const next = msgs.concat({ role: 'user', text: q });
    setMsgs(next); setDraft(''); setBusy(true);
    try {
      const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';
      const res = await fetch('/.netlify/functions/asistan', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: 'Bearer ' + token },
        body: JSON.stringify({ messages: next.map((m) => ({ role: m.role, text: m.text })), context: context() })
      });
      if (res.status === 404 || res.status === 503) { setSetup(true); setMsgs(next.concat({ role: 'assistant', text: 'Asistan henüz bağlanmadı. Bağlantı kurulunca bu mesaja cevap verebileceğim.' })); }
      else if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setMsgs(next.concat({ role: 'assistant', text: j.error === 'unauthorized' ? 'Bu hesabın asistanı kullanma izni yok.' : 'Bir sorun oldu: ' + (j.message || res.status) }));
      } else {
        const j = await res.json();
        const done = await apply(j.actions || []);
        setMsgs(next.concat({ role: 'assistant', text: j.reply, done }));
      }
    } catch (e) {
      setSetup(true);
      setMsgs(next.concat({ role: 'assistant', text: 'Asistana ulaşılamadı. İnternet bağlantını kontrol et ya da biraz sonra tekrar dene.' }));
    }
    setBusy(false);
  };

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 5, background: 'var(--bg)', borderBottom: '1px solid var(--line)', padding: 'calc(12px + var(--safe-t)) 16px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span aria-hidden="true" style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--moss)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="sparkle" color="#fff" /></span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ margin: 0, fontFamily: 'var(--display)', fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>MOSS Asistan<span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 600, color: 'var(--moss)' }}><span style={{ width: 6, height: 6, borderRadius: 3, background: busy ? 'var(--wait)' : '#3A8A71' }} />{busy ? 'Yazıyor' : 'Hazır'}</span></h1>
          <span className="tiny">{focusFirm ? 'Konu: ' + focusFirm.name + (focusItem ? ' · ' + focusItem.title : '') : 'Firmalar, takvim ve galeri hakkında sor ya da iste'}</span>
        </div>
        {msgs.length > 0 && <button className="link" onClick={() => { setMsgs([]); sessionStorage.removeItem(KEY); }}>Temizle</button>}
      </div>

      <div style={{ flex: 1, padding: '16px 16px calc(220px + var(--safe-b))', display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 560, width: '100%', margin: '0 auto' }}>
        {msgs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '20px 8px 4px' }}>
            <span className="empty-ic" style={{ margin: '0 auto 14px' }}><Icon name="sparkle" size={28} /></span>
            <div style={{ fontFamily: 'var(--display)', fontSize: 20, fontWeight: 700 }}>Bugün ne üretelim?</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginTop: 14 }}>
              {[['Post hazırla', 'Post hazırla: '], ['Video senaryosu', 'Reels senaryosu yaz: '], ['İş oluştur', 'Takvime iş ekle: ']].map(([l, p]) => <button key={l} className="chip" onClick={() => { setDraft(p); setTimeout(() => { const el = document.getElementById('soru'); if (el) el.focus(); }, 0); }}>{l}</button>)}
            </div>
          </div>
        )}
        {msgs.length === 0 && (
          <div className="card pad" style={{ fontSize: 14, lineHeight: '21px' }}>
            Örnek istekler:
            <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
              <li>“10 Kasım için tüm firmalara post hazırla”</li>
              <li>“DSG Otomotiv için kış bakımı reels’i yap”</li>
              <li>“Boğaziçi VIP’e Öğretmenler Günü fikri ver, tartışalım”</li>
              <li>“Mutlu Çocuklar’a 3 Kasım’a çekim ekle”</li>
            </ul>
            <p className="tiny" style={{ margin: '10px 0 0' }}>Hazırladığım postlar ve videolar firmanın galerisine taslak olarak düşer.</p>
          </div>
        )}
        {msgs.map((m, i) => m.role === 'user'
          ? <div key={i} style={{ alignSelf: 'flex-end', maxWidth: '85%', padding: '12px 14px', borderRadius: '16px 16px 4px 16px', background: 'var(--moss)', color: '#fff', fontSize: 15, lineHeight: '21px', whiteSpace: 'pre-wrap' }}>{m.text}</div>
          : (
            <div key={i} style={{ alignSelf: 'flex-start', maxWidth: '88%', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="card" style={{ padding: '12px 14px', borderRadius: '4px 16px 16px 16px', fontSize: 15, lineHeight: '22px', whiteSpace: 'pre-wrap' }}>{m.text}</div>
              {(m.done || []).length > 0 && (
                <div style={{ padding: '12px 14px', borderRadius: 16, background: 'var(--moss-soft)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--moss)' }}>Uygulamada yaptıklarım</span>
                  {m.done.map((d) => {
                    const f = firms.find((x) => x.id === d.firmId);
                    const href = d.kind === 'task' ? '#/is/' + d.id : '#/galeri/' + d.id;
                    return (
                      <a key={d.id} href={href} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {d.kind === 'post' && d.spec ? <PostPreview spec={d.spec} firm={f} width={56} radius={8} /> : <Logo firm={f} size={40} radius={10} />}
                        <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ fontSize: 14, fontWeight: 600 }}>{d.title}</span>
                          <span className="tiny">{(f ? f.name + ' · ' : '') + (d.kind === 'post' ? (d.draw ? 'ChatGPT görseli çiziyor, bitince galeride' : 'Post galeriye eklendi') : d.kind === 'video' ? 'Video galeriye eklendi' : 'Takvime eklendi')}</span>
                        </span>
                        <Icon name="right" size={16} color="#7C857E" />
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        {busy && <div role="status" aria-label="Asistan yazıyor" className="card" style={{ alignSelf: 'flex-start', padding: '14px 16px', borderRadius: '4px 18px 18px 18px', display: 'flex', gap: 5 }}><span className="dot" /><span className="dot" /><span className="dot" /></div>}
        {setup && (
          <div className="card pad small" style={{ lineHeight: '19px' }}>
            Kurulum notu: Asistanın çalışması için Netlify’a <b>ANTHROPIC_API_KEY</b> (Claude), <b>OPENAI_API_KEY</b> (ChatGPT görselleri), <b>FIREBASE_API_KEY</b> ve <b>ALLOWED_EMAILS</b> ayarlarının girilmesi ve uygulamanın GitHub ya da Netlify CLI ile yüklenmesi gerekiyor.
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div style={{ position: 'fixed', left: 0, right: 0, bottom: 'calc(65px + var(--safe-b))', zIndex: 15, background: 'var(--bg)', borderTop: '1px solid var(--line)', padding: '10px 0 12px' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <div className="chips" style={{ margin: 0, padding: '0 16px 8px' }}>
            {CHIPS.map((c) => <button key={c} className="chip" onClick={() => ask(focusFirm && c.includes('Ağustos') ? c : c)}>{c}</button>)}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); ask(draft); }} style={{ display: 'flex', gap: 8, padding: '0 16px' }}>
            <label htmlFor="soru" className="sr">Asistana yaz</label>
            <input id="soru" className="input" placeholder="Bir şey sor ya da iste…" value={draft} onChange={(e) => setDraft(e.target.value)} style={{ height: 52, borderRadius: 12 }} />
            <button type="submit" aria-label="Gönder" disabled={busy || !draft.trim()} className="btn primary" style={{ width: 52, height: 52, padding: 0, borderRadius: 12, flexShrink: 0 }}><Icon name="up" color="#fff" /></button>
          </form>
        </div>
      </div>
      <Nav active="/asistan" />
    </div>
  );
}
