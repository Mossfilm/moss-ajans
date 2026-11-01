import { useEffect, useState } from 'react';
import { useStore } from '../store.jsx';
import { Icon, Logo, back } from '../components/ui.jsx';
import { Hero } from '../components/Art.jsx';
import { specialDays, firmsFor, appliesTo, todayYmd, parseYmd, ymd, MONTHS, DAYS } from '../data.js';

// Firmalara göre özel günler: resmi/dini günler, sınavlar, okul takvimi, sektörel dünya günleri ve sezonlar.
const KIND = {
  resmi: ['Resmî', 'pill ok'], dini: ['Dinî', 'pill wait'], anma: ['Anma', 'pill neutral'], sinav: ['Sınav', 'pill alert'],
  okul: ['Okul', 'pill post'], dunya: ['Dünya günü', 'pill reels'], sezon: ['Sezon', 'pill wait'], yerel: ['Gaziantep', 'pill ok']
};

export default function OzelGunler({ q }) {
  const { firms, tasks, gallery } = useStore();
  const [firmId, setFirmId] = useState(q.get('firma') || '');
  const [range, setRange] = useState(90);
  const t0 = todayYmd();
  const now = new Date();
  const end = new Date(now); end.setDate(end.getDate() + range);
  const endYmd = ymd(end);
  const active = firms.filter((f) => f.active !== false);
  const focus = q.get('date');
  useEffect(() => {
    const c = document.querySelector('.chips .chip[aria-pressed="true"]');
    if (c && firmId) c.scrollIntoView({ block: 'nearest', inline: 'center' });
    const f = focus && document.getElementById('gun-' + focus);
    if (f) f.scrollIntoView({ block: 'center' });
  }, []);
  const list = specialDays(now.getFullYear()).concat(specialDays(now.getFullYear() + 1))
    .filter((s) => s.date >= t0 && s.date <= endYmd)
    .filter((s) => (firmId ? appliesTo(s, firms.find((f) => f.id === firmId)) : firmsFor(s, firms).length > 0));
  const months = [];
  list.forEach((s) => {
    const k = s.date.slice(0, 7);
    const g = months.find((x) => x.k === k);
    if (g) g.items.push(s); else months.push({ k, items: [s] });
  });
  const planned = (s, f) => tasks.some((t) => t.firmId === f.id && t.date && Math.abs(parseYmd(t.date) - parseYmd(s.date)) <= 2 * 86400000) || gallery.some((g) => g.firmId === f.id && g.date === s.date);

  return (
    <div className="screen no-nav">
      <Hero art="cal" />
      <button className="back" onClick={() => back('/')}><Icon name="left" size={20} />Geri</button>
      <h1 className="h1" style={{ marginTop: 8, marginBottom: 6 }}>Özel günler</h1>
      <p className="small" style={{ margin: '0 0 14px', fontSize: 13 }}>Her firmanın sektörüne göre: resmî ve dinî günler, sınavlar, okul takvimi, dünya günleri ve sezonlar. Her günün içerik fikri yanında.</p>

      <div className="chips">
        <button className="chip" aria-pressed={!firmId} onClick={() => setFirmId('')}>Tüm firmalar</button>
        {active.map((f) => <button key={f.id} className="chip" aria-pressed={firmId === f.id} onClick={() => setFirmId(f.id)} style={{ paddingLeft: 8 }}><Logo firm={f} size={20} radius={5} />{f.name}</button>)}
      </div>
      <div className="seg" style={{ gridTemplateColumns: '1fr 1fr 1fr', marginTop: 12 }}>
        {[30, 90, 365].map((n) => <button key={n} aria-pressed={range === n} onClick={() => setRange(n)}>{n === 365 ? '1 yıl' : n + ' gün'}</button>)}
      </div>

      {months.length === 0 && <div className="card empty" style={{ marginTop: 16 }}><span className="empty-ic"><Icon name="cal" size={28} /></span>Bu aralıkta özel gün yok.</div>}
      {months.map((m) => (
        <div key={m.k}>
          <h2 className="h2">{MONTHS[Number(m.k.slice(5, 7)) - 1]} {m.k.slice(0, 4)}</h2>
          <div className="stack">
            {m.items.map((s) => {
              const d = parseYmd(s.date);
              const days = Math.round((d - parseYmd(t0)) / 86400000);
              const fs = firmId ? firms.filter((f) => f.id === firmId) : firmsFor(s, firms);
              const k = KIND[s.kind] || KIND.dunya;
              const missing = fs.filter((f) => !planned(s, f));
              const soru = s.name + ' (' + d.getDate() + ' ' + MONTHS[d.getMonth()] + ') için ' + (fs.length === 1 ? fs[0].name : fs.map((f) => f.name).join(', ')) + ' için post hazırla. Fikir: ' + (s.idea || '');
              return (
                <div key={s.date + s.name} id={'gun-' + s.date} className="card" style={{ padding: 14, display: 'flex', gap: 12, borderColor: focus === s.date ? 'var(--moss)' : undefined, boxShadow: focus === s.date ? '0 0 0 1px var(--moss)' : undefined }}>
                  <div style={{ width: 46, flexShrink: 0, textAlign: 'center', paddingTop: 2 }}>
                    <div style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 800, lineHeight: '24px' }}>{d.getDate()}</div>
                    <div className="tiny">{DAYS[d.getDay()].slice(0, 3)}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span className={k[1]}>{k[0]}</span>
                      <span className="tiny">{days === 0 ? 'bugün' : days + ' gün kaldı'}</span>
                    </span>
                    <span style={{ fontSize: 15, fontWeight: 700, lineHeight: '20px' }}>{s.name}</span>
                    {s.idea && <span className="small" style={{ fontSize: 13, lineHeight: '18px' }}>{s.idea}</span>}
                    <span style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                      {fs.slice(0, 9).map((f) => <span key={f.id} title={f.name} style={{ opacity: planned(s, f) ? 0.35 : 1 }}><Logo firm={f} size={22} radius={6} /></span>)}
                      <span className="tiny" style={{ marginLeft: 4 }}>{missing.length ? missing.length + ' firma için plan yok' : 'Hepsi planlı'}</span>
                    </span>
                    <span style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                      <a className="btn sm primary" href={'#/asistan?soru=' + encodeURIComponent(soru)}><Icon name="sparkle" size={14} color="#fff" />Post hazırlat</a>
                      <a className="btn sm" href={'#/yeni?date=' + s.date + (fs.length === 1 ? '&firma=' + fs[0].id : '') + '&title=' + encodeURIComponent(s.name)}><Icon name="plus" size={14} />İş ekle</a>
                    </span>
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
