import { useState } from 'react';
import { useStore, useSub } from '../store.jsx';
import { Logo, Icon, TypePill, Check, back, go, assigneeLabel } from '../components/ui.jsx';
import { STAGES, dayLabel } from '../data.js';
import { Thread } from './Firma.jsx';
import { useAsk } from '../components/Dialog.jsx';
import { Hero, TYPE_ART } from '../components/Art.jsx';
import { TYPES } from '../data.js';

export default function Is({ id }) {
  const { tasks, firms, users, updateTask, setStage, toggleDone, deleteTask, addComment, addRevision } = useStore();
  const t = tasks.find((x) => x.id === id);
  const comments = useSub(['tasks', id, 'comments']);
  const [item, setItem] = useState('');
  const ask = useAsk();
  if (!t) return <div className="screen no-nav"><button className="back" onClick={() => back()}><Icon name="left" size={20} />Geri</button><p className="small">İş bulunamadı ya da silindi.</p></div>;

  const firm = firms.find((f) => f.id === t.firmId);
  const stage = typeof t.stage === 'number' ? t.stage : 2;
  const list = t.checklist || [];
  const setList = (next) => updateTask(t.id, { checklist: next });
  const addItem = (e) => { e.preventDefault(); if (item.trim()) { setList(list.concat({ id: Date.now().toString(36), label: item.trim(), done: false })); setItem(''); } };
  const who = assigneeLabel(t, users) || 'Atanmadı';

  return (
    <div className="screen no-nav">
      <Hero tall color={(TYPES[t.type] || TYPES.diger).dot} Art={TYPE_ART[t.type] || TYPE_ART.diger} />
      <div className="topbar">
        <button className="back" onClick={() => back()}><Icon name="left" size={20} />Geri</button>
        <a className="btn sm" href={'#/duzenle/' + t.id}><Icon name="edit" size={16} />Düzenle</a>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
        <a href={firm ? '#/firma/' + firm.id : '#/firmalar'} className="pill ok" style={{ gap: 6, padding: '4px 10px 4px 4px' }}><Logo firm={firm} size={22} />{firm ? firm.name : 'Firma yok'}</a>
        <TypePill type={t.type} />
        {t.done && <span className="pill ok">Tamamlandı</span>}
      </div>
      <h1 style={{ fontFamily: 'var(--display)', fontSize: 20, lineHeight: '27px', fontWeight: 700, margin: '12px 0 16px' }}>{t.title}</h1>

      <div className="card pad">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
          <span className="small" style={{ fontWeight: 600, color: 'var(--ink-2)' }}>Aşama</span>
          <span className="small" style={{ fontWeight: 600, color: 'var(--moss)' }}>{stage + 1}/6 · {STAGES[stage].label}</span>
        </div>
        <div className="stepper">
          {STAGES.map((s, i) => (
            <button key={s.label} onClick={() => setStage(t, i)} aria-label={s.label + (i === stage ? ' (şu anki aşama)' : '')} className={i < stage ? 'past' : i === stage ? 'now' : ''}>
              <span className="dot">{i < stage ? <Icon name="check" size={13} color="#fff" width={3} /> : i + 1}</span>
              <span className="lbl">{s.short}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
        {[['cal', 'Tarih', t.date ? dayLabel(t.date) + (t.time ? ', ' + t.time : '') : 'Tarih yok'], ['user', 'Sorumlu', who], ['pin', 'Konum', t.location || '—'], ['send', 'Teslim', t.deliver ? dayLabel(t.deliver) : '—']].map(([ic, l, v], i) => (
          <div key={l} style={{ padding: '14px 14px', display: 'flex', gap: 10, borderRight: i % 2 === 0 ? '1px solid var(--line-2)' : 0, borderBottom: i < 2 ? '1px solid var(--line-2)' : 0 }}>
            <span className="row-ic" style={{ marginTop: 2 }}><Icon name={ic} size={15} /></span>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}><span className="tiny">{l}</span><span style={{ fontSize: 14, fontWeight: 600 }}>{v}</span></span>
          </div>
        ))}
      </div>

      <button className={'btn' + (t.done ? '' : ' primary')} style={{ width: '100%', marginTop: 12 }} onClick={() => toggleDone(t)}>
        {t.done ? 'Yapılmadı olarak işaretle' : 'Yapıldı olarak işaretle'}
      </button>

      {t.note && <><h2 className="h2 hi"><span className="h-ic"><Icon name="msg" size={14} /></span>Not</h2><p className="card pad note" style={{ margin: 0, fontSize: 15, lineHeight: '22px', whiteSpace: 'pre-wrap' }}>{t.note}</p></>}

      <div className="row-h2"><h2 className="h2 hi"><span className="h-ic"><Icon name="check" size={14} /></span>Kontrol listesi</h2><span className="small">{list.length ? list.filter((c) => c.done).length + '/' + list.length + ' hazır' : ''}</span></div>
      <div className="card list">
        {list.map((c) => (
          <div key={c.id} style={{ display: 'flex', alignItems: 'center' }}>
            <button role="checkbox" aria-checked={c.done} onClick={() => setList(list.map((x) => (x.id === c.id ? { ...x, done: !x.done } : x)))}
              style={{ flex: 1, minHeight: 48, display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', border: 0, background: 'transparent', textAlign: 'left', fontSize: 15 }}>
              <Check on={c.done} /><span style={{ textDecoration: c.done ? 'line-through' : 'none', color: c.done ? 'var(--muted)' : 'var(--ink)' }}>{c.label}</span>
            </button>
            <button aria-label={c.label + ' maddesini sil'} onClick={() => setList(list.filter((x) => x.id !== c.id))} style={{ width: 44, height: 44, border: 0, background: 'transparent' }}><Icon name="trash" size={18} color="#7C857E" /></button>
          </div>
        ))}
        <form onSubmit={addItem} style={{ display: 'flex', gap: 8, padding: 10 }}>
          <label htmlFor="mad" className="sr">Yeni madde</label>
          <input id="mad" className="input" style={{ height: 44 }} placeholder="Madde ekle (örn. yaka mikrofonu)" value={item} onChange={(e) => setItem(e.target.value)} />
          <button className="btn sm" type="submit" style={{ height: 44 }}>Ekle</button>
        </form>
      </div>

      {t.approval !== false && stage >= 3 && (
        <>
          <h2 className="h2">Müşteri onayı</h2>
          <div className="card pad stack" style={{ gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}><span style={{ color: 'var(--ink-2)' }}>Onay veren</span><b>{(firm && firm.approver) || 'Firma sayfasından ekle'}</b></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}><span style={{ color: 'var(--ink-2)' }}>Revize sayısı</span><b>{t.revisions || 0}</b></div>
            {stage === 3 && <button className="btn primary" onClick={() => setStage(t, 4)}>Müşteriye onaya gönderildi</button>}
            {stage === 4 && (
              <div className="grid2">
                <button className="btn danger" onClick={async () => { const n = await ask({ title: 'Firma revize istedi', message: 'Revize notunu yaz (isteğe bağlı). İş kurgu aşamasına döner.', input: true, placeholder: 'Örn. Döner kesim sahnesi daha uzun olsun', confirmText: 'Revizeyi kaydet' }); if (n !== null) addRevision(t, n); }}>Revize istendi</button>
                <button className="btn primary" onClick={() => setStage(t, 5)}>Onaylandı</button>
              </div>
            )}
            {stage === 5 && <span className="pill ok" style={{ alignSelf: 'flex-start' }}>Onaylandı, yayına hazır</span>}
          </div>
        </>
      )}

      <div className="row-h2"><h2 className="h2 hi"><span className="h-ic"><Icon name="msg" size={14} /></span>Yorumlar</h2><span className="small">{comments.length ? comments.length + ' yorum' : ''}</span></div>
      <Thread items={comments} onSend={(text) => addComment(t, text)} placeholder="Yorum yaz…" emptyText="Henüz yorum yok." />

      <button className="btn danger" style={{ width: '100%', marginTop: 28 }} onClick={async () => { if (await ask({ title: 'İş silinsin mi?', message: '“' + t.title + '” ve yorumları kalıcı olarak silinir.', confirmText: 'Sil', danger: true })) { deleteTask(t.id); go('/'); } }}>
        <Icon name="trash" size={18} />İşi sil
      </button>
    </div>
  );
}
