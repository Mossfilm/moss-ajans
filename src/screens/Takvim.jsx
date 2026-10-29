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
      <h1 className="h1">Takvim</h1>

      <div className="chips">
        <button className="chip" aria-pressed={firm === 'all'} onClick={() => setFirm('all')}>Tümü</button>
        {activeFirms.map((f) => (
          <button key={f.id} className="chip" aria-pressed={firm === f.id} onClick={() => setFirm(f.id)} style={{ paddingLeft: 6 }}>
            <Logo firm={f} size={26} radius={8} />{f.name}
          </button>
        ))}
      </div>

      <div className="card" style={{ marginTop: 14, padding: '14px 12px 12px', borderRadius: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px 10px' }}>
          <button className="icon-btn" style={{ border: 0, background: 'var(--bg)', width: 40, height: 40 }} aria-label="Önceki ay" onClick={() => shift(-1)}><Icon name="left" size={18} /></button>
          <span style={{ fontFamily: 'var(--display)', fontSize: 20, fontWeight: 700 }}>{MONTHS[m]} {y}</span>
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
          {[['Çekim', '#C46A1C'], ['Paylaşım', '#2F6DB0'], ['Kurgu / Tasarım', '#7D4A9C'], ['Toplantı', '#2F4A2C'], ['Rapor / Diğer', '#7C857E']].map(([l, c]) => (
            <span key={l} className="tiny" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--ink-2)' }}><span style={{ width: 8, height: 8, borderRadius: 4, background: c }} />{l}</span>
          ))}
          <span className="tiny" style={{ color: 'var(--ink-2)' }}><u>Altı çizili</u>: özel gün</span>
        </div>
      </div>

      <div className="row-h2">
        <h2 className="h2" style={{ fontSize: 16, color: 'var(--ink)' }}>{(sel === t0 ? 'Bugün · ' : '') + selDate.getDate() + ' ' + MONTHS[selDate.getMonth()] + ' ' + DAYS[selDate.getDay()]}</h2>
        <span className="small">{dayTasks.length ? dayTasks.length + ' iş' : ''}</span>
      </div>
      {selSpecial.map((s) => <div key={s.name} className="pill ok" style={{ marginBottom: 10 }}>{s.name}{s.who ? ' · ' + s.who : ''}</div>)}
      <div className="stack">
        {dayTasks.map((t) => <TaskRow key={t.id} t={t} />)}
        <a href={'#/yeni?date=' + sel + (firm !== 'all' ? '&firma=' + firm : '')} className="card" style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: '1.5px dashed var(--field)', fontWeight: 600, color: 'var(--moss)' }}>
          <Icon name="plus" size={18} />Bu güne iş ekle
        </a>
      </div>

      <Fab to={'/yeni?date=' + sel} />
      <Nav active="/takvim" />
    </div>
  );
}
