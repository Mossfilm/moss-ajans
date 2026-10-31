import { useState } from 'react';
import { Hero } from '../components/Art.jsx';
import { useStore } from '../store.jsx';
import { Icon, Logo, Switch, back, go } from '../components/ui.jsx';
import { TYPES, TYPE_ORDER, STAGES, todayYmd } from '../data.js';

const DEFAULT_STAGE = { cekim: 2, gonderi: 3, reels: 3, hikaye: 3, kurgu: 3, tasarim: 3, reklam: 3 };
const SHOOT_LIST = ['Kamera ve yedek bataryalar', 'Yaka mikrofonu', 'Işık seti', 'Çekim izinleri', 'Dikey + yatay format planı'];

export default function IsForm({ id, q }) {
  const { tasks, firms, users, addTask, updateTask } = useStore();
  const existing = id ? tasks.find((t) => t.id === id) : null;
  const activeFirms = firms.filter((f) => f.active !== false);
  const initType = existing ? existing.type : 'cekim';
  const [f, setF] = useState(() => existing ? {
    firmId: existing.firmId, type: existing.type, title: existing.title, date: existing.date || '', time: existing.time || '',
    assignees: existing.assignees || [], stage: typeof existing.stage === 'number' ? String(existing.stage) : 'none',
    approval: existing.approval !== false, location: existing.location || '', deliver: existing.deliver || '', note: existing.note || ''
  } : {
    firmId: q.get('firma') || (activeFirms[0] && activeFirms[0].id) || '', type: initType, title: q.get('title') || '',
    date: q.get('date') || todayYmd(), time: '', assignees: [], stage: q.get('stage') || String(DEFAULT_STAGE[initType]),
    approval: true, location: '', deliver: '', note: ''
  });
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));

  const pickType = (type) => {
    setF((x) => ({ ...x, type, stage: existing || q.get('stage') ? x.stage : (type in DEFAULT_STAGE ? String(DEFAULT_STAGE[type]) : 'none') }));
  };
  const toggleA = (uid) => {
    setF((x) => {
      if (uid === 'all') return { ...x, assignees: x.assignees.includes('all') ? [] : ['all'] };
      const a = x.assignees.filter((v) => v !== 'all');
      return { ...x, assignees: a.includes(uid) ? a.filter((v) => v !== uid) : a.concat(uid) };
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!f.firmId || !f.title.trim()) return;
    setBusy(true);
    const data = {
      firmId: f.firmId, type: f.type, title: f.title.trim(), date: f.date || '', time: f.time || '',
      assignees: f.assignees, stage: f.stage === 'none' ? null : Number(f.stage), approval: f.approval,
      location: f.location.trim(), deliver: f.deliver || '', note: f.note.trim()
    };
    if (existing) { await updateTask(existing.id, data); back(); }
    else {
      if (f.type === 'cekim') data.checklist = SHOOT_LIST.map((label, i) => ({ id: 'c' + i, label, done: false }));
      const nid = await addTask(data);
      window.location.replace('#/is/' + nid);
    }
    setBusy(false);
  };

  const chip = (on) => ({ 'aria-pressed': on, className: 'chip', type: 'button' });

  return (
    <form className="screen no-nav" onSubmit={submit}>
      <Hero art="clapper" />
      <div className="topbar">
        <button type="button" className="back" onClick={() => back()}>Vazgeç</button>
        <span className="small">Ekibe bildirim düşer</span>
      </div>
      <h1 className="h1">{existing ? 'İşi düzenle' : 'Yeni iş'}</h1>

      <div className="stack" style={{ gap: 20 }}>
        <div className="field">
          <span className="label" id="firma-l">Firma</span>
          <div className="chips" role="group" aria-labelledby="firma-l">
            {activeFirms.map((x) => (
              <button key={x.id} {...chip(f.firmId === x.id)} onClick={() => set('firmId', x.id)} style={{ paddingLeft: 6 }}><Logo firm={x} size={26} radius={8} />{x.name}</button>
            ))}
          </div>
        </div>

        <div className="field">
          <span className="label" id="tur-l">İş türü</span>
          <div className="chips wrap" role="group" aria-labelledby="tur-l">
            {TYPE_ORDER.map((k) => <button key={k} {...chip(f.type === k)} onClick={() => pickType(k)}>{TYPES[k].label}</button>)}
          </div>
        </div>

        <div className="field"><label className="label" htmlFor="bs">Başlık</label>
          <input id="bs" className="input" value={f.title} onChange={(e) => set('title', e.target.value)} required placeholder="Örn. Tanıtım videosu çekimi" />
        </div>

        <div className="grid2">
          <div className="field"><label className="label" htmlFor="tr">Tarih</label><input id="tr" className="input" type="date" value={f.date} onChange={(e) => set('date', e.target.value)} /></div>
          <div className="field"><label className="label" htmlFor="st">Saat</label><input id="st" className="input" type="time" value={f.time} onChange={(e) => set('time', e.target.value)} /></div>
        </div>

        <div className="field">
          <span className="label" id="sor-l">Sorumlu</span>
          <div className="chips wrap" role="group" aria-labelledby="sor-l">
            {users.map((u) => <button key={u.id} {...chip(f.assignees.includes(u.id))} onClick={() => toggleA(u.id)}>{u.name}</button>)}
            <button {...chip(f.assignees.includes('all'))} onClick={() => toggleA('all')}>Tüm ekip</button>
          </div>
        </div>

        <div className="field"><label className="label" htmlFor="as">Üretim aşaması</label>
          <select id="as" className="select" value={f.stage} onChange={(e) => set('stage', e.target.value)}>
            <option value="none">Üretim hattında değil (toplantı, rapor vb.)</option>
            {STAGES.map((s, i) => <option key={s.label} value={String(i)}>{s.label}</option>)}
          </select>
        </div>

        {f.stage !== 'none' && (
          <div className="card"><Switch on={f.approval} onToggle={() => set('approval', !f.approval)} label="Müşteri onayı gerekli" hint="Yayından önce firmaya onaya gönderilir" /></div>
        )}

        <div className="grid2">
          <div className="field"><label className="label" htmlFor="kn">Konum</label><input id="kn" className="input" value={f.location} onChange={(e) => set('location', e.target.value)} placeholder="İsteğe bağlı" /></div>
          <div className="field"><label className="label" htmlFor="tl">Teslim tarihi</label><input id="tl" className="input" type="date" value={f.deliver} onChange={(e) => set('deliver', e.target.value)} /></div>
        </div>

        <div className="field"><label className="label" htmlFor="nt">Not</label>
          <textarea id="nt" className="textarea" value={f.note} onChange={(e) => set('note', e.target.value)} placeholder="Çekim listesi, metin, hashtag…" />
        </div>
        {!existing && f.type === 'cekim' && <p className="tiny" style={{ margin: 0 }}>Çekim işlerine hazır bir kontrol listesi eklenir; iş sayfasından düzenleyebilirsin.</p>}
      </div>

      <div className="bottom-bar"><div className="inner">
        <button className="btn primary" type="submit" disabled={busy || !f.firmId || !f.title.trim()} style={{ flex: 1 }}>
          <Icon name="check" size={20} color="#fff" />{existing ? 'Kaydet' : 'Kaydet ve ekibe bildir'}
        </button>
      </div></div>
    </form>
  );
}
