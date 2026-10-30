import { useState } from 'react';
import { useStore } from '../store.jsx';
import { Icon, Logo, back } from '../components/ui.jsx';
import { todayYmd, ymd, addDays, parseYmd, DAYS, MONTHS, upcomingSpecialDays } from '../data.js';

// Hazır içerik stoğu: onaylanmış/yayına hazır ama henüz paylaşılmamış içerikler
function stockOf(firm, tasks, gallery) {
  const t0 = todayYmd();
  const ready = tasks.filter((t) => t.firmId === firm.id && !t.done && t.stage === 5).length
    + gallery.filter((g) => g.firmId === firm.id && g.status === 'onaylandi' && (!g.date || g.date >= t0)).length;
  const p = firm.package || {};
  const monthly = (p.gonderi || 0) + (p.reels || 0) + (p.hikaye || 0) || 12;
  const perDay = monthly / 30;
  return { ready, days: Math.round(ready / perDay) };
}

function nextWeekday(from, offset) {
  let d = addDays(from, offset);
  while (d.getDay() === 0) d = addDays(d, 1);
  return d;
}

export default function CekimPlani() {
  const { firms, tasks, gallery, addTask } = useStore();
  const [hidden, setHidden] = useState({});
  const [added, setAdded] = useState({});
  const today = new Date();
  const t0 = todayYmd();
  const end = ymd(addDays(today, 7));
  const active = firms.filter((f) => f.active !== false);

  const rows = active.map((f) => ({ firm: f, ...stockOf(f, tasks, gallery) })).sort((a, b) => a.days - b.days);
  const shootsSoon = (id) => tasks.filter((t) => t.firmId === id && t.type === 'cekim' && !t.done && t.date >= t0 && t.date <= end);

  // Her firma için en fazla bir öneri: stok azsa ve bu hafta çekim yoksa; yaklaşan özel gün varsa nedenine eklenir.
  const specials = upcomingSpecialDays(21).filter((s) => !/Anma/.test(s.name));
  const cands = [];
  rows.forEach((r) => {
    if (shootsSoon(r.firm.id).length > 0) return;
    const f = r.firm;
    const sp = specials.find((s) => {
      const who = s.who || '';
      const fits = who.includes('Tüm firmalar') || who.split(',').map((x) => x.trim()).includes(f.sector);
      const covered = tasks.some((t) => t.firmId === f.id && t.date && Math.abs(parseYmd(t.date) - parseYmd(s.date)) <= 3 * 86400000)
        || gallery.some((g) => g.firmId === f.id && g.date === s.date);
      return fits && !covered;
    });
    if (r.days > 3 && !sp) return;
    const reasons = [];
    if (r.days <= 3) reasons.push('Elinde ' + r.days + ' günlük hazır içerik var.');
    if (sp) reasons.push(sp.name + ' (' + parseYmd(sp.date).getDate() + ' ' + MONTHS[parseYmd(sp.date).getMonth()] + ') için henüz içerik yok; aynı çekimde onu da çek.');
    cands.push({ key: 'oneri-' + f.id, firm: f, urgency: r.days - (sp ? 2 : 0), time: '11:00',
      title: sp && r.days > 3 ? sp.name + ' içeriği çekimi' : 'İçerik çekimi' + (sp ? ' + ' + sp.name : ''), why: reasons.join(' ') });
  });
  cands.sort((a, b) => a.urgency - b.urgency);
  const perDay = {};
  tasks.filter((t) => t.type === 'cekim' && !t.done && t.date >= t0 && t.date <= end).forEach((t) => { perDay[t.date] = (perDay[t.date] || 0) + 1; });
  let dayIdx = 1;
  const sugg = cands.slice(0, 6).map((c) => {
    let d = nextWeekday(today, dayIdx);
    while ((perDay[ymd(d)] || 0) >= 2) { dayIdx += 1; d = nextWeekday(today, dayIdx); }
    perDay[ymd(d)] = (perDay[ymd(d)] || 0) + 1;
    return { ...c, date: ymd(d), time: perDay[ymd(d)] === 1 ? '11:00' : '15:00' };
  });
  // Eklenenler, takvime girdikten sonra da listede “eklendi” olarak kalsın
  const keep = Object.values(added).filter((s) => s && !sugg.some((x) => x.key === s.key));
  const visible = sugg.concat(keep).filter((s) => !hidden[s.key]).sort((a, b) => (a.date + a.time < b.date + b.time ? -1 : 1));
  const byDay = [];
  visible.forEach((s) => { const g = byDay.find((x) => x.date === s.date); if (g) g.items.push(s); else byDay.push({ date: s.date, items: [s] }); });
  const planned = tasks.filter((t) => t.type === 'cekim' && !t.done && t.date >= t0 && t.date <= end).sort((a, b) => ((a.date + (a.time || '')) < (b.date + (b.time || '')) ? -1 : 1));

  const add = async (s) => {
    await addTask({ firmId: s.firm.id, title: s.title, type: 'cekim', date: s.date, time: s.time, note: s.why, assignees: [], approval: true, stage: 2, location: '', deliver: '',
      checklist: ['Kamera ve yedek bataryalar', 'Yaka mikrofonu', 'Işık seti', 'Çekim izinleri'].map((label, i) => ({ id: 'c' + i, label, done: false })) });
    setAdded((x) => ({ ...x, [s.key]: s }));
  };
  const label = (s) => { const d = parseYmd(s); return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + DAYS[d.getDay()]; };

  return (
    <div className="screen no-nav">
      <button className="back" onClick={() => back('/')}><Icon name="left" size={20} />Geri</button>
      <span className="eyebrow" style={{ display: 'block', marginTop: 8 }}>{today.getDate()} {MONTHS[today.getMonth()]} – {addDays(today, 7).getDate()} {MONTHS[addDays(today, 7).getMonth()]}</span>
      <h1 className="h1" style={{ margin: '6px 0 8px' }}>Haftalık çekim planı</h1>
      <p className="small" style={{ margin: 0, lineHeight: '19px' }}>Öneriler firmaların aylık paketine, hazır içerik stoğuna ve yaklaşan özel günlere göre hesaplanır. En acil 6 öneri, günde en fazla 2 çekim olacak şekilde dağıtılır.</p>

      <div className="row-h2"><h2 className="h2">İçerik stoğu</h2><span className="tiny">Kaç günlük paylaşım hazır</span></div>
      <div className="card pad stack" style={{ gap: 12 }}>
        {rows.map((r) => {
          const low = r.days <= 3;
          return (
            <div key={r.firm.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr) 54px', gap: 10, alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, fontSize: 13, fontWeight: 500 }}><Logo firm={r.firm} size={22} /><span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.firm.name}</span></span>
              <div className="bar" style={{ height: 8 }} role="img" aria-label={r.firm.name + ': ' + r.days + ' günlük içerik hazır'}><div style={{ width: Math.min(100, r.days * 10) + '%', background: low ? 'var(--alert)' : 'var(--moss)' }} /></div>
              <span style={{ fontSize: 13, fontWeight: 600, textAlign: 'right', color: low ? 'var(--alert-ink)' : 'var(--ink)' }}>{r.days} gün</span>
            </div>
          );
        })}
        <p className="tiny" style={{ margin: 0 }}>Stok: üretim hattında “Yayına hazır” olan işler + galeride “Onaylandı” durumundaki içerikler. 3 gün ve altı kırmızı.</p>
      </div>

      {planned.length > 0 && (
        <>
          <h2 className="h2">Bu hafta zaten planlı çekimler</h2>
          <div className="card list">
            {planned.map((t) => {
              const f = firms.find((x) => x.id === t.firmId);
              return <a key={t.id} href={'#/is/' + t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12 }}><Logo firm={f} size={28} radius={8} /><span style={{ flex: 1, fontSize: 14 }}><b>{label(t.date)}</b> {t.time} · {t.title}</span></a>;
            })}
          </div>
        </>
      )}

      <div className="row-h2"><h2 className="h2">Önerilen çekimler</h2><span className="small" style={{ color: 'var(--moss)', fontWeight: 600 }}>{Object.keys(added).length}/{visible.length} eklendi</span></div>
      {byDay.length === 0 && <div className="card empty">Bu hafta için ek çekim önerisi yok. Stoklar yeterli görünüyor.</div>}
      {byDay.map((g) => (
        <div key={g.date} style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{label(g.date)}</div>
          <div className="stack">
            {g.items.map((s) => {
              const on = added[s.key];
              return (
                <div key={s.key} className="card" style={{ overflow: 'hidden', borderColor: on ? 'var(--moss)' : 'var(--line)' }}>
                  <div style={{ padding: '14px 14px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span className="small" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Logo firm={s.firm} size={22} /><b style={{ color: 'var(--ink)' }}>{s.time}</b> · {s.firm.name}</span>
                    <span style={{ fontSize: 16, fontWeight: 600 }}>{s.title}</span>
                    <span style={{ fontSize: 13, lineHeight: '18px', color: 'var(--ink-2)' }}>{s.why}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: '1px solid var(--line-2)' }}>
                    <button disabled={on} onClick={() => setHidden({ ...hidden, [s.key]: true })} style={{ height: 44, border: 0, borderRight: '1px solid var(--line-2)', background: 'transparent', fontWeight: 600, fontSize: 14, color: 'var(--ink-2)' }}>Bu hafta değil</button>
                    <button disabled={on} onClick={() => add(s)} style={{ height: 44, border: 0, background: on ? 'var(--moss)' : 'var(--moss-soft)', color: on ? '#fff' : 'var(--moss)', fontWeight: 600, fontSize: 14 }}>{on ? 'Takvime eklendi' : 'Plana ekle'}</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
