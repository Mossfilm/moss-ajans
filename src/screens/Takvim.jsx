import { useState } from 'react';
import { useStore } from '../store.jsx';
import { Nav, Fab, TaskRow, Icon, Logo, useRoute } from '../components/ui.jsx';
import { TYPES, MONTHS, DAYS, ymd, todayYmd, parseYmd, specialDays } from '../data.js';

export default function Takvim() {
  const { tasks, firms } = useStore();
  const r = useRoute();
  const initial = r.q.get('date') || todayYmd();
  const [sel, setSel] = useState(initial);
  const [month, setMonth] = useState(() => { const d = parseYmd(initial); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [firm, setFirm] = useState('all');

  const y = month.getFullYear(), m = month.getMonth();
  const first = new Date(y, m, 1);
  const lead = (first.getDay() + 6) % 7; // pazartesi başlangıç
  const daysIn = new Date(y, m + 1, 0).getDate();
  const t0 = todayYmd();
  const list = tasks.filter((t) => firm === 'all' || t.firmId === firm);
  const specials = specialDays(y);

  const cells = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let d = 1; d <= daysIn; d++) cells.push(ymd(new Date(y, m, d)));

  const dayTasks = list.filter((t) => t.date === sel).sort((a, b) => ((a.time || '99') < (b.time || '99') ? -1 : 1));
  const selDate = parseYmd(sel);
  const selSpecial = specialDays(selDate.getFullYear()).filter((s) => s.date === sel);
  const shift = (n) => setMonth(new Date(y, m + n, 1));
  const activeFirms = firms.filter((f) => f.active !== false);

  return (
    <div className="screen">
      <div className="topbar" style={{ margin: '10px 0 16px' }}>
        <h1 className="h1" style={{ margin: 0 }}>Takvim</h1>
        <button className="btn sm" onClick={() => { const d = parseYmd(t0); setSel(t0); setMonth(new Date(d.getFullYear(), d.getMonth(), 1)); }}>Bugün</button>
      </div>

      <div className="chips">
        <button className="chip" aria-pressed={firm === 'all'} onClick={() => setFirm('all')}>Tüm firmalar</button>
        {activeFirms.map((f) => (
          <button key={f.id} className="chip" aria-pressed={firm === f.id} onClick={() => setFirm(f.id)} style={{ paddingLeft: 8 }}>
            <Logo firm={f} size={20} radius={5} />{f.name}
          </button>
        ))}
      </div>

      <div className="card" style={{ marginTop: 14, padding: '8px 12px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px 10px' }}>
          <button className="icon-btn" style={{ border: 0, background: 'var(--bg)', width: 40, height: 40 }} aria-label="Önceki ay" onClick={() => shift(-1)}><Icon name="left" size={18} /></button>
          <span style={{ fontFamily: 'var(--display)', fontSize: 17, fontWeight: 700 }}>{MONTHS[m]} {y}</span>
          <button className="icon-btn" style={{ border: 0, background: 'var(--bg)', width: 40, height: 40 }} aria-label="Sonraki ay" onClick={() => shift(1)}><Icon name="right" size={18} /></button>
        </div>
        <div className="cal" aria-hidden="true">
          {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((d) => <span key={d} className="dow">{d}</span>)}
        </div>
        <div className="cal">
          {cells.map((c, i) => {
            if (!c) return <span key={'b' + i} />;
            const ts = list.filter((t) => t.date === c);
            const seen = {}; const dots = [];
            ts.forEach((t) => { const col = (TYPES[t.type] || TYPES.diger).dot; if (!seen[col] && dots.length < 3) { seen[col] = 1; dots.push(col); } });
            const isSel = c === sel;
            const sp = specials.some((s) => s.date === c);
            return (
              <button key={c} className={'day' + (c === t0 ? ' today' : '')} aria-pressed={isSel} onClick={() => setSel(c)}
                aria-label={parseYmd(c).getDate() + ' ' + MONTHS[m] + ', ' + (ts.length ? ts.length + ' iş' : 'iş yok') + (sp ? ', özel gün' : '')}>
                <span style={{ textDecoration: sp ? 'underline' : 'none', textUnderlineOffset: 3 }}>{parseYmd(c).getDate()}</span>
                <span className="dots">{dots.map((col) => <span key={col} style={{ background: isSel ? '#fff' : col }} />)}</span>
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, padding: '12px 4px 0', borderTop: '1px solid var(--line-2)', marginTop: 10 }}>
          {[['Çekim', TYPES.cekim.dot], ['Gönderi', TYPES.gonderi.dot], ['Reels', TYPES.reels.dot], ['Hikâye', TYPES.hikaye.dot], ['Kurgu', TYPES.kurgu.dot], ['Tasarım', TYPES.tasarim.dot], ['Toplantı', TYPES.toplanti.dot]].map(([l, c]) => (
            <span key={l} className="tiny" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--ink-2)' }}><span style={{ width: 8, height: 8, borderRadius: 4, background: c }} />{l}</span>
          ))}
          <span className="tiny" style={{ color: 'var(--ink-2)' }}><u>Altı çizili</u>: özel gün</span>
        </div>
      </div>

      <div className="row-h2">
        <h2 className="h2">{(sel === t0 ? 'Bugün · ' : '') + selDate.getDate() + ' ' + MONTHS[selDate.getMonth()] + ' ' + DAYS[selDate.getDay()] + ' · ' + dayTasks.length + ' iş'}</h2>
        <a className="icon-btn" style={{ width: 40, height: 40 }} href={'#/yeni?date=' + sel + (firm !== 'all' ? '&firma=' + firm : '')} aria-label="Bu güne iş ekle"><Icon name="plus" size={18} /></a>
      </div>
      {selSpecial.map((s) => <div key={s.name} className="pill ok" style={{ marginBottom: 10 }}>{s.name}{s.who ? ' · ' + s.who : ''}</div>)}
      <div className="stack">
        {dayTasks.map((t) => <TaskRow key={t.id} t={t} />)}
        {dayTasks.length === 0 && (
          <div className="card empty">
            <span className="empty-ic"><Icon name="cal" size={28} /></span>
            <b style={{ fontSize: 16, color: 'var(--ink)' }}>Bu tarihte planlanmış iş yok</b>
            <a className="btn primary" style={{ marginTop: 20 }} href={'#/yeni?date=' + sel + (firm !== 'all' ? '&firma=' + firm : '')}><Icon name="plus" size={18} />İş ekle</a>
          </div>
        )}
      </div>

      <Fab to={'/yeni?date=' + sel} />
      <Nav active="/takvim" />
    </div>
  );
}
