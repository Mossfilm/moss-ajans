import { useEffect, useRef, useState } from 'react';
import { Pen, Hero } from '../components/Art.jsx';
import { useStore } from '../store.jsx';
import { Nav, Icon, Logo, useRoute } from '../components/ui.jsx';
import { PostPreview } from '../components/Post.jsx';
import { todayYmd, ymd, addDays, upcomingSpecialDays, TYPES } from '../data.js';
import { auth } from '../firebase.js';

const JOB_LABEL = { soru: 'Soru', post: 'Özel tasarım', video: 'Montaj', diger: 'İş' };
const JOB_STATUS = { bekliyor: ['Sırada', 'pill wait'], isleniyor: ['Claude yapıyor', 'pill ok'], tamam: ['Bitti', 'pill ok'], hata: ['Yapılamadı', 'pill alert'] };
const CHIPS = [
  'Yaklaşan özel günler için tüm firmalara post hazırla',
  'Hangi firmanın içeriği azalıyor?',
  'Bu hafta için 3 reels fikri ver',
  'Ağustos Döner için kampanya postu yap'
];

export default function Asistan() {
  const { firms, tasks, gallery, addGallery, addTask, chat, jobs, addChat, addJob, clearChat, cancelJob, user } = useStore();
  const r = useRoute();
  const focusFirmId = r.q.get('firma');
  const focusItemId = r.q.get('galeri');
  const focusFirm = firms.find((f) => f.id === focusFirmId);
  const focusItem = gallery.find((g) => g.id === focusItemId);
  const msgs = chat;
  const [showJobs, setShowJobs] = useState(false);
  const open = jobs.filter((j) => j.status === 'bekliyor' || j.status === 'isleniyor');
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current && endRef.current.scrollIntoView({ block: 'end' }); }, [msgs.length, busy]);

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
          const { action, firmId, title, caption, tags, date, time, ...rest } = a;
          const spec = { ...rest, template: ['anma', 'kutlama', 'duyuru', 'urun', 'alinti'].includes(rest.template) ? rest.template : 'duyuru' };
          const id = await addGallery({ firmId, kind: 'post', title, caption: caption || '', tags: tags || '', date: date || '', time: time || '', source: 'asistan', spec });
          done.push({ kind: 'post', id, firmId, title, spec });
        } else if (a.action === 'queue_for_claude') {
          const id = await addJob({ kind: ['post', 'video', 'diger'].includes(a.kind) ? a.kind : 'diger', firmId: a.firmId || '', text: a.brief || '' });
          done.push({ kind: 'job', id, firmId: a.firmId || '', title: a.brief || 'Claude sırasına eklendi' });
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

  const toQueue = async (q, why) => {
    const id = await addJob({ kind: 'soru', text: q, firmId: focusFirm ? focusFirm.id : '' });
    await addChat({ role: 'assistant', via: 'sistem', jobId: id, text: why + ' Sorunu Claude’un sırasına aldım; en geç yaklaşık 1 saat içinde cevabı burada olacak.' });
  };

  const ask = async (text) => {
    const q = (text || '').trim();
    if (!q || busy) return;
    const next = msgs.concat({ role: 'user', text: q });
    setDraft(''); setBusy(true);
    await addChat({ role: 'user', text: q });
    try {
      const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';
      const res = await fetch('/.netlify/functions/asistan', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: 'Bearer ' + token },
        body: JSON.stringify({ messages: next.map((m) => ({ role: m.role, text: m.text })), context: context() })
      });
      if (res.status === 404 || res.status === 503) await toQueue(q, 'Anlık asistan henüz bağlı değil.');
      else if (res.status === 429) await toQueue(q, 'Anlık asistanın bugünkü ücretsiz kotası doldu.');
      else if (res.status === 401) await addChat({ role: 'assistant', via: 'sistem', text: 'Bu hesabın asistanı kullanma izni yok.' });
      else if (!res.ok) await toQueue(q, 'Anlık asistan şu an cevap veremedi.');
      else {
        const j = await res.json();
        const done = await apply(j.actions || []);
        await addChat({ role: 'assistant', via: j.via || 'gemini', text: j.reply, done });
      }
    } catch (e) {
      await toQueue(q, 'Anlık asistana ulaşılamadı.');
    }
    setBusy(false);
  };

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', position: 'relative', isolation: 'isolate' }}>
      <Hero />
      <div style={{ position: 'sticky', top: 0, zIndex: 5, background: 'rgba(245,244,239,.72)', WebkitBackdropFilter: 'blur(14px)', backdropFilter: 'blur(14px)', borderBottom: '1px solid var(--line)', padding: 'calc(12px + var(--safe-t)) 16px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span aria-hidden="true" style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--moss)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="sparkle" color="#fff" /></span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ margin: 0, fontFamily: 'var(--display)', fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>MOSS Asistan<span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 600, color: 'var(--moss)' }}><span style={{ width: 6, height: 6, borderRadius: 3, background: busy ? 'var(--wait)' : '#3A8A71' }} />{busy ? 'Yazıyor' : 'Hazır'}</span></h1>
          {open.length > 0 && <button className="link" onClick={() => setShowJobs(!showJobs)} style={{ fontSize: 12 }}>Claude sırasında {open.length} iş {showJobs ? '▴' : '▾'}</button>}
          <span className="tiny">{focusFirm ? 'Konu: ' + focusFirm.name + (focusItem ? ' · ' + focusItem.title : '') : 'Firmalar, takvim ve galeri hakkında sor ya da iste'}</span>
        </div>
        {msgs.length > 0 && <button className="link" onClick={() => clearChat()}>Temizle</button>}
      </div>

      <div style={{ flex: 1, padding: '16px 16px calc(220px + var(--safe-b))', display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 560, width: '100%', margin: '0 auto' }}>
        {showJobs && open.length > 0 && (
          <div className="card list">
            {open.map((j) => {
              const f = firms.find((x) => x.id === j.firmId);
              const [l, cls] = JOB_STATUS[j.status] || JOB_STATUS.bekliyor;
              return (
                <div key={j.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px' }}>
                  {f ? <Logo firm={f} size={28} radius={8} /> : <span className="h-ic"><Icon name="sparkle" size={14} /></span>}
                  <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{JOB_LABEL[j.kind] || 'İş'} · {j.text || ''}</span>
                    <span className="tiny">{j.byName} · {j.status === 'bekliyor' ? 'en geç ~1 saat' : 'şu an yapılıyor'}</span>
                  </span>
                  <span className={cls}>{l}</span>
                  {j.status === 'bekliyor' && j.by === user.uid && <button aria-label="Sıradan çıkar" onClick={() => cancelJob(j.id)} style={{ width: 36, height: 36, border: 0, background: 'transparent' }}><Icon name="trash" size={16} color="var(--muted)" /></button>}
                </div>
              );
            })}
          </div>
        )}
        {msgs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '20px 8px 4px' }}>
            <span className="empty-ic glow" style={{ margin: '0 auto 14px' }}><Icon name="sparkle" size={28} /></span>
            <div style={{ fontFamily: 'var(--display)', fontSize: 20, fontWeight: 700 }}>Bugün ne üretelim?</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginTop: 14 }}>
              {[['star', 'Post hazırla', 'Post hazırla: '], ['film', 'Video senaryosu', 'Reels senaryosu yaz: '], ['cal', 'İş oluştur', 'Takvime iş ekle: ']].map(([ic, l, p]) => <button key={l} className="chip sug" onClick={() => { setDraft(p); setTimeout(() => { const el = document.getElementById('soru'); if (el) el.focus(); }, 0); }}><Icon name={ic} size={15} />{l}</button>)}
            </div>
          </div>
        )}
        {msgs.length === 0 && (
          <div className="card pad examples" style={{ fontSize: 14, lineHeight: '21px' }}>
            <Pen className="wm" />
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}><span className="h-ic"><Icon name="sparkle" size={14} /></span>Örnek istekler</span>
            <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
              <li>“10 Kasım için tüm firmalara post hazırla”</li>
              <li>“DSG Otomotiv için kış bakımı reels’i yap”</li>
              <li>“Boğaziçi VIP’e Öğretmenler Günü fikri ver, tartışalım”</li>
              <li>“Mutlu Çocuklar’a 3 Kasım’a çekim ekle”</li>
            </ul>
            <p className="tiny" style={{ margin: '10px 0 0' }}>Sohbet, fikir, şablon postlar ve takvim işleri anında yapılır. Montaj ve özel tasarımları Claude saatte bir yapar; en geç yaklaşık 1 saatte uygulamaya düşer.</p>
          </div>
        )}
        {msgs.map((m, i) => m.role === 'user'
          ? (
            <div key={m.id || i} style={{ alignSelf: 'flex-end', maxWidth: '85%', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
              {m.by !== user.uid && <span className="tiny">{m.byName}</span>}
              <div style={{ padding: '12px 14px', borderRadius: '16px 16px 4px 16px', background: 'var(--moss)', color: '#fff', fontSize: 15, lineHeight: '21px', whiteSpace: 'pre-wrap' }}>{m.text}</div>
            </div>
          )
          : (
            <div key={m.id || i} style={{ alignSelf: 'flex-start', maxWidth: '88%', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span className="tiny" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>{m.via === 'claude' ? 'Claude' : m.via === 'sistem' ? 'Moss' : 'Asistan (anlık)'}{m.jobId && (() => { const j = jobs.find((x) => x.id === m.jobId); const st = j ? JOB_STATUS[j.status] : null; return st ? <span className={st[1]} style={{ fontSize: 11, padding: '2px 6px' }}>{st[0]}</span> : null; })()}</span>
              <div className="card" style={{ padding: '12px 14px', borderRadius: '4px 16px 16px 16px', fontSize: 15, lineHeight: '22px', whiteSpace: 'pre-wrap', background: m.via === 'sistem' ? 'var(--wait-soft)' : undefined }}>{m.text}</div>
              {(m.done || []).length > 0 && (
                <div style={{ padding: '12px 14px', borderRadius: 16, background: 'var(--moss-soft)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--moss)' }}>Uygulamada yaptıklarım</span>
                  {m.done.map((d) => {
                    const f = firms.find((x) => x.id === d.firmId);
                    const href = d.kind === 'task' ? '#/is/' + d.id : d.kind === 'job' ? '#/asistan' : d.kind === 'project' ? '#/edit/' + d.id : '#/galeri/' + d.id;
                    return (
                      <a key={d.id} href={href} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {d.kind === 'post' && d.spec ? <PostPreview spec={d.spec} firm={f} width={56} radius={8} /> : <Logo firm={f} size={40} radius={10} />}
                        <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ fontSize: 14, fontWeight: 600 }}>{d.title}</span>
                          <span className="tiny">{(f ? f.name + ' · ' : '') + (d.kind === 'post' ? 'Post galeriye eklendi' : d.kind === 'video' ? 'Video galeriye eklendi' : d.kind === 'job' ? 'Claude sırasında, en geç ~1 saat' : d.kind === 'project' ? 'Montaj hazır' : 'Takvime eklendi')}</span>
                        </span>
                        <Icon name="right" size={16} color="var(--muted)" />
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        {busy && <div role="status" aria-label="Asistan yazıyor" className="card" style={{ alignSelf: 'flex-start', padding: '14px 16px', borderRadius: '4px 18px 18px 18px', display: 'flex', gap: 5 }}><span className="dot" /><span className="dot" /><span className="dot" /></div>}
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
